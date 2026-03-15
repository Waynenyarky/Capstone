import { getBusinessConflicts, resolveConflict } from '../businessConflictService';
import { get, post } from '@/lib/http';
import { vi, describe, it, expect, beforeEach } from 'vitest';

// Mock the HTTP module
vi.mock('@/lib/http');
const mockGet = vi.mocked(get);
const mockPost = vi.mocked(post);

describe('businessConflictService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getBusinessConflicts', () => {
    it('should call POST with correct endpoint and business IDs', async () => {
      const businessIds = ['business1', 'business2'];
      const mockResponse = { conflicts: [] };
      mockPost.mockResolvedValue(mockResponse);

      const result = await getBusinessConflicts(businessIds);

      expect(mockPost).toHaveBeenCalledWith('/api/business-owner/conflicts/detect', { businessIds });
      expect(result).toEqual(mockResponse);
    });

    it('should handle API errors', async () => {
      const businessIds = ['business1', 'business2'];
      const mockError = new Error('Network error');
      mockPost.mockRejectedValue(mockError);

      await expect(getBusinessConflicts(businessIds)).rejects.toThrow('Network error');
      expect(mockPost).toHaveBeenCalledWith('/api/business-owner/conflicts/detect', { businessIds });
    });
  });

  describe('resolveConflict', () => {
    it('should call POST with correct endpoint and resolution data', async () => {
      const conflictId = 'conflict1';
      const resolution = 'auto';
      const mockResponse = { success: true };
      mockPost.mockResolvedValue(mockResponse);

      const result = await resolveConflict(conflictId, resolution);

      expect(mockPost).toHaveBeenCalledWith('/api/business-owner/conflicts/conflict1/resolve', { resolution });
      expect(result).toEqual(mockResponse);
    });

    it('should handle network errors', async () => {
      const conflictId = 'conflict1';
      const resolution = 'auto';
      const mockError = new Error('Network error');
      mockPost.mockRejectedValue(mockError);

      await expect(resolveConflict(conflictId, resolution)).rejects.toThrow('Network error');
      expect(mockPost).toHaveBeenCalledWith('/api/business-owner/conflicts/conflict1/resolve', { resolution });
    });
  });
});
