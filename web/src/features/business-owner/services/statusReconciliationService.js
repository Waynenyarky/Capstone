// Status Reconciliation Service
// Handles mapping and reconciliation of different status systems

// Unified status enum
export const UNIFIED_STATUS = {
  DRAFT: 'draft',
  PREPARING: 'preparing',
  SUBMITTED: 'submitted',
  UNDER_REVIEW: 'under_review',
  APPROVED: 'approved',
  ACTIVE: 'active',
  COMPLIANT: 'compliant',
  NEEDS_ATTENTION: 'needs_attention',
  EXPIRED: 'expired'
};

// Legacy status mappings
export const LEGACY_STATUS_MAPPINGS = {
  // Application level statuses
  applicationStatus: {
    'draft': UNIFIED_STATUS.DRAFT,
    'preparing': UNIFIED_STATUS.PREPARING,
    'pending': UNIFIED_STATUS.SUBMITTED,
    'under_review': UNIFIED_STATUS.UNDER_REVIEW,
    'approved': UNIFIED_STATUS.APPROVED,
    'rejected': UNIFIED_STATUS.NEEDS_ATTENTION,
    'withdrawn': UNIFIED_STATUS.NEEDS_ATTENTION
  },
  
  // Business level statuses
  businessStatus: {
    'inactive': UNIFIED_STATUS.DRAFT,
    'pending_activation': UNIFIED_STATUS.SUBMITTED,
    'active': UNIFIED_STATUS.ACTIVE,
    'suspended': UNIFIED_STATUS.NEEDS_ATTENTION,
    'expired': UNIFIED_STATUS.EXPIRED,
    'compliant': UNIFIED_STATUS.COMPLIANT,
    'non_compliant': UNIFIED_STATUS.NEEDS_ATTENTION
  },
  
  // Registration level statuses
  registrationStatus: {
    'not_started': UNIFIED_STATUS.DRAFT,
    'in_progress': UNIFIED_STATUS.PREPARING,
    'submitted': UNIFIED_STATUS.SUBMITTED,
    'processing': UNIFIED_STATUS.UNDER_REVIEW,
    'completed': UNIFIED_STATUS.APPROVED,
    'failed': UNIFIED_STATUS.NEEDS_ATTENTION,
    'cancelled': UNIFIED_STATUS.NEEDS_ATTENTION
  },
  
  // Permit level statuses
  permitStatus: {
    'none': UNIFIED_STATUS.DRAFT,
    'applied': UNIFIED_STATUS.SUBMITTED,
    'issued': UNIFIED_STATUS.APPROVED,
    'active': UNIFIED_STATUS.ACTIVE,
    'expired': UNIFIED_STATUS.EXPIRED,
    'revoked': UNIFIED_STATUS.NEEDS_ATTENTION,
    'suspended': UNIFIED_STATUS.NEEDS_ATTENTION
  }
};

// Status priority for conflict resolution
export const STATUS_PRIORITY = {
  [UNIFIED_STATUS.EXPIRED]: 9,
  [UNIFIED_STATUS.NEEDS_ATTENTION]: 8,
  [UNIFIED_STATUS.COMPLIANT]: 7,
  [UNIFIED_STATUS.ACTIVE]: 6,
  [UNIFIED_STATUS.APPROVED]: 5,
  [UNIFIED_STATUS.UNDER_REVIEW]: 4,
  [UNIFIED_STATUS.SUBMITTED]: 3,
  [UNIFIED_STATUS.PREPARING]: 2,
  [UNIFIED_STATUS.DRAFT]: 1
};

// Status reconciliation rules
export const RECONCILIATION_RULES = {
  // If any status is expired, mark as expired
  expired: {
    condition: (statuses) => statuses.includes(UNIFIED_STATUS.EXPIRED),
    result: UNIFIED_STATUS.EXPIRED,
    reason: 'Permit or registration has expired'
  },
  
  // If any status needs attention, mark as needs attention
  needs_attention: {
    condition: (statuses) => statuses.includes(UNIFIED_STATUS.NEEDS_ATTENTION),
    result: UNIFIED_STATUS.NEEDS_ATTENTION,
    reason: 'Action required for compliance'
  },
  
  // If all statuses are compliant or active, mark as compliant
  compliant: {
    condition: (statuses) => 
      statuses.every(s => s === UNIFIED_STATUS.COMPLIANT || s === UNIFIED_STATUS.ACTIVE),
    result: UNIFIED_STATUS.COMPLIANT,
    reason: 'All requirements met, fully compliant'
  },
  
  // If business is active and approved, mark as active
  active: {
    condition: (statuses) => 
      statuses.includes(UNIFIED_STATUS.ACTIVE) && 
      statuses.includes(UNIFIED_STATUS.APPROVED),
    result: UNIFIED_STATUS.ACTIVE,
    reason: 'Business is operational'
  },
  
  // If approved but not yet active, mark as approved
  approved: {
    condition: (statuses) => 
      statuses.includes(UNIFIED_STATUS.APPROVED) && 
      !statuses.includes(UNIFIED_STATUS.ACTIVE),
    result: UNIFIED_STATUS.APPROVED,
    reason: 'Application approved, awaiting activation'
  },
  
  // If under review, maintain under review
  under_review: {
    condition: (statuses) => statuses.includes(UNIFIED_STATUS.UNDER_REVIEW),
    result: UNIFIED_STATUS.UNDER_REVIEW,
    reason: 'Application under review'
  },
  
  // If submitted but not under review, mark as submitted
  submitted: {
    condition: (statuses) => 
      statuses.includes(UNIFIED_STATUS.SUBMITTED) && 
      !statuses.includes(UNIFIED_STATUS.UNDER_REVIEW),
    result: UNIFIED_STATUS.SUBMITTED,
    reason: 'Application submitted for review'
  },
  
  // If preparing, maintain preparing
  preparing: {
    condition: (statuses) => statuses.includes(UNIFIED_STATUS.PREPARING),
    result: UNIFIED_STATUS.PREPARING,
    reason: 'Preparing application documents'
  },
  
  // Default to draft
  default: {
    condition: () => true,
    result: UNIFIED_STATUS.DRAFT,
    reason: 'Application in draft stage'
  }
};

class StatusReconciliationService {
  constructor() {
    this.cache = new Map();
    this.listeners = new Map();
  }

  /**
   * Map all statuses for a business to unified status
   * @param {string} businessId - Business ID
   * @param {Object} businessData - Business data with various status fields
   * @returns {Object} Reconciliation result
   */
  async mapAllStatuses(businessId, businessData) {
    try {
      // Check cache first
      const cacheKey = `${businessId}_${JSON.stringify(businessData)}`;
      if (this.cache.has(cacheKey)) {
        return this.cache.get(cacheKey);
      }

      // Extract all status fields
      const statusFields = {
        applicationStatus: businessData.applicationStatus,
        businessStatus: businessData.businessStatus,
        registrationStatus: businessData.registrationStatus,
        permitStatus: businessData.permitStatus
      };

      // Map each status to unified status
      const mappedStatuses = {};
      const rawStatuses = [];

      Object.entries(statusFields).forEach(([field, status]) => {
        if (status) {
          const mapping = LEGACY_STATUS_MAPPINGS[field];
          if (mapping && mapping[status]) {
            mappedStatuses[field] = mapping[status];
            rawStatuses.push(mapping[status]);
          } else {
            // Unknown status, map to needs attention
            mappedStatuses[field] = UNIFIED_STATUS.NEEDS_ATTENTION;
            rawStatuses.push(UNIFIED_STATUS.NEEDS_ATTENTION);
          }
        }
      });

      // Reconcile conflicts
      const reconciliationResult = this.reconcileStatusConflicts(rawStatuses, mappedStatuses);

      // Cache result
      this.cache.set(cacheKey, reconciliationResult);

      // Notify listeners
      this.notifyListeners(businessId, reconciliationResult);

      return reconciliationResult;

    } catch (error) {
      console.error('Error mapping statuses:', error);
      throw error;
    }
  }

  /**
   * Resolve status conflicts using reconciliation rules
   * @param {Array} rawStatuses - Array of unified statuses
   * @param {Object} mappedStatuses - Mapped status fields
   * @returns {Object} Reconciliation result
   */
  reconcileStatusConflicts(rawStatuses, mappedStatuses) {
    // Remove duplicates
    const uniqueStatuses = [...new Set(rawStatuses)];

    // Apply reconciliation rules in priority order
    for (const [ruleName, rule] of Object.entries(RECONCILIATION_RULES)) {
      if (rule.condition(uniqueStatuses)) {
        return {
          unifiedStatus: rule.result,
          reason: rule.reason,
          rule: ruleName,
          mappedStatuses,
          conflicts: this.detectConflicts(mappedStatuses),
          confidence: this.calculateConfidence(uniqueStatuses, rule.result)
        };
      }
    }

    // Default case
    return {
      unifiedStatus: UNIFIED_STATUS.DRAFT,
      reason: 'Default status applied',
      rule: 'default',
      mappedStatuses,
      conflicts: this.detectConflicts(mappedStatuses),
      confidence: 0.5
    };
  }

  /**
   * Detect conflicts between different status systems
   * @param {Object} mappedStatuses - Mapped status fields
   * @returns {Array} Array of conflicts
   */
  detectConflicts(mappedStatuses) {
    const conflicts = [];
    const statusValues = Object.values(mappedStatuses);

    // Check for conflicting statuses
    const uniqueStatuses = [...new Set(statusValues)];
    
    if (uniqueStatuses.length > 1) {
      // There are different statuses across systems
      Object.entries(mappedStatuses).forEach(([field, status]) => {
        const otherFields = Object.entries(mappedStatuses)
          .filter(([f, s]) => f !== field && s !== status);
        
        if (otherFields.length > 0) {
          conflicts.push({
            field,
            status,
            conflictingFields: otherFields.map(([f, s]) => ({ field: f, status: s })),
            severity: this.getConflictSeverity(status, otherFields.map(([_, s]) => s))
          });
        }
      });
    }

    return conflicts;
  }

  /**
   * Get conflict severity based on status differences
   * @param {string} status - Current status
   * @param {Array} otherStatuses - Other statuses
   * @returns {string} Conflict severity
   */
  getConflictSeverity(status, otherStatuses) {
    const statusPriority = STATUS_PRIORITY[status];
    const otherPriorities = otherStatuses.map(s => STATUS_PRIORITY[s]);
    
    const maxPriorityDiff = Math.max(...otherPriorities) - statusPriority;
    
    if (maxPriorityDiff > 3) return 'high';
    if (maxPriorityDiff > 1) return 'medium';
    return 'low';
  }

  /**
   * Calculate confidence in reconciliation result
   * @param {Array} statuses - Array of statuses
   * @param {string} result - Reconciled status
   * @returns {number} Confidence score (0-1)
   */
  calculateConfidence(statuses, result) {
    if (statuses.length === 0) return 0.5;
    
    const resultCount = statuses.filter(s => s === result).length;
    return resultCount / statuses.length;
  }

  /**
   * Validate status consistency across systems
   * @param {string} businessId - Business ID
   * @returns {Object} Validation result
   */
  async validateStatusConsistency(businessId) {
    try {
      // This would typically fetch business data from API
      // For now, return mock validation result
      return {
        businessId,
        isConsistent: true,
        conflicts: [],
        lastValidated: new Date().toISOString(),
        recommendations: []
      };
    } catch (error) {
      console.error('Error validating status consistency:', error);
      throw error;
    }
  }

  /**
   * Sync statuses across all systems
   * @param {string} businessId - Business ID
   * @param {string} targetStatus - Target unified status
   * @returns {Object} Sync result
   */
  async syncStatusesAcrossSystems(businessId, targetStatus) {
    try {
      // This would typically call APIs to update status in each system
      const syncResults = {
        businessId,
        targetStatus,
        syncedSystems: [],
        failedSystems: [],
        timestamp: new Date().toISOString()
      };

      // Mock sync for each system
      Object.keys(LEGACY_STATUS_MAPPINGS).forEach(system => {
        // Simulate API call
        setTimeout(() => {
          syncResults.syncedSystems.push(system);
        }, Math.random() * 1000);
      });

      return syncResults;
    } catch (error) {
      console.error('Error syncing statuses:', error);
      throw error;
    }
  }

  /**
   * Add status change listener
   * @param {string} businessId - Business ID
   * @param {Function} callback - Callback function
   */
  addStatusListener(businessId, callback) {
    if (!this.listeners.has(businessId)) {
      this.listeners.set(businessId, []);
    }
    this.listeners.get(businessId).push(callback);
  }

  /**
   * Remove status change listener
   * @param {string} businessId - Business ID
   * @param {Function} callback - Callback function
   */
  removeStatusListener(businessId, callback) {
    if (this.listeners.has(businessId)) {
      const callbacks = this.listeners.get(businessId);
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  /**
   * Notify listeners of status changes
   * @param {string} businessId - Business ID
   * @param {Object} result - Reconciliation result
   */
  notifyListeners(businessId, result) {
    if (this.listeners.has(businessId)) {
      this.listeners.get(businessId).forEach(callback => {
        try {
          callback(result);
        } catch (error) {
          console.error('Error in status listener:', error);
        }
      });
    }
  }

  /**
   * Clear cache for a business
   * @param {string} businessId - Business ID
   */
  clearCache(businessId) {
    // Clear all cache entries for this business
    for (const key of this.cache.keys()) {
      if (key.startsWith(`${businessId}_`)) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Get status configuration
   * @param {string} status - Unified status
   * @returns {Object} Status configuration
   */
  getStatusConfig(status) {
    const configs = {
      [UNIFIED_STATUS.DRAFT]: {
        label: 'Draft',
        color: '#d9d9d9',
        icon: 'file-text',
        description: 'Application is being prepared'
      },
      [UNIFIED_STATUS.PREPARING]: {
        label: 'Preparing',
        color: '#1890ff',
        icon: 'sync',
        description: 'Application is being prepared for submission'
      },
      [UNIFIED_STATUS.SUBMITTED]: {
        label: 'Submitted',
        color: '#52c41a',
        icon: 'rocket',
        description: 'Application has been submitted for review'
      },
      [UNIFIED_STATUS.UNDER_REVIEW]: {
        label: 'Under Review',
        color: '#faad14',
        icon: 'clock-circle',
        description: 'Application is being reviewed by LGU staff'
      },
      [UNIFIED_STATUS.APPROVED]: {
        label: 'Approved',
        color: '#52c41a',
        icon: 'check-circle',
        description: 'Application has been approved'
      },
      [UNIFIED_STATUS.ACTIVE]: {
        label: 'Active',
        color: '#52c41a',
        icon: 'play-circle',
        description: 'Business is fully operational'
      },
      [UNIFIED_STATUS.COMPLIANT]: {
        label: 'Compliant',
        color: '#52c41a',
        icon: 'check-circle',
        description: 'All requirements and regulations are met'
      },
      [UNIFIED_STATUS.NEEDS_ATTENTION]: {
        label: 'Needs Attention',
        color: '#faad14',
        icon: 'exclamation-circle',
        description: 'Action required to proceed'
      },
      [UNIFIED_STATUS.EXPIRED]: {
        label: 'Expired',
        color: '#f5222d',
        icon: 'warning',
        description: 'Permit or registration has expired'
      }
    };

    return configs[status] || configs[UNIFIED_STATUS.DRAFT];
  }
}

// Export singleton instance
export const statusReconciliationService = new StatusReconciliationService();

// Export utility functions
export const mapStatusToUnified = (system, status) => {
  const mapping = LEGACY_STATUS_MAPPINGS[system];
  return mapping && mapping[status] ? mapping[status] : UNIFIED_STATUS.NEEDS_ATTENTION;
};

export const getUnifiedStatusPriority = (status) => {
  return STATUS_PRIORITY[status] || 0;
};

export const isStatusHigher = (status1, status2) => {
  return getUnifiedStatusPriority(status1) > getUnifiedStatusPriority(status2);
};

export default statusReconciliationService;
