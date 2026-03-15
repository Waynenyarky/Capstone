import { getConcurrentActions, cancelAction, queueAction } from '../concurrentActionService';
import { get, post, del } from '@/lib/http';
import { vi, describe, it, expect, beforeEach } from 'vitest';

// Mock the HTTP module
vi.mock('@/lib/http');
const mockGet = vi.mocked(get);
const mockPost = vi.mocked(post);
const mockDelete = vi.mocked(del);

describe('concurrentActionService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getConcurrentActions', () => {
    it('should call GET with correct endpoint and business ID', async () => {
      const businessId = 'business1';
      const mockResponse = { actions: [] };
      mockGet.mockResolvedValue(mockResponse);

      const result = await getConcurrentActions(businessId);

      expect(mockGet).toHaveBeenCalledWith('/api/business-owner/actions/business1/concurrent');
      expect(result).toEqual(mockResponse);
    });

    it('should handle API errors', async () => {
      const businessId = 'business1';
      const mockError = new Error('Network error');
      mockGet.mockRejectedValue(mockError);

      await expect(getConcurrentActions(businessId)).rejects.toThrow('Network error');
      expect(mockGet).toHaveBeenCalledWith('/api/business-owner/actions/business1/concurrent');
    });
  });

  describe('cancelAction', () => {
    it('should call DELETE with correct endpoint and action ID', async () => {
      const actionId = 'action1';
      const mockResponse = { success: true };
      mockDelete.mockResolvedValue(mockResponse);

      const result = await cancelAction(actionId);

      expect(mockDelete).toHaveBeenCalledWith('/api/business-owner/actions/action1');
      expect(result).toEqual(mockResponse);
    });

    it('should handle network errors', async () => {
      const actionId = 'action1';
      const mockError = new Error('Network error');
      mockDelete.mockRejectedValue(mockError);

      await expect(cancelAction(actionId)).rejects.toThrow('Network error');
      expect(mockDelete).toHaveBeenCalledWith('/api/business-owner/actions/action1');
    });
  });

  describe('queueAction', () => {
    it('should call POST with correct endpoint and action data', async () => {
      const businessId = 'business1';
      const actionData = {
        type: 'Permit Application',
        priority: 'normal',
        metadata: { permitType: 'general' }
      };
      const mockResponse = { success: true, actionId: 'new-action' };
      mockPost.mockResolvedValue(mockResponse);

      const result = await queueAction(businessId, actionData);

      expect(mockPost).toHaveBeenCalledWith('/api/business-owner/actions/business1/queue', actionData);
      expect(result).toEqual(mockResponse);
    });

    it('should handle network errors', async () => {
      const businessId = 'business1';
      const actionData = { type: 'Test Action' };
      const mockError = new Error('Network error');
      mockPost.mockRejectedValue(mockError);

      await expect(queueAction(businessId, actionData)).rejects.toThrow('Network error');
      expect(mockPost).toHaveBeenCalledWith('/api/business-owner/actions/business1/queue', actionData);
    });
  });
});
