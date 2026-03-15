import { getAuditHistoryAdmin, getRecentAuditActivityAdmin, getAllAuditLogsAdmin } from '../auditService';
import { fetchJsonWithFallback } from '@/lib/http';
import { vi, describe, it, expect, beforeEach } from 'vitest';

vi.mock('@/lib/http');
const mockFetchJson = vi.mocked(fetchJsonWithFallback);

describe('auditService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getAuditHistoryAdmin', () => {
    it('should call fetch with correct endpoint and no parameters', async () => {
      const mockResponse = { logs: [] };
      mockFetchJson.mockResolvedValue(mockResponse);

      const result = await getAuditHistoryAdmin();

      expect(mockFetchJson).toHaveBeenCalledWith('/api/auth/audit/history?', { method: 'GET' });
      expect(result).toEqual(mockResponse);
    });

    it('should call fetch with parameters', async () => {
      const mockResponse = { logs: [] };
      mockFetchJson.mockResolvedValue(mockResponse);

      await getAuditHistoryAdmin({ page: '1', limit: '10' });

      expect(mockFetchJson).toHaveBeenCalledWith('/api/auth/audit/history?page=1&limit=10', { method: 'GET' });
    });

    it('should handle API errors', async () => {
      mockFetchJson.mockRejectedValue(new Error('Network error'));
      await expect(getAuditHistoryAdmin()).rejects.toThrow('Network error');
    });
  });

  describe('getRecentAuditActivityAdmin', () => {
    it('should call fetch with correct endpoint', async () => {
      const mockResponse = { activities: [] };
      mockFetchJson.mockResolvedValue(mockResponse);

      const result = await getRecentAuditActivityAdmin();

      expect(mockFetchJson).toHaveBeenCalledWith('/api/auth/audit/admin/recent', { method: 'GET' });
      expect(result).toEqual(mockResponse);
    });

    it('should handle API errors', async () => {
      mockFetchJson.mockRejectedValue(new Error('Network error'));
      await expect(getRecentAuditActivityAdmin()).rejects.toThrow('Network error');
    });
  });

  describe('getAllAuditLogsAdmin', () => {
    it('should call fetch with correct endpoint', async () => {
      const mockResponse = { logs: [] };
      mockFetchJson.mockResolvedValue(mockResponse);

      const result = await getAllAuditLogsAdmin();

      expect(mockFetchJson).toHaveBeenCalledWith('/api/auth/audit/admin/all?', { method: 'GET' });
      expect(result).toEqual(mockResponse);
    });

    it('should filter out empty params', async () => {
      const mockResponse = { logs: [] };
      mockFetchJson.mockResolvedValue(mockResponse);

      await getAllAuditLogsAdmin({ action: 'LOGIN', userId: '', empty: null });

      expect(mockFetchJson).toHaveBeenCalledWith('/api/auth/audit/admin/all?action=LOGIN', { method: 'GET' });
    });

    it('should handle API errors', async () => {
      mockFetchJson.mockRejectedValue(new Error('Network error'));
      await expect(getAllAuditLogsAdmin()).rejects.toThrow('Network error');
    });
  });
});
