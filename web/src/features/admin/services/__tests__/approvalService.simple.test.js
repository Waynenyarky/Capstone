import { getApprovals, getApproval, approveRequest, getRequestTypeLabel } from '../approvalService';
import { fetchJsonWithFallback } from '@/lib/http';
import { getCurrentUser } from '@/features/authentication/lib/authEvents';
import { vi, describe, it, expect, beforeEach } from 'vitest';

// Mock dependencies
vi.mock('@/lib/http');
vi.mock('@/features/authentication/lib/authEvents');

const mockFetchJson = vi.mocked(fetchJsonWithFallback);
const mockGetCurrentUser = vi.mocked(getCurrentUser);

// Mock the authHeaders function
vi.mock('@/lib/authHeaders', () => ({
  authHeaders: vi.fn((user, role, extra = {}) => {
    const headers = {
      'x-user-id': user?.id || 'admin1',
      'x-user-role': role || 'admin',
      ...extra
    };
    // Only add Content-Type for POST/PUT/PATCH requests
    if (extra['Content-Type']) {
      headers['Content-Type'] = extra['Content-Type'];
    }
    return headers;
  })
}));

describe('approvalService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetCurrentUser.mockReturnValue({ id: 'admin1', token: 'token123' });
  });

  describe('getApprovals', () => {
    it('should call fetch with correct endpoint and no parameters', async () => {
      const mockResponse = { approvals: [] };
      mockFetchJson.mockResolvedValue(mockResponse);

      const result = await getApprovals();

      expect(mockFetchJson).toHaveBeenCalledWith('/api/admin/approvals', {
        method: 'GET',
        headers: { 
          'x-user-id': 'admin1',
          'x-user-role': 'admin'
        }
      });
      expect(result).toEqual({ approvals: [] });
    });

    it('should call fetch with status filter', async () => {
      const mockResponse = { approvals: [] };
      mockFetchJson.mockResolvedValue(mockResponse);

      await getApprovals({ status: 'pending' });

      expect(mockFetchJson).toHaveBeenCalledWith('/api/admin/approvals?status=pending', {
        method: 'GET',
        headers: { 
          'x-user-id': 'admin1',
          'x-user-role': 'admin'
        }
      });
    });

    it('should call fetch with multiple filters', async () => {
      const mockResponse = { approvals: [] };
      mockFetchJson.mockResolvedValue(mockResponse);

      await getApprovals({ status: 'pending', userId: 'user1', requestType: 'business' });

      expect(mockFetchJson).toHaveBeenCalledWith('/api/admin/approvals?status=pending&userId=user1&requestType=business', {
        method: 'GET',
        headers: { 
          'x-user-id': 'admin1',
          'x-user-role': 'admin'
        }
      });
    });

    it('should handle API errors', async () => {
      const mockError = new Error('Network error');
      mockFetchJson.mockRejectedValue(mockError);

      await expect(getApprovals()).rejects.toThrow('Network error');
    });
  });

  describe('getApproval', () => {
    it('should call fetch with correct endpoint and approval ID', async () => {
      const approvalId = 'approval1';
      const mockResponse = { approval: { id: approvalId } };
      mockFetchJson.mockResolvedValue(mockResponse);

      const result = await getApproval(approvalId);

      expect(mockFetchJson).toHaveBeenCalledWith('/api/admin/approvals/approval1', {
        method: 'GET',
        headers: { 
          'x-user-id': 'admin1',
          'x-user-role': 'admin'
        }
      });
      expect(result).toEqual({ approval: { id: approvalId } });
    });

    it('should handle API errors', async () => {
      const approvalId = 'approval1';
      const mockError = new Error('Network error');
      mockFetchJson.mockRejectedValue(mockError);

      await expect(getApproval(approvalId)).rejects.toThrow('Network error');
    });
  });

  describe('approveRequest', () => {
    it('should call fetch with correct endpoint and approval data', async () => {
      const approvalId = 'approval1';
      const approvalData = { approved: true, comment: 'Approved after review' };
      const mockResponse = { success: true };
      mockFetchJson.mockResolvedValue(mockResponse);

      const result = await approveRequest(approvalId, approvalData);

      expect(mockFetchJson).toHaveBeenCalledWith('/api/admin/approvals/approval1/approve', {
        method: 'POST',
        headers: { 
          'x-user-id': 'admin1',
          'x-user-role': 'admin',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(approvalData)
      });
      expect(result).toEqual(mockResponse);
    });

    it('should handle approval with false (rejection)', async () => {
      const approvalId = 'approval1';
      const approvalData = { approved: false, comment: 'Insufficient documentation' };
      const mockResponse = { success: true };
      mockFetchJson.mockResolvedValue(mockResponse);

      const result = await approveRequest(approvalId, approvalData);

      expect(mockFetchJson).toHaveBeenCalledWith('/api/admin/approvals/approval1/approve', {
        method: 'POST',
        headers: { 
          'x-user-id': 'admin1',
          'x-user-role': 'admin',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(approvalData)
      });
      expect(result).toEqual(mockResponse);
    });

    it('should handle network errors', async () => {
      const approvalId = 'approval1';
      const approvalData = { approved: true, comment: 'Approved' };
      const mockError = new Error('Network error');
      mockFetchJson.mockRejectedValue(mockError);

      await expect(approveRequest(approvalId, approvalData)).rejects.toThrow('Network error');
    });
  });

  describe('getRequestTypeLabel', () => {
    it('should return correct label for known request types', () => {
      expect(getRequestTypeLabel('email_change')).toBe('Email change');
      expect(getRequestTypeLabel('password_change')).toBe('Password change');
      expect(getRequestTypeLabel('personal_info_change')).toBe('Personal info');
      expect(getRequestTypeLabel('account_status_change')).toBe('Account status');
      expect(getRequestTypeLabel('role_change')).toBe('Role change');
      expect(getRequestTypeLabel('maintenance_mode')).toBe('Maintenance');
      expect(getRequestTypeLabel('form_definition')).toBe('Form definition');
      expect(getRequestTypeLabel('password_reset')).toBe('Password reset');
      expect(getRequestTypeLabel('other')).toBe('Other');
    });

    it('should return fallback for unknown request types', () => {
      expect(getRequestTypeLabel('unknown_type')).toBe('unknown_type');
      expect(getRequestTypeLabel(null)).toBe('—');
      expect(getRequestTypeLabel(undefined)).toBe('—');
    });
  });
});
