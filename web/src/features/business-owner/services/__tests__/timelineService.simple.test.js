import { getTimelineEdgeCases, submitExtensionRequest, getTimelineHistory } from '../timelineService';
import { get, post } from '@/lib/http';
import { vi, describe, it, expect, beforeEach } from 'vitest';

// Mock the HTTP module
vi.mock('@/lib/http');
const mockGet = vi.mocked(get);
const mockPost = vi.mocked(post);

describe('timelineService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getTimelineEdgeCases', () => {
    it('should call GET with correct endpoint and business ID', async () => {
      const businessId = 'business1';
      const mockResponse = { edgeCases: [] };
      mockGet.mockResolvedValue(mockResponse);

      const result = await getTimelineEdgeCases(businessId);

      expect(mockGet).toHaveBeenCalledWith('/api/business-owner/timeline/business1/edge-cases');
      expect(result).toEqual(mockResponse);
    });

    it('should handle API errors', async () => {
      const businessId = 'business1';
      const mockError = new Error('Network error');
      mockGet.mockRejectedValue(mockError);

      await expect(getTimelineEdgeCases(businessId)).rejects.toThrow('Network error');
      expect(mockGet).toHaveBeenCalledWith('/api/business-owner/timeline/business1/edge-cases');
    });
  });

  describe('submitExtensionRequest', () => {
    it('should call POST with correct endpoint and request data', async () => {
      const caseId = 'case1';
      const requestData = {
        reason: 'Business closure',
        extensionDuration: '7',
        supportingDocuments: ''
      };
      const mockResponse = { success: true };
      mockPost.mockResolvedValue(mockResponse);

      const result = await submitExtensionRequest(caseId, requestData);

      expect(mockPost).toHaveBeenCalledWith('/api/business-owner/timeline/edge-cases/case1/extension', requestData);
      expect(result).toEqual(mockResponse);
    });

    it('should handle network errors', async () => {
      const caseId = 'case1';
      const requestData = { reason: 'Test reason' };
      const mockError = new Error('Network error');
      mockPost.mockRejectedValue(mockError);

      await expect(submitExtensionRequest(caseId, requestData)).rejects.toThrow('Network error');
      expect(mockPost).toHaveBeenCalledWith('/api/business-owner/timeline/edge-cases/case1/extension', requestData);
    });
  });

  describe('getTimelineHistory', () => {
    it('should call GET with correct endpoint and business ID', async () => {
      const businessId = 'business1';
      const mockHistory = [
        {
          id: 'adjustment1',
          type: 'Extension',
          originalDate: '2023-12-25',
          newDate: '2024-01-01',
          reason: 'Holiday deadline',
          approvedAt: '2023-12-20T10:00:00Z'
        }
      ];
      mockGet.mockResolvedValue({ history: mockHistory });

      const result = await getTimelineHistory(businessId);

      expect(mockGet).toHaveBeenCalledWith('/api/business-owner/timeline/business1/history');
      expect(result).toEqual({ history: mockHistory });
    });

    it('should handle empty history', async () => {
      const businessId = 'business1';
      const mockHistory = [];
      mockGet.mockResolvedValue({ history: mockHistory });

      const result = await getTimelineHistory(businessId);

      expect(result).toEqual({ history: mockHistory });
      expect(mockGet).toHaveBeenCalledWith('/api/business-owner/timeline/business1/history');
    });

    it('should handle network errors', async () => {
      const businessId = 'business1';
      const mockError = new Error('Network error');
      mockGet.mockRejectedValue(mockError);

      await expect(getTimelineHistory(businessId)).rejects.toThrow('Network error');
      expect(mockGet).toHaveBeenCalledWith('/api/business-owner/timeline/business1/history');
    });
  });
});
