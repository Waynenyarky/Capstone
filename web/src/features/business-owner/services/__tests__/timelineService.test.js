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

    it('should handle empty edge cases', async () => {
      const businessId = 'business1';
      const mockResponse = { edgeCases: [] };
      mockGet.mockResolvedValue(mockResponse);

      const result = await getTimelineEdgeCases(businessId);

      expect(result).toEqual(mockResponse);
      expect(mockGet).toHaveBeenCalledWith('/api/business-owner/timeline/business1/edge-cases');
    });

    it('should handle edge cases with valid data', async () => {
      const businessId = 'business1';
      const mockEdgeCases = [
        {
          id: 'case1',
          type: 'Holiday Deadline',
          severity: 'High',
          description: 'Deadline falls on a public holiday',
          originalDeadline: '2023-12-25',
          gracePeriodEnds: '2023-12-27'
        },
        {
          id: 'case2',
          type: 'Weekend Payment',
          severity: 'Medium',
          description: 'Payment due on weekend',
          originalDeadline: '2023-12-30',
          gracePeriodEnds: '2024-01-02'
        }
      ];
      mockGet.mockResolvedValue({ edgeCases: mockEdgeCases });

      const result = await getTimelineEdgeCases(businessId);

      expect(result).toEqual({ edgeCases: mockEdgeCases });
      expect(mockGet).toHaveBeenCalledWith('/api/business-owner/timeline/business1/edge-cases');
    });

    it('should handle server error responses', async () => {
      const businessId = 'business1';
      const mockErrorResponse = { error: 'Business not found' };
      mockGet.mockResolvedValue(mockErrorResponse);

      const result = await getTimelineEdgeCases(businessId);

      expect(result).toEqual(mockErrorResponse);
      expect(mockGet).toHaveBeenCalledWith('/api/business-owner/timeline/business1/edge-cases');
    });

    it('should handle null response', async () => {
      const businessId = 'business1';
      mockGet.mockResolvedValue(null);

      const result = await getTimelineEdgeCases(businessId);

      expect(result).toBeNull();
      expect(mockGet).toHaveBeenCalledWith('/api/business-owner/timeline/business1/edge-cases');
    });

    it('should handle undefined response', async () => {
      const businessId = 'business1';
      mockGet.mockResolvedValue(undefined);

      const result = await getTimelineEdgeCases(businessId);

      expect(result).toBeUndefined();
      expect(mockGet).toHaveBeenCalledWith('/api/business-owner/timeline/business1/edge-cases');
    });
  });

  describe('submitExtensionRequest', () => {
    it('should call POST with correct endpoint and request data', async () => {
      const caseId = 'case1';
      const requestData = {
        reason: 'Business closure due to emergency',
        extensionDuration: '7',
        supportingDocuments: 'https://example.com/doc1'
      };
      const mockResponse = { success: true, requestId: 'req1' };
      mockPost.mockResolvedValue(mockResponse);

      const result = await submitExtensionRequest(caseId, requestData);

      expect(mockPost).toHaveBeenCalledWith('/api/business-owner/timeline/edge-cases/case1/extension', requestData);
      expect(result).toEqual(mockResponse);
    });

    it('should handle minimal request data', async () => {
      const caseId = 'case1';
      const requestData = {
        reason: 'Test reason',
        extensionDuration: '7'
      };
      const mockResponse = { success: true };
      mockPost.mockResolvedValue(mockResponse);

      const result = await submitExtensionRequest(caseId, requestData);

      expect(mockPost).toHaveBeenCalledWith('/api/business-owner/timeline/edge-cases/case1/extension', requestData);
      expect(result).toEqual(mockResponse);
    });

    it('should handle full request data with all fields', async () => {
      const caseId = 'case1';
      const requestData = {
        reason: 'Comprehensive reason for extension request',
        extensionDuration: '30',
        supportingDocuments: 'https://example.com/doc1, https://example.com/doc2',
        additionalInfo: 'Additional context',
        contactInfo: 'contact@example.com'
      };
      const mockResponse = { success: true, requestId: 'req1' };
      mockPost.mockResolvedValue(mockResponse);

      const result = await submitExtensionRequest(caseId, requestData);

      expect(mockPost).toHaveBeenCalledWith('/api/business-owner/timeline/edge-cases/case1/extension', requestData);
      expect(result).toEqual(mockResponse);
    });

    it('should handle invalid case ID', async () => {
      const caseId = 'invalid-case';
      const requestData = { reason: 'Test reason', extensionDuration: '7' };
      const mockErrorResponse = { error: 'Case not found' };
      mockPost.mockResolvedValue(mockErrorResponse);

      const result = await submitExtensionRequest(caseId, requestData);

      expect(result).toEqual(mockErrorResponse);
      expect(mockPost).toHaveBeenCalledWith('/api/business-owner/timeline/edge-cases/invalid-case/extension', requestData);
    });

    it('should handle validation errors', async () => {
      const caseId = 'case1';
      const requestData = { reason: '', extensionDuration: '' };
      const mockErrorResponse = { error: 'Validation failed', details: ['Reason is required', 'Duration is required'] };
      mockPost.mockResolvedValue(mockErrorResponse);

      const result = await submitExtensionRequest(caseId, requestData);

      expect(result).toEqual(mockErrorResponse);
      expect(mockPost).toHaveBeenCalledWith('/api/business-owner/timeline/edge-cases/case1/extension', requestData);
    });

    it('should handle network errors', async () => {
      const caseId = 'case1';
      const requestData = { reason: 'Test reason', extensionDuration: '7' };
      const mockError = new Error('Network error');
      mockPost.mockRejectedValue(mockError);

      await expect(submitExtensionRequest(caseId, requestData)).rejects.toThrow('Network error');
      expect(mockPost).toHaveBeenCalledWith('/api/business-owner/timeline/edge-cases/case1/extension', requestData);
    });

    it('should handle server errors', async () => {
      const caseId = 'case1';
      const requestData = { reason: 'Test reason', extensionDuration: '7' };
      const mockError = new Error('Internal server error');
      mockPost.mockRejectedValue(mockError);

      await expect(submitExtensionRequest(caseId, requestData)).rejects.toThrow('Internal server error');
      expect(mockPost).toHaveBeenCalledWith('/api/business-owner/timeline/edge-cases/case1/extension', requestData);
    });

    it('should handle empty request data', async () => {
      const caseId = 'case1';
      const requestData = {};
      const mockResponse = { success: true };
      mockPost.mockResolvedValue(mockResponse);

      const result = await submitExtensionRequest(caseId, requestData);

      expect(mockPost).toHaveBeenCalledWith('/api/business-owner/timeline/edge-cases/case1/extension', requestData);
      expect(result).toEqual(mockResponse);
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

    it('should handle invalid business ID', async () => {
      const businessId = 'invalid-business';
      const mockErrorResponse = { error: 'Business not found' };
      mockGet.mockResolvedValue(mockErrorResponse);

      const result = await getTimelineHistory(businessId);

      expect(result).toEqual(mockErrorResponse);
      expect(mockGet).toHaveBeenCalledWith('/api/business-owner/timeline/invalid-business/history');
    });

    it('should handle network errors', async () => {
      const businessId = 'business1';
      const mockError = new Error('Network error');
      mockGet.mockRejectedValue(mockError);

      await expect(getTimelineHistory(businessId)).rejects.toThrow('Network error');
      expect(mockGet).toHaveBeenCalledWith('/api/business-owner/timeline/business1/history');
    });

    it('should handle server errors', async () => {
      const businessId = 'business1';
      const mockError = new Error('Internal server error');
      mockGet.mockRejectedValue(mockError);

      await expect(getTimelineHistory(businessId)).rejects.toThrow('Internal server error');
      expect(mockGet).toHaveBeenCalledWith('/api/business-owner/timeline/business1/history');
    });

    it('should handle large history dataset', async () => {
      const businessId = 'business1';
      const largeHistory = Array.from({ length: 1000 }, (_, i) => ({
        id: `adjustment${i}`,
        type: 'Extension',
        originalDate: '2023-12-25',
        newDate: '2024-01-01',
        reason: 'Extension request',
        approvedAt: '2023-12-20T10:00:00Z'
      }));
      mockGet.mockResolvedValue({ history: largeHistory });

      const result = await getTimelineHistory(businessId);

      expect(result).toEqual({ history: largeHistory });
      expect(mockGet).toHaveBeenCalledWith('/api/business-owner/timeline/business1/history');
    });

    it('should handle different adjustment types', async () => {
      const businessId = 'business1';
      const mockHistory = [
        {
          id: 'adjustment1',
          type: 'Extension',
          originalDate: '2023-12-25',
          newDate: '2024-01-01',
          reason: 'Holiday deadline'
        },
        {
          id: 'adjustment2',
          type: 'Grace Period',
          originalDate: '2023-12-30',
          newDate: '2024-01-02',
          reason: 'Weekend payment'
        },
        {
          id: 'adjustment3',
          type: 'Emergency',
          originalDate: '2023-12-20',
          newDate: '2023-12-27',
          reason: 'Business closure'
        }
      ];
      mockGet.mockResolvedValue({ history: mockHistory });

      const result = await getTimelineHistory(businessId);

      expect(result).toEqual({ history: mockHistory });
      expect(mockGet).toHaveBeenCalledWith('/api/business-owner/timeline/business1/history');
    });
  });

  describe('Service Integration', () => {
    it('should handle complete timeline workflow', async () => {
      const businessId = 'business1';
      const caseId = 'case1';
      const requestData = {
        reason: 'Test reason',
        extensionDuration: '7'
      };

      // Mock getTimelineEdgeCases
      const mockEdgeCases = [
        {
          id: caseId,
          type: 'Holiday Deadline',
          severity: 'High',
          description: 'Deadline falls on a public holiday'
        }
      ];
      mockGet.mockResolvedValueOnce({ edgeCases: mockEdgeCases });

      // Mock submitExtensionRequest
      const mockResponse = { success: true, requestId: 'req1' };
      mockPost.mockResolvedValue(mockResponse);

      // Get edge cases
      const edgeCases = await getTimelineEdgeCases(businessId);
      expect(edgeCases).toEqual({ edgeCases: mockEdgeCases });

      // Submit extension request
      const extensionResult = await submitExtensionRequest(caseId, requestData);
      expect(extensionResult).toEqual(mockResponse);

      expect(mockGet).toHaveBeenCalledWith('/api/business-owner/timeline/business1/edge-cases');
      expect(mockPost).toHaveBeenCalledWith('/api/business-owner/timeline/edge-cases/case1/extension', requestData);
    });

    it('should handle error propagation in workflow', async () => {
      const businessId = 'business1';
      const mockError = new Error('Service unavailable');
      mockGet.mockRejectedValue(mockError);

      await expect(getTimelineEdgeCases(businessId)).rejects.toThrow('Service unavailable');
      expect(mockGet).toHaveBeenCalledWith('/api/business-owner/timeline/business1/edge-cases');
    });
  });

  describe('Data Validation', () => {
    it('should handle special characters in business ID', async () => {
      const businessId = 'business-with-special-chars-123';
      const mockResponse = { edgeCases: [] };
      mockGet.mockResolvedValue(mockResponse);

      const result = await getTimelineEdgeCases(businessId);

      expect(mockGet).toHaveBeenCalledWith('/api/business-owner/timeline/business-with-special-chars-123/edge-cases');
      expect(result).toEqual(mockResponse);
    });

    it('should handle special characters in case ID', async () => {
      const caseId = 'case-with-special-chars-123';
      const requestData = { reason: 'Test reason', extensionDuration: '7' };
      const mockResponse = { success: true };
      mockPost.mockResolvedValue(mockResponse);

      const result = await submitExtensionRequest(caseId, requestData);

      expect(mockPost).toHaveBeenCalledWith('/api/business-owner/timeline/edge-cases/case-with-special-chars-123/extension', requestData);
      expect(result).toEqual(mockResponse);
    });

    it('should handle very long business ID', async () => {
      const businessId = 'a'.repeat(1000);
      const mockResponse = { history: [] };
      mockGet.mockResolvedValue(mockResponse);

      const result = await getTimelineHistory(businessId);

      expect(mockGet).toHaveBeenCalledWith(`/api/business-owner/timeline/${businessId}/history`);
      expect(result).toEqual(mockResponse);
    });

    it('should handle malformed request data', async () => {
      const caseId = 'case1';
      const requestData = {
        reason: null,
        extensionDuration: undefined,
        supportingDocuments: ''
      };
      const mockResponse = { success: true };
      mockPost.mockResolvedValue(mockResponse);

      const result = await submitExtensionRequest(caseId, requestData);

      expect(mockPost).toHaveBeenCalledWith('/api/business-owner/timeline/edge-cases/case1/extension', requestData);
      expect(result).toEqual(mockResponse);
    });
  });

  describe('Performance', () => {
    it('should handle concurrent requests', async () => {
      const businessId = 'business1';
      const caseId = 'case1';
      const requestData = { reason: 'Test reason', extensionDuration: '7' };

      const mockEdgeCases = { edgeCases: [] };
      const mockHistory = { history: [] };
      const mockResponse = { success: true };

      // Setup mocks to return different values for different calls
      mockGet
        .mockResolvedValueOnce(mockEdgeCases)  // First call returns edgeCases
        .mockResolvedValueOnce(mockHistory);  // Second call returns history
      mockPost.mockResolvedValue(mockResponse);

      // Make concurrent requests
      const [edgeCasesResult, historyResult, extensionResult] = await Promise.all([
        getTimelineEdgeCases(businessId),
        getTimelineHistory(businessId),
        submitExtensionRequest(caseId, requestData)
      ]);

      expect(edgeCasesResult).toEqual(mockEdgeCases);
      expect(historyResult).toEqual(mockHistory);
      expect(extensionResult).toEqual(mockResponse);
      expect(mockGet).toHaveBeenCalledTimes(2);
      expect(mockPost).toHaveBeenCalledTimes(1);
    });

    it('should handle request timeout scenarios', async () => {
      const businessId = 'business1';
      const timeoutError = new Error('Request timeout');
      timeoutError.code = 'ECONNABORTED';
      mockGet.mockRejectedValue(timeoutError);

      await expect(getTimelineEdgeCases(businessId)).rejects.toThrow('Request timeout');
    });
  });

  describe('Error Handling', () => {
    it('should handle 404 errors', async () => {
      const businessId = 'nonexistent-business';
      const notFoundError = new Error('Not Found');
      notFoundError.response = { status: 404 };
      mockGet.mockRejectedValue(notFoundError);

      await expect(getTimelineEdgeCases(businessId)).rejects.toThrow('Not Found');
    });

    it('should handle 500 errors', async () => {
      const caseId = 'case1';
      const requestData = { reason: 'Test reason', extensionDuration: '7' };
      const serverError = new Error('Internal Server Error');
      serverError.response = { status: 500 };
      mockPost.mockRejectedValue(serverError);

      await expect(submitExtensionRequest(caseId, requestData)).rejects.toThrow('Internal Server Error');
    });

    it('should handle authentication errors', async () => {
      const businessId = 'business1';
      const authError = new Error('Unauthorized');
      authError.response = { status: 401 };
      mockGet.mockRejectedValue(authError);

      await expect(getTimelineHistory(businessId)).rejects.toThrow('Unauthorized');
    });

    it('should handle rate limiting errors', async () => {
      const caseId = 'case1';
      const requestData = { reason: 'Test reason', extensionDuration: '7' };
      const rateLimitError = new Error('Too Many Requests');
      rateLimitError.response = { status: 429 };
      mockPost.mockRejectedValue(rateLimitError);

      await expect(submitExtensionRequest(caseId, requestData)).rejects.toThrow('Too Many Requests');
    });
  });
});
