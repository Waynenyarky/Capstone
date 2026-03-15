import { getOwnerStats } from '../dashboardService';
import { get } from '@/lib/http';
import { vi, describe, it, expect, beforeEach } from 'vitest';

vi.mock('@/lib/http');
const mockGet = vi.mocked(get);

describe('dashboardService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getOwnerStats', () => {
    it('should call GET with correct endpoint', async () => {
      const mockResponse = { data: { totalBusinesses: 5, activeBusinesses: 3 } };
      mockGet.mockResolvedValue(mockResponse);

      const result = await getOwnerStats();

      expect(mockGet).toHaveBeenCalledWith('/api/business/dashboard/owner-stats');
      expect(result).toEqual(mockResponse.data);
    });

    it('should return defaults when response has no data', async () => {
      mockGet.mockResolvedValue({});

      const result = await getOwnerStats();

      expect(mockGet).toHaveBeenCalledWith('/api/business/dashboard/owner-stats');
      expect(result).toEqual({
        totalBusinesses: 0,
        activeBusinesses: 0,
        renewalsDue: 0,
        renewalsDueList: [],
        pendingPostRequirements: 0,
        overduePostRequirements: 0,
        openAppeals: 0,
        pendingEditRequests: 0,
        recentApplications: [],
      });
    });

    it('should handle API errors', async () => {
      mockGet.mockRejectedValue(new Error('Network error'));

      await expect(getOwnerStats()).rejects.toThrow('Network error');
    });

    it('should return defaults when response is null', async () => {
      mockGet.mockResolvedValue(null);

      const result = await getOwnerStats();

      expect(result).toEqual({
        totalBusinesses: 0,
        activeBusinesses: 0,
        renewalsDue: 0,
        renewalsDueList: [],
        pendingPostRequirements: 0,
        overduePostRequirements: 0,
        openAppeals: 0,
        pendingEditRequests: 0,
        recentApplications: [],
      });
    });
  });
});
