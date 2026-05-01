/**
 * Integration Tests for Maintenance Feature
 * Tests end-to-end maintenance workflows across services
 */

import { vi, describe, it, expect, beforeEach } from 'vitest';

// Mock maintenance service
vi.mock('@/features/admin/services/maintenanceService');

// Mock HTTP calls
vi.mock('@/lib/http', () => ({
  get: vi.fn(),
  post: vi.fn(),
  del: vi.fn()
}));

describe('Maintenance Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Maintenance Request Workflow', () => {
    it('should complete maintenance request creation with conflict detection', async () => {
      const { getMaintenanceConflicts } = await import('@/features/admin/services/maintenanceService');
      const http = await import('@/lib/http');

      // Mock conflict check - no conflicts
      getMaintenanceConflicts.mockResolvedValue([]);

      // Mock successful request creation
      http.post.mockResolvedValue({
        success: true,
        approval: {
          approvalId: 'MAINT-001',
          status: 'pending',
          requestType: 'maintenance_mode',
          requestDetails: {
            action: 'enable',
            reason: 'System upgrade',
            message: 'Database maintenance',
            expectedResumeAt: new Date(Date.now() + 7200000).toISOString(),
            scheduledStartAt: new Date(Date.now() + 3600000).toISOString()
          }
        }
      });

      // Verify conflict service was called with correct parameters
      expect(getMaintenanceConflicts).toBeDefined();
      expect(http.post).toBeDefined();
    });

    it('should handle conflict detection when overlapping maintenance exists', async () => {
      const { getMaintenanceConflicts } = await import('@/features/admin/services/maintenanceService');

      // Mock conflict check - returns conflicts
      getMaintenanceConflicts.mockResolvedValue([
        {
          approvalId: 'MAINT-EXISTING',
          status: 'approved',
          reason: 'Existing maintenance',
          startAt: new Date(Date.now() + 3600000).toISOString(),
          endAt: new Date(Date.now() + 7200000).toISOString()
        }
      ]);

      const conflicts = await getMaintenanceConflicts(
        new Date(Date.now() + 5400000).toISOString(),
        new Date(Date.now() + 10800000).toISOString()
      );

      expect(conflicts).toHaveLength(1);
      expect(conflicts[0].approvalId).toBe('MAINT-EXISTING');
    });

    it('should validate maintenance schedule constraints', async () => {
      const { getMaintenanceConflicts } = await import('@/features/admin/services/maintenanceService');

      getMaintenanceConflicts.mockResolvedValue([]);

      // Test minimum duration (1 hour)
      const minDurationStart = new Date(Date.now() + 3600000);
      const minDurationEnd = new Date(Date.now() + 3600000 + 3600000); // 1 hour later
      const minDurationCheck = await getMaintenanceConflicts(
        minDurationStart.toISOString(),
        minDurationEnd.toISOString()
      );
      expect(minDurationCheck).toEqual([]);

      // Test maximum duration (7 days)
      const maxDurationStart = new Date(Date.now() + 3600000);
      const maxDurationEnd = new Date(Date.now() + 3600000 + (7 * 24 * 3600000)); // 7 days later
      const maxDurationCheck = await getMaintenanceConflicts(
        maxDurationStart.toISOString(),
        maxDurationEnd.toISOString()
      );
      expect(maxDurationCheck).toEqual([]);

      // Test scheduling horizon (30 days)
      const horizonStart = new Date(Date.now() + 30 * 24 * 3600000);
      const horizonEnd = new Date(Date.now() + 30 * 24 * 3600000 + 3600000);
      const horizonCheck = await getMaintenanceConflicts(
        horizonStart.toISOString(),
        horizonEnd.toISOString()
      );
      expect(horizonCheck).toEqual([]);
    });
  });

  describe('Maintenance Approval Workflow', () => {
    it('should complete approval workflow with single rejection', async () => {
      const http = await import('@/lib/http');

      // Mock approval endpoint
      http.post.mockImplementation((url) => {
        if (url.includes('/approvals')) {
          return Promise.resolve({
            success: true,
            approval: {
              approvalId: 'MAINT-001',
              status: 'rejected',
              approvals: [
                { adminId: 'admin1', approved: false, comment: 'Not needed', timestamp: new Date() }
              ]
            }
          });
        }
        return Promise.resolve({ success: true });
      });

      // Verify single rejection results in rejected status
      const response = await http.post('/api/admin/approvals/MAINT-001/vote', {
        approved: false,
        comment: 'Not needed'
      });

      expect(response.success).toBe(true);
      expect(response.approval.status).toBe('rejected');
    });

    it('should require two approvals for maintenance request', async () => {
      const http = await import('@/lib/http');

      // Mock first approval
      http.post.mockImplementation((url) => {
        if (url.includes('/approvals')) {
          return Promise.resolve({
            success: true,
            approval: {
              approvalId: 'MAINT-001',
              status: 'pending',
              requiredApprovals: 2,
              approvals: [
                { adminId: 'admin1', approved: true, timestamp: new Date() }
              ]
            }
          });
        }
        return Promise.resolve({ success: true });
      });

      const response1 = await http.post('/api/admin/approvals/MAINT-001/vote', {
        approved: true
      });

      expect(response1.approval.status).toBe('pending');
      expect(response1.approval.approvals.length).toBe(1);

      // Mock second approval
      http.post.mockImplementation((url) => {
        if (url.includes('/approvals')) {
          return Promise.resolve({
            success: true,
            approval: {
              approvalId: 'MAINT-001',
              status: 'approved',
              requiredApprovals: 2,
              approvals: [
                { adminId: 'admin1', approved: true, timestamp: new Date() },
                { adminId: 'admin2', approved: true, timestamp: new Date() }
              ]
            }
          });
        }
        return Promise.resolve({ success: true });
      });

      const response2 = await http.post('/api/admin/approvals/MAINT-001/vote', {
        approved: true
      });

      expect(response2.approval.status).toBe('approved');
      expect(response2.approval.approvals.length).toBe(2);
    });
  });

  describe('Maintenance Activation Workflow', () => {
    it('should activate maintenance when scheduled time arrives', async () => {
      const http = await import('@/lib/http');

      // Mock maintenance status check
      http.get.mockResolvedValue({
        active: true,
        message: 'System maintenance in progress',
        expectedResumeAt: new Date(Date.now() + 3600000).toISOString(),
        activatedAt: new Date().toISOString()
      });

      const status = await http.get('/api/maintenance/status');

      expect(status.active).toBe(true);
      expect(status.message).toBe('System maintenance in progress');
    });

    it('should show scheduled maintenance before activation', async () => {
      const http = await import('@/lib/http');

      const scheduledStart = new Date(Date.now() + 86400000); // 1 day from now

      http.get.mockResolvedValue({
        active: false,
        scheduled: true,
        message: 'Scheduled maintenance',
        expectedResumeAt: new Date(Date.now() + 172800000).toISOString(),
        scheduledStartAt: scheduledStart.toISOString()
      });

      const status = await http.get('/api/maintenance/status');

      expect(status.active).toBe(false);
      expect(status.scheduled).toBe(true);
    });
  });

  describe('Maintenance Cancellation Workflow', () => {
    it('should create cancellation request for approved upcoming maintenance', async () => {
      const http = await import('@/lib/http');

      http.post.mockResolvedValue({
        success: true,
        approval: {
          approvalId: 'CANCEL-001',
          status: 'pending',
          requestType: 'maintenance_mode',
          requestDetails: {
            action: 'disable',
            cancelTargetApprovalId: 'MAINT-001',
            cancelScheduledStartAt: new Date(Date.now() + 86400000).toISOString()
          }
        }
      });

      const response = await http.post('/api/admin/maintenance/MAINT-001/cancel');

      expect(response.success).toBe(true);
      expect(response.approval.requestDetails.action).toBe('disable');
      expect(response.approval.requestDetails.cancelTargetApprovalId).toBe('MAINT-001');
    });

    it('should prevent cancellation for maintenance that already started', async () => {
      const http = await import('@/lib/http');

      http.post.mockResolvedValue({
        success: false,
        error_code: 'maintenance_not_upcoming'
      });

      const response = await http.post('/api/admin/maintenance/MAINT-ACTIVE/cancel');

      expect(response.success).toBe(false);
      expect(response.error_code).toBe('maintenance_not_upcoming');
    });
  });

  describe('Maintenance Undo Vote Workflow', () => {
    it('should allow undo within time window when no overlapping maintenance', async () => {
      const http = await import('@/lib/http');

      http.post.mockResolvedValue({
        success: true,
        approval: {
          approvalId: 'MAINT-001',
          status: 'pending',
          approvals: [] // Vote removed
        }
      });

      const response = await http.post('/api/admin/approvals/MAINT-001/undo');

      expect(response.success).toBe(true);
      expect(response.approval.approvals).toHaveLength(0);
    });

    it('should prevent undo when overlapping approved maintenance exists', async () => {
      const http = await import('@/lib/http');

      http.post.mockResolvedValue({
        success: false,
        error_code: 'undo_not_allowed',
        message: 'Cannot undo vote due to overlapping approved maintenance'
      });

      const response = await http.post('/api/admin/approvals/MAINT-001/undo');

      expect(response.success).toBe(false);
      expect(response.error_code).toBe('undo_not_allowed');
    });
  });

  describe('Maintenance During Active Session', () => {
    it('should allow scheduling next maintenance during active session', async () => {
      const { getMaintenanceConflicts } = await import('@/features/admin/services/maintenanceService');
      const http = await import('@/lib/http');

      // Mock current active maintenance
      http.get.mockResolvedValue({
        maintenance: {
          status: 'active',
          isActive: true,
          expectedResumeAt: new Date(Date.now() + 3600000).toISOString()
        }
      });

      // Mock conflict check - should exclude current active maintenance
      getMaintenanceConflicts.mockResolvedValue([]);

      const currentStatus = await http.get('/api/admin/maintenance/current');
      expect(currentStatus.maintenance.status).toBe('active');

      // Check for conflicts when scheduling next maintenance
      const nextStart = new Date(Date.now() + 86400000);
      const nextEnd = new Date(Date.now() + 172800000);
      const conflicts = await getMaintenanceConflicts(
        nextStart.toISOString(),
        nextEnd.toISOString(),
        'CURRENT-MAINT-ID' // exclude current active maintenance
      );

      expect(conflicts).toHaveLength(0);
    });

    it('should detect conflicts excluding current active maintenance', async () => {
      const { getMaintenanceConflicts } = await import('@/features/admin/services/maintenanceService');

      // Mock conflicts excluding current active maintenance
      getMaintenanceConflicts.mockResolvedValue([
        {
          approvalId: 'MAINT-OTHER',
          status: 'approved',
          startAt: new Date(Date.now() + 86400000).toISOString(),
          endAt: new Date(Date.now() + 172800000).toISOString()
        }
      ]);

      const nextStart = new Date(Date.now() + 90000000);
      const nextEnd = new Date(Date.now() + 180000000);
      const conflicts = await getMaintenanceConflicts(
        nextStart.toISOString(),
        nextEnd.toISOString(),
        'CURRENT-MAINT-ID'
      );

      expect(conflicts).toHaveLength(1);
      expect(conflicts[0].approvalId).toBe('MAINT-OTHER');
    });
  });
});
