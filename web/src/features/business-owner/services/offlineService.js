// Offline storage service for mobile functionality
const OFFLINE_STORAGE_KEY = 'bizclear_offline_data';
const SYNC_QUEUE_KEY = 'bizclear_sync_queue';
const SYNC_STATUS_KEY = 'bizclear_sync_status';
const CONFLICT_RESOLUTION_KEY = 'bizclear_conflicts';

// Sync status tracking
let syncInProgress = false;
let syncProgress = { total: 0, completed: 0, failed: 0 };
let syncListeners = [];

/**
 * Store data in offline storage
 * @param {string} key - Storage key
 * @param {any} data - Data to store
 */
export const setOfflineData = (key, data) => {
  try {
    const offlineData = JSON.parse(localStorage.getItem(OFFLINE_STORAGE_KEY) || '{}');
    offlineData[key] = {
      data,
      timestamp: Date.now(),
      synced: false,
      version: Date.now() // Version for conflict detection
    };
    localStorage.setItem(OFFLINE_STORAGE_KEY, JSON.stringify(offlineData));
  } catch (error) {
    console.error('Failed to store offline data:', error);
  }
};

/**
 * Get data from offline storage
 * @param {string} key - Storage key
 * @returns {any} Stored data or null
 */
export const getOfflineData = (key) => {
  try {
    const offlineData = JSON.parse(localStorage.getItem(OFFLINE_STORAGE_KEY) || '{}');
    return offlineData[key]?.data || null;
  } catch (error) {
    console.error('Failed to retrieve offline data:', error);
    return null;
  }
};

/**
 * Get offline data with metadata
 * @param {string} key - Storage key
 * @returns {object} Stored data with metadata
 */
export const getOfflineDataWithMetadata = (key) => {
  try {
    const offlineData = JSON.parse(localStorage.getItem(OFFLINE_STORAGE_KEY) || '{}');
    return offlineData[key] || null;
  } catch (error) {
    console.error('Failed to retrieve offline data with metadata:', error);
    return null;
  }
};

/**
 * Add action to sync queue
 * @param {object} action - Action to sync
 */
export const addToSyncQueue = (action) => {
  try {
    const syncQueue = JSON.parse(localStorage.getItem(SYNC_QUEUE_KEY) || '[]');
    syncQueue.push({
      ...action,
      timestamp: Date.now(),
      id: Date.now().toString(),
      retries: 0,
      maxRetries: 3,
      priority: action.priority || 'normal' // high, normal, low
    });
    
    // Sort by priority
    syncQueue.sort((a, b) => {
      const priorityOrder = { high: 0, normal: 1, low: 2 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });
    
    localStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(syncQueue));
  } catch (error) {
    console.error('Failed to add to sync queue:', error);
  }
};

/**
 * Get sync queue
 * @returns {Array} Array of queued actions
 */
export const getSyncQueue = () => {
  try {
    return JSON.parse(localStorage.getItem(SYNC_QUEUE_KEY) || '[]');
  } catch (error) {
    console.error('Failed to get sync queue:', error);
    return [];
  }
};

/**
 * Clear sync queue
 */
export const clearSyncQueue = () => {
  try {
    localStorage.removeItem(SYNC_QUEUE_KEY);
  } catch (error) {
    console.error('Failed to clear sync queue:', error);
  }
};

/**
 * Update sync progress
 * @param {object} progress - Progress update
 */
export const updateSyncProgress = (progress) => {
  syncProgress = { ...syncProgress, ...progress };
  
  // Notify listeners
  syncListeners.forEach(listener => {
    try {
      listener(syncProgress);
    } catch (error) {
      console.error('Error notifying sync listener:', error);
    }
  });
  
  // Save to localStorage for persistence
  try {
    localStorage.setItem(SYNC_STATUS_KEY, JSON.stringify(syncProgress));
  } catch (error) {
    console.error('Failed to save sync status:', error);
  }
};

/**
 * Add sync progress listener
 * @param {Function} listener - Progress listener function
 * @returns {Function} Cleanup function
 */
export const addSyncProgressListener = (listener) => {
  syncListeners.push(listener);
  
  // Return cleanup function
  return () => {
    syncListeners = syncListeners.filter(l => l !== listener);
  };
};

/**
 * Get current sync progress
 * @returns {object} Current sync progress
 */
export const getSyncProgress = () => {
  try {
    const saved = localStorage.getItem(SYNC_STATUS_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (error) {
    console.error('Failed to get sync progress:', error);
  }
  return syncProgress;
};

/**
 * Detect and resolve conflicts
 * @param {string} key - Data key
 * @param {any} localData - Local data
 * @param {any} remoteData - Remote data
 * @returns {object} Conflict resolution result
 */
export const resolveConflict = async (key, localData, remoteData) => {
  const localMeta = getOfflineDataWithMetadata(key);
  const conflict = {
    key,
    localData,
    remoteData,
    localTimestamp: localMeta?.timestamp,
    remoteTimestamp: Date.now(),
    resolution: null
  };

  // Save conflict for manual resolution
  try {
    const conflicts = JSON.parse(localStorage.getItem(CONFLICT_RESOLUTION_KEY) || '[]');
    conflicts.push(conflict);
    localStorage.setItem(CONFLICT_RESOLUTION_KEY, JSON.stringify(conflicts));
  } catch (error) {
    console.error('Failed to save conflict:', error);
  }

  // Auto-resolution strategies
  const resolution = await autoResolveConflict(conflict);
  
  return {
    resolved: resolution.strategy !== 'manual',
    strategy: resolution.strategy,
    result: resolution.data,
    conflict
  };
};

/**
 * Auto-resolve conflicts using heuristics
 * @param {object} conflict - Conflict data
 * @returns {object} Resolution strategy and result
 */
const autoResolveConflict = async (conflict) => {
  const { localData, remoteData, localTimestamp } = conflict;
  
  // Strategy 1: Most recent wins
  if (localTimestamp && (Date.now() - localTimestamp) < 60000) { // Local is newer than 1 minute
    return {
      strategy: 'local_wins',
      data: localData
    };
  }
  
  // Strategy 2: Remote wins for critical business data
  if (conflict.key.includes('business') || conflict.key.includes('payment')) {
    return {
      strategy: 'remote_wins',
      data: remoteData
    };
  }
  
  // Strategy 3: Merge if possible (for simple objects)
  if (typeof localData === 'object' && typeof remoteData === 'object' && 
      localData && remoteData && !Array.isArray(localData) && !Array.isArray(remoteData)) {
    try {
      const merged = { ...remoteData, ...localData };
      return {
        strategy: 'merge',
        data: merged
      };
    } catch (error) {
      console.error('Failed to merge conflict data:', error);
    }
  }
  
  // Default: Manual resolution required
  return {
    strategy: 'manual',
    data: remoteData // Default to remote for safety
  };
};

/**
 * Get pending conflicts
 * @returns {Array} Array of pending conflicts
 */
export const getPendingConflicts = () => {
  try {
    return JSON.parse(localStorage.getItem(CONFLICT_RESOLUTION_KEY) || '[]');
  } catch (error) {
    console.error('Failed to get pending conflicts:', error);
    return [];
  }
};

/**
 * Resolve conflict manually
 * @param {string} conflictId - Conflict ID
 * @param {string} resolution - Resolution strategy ('local', 'remote', 'merged')
 * @param {any} mergedData - Merged data if resolution is 'merged'
 */
export const resolveConflictManually = (conflictId, resolution, mergedData = null) => {
  try {
    const conflicts = JSON.parse(localStorage.getItem(CONFLICT_RESOLUTION_KEY) || '[]');
    const conflictIndex = conflicts.findIndex(c => c.key === conflictId);
    
    if (conflictIndex !== -1) {
      const conflict = conflicts[conflictIndex];
      let resolvedData;
      
      switch (resolution) {
        case 'local':
          resolvedData = conflict.localData;
          break;
        case 'remote':
          resolvedData = conflict.remoteData;
          break;
        case 'merged':
          resolvedData = mergedData;
          break;
        default:
          throw new Error('Invalid resolution strategy');
      }
      
      // Update local data with resolved data
      setOfflineData(conflict.key, resolvedData);
      
      // Remove from conflicts
      conflicts.splice(conflictIndex, 1);
      localStorage.setItem(CONFLICT_RESOLUTION_KEY, JSON.stringify(conflicts));
      
      return { success: true, resolvedData };
    }
  } catch (error) {
    console.error('Failed to resolve conflict manually:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get mobile dashboard data (with offline support)
 * @param {string} businessId - Business ID
 * @returns {Promise} Dashboard data
 */
export const getMobileDashboardData = async (businessId) => {
  // Try to get cached data first
  const cachedData = getOfflineData(`dashboard_${businessId}`);
  
  if (navigator.onLine) {
    try {
      // Fetch fresh data
      const response = await fetch(`/api/business-owner/mobile/dashboard/${businessId}`);
      const data = await response.json();
      
      // Cache the data
      setOfflineData(`dashboard_${businessId}`, data);
      
      return data;
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
      // Return cached data if available
      return cachedData || { error: 'No data available' };
    }
  } else {
    // Offline mode - return cached data
    return cachedData || { error: 'No cached data available' };
  }
};

/**
 * Enhanced sync offline data when online with auto-retry and conflict resolution
 * @param {string} businessId - Business ID
 * @param {object} options - Sync options
 * @returns {Promise} Sync result
 */
export const syncOfflineData = async (businessId, options = {}) => {
  if (syncInProgress) {
    throw new Error('Sync already in progress');
  }

  if (!navigator.onLine) {
    throw new Error('Cannot sync while offline');
  }

  syncInProgress = true;
  const syncQueue = getSyncQueue();
  const results = [];
  
  updateSyncProgress({ total: syncQueue.length, completed: 0, failed: 0 });

  try {
    // Process sync queue with priority handling
    for (let i = 0; i < syncQueue.length; i++) {
      const action = syncQueue[i];
      
      try {
        // Check for conflicts before syncing
        if (action.conflictCheck) {
          const conflictResult = await resolveConflict(action.key, action.localData, action.remoteData);
          if (!conflictResult.resolved) {
            results.push({ 
              actionId: action.id, 
              status: 'conflict', 
              conflict: conflictResult.conflict 
            });
            continue;
          }
          // Use resolved data
          action.data = conflictResult.result;
        }

        // Execute sync action with retry logic
        const syncResult = await executeSyncAction(action);
        
        if (syncResult.success) {
          results.push({ actionId: action.id, status: 'success' });
        } else {
          // Handle retry logic
          if (action.retries < action.maxRetries) {
            action.retries++;
            action.lastError = syncResult.error;
            
            // Add back to queue for retry
            setTimeout(() => {
              addToSyncQueue(action);
            }, Math.pow(2, action.retries) * 1000); // Exponential backoff
            
            results.push({ 
              actionId: action.id, 
              status: 'retrying', 
              retry: action.retries,
              maxRetries: action.maxRetries 
            });
          } else {
            results.push({ 
              actionId: action.id, 
              status: 'failed', 
              error: syncResult.error,
              retries: action.retries 
            });
          }
        }
      } catch (error) {
        results.push({ actionId: action.id, status: 'failed', error: error.message });
      }
      
      // Update progress
      updateSyncProgress({
        completed: results.filter(r => r.status === 'success').length,
        failed: results.filter(r => r.status === 'failed').length
      });
      
      // Small delay between syncs to prevent overwhelming the server
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    // Clean up successful syncs
    const successfulSyncs = results.filter(r => r.status === 'success');
    const failedSyncs = results.filter(r => r.status === 'failed');
    const conflictSyncs = results.filter(r => r.status === 'conflict');

    if (successfulSyncs.length > 0) {
      // Remove successful items from queue
      const remainingQueue = syncQueue.filter(action => 
        !successfulSyncs.some(success => success.actionId === action.id)
      );
      localStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(remainingQueue));
    }

    return {
      total: syncQueue.length,
      successful: successfulSyncs.length,
      failed: failedSyncs.length,
      conflicts: conflictSyncs.length,
      results,
      syncTime: Date.now()
    };

  } finally {
    syncInProgress = false;
    updateSyncProgress({ 
      total: 0, 
      completed: 0, 
      failed: 0, 
      status: 'completed' 
    });
  }
};

/**
 * Execute individual sync action with enhanced error handling
 * @param {object} action - Action to execute
 * @returns {Promise} Sync result
 */
const executeSyncAction = async (action) => {
  try {
    const response = await fetch(action.url, {
      method: action.method || 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Offline-Sync': 'true', // Mark as offline sync request
        ...action.headers
      },
      body: JSON.stringify(action.data),
      credentials: 'include'
    });

    if (response.ok) {
      const result = await response.json();
      
      // Update local data with server response if needed
      if (action.updateLocal && result.data) {
        setOfflineData(action.key, result.data);
      }
      
      return { success: true, data: result };
    } else {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
    }
  } catch (error) {
    return { success: false, error: error.message };
  }
};

/**
 * Auto-sync on reconnection with debouncing
 * @param {string} businessId - Business ID
 * @param {number} delay - Delay before auto-sync (ms)
 */
export const autoSyncOnReconnect = (businessId, delay = 2000) => {
  let autoSyncTimeout;
  
  const handleReconnect = async () => {
    if (autoSyncTimeout) {
      clearTimeout(autoSyncTimeout);
    }
    
    // Wait for stable connection
    autoSyncTimeout = setTimeout(async () => {
      if (navigator.onLine && !syncInProgress) {
        try {
          const syncQueue = getSyncQueue();
          if (syncQueue.length > 0) {
            console.log(`Auto-syncing ${syncQueue.length} items...`);
            await syncOfflineData(businessId);
          }
        } catch (error) {
          console.error('Auto-sync failed:', error);
        }
      }
    }, delay);
  };
  
  // Set up connection monitoring
  return monitorConnectionStatus(handleReconnect, () => {
    if (autoSyncTimeout) {
      clearTimeout(autoSyncTimeout);
    }
  });
};

/**
 * Background sync with service worker support
 * @param {string} businessId - Business ID
 */
export const enableBackgroundSync = (businessId) => {
  if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
    // Register for background sync
    navigator.serviceWorker.ready.then(registration => {
      return registration.sync.register('background-sync');
    }).catch(error => {
      console.error('Background sync registration failed:', error);
    });
  }
  
  // Fallback: periodic sync check
  const periodicSync = setInterval(async () => {
    if (navigator.onLine && !syncInProgress) {
      const syncQueue = getSyncQueue();
      if (syncQueue.length > 0) {
        try {
          await syncOfflineData(businessId);
        } catch (error) {
          console.error('Periodic sync failed:', error);
        }
      }
    }
  }, 60000); // Check every minute
  
  return () => clearInterval(periodicSync);
};

/**
 * Get sync statistics
 * @returns {object} Sync statistics
 */
export const getSyncStatistics = () => {
  const syncQueue = getSyncQueue();
  const conflicts = getPendingConflicts();
  const progress = getSyncProgress();
  
  return {
    queueLength: syncQueue.length,
    pendingConflicts: conflicts.length,
    inProgress: syncInProgress,
    lastSync: progress.status === 'completed' ? progress.syncTime : null,
    priorityBreakdown: {
      high: syncQueue.filter(a => a.priority === 'high').length,
      normal: syncQueue.filter(a => a.priority === 'normal').length,
      low: syncQueue.filter(a => a.priority === 'low').length
    },
    storageSize: getOfflineStorageSize()
  };
};

/**
 * Check if device is online
 * @returns {boolean} Online status
 */
export const isOnline = () => navigator.onLine;

/**
 * Monitor online/offline status
 * @param {Function} onOnline - Callback when online
 * @param {Function} onOffline - Callback when offline
 * @returns {Function} Cleanup function
 */
export const monitorConnectionStatus = (onOnline, onOffline) => {
  const handleOnline = () => onOnline();
  const handleOffline = () => onOffline();

  window.addEventListener('online', handleOnline);
  window.addEventListener('offline', handleOffline);

  return () => {
    window.removeEventListener('online', handleOnline);
    window.removeEventListener('offline', handleOffline);
  };
};

/**
 * Cache form data for offline submission
 * @param {string} formId - Form identifier
 * @param {object} formData - Form data
 */
export const cacheFormData = (formId, formData) => {
  setOfflineData(`form_${formId}`, formData);
};

/**
 * Get cached form data
 * @param {string} formId - Form identifier
 * @returns {object} Cached form data
 */
export const getCachedFormData = (formId) => {
  return getOfflineData(`form_${formId}`);
};

/**
 * Submit form data (with offline support)
 * @param {string} url - Submission URL
 * @param {object} formData - Form data
 * @returns {Promise} Submission result
 */
export const submitFormWithOfflineSupport = async (url, formData) => {
  if (navigator.onLine) {
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      // If submission fails, queue for later sync
      addToSyncQueue({
        url,
        method: 'POST',
        data: formData
      });
      throw error;
    }
  } else {
    // Offline mode - queue for later sync
    addToSyncQueue({
      url,
      method: 'POST',
      data: formData
    });
    return { queued: true, message: 'Form will be submitted when online' };
  }
};

/**
 * Clear all offline data
 */
export const clearAllOfflineData = () => {
  try {
    localStorage.removeItem(OFFLINE_STORAGE_KEY);
    localStorage.removeItem(SYNC_QUEUE_KEY);
  } catch (error) {
    console.error('Failed to clear offline data:', error);
  }
};

/**
 * Get offline storage size
 * @returns {number} Storage size in bytes
 */
export const getOfflineStorageSize = () => {
  try {
    const offlineData = localStorage.getItem(OFFLINE_STORAGE_KEY) || '{}';
    const syncQueue = localStorage.getItem(SYNC_QUEUE_KEY) || '[]';
    return new Blob([offlineData, syncQueue]).size;
  } catch (error) {
    console.error('Failed to calculate storage size:', error);
    return 0;
  }
};
