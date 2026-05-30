import { getConcurrentActions, cancelAction, queueAction } from '../concurrentActionService';
import { get, post, del } from '@/lib/http';
import { vi, describe, expect, beforeEach } from 'vitest';

vi.mock('@/lib/http');
const mockGet = vi.mocked(get);
const mockPost = vi.mocked(post);
const mockDel = vi.mocked(del);

describe('concurrentActionService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getConcurrentActions', () => {
    test('should call GET with correct endpoint and business ID', async () => {
      const businessId = 'business1';
      const mockResponse = { actions: [] };
      mockGet.mockResolvedValue(mockResponse);

      const result = await getConcurrentActions(businessId);

      expect(mockGet).toHaveBeenCalledWith('/api/business-owner/actions/business1/concurrent');
      expect(result).toEqual(mockResponse);
    });

    test('should handle empty concurrent actions', async () => {
      const businessId = 'business1';
      const mockResponse = { actions: [] };
      mockGet.mockResolvedValue(mockResponse);

      const result = await getConcurrentActions(businessId);

      expect(result).toEqual(mockResponse);
      expect(mockGet).toHaveBeenCalledWith('/api/business-owner/actions/business1/concurrent');
    });

    test('should handle concurrent actions with valid data', async () => {
      const businessId = 'business1';
      const mockActions = [
        {
          id: 'action1',
          type: 'Business Registration',
          status: 'In Progress',
          description: 'Registering new business entity',
          startTime: '2023-12-01T10:00:00Z',
          progress: 65
        },
        {
          id: 'action2',
          type: 'Payment Processing',
          status: 'Pending',
          description: 'Processing payment for business fees',
          startTime: '2023-12-01T10:05:00Z',
          progress: 0
        }
      ];
      mockGet.mockResolvedValue({ actions: mockActions });

      const result = await getConcurrentActions(businessId);

      expect(result).toEqual({ actions: mockActions });
      expect(mockGet).toHaveBeenCalledWith('/api/business-owner/actions/business1/concurrent');
    });

    test('should handle API errors', async () => {
      const businessId = 'business1';
      const mockError = new Error('Network error');
      mockGet.mockRejectedValue(mockError);

      await expect(getConcurrentActions(businessId)).rejects.toThrow('Network error');
      expect(mockGet).toHaveBeenCalledWith('/api/business-owner/actions/business1/concurrent');
    });

    test('should handle server error responses', async () => {
      const businessId = 'business1';
      const mockErrorResponse = { error: 'Business not found' };
      mockGet.mockResolvedValue(mockErrorResponse);

      const result = await getConcurrentActions(businessId);

      expect(result).toEqual(mockErrorResponse);
      expect(mockGet).toHaveBeenCalledWith('/api/business-owner/actions/business1/concurrent');
    });

    test('should handle null response', async () => {
      const businessId = 'business1';
      mockGet.mockResolvedValue(null);

      const result = await getConcurrentActions(businessId);

      expect(result).toBeNull();
      expect(mockGet).toHaveBeenCalledWith('/api/business-owner/actions/business1/concurrent');
    });

    test('should handle undefined response', async () => {
      const businessId = 'business1';
      mockGet.mockResolvedValue(undefined);

      const result = await getConcurrentActions(businessId);

      expect(result).toBeUndefined();
      expect(mockGet).toHaveBeenCalledWith('/api/business-owner/actions/business1/concurrent');
    });

    test('should handle actions with different statuses', async () => {
      const businessId = 'business1';
      const mockActions = [
        {
          id: 'action1',
          type: 'Business Registration',
          status: 'In Progress',
          description: 'Registering new business entity',
          startTime: '2023-12-01T10:00:00Z',
          progress: 65
        },
        {
          id: 'action2',
          type: 'Payment Processing',
          status: 'Pending',
          description: 'Processing payment for business fees',
          startTime: '2023-12-01T10:05:00Z',
          progress: 0
        },
        {
          id: 'action3',
          type: 'Document Upload',
          status: 'Completed',
          description: 'Uploading required documents',
          startTime: '2023-12-01T09:30:00Z',
          progress: 100
        },
        {
          id: 'action4',
          type: 'Permit Application',
          status: 'Failed',
          description: 'Applying for business permit',
          startTime: '2023-12-01T09:45:00Z',
          progress: 25
        }
      ];
      mockGet.mockResolvedValue({ actions: mockActions });

      const result = await getConcurrentActions(businessId);

      expect(result).toEqual({ actions: mockActions });
      expect(mockGet).toHaveBeenCalledWith('/api/business-owner/actions/business1/concurrent');
    });
  });

  describe('cancelAction', () => {
    test('should call DELETE with correct endpoint and action ID', async () => {
      const actionId = 'action1';
      const mockResponse = { success: true, cancelledAt: '2023-12-01T10:30:00Z' };
      mockDel.mockResolvedValue(mockResponse);

      const result = await cancelAction(actionId);

      expect(mockDel).toHaveBeenCalledWith('/api/business-owner/actions/action1');
      expect(result).toEqual(mockResponse);
    });

    test('should handle successful cancellation', async () => {
      const actionId = 'action1';
      const mockResponse = { 
        success: true, 
        cancelledAt: '2023-12-01T10:30:00Z',
        message: 'Action cancelled successfully'
      };
      mockDel.mockResolvedValue(mockResponse);

      const result = await cancelAction(actionId);

      expect(result).toEqual(mockResponse);
      expect(mockDel).toHaveBeenCalledWith('/api/business-owner/actions/action1');
    });

    test('should handle invalid action ID', async () => {
      const actionId = 'invalid-action';
      const mockErrorResponse = { error: 'Action not found' };
      mockDel.mockResolvedValue(mockErrorResponse);

      const result = await cancelAction(actionId);

      expect(result).toEqual(mockErrorResponse);
      expect(mockDel).toHaveBeenCalledWith('/api/business-owner/actions/invalid-action');
    });

    test('should handle action that cannot be cancelled', async () => {
      const actionId = 'completed-action';
      const mockErrorResponse = { error: 'Cannot cancel completed action' };
      mockDel.mockResolvedValue(mockErrorResponse);

      const result = await cancelAction(actionId);

      expect(result).toEqual(mockErrorResponse);
      expect(mockDel).toHaveBeenCalledWith('/api/business-owner/actions/completed-action');
    });

    test('should handle network errors', async () => {
      const actionId = 'action1';
      const mockError = new Error('Network error');
      mockDel.mockRejectedValue(mockError);

      await expect(cancelAction(actionId)).rejects.toThrow('Network error');
      expect(mockDel).toHaveBeenCalledWith('/api/business-owner/actions/action1');
    });

    test('should handle server errors', async () => {
      const actionId = 'action1';
      const mockError = new Error('Internal server error');
      mockDel.mockRejectedValue(mockError);

      await expect(cancelAction(actionId)).rejects.toThrow('Internal server error');
      expect(mockDel).toHaveBeenCalledWith('/api/business-owner/actions/action1');
    });

    test('should handle special characters in action ID', async () => {
      const actionId = 'action-with-special-chars-123';
      const mockResponse = { success: true };
      mockDel.mockResolvedValue(mockResponse);

      const result = await cancelAction(actionId);

      expect(mockDel).toHaveBeenCalledWith('/api/business-owner/actions/action-with-special-chars-123');
      expect(result).toEqual(mockResponse);
    });

    test('should handle very long action ID', async () => {
      const actionId = 'a'.repeat(1000);
      const mockResponse = { success: true };
      mockDel.mockResolvedValue(mockResponse);

      const result = await cancelAction(actionId);

      expect(mockDel).toHaveBeenCalledWith(`/api/business-owner/actions/${actionId}`);
      expect(result).toEqual(mockResponse);
    });
  });

  describe('queueAction', () => {
    test('should call POST with correct endpoint and action data', async () => {
      const businessId = 'business1';
      const actionData = {
        type: 'Business Registration',
        priority: 'high',
        metadata: {
          description: 'Register new business entity',
          estimatedDuration: 300
        }
      };
      const mockResponse = { success: true, actionId: 'queued-action-1' };
      mockPost.mockResolvedValue(mockResponse);

      const result = await queueAction(businessId, actionData);

      expect(mockPost).toHaveBeenCalledWith('/api/business-owner/actions/business1/queue', actionData);
      expect(result).toEqual(mockResponse);
    });

    test('should handle minimal action data', async () => {
      const businessId = 'business1';
      const actionData = { type: 'Simple Action' };
      const mockResponse = { success: true, actionId: 'queued-action-1' };
      mockPost.mockResolvedValue(mockResponse);

      const result = await queueAction(businessId, actionData);

      expect(mockPost).toHaveBeenCalledWith('/api/business-owner/actions/business1/queue', actionData);
      expect(result).toEqual(mockResponse);
    });

    test('should handle full action data with all fields', async () => {
      const businessId = 'business1';
      const actionData = {
        type: 'Complex Business Registration',
        priority: 'urgent',
        metadata: {
          description: 'Register complex business entity with multiple permits',
          estimatedDuration: 600,
          dependencies: ['action1', 'action2'],
          resources: ['cpu', 'memory', 'storage'],
          timeout: 1800
        },
        scheduledAt: '2023-12-01T12:00:00Z',
        retryPolicy: {
          maxRetries: 3,
          backoffMultiplier: 2
        }
      };
      const mockResponse = { success: true, actionId: 'queued-action-complex' };
      mockPost.mockResolvedValue(mockResponse);

      const result = await queueAction(businessId, actionData);

      expect(mockPost).toHaveBeenCalledWith('/api/business-owner/actions/business1/queue', actionData);
      expect(result).toEqual(mockResponse);
    });

    test('should handle invalid business ID', async () => {
      const businessId = 'invalid-business';
      const actionData = { type: 'Test Action' };
      const mockErrorResponse = { error: 'Business not found' };
      mockPost.mockResolvedValue(mockErrorResponse);

      const result = await queueAction(businessId, actionData);

      expect(result).toEqual(mockErrorResponse);
      expect(mockPost).toHaveBeenCalledWith('/api/business-owner/actions/invalid-business/queue', actionData);
    });

    test('should handle validation errors', async () => {
      const businessId = 'business1';
      const actionData = { priority: 'high' }; // Missing required 'type' field
      const mockErrorResponse = { error: 'Validation failed', details: ['Action type is required'] };
      mockPost.mockResolvedValue(mockErrorResponse);

      const result = await queueAction(businessId, actionData);

      expect(result).toEqual(mockErrorResponse);
      expect(mockPost).toHaveBeenCalledWith('/api/business-owner/actions/business1/queue', actionData);
    });

    test('should handle network errors', async () => {
      const businessId = 'business1';
      const actionData = { type: 'Test Action' };
      const mockError = new Error('Network error');
      mockPost.mockRejectedValue(mockError);

      await expect(queueAction(businessId, actionData)).rejects.toThrow('Network error');
      expect(mockPost).toHaveBeenCalledWith('/api/business-owner/actions/business1/queue', actionData);
    });

    test('should handle server errors', async () => {
      const businessId = 'business1';
      const actionData = { type: 'Test Action' };
      const mockError = new Error('Internal server error');
      mockPost.mockRejectedValue(mockError);

      await expect(queueAction(businessId, actionData)).rejects.toThrow('Internal server error');
      expect(mockPost).toHaveBeenCalledWith('/api/business-owner/actions/business1/queue', actionData);
    });

    test('should handle empty action data', async () => {
      const businessId = 'business1';
      const actionData = {};
      const mockResponse = { success: true, actionId: 'queued-action-empty' };
      mockPost.mockResolvedValue(mockResponse);

      const result = await queueAction(businessId, actionData);

      expect(mockPost).toHaveBeenCalledWith('/api/business-owner/actions/business1/queue', actionData);
      expect(result).toEqual(mockResponse);
    });

    test('should handle action queuing with dependencies', async () => {
      const businessId = 'business1';
      const actionData = {
        type: 'Dependent Action',
        dependencies: ['action1', 'action2'],
        priority: 'normal'
      };
      const mockResponse = { success: true, actionId: 'queued-dependent' };
      mockPost.mockResolvedValue(mockResponse);

      const result = await queueAction(businessId, actionData);

      expect(mockPost).toHaveBeenCalledWith('/api/business-owner/actions/business1/queue', actionData);
      expect(result).toEqual(mockResponse);
    });
  });

  describe('Service Integration', () => {
    test('should handle complete action management workflow', async () => {
      const businessId = 'business1';
      const actionData = { type: 'Test Action' };
      const actionId = 'action1';

      // Mock queueAction
      const mockQueueResponse = { success: true, actionId: 'queued-action-1' };
      mockPost.mockResolvedValue(mockQueueResponse);

      // Mock getConcurrentActions
      const mockActions = [
        {
          id: actionId,
          type: 'Test Action',
          status: 'In Progress',
          description: 'Test action in progress'
        }
      ];
      mockGet.mockResolvedValue({ actions: mockActions });

      // Mock cancelAction
      const mockCancelResponse = { success: true, cancelledAt: '2023-12-01T10:30:00Z' };
      mockDel.mockResolvedValue(mockCancelResponse);

      // Queue action
      const queueResult = await queueAction(businessId, actionData);
      expect(queueResult).toEqual(mockQueueResponse);

      // Get concurrent actions
      const actionsResult = await getConcurrentActions(businessId);
      expect(actionsResult).toEqual({ actions: mockActions });

      // Cancel action
      const cancelResult = await cancelAction(actionId);
      expect(cancelResult).toEqual(mockCancelResponse);

      expect(mockPost).toHaveBeenCalledWith('/api/business-owner/actions/business1/queue', actionData);
      expect(mockGet).toHaveBeenCalledWith('/api/business-owner/actions/business1/concurrent');
      expect(mockDel).toHaveBeenCalledWith('/api/business-owner/actions/action1');
    });

    test('should handle error propagation in workflow', async () => {
      const businessId = 'business1';
      const mockError = new Error('Service unavailable');
      mockGet.mockRejectedValue(mockError);

      await expect(getConcurrentActions(businessId)).rejects.toThrow('Service unavailable');
      expect(mockGet).toHaveBeenCalledWith('/api/business-owner/actions/business1/concurrent');
    });
  });

  describe('Data Validation', () => {
    test('should handle special characters in business ID', async () => {
      const businessId = 'business-with-special-chars-123';
      const mockResponse = { actions: [] };
      mockGet.mockResolvedValue(mockResponse);

      const result = await getConcurrentActions(businessId);

      expect(mockGet).toHaveBeenCalledWith('/api/business-owner/actions/business-with-special-chars-123/concurrent');
      expect(result).toEqual(mockResponse);
    });

    test('should handle malformed action data', async () => {
      const businessId = 'business1';
      const actionData = {
        type: null,
        priority: undefined,
        metadata: ''
      };
      const mockResponse = { success: true, actionId: 'queued-action-malformed' };
      mockPost.mockResolvedValue(mockResponse);

      const result = await queueAction(businessId, actionData);

      expect(mockPost).toHaveBeenCalledWith('/api/business-owner/actions/business1/queue', actionData);
      expect(result).toEqual(mockResponse);
    });

    test('should handle very long business ID in queue action', async () => {
      const businessId = 'a'.repeat(1000);
      const actionData = { type: 'Test Action' };
      const mockResponse = { success: true, actionId: 'queued-action-long' };
      mockPost.mockResolvedValue(mockResponse);

      const result = await queueAction(businessId, actionData);

      expect(mockPost).toHaveBeenCalledWith(`/api/business-owner/actions/${businessId}/queue`, actionData);
      expect(result).toEqual(mockResponse);
    });
  });

  describe('Performance', () => {
    test('should handle concurrent requests', async () => {
      const businessId = 'business1';
      const actionId = 'action1';
      const actionData = { type: 'Test Action' };

      const mockActions = { actions: [] };
      const mockResponse = { success: true, actionId: 'queued-action' };

      mockGet.mockResolvedValue(mockActions);
      mockPost.mockResolvedValue(mockResponse);
      mockDel.mockResolvedValue({ success: true });

      // Make concurrent requests
      const [actionsResult, queueResult, cancelResult] = await Promise.all([
        getConcurrentActions(businessId),
        queueAction(businessId, actionData),
        cancelAction(actionId)
      ]);

      expect(actionsResult).toEqual(mockActions);
      expect(queueResult).toEqual(mockResponse);
      expect(cancelResult).toEqual({ success: true });
      expect(mockGet).toHaveBeenCalledTimes(1);
      expect(mockPost).toHaveBeenCalledTimes(1);
      expect(mockDel).toHaveBeenCalledTimes(1);
    });

    test('should handle request timeout scenarios', async () => {
      const businessId = 'business1';
      const timeoutError = new Error('Request timeout');
      timeoutError.code = 'ECONNABORTED';
      mockGet.mockRejectedValue(timeoutError);

      await expect(getConcurrentActions(businessId)).rejects.toThrow('Request timeout');
    });
  });

  describe('Error Handling', () => {
    test('should handle 404 errors', async () => {
      const businessId = 'nonexistent-business';
      const notFoundError = new Error('Not Found');
      notFoundError.response = { status: 404 };
      mockGet.mockRejectedValue(notFoundError);

      await expect(getConcurrentActions(businessId)).rejects.toThrow('Not Found');
    });

    test('should handle 500 errors', async () => {
      const actionId = 'action1';
      const serverError = new Error('Internal Server Error');
      serverError.response = { status: 500 };
      mockDel.mockRejectedValue(serverError);

      await expect(cancelAction(actionId)).rejects.toThrow('Internal Server Error');
    });

    test('should handle authentication errors', async () => {
      const businessId = 'business1';
      const authError = new Error('Unauthorized');
      authError.response = { status: 401 };
      mockPost.mockRejectedValue(authError);

      await expect(queueAction(businessId, { type: 'Test' })).rejects.toThrow('Unauthorized');
    });

    test('should handle rate limiting errors', async () => {
      const businessId = 'business1';
      const rateLimitError = new Error('Too Many Requests');
      rateLimitError.response = { status: 429 };
      mockGet.mockRejectedValue(rateLimitError);

      await expect(getConcurrentActions(businessId)).rejects.toThrow('Too Many Requests');
    });
  });
});
