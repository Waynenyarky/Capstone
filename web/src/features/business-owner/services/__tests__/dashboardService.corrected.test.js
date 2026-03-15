import { getOwnerStats } from '../dashboardService';
import { get } from '@/lib/http';
import { vi, describe, it, expect, beforeEach } from 'vitest';

// Mock the HTTP module
vi.mock('@/lib/http');
const mockGet = vi.mocked(get);

describe('dashboardService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getOwnerStats', () => {
    it('should call GET with correct endpoint and return data', async () => {
      const mockResponse = {
        data: {
          totalBusinesses: 5,
          activeBusinesses: 3,
          renewalsDue: 2,
          renewalsDueList: [{ businessId: 'b1', businessName: 'Business 1' }],
          pendingPostRequirements: 1,
          overduePostRequirements: 0,
          openAppeals: 1,
          pendingEditRequests: 2,
          recentApplications: [{ businessId: 'b2', businessName: 'Business 2', status: 'pending' }]
        }
      };
      mockGet.mockResolvedValue(mockResponse);

      const result = await getOwnerStats();

      expect(mockGet).toHaveBeenCalledWith('/api/business/dashboard/owner-stats');
      expect(result).toEqual(mockResponse.data);
    });

    it('should return default data when API response has no data', async () => {
      const mockResponse = {};
      mockGet.mockResolvedValue(mockResponse);

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
        recentApplications: []
      });
    });

    it('should handle API errors', async () => {
      const mockError = new Error('Network error');
      mockGet.mockRejectedValue(mockError);

      await expect(getOwnerStats()).rejects.toThrow('Network error');
      expect(mockGet).toHaveBeenCalledWith('/api/business/dashboard/owner-stats');
    });

    it('should return default data when response is null', async () => {
      mockGet.mockResolvedValue(null);

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
        recentApplications: []
      });
    });
  });
});
