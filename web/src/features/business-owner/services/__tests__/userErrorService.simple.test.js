import { getUserErrorPatterns, preventError, undoAction, getErrorHistory } from '../userErrorService';
import { get, post } from '@/lib/http';
import { vi, describe, it, expect, beforeEach } from 'vitest';

// Mock the HTTP module
vi.mock('@/lib/http');
const mockGet = vi.mocked(get);
const mockPost = vi.mocked(post);

describe('userErrorService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getUserErrorPatterns', () => {
    it('should call GET with correct endpoint and business ID', async () => {
      const businessId = 'business1';
      const mockResponse = { patterns: [] };
      mockGet.mockResolvedValue(mockResponse);

      const result = await getUserErrorPatterns(businessId);

      expect(mockGet).toHaveBeenCalledWith('/api/business-owner/user-error/business1/patterns');
      expect(result).toEqual(mockResponse);
    });

    it('should handle API errors', async () => {
      const businessId = 'business1';
      const mockError = new Error('Network error');
      mockGet.mockRejectedValue(mockError);

      await expect(getUserErrorPatterns(businessId)).rejects.toThrow('Network error');
      expect(mockGet).toHaveBeenCalledWith('/api/business-owner/user-error/business1/patterns');
    });
  });

  describe('preventError', () => {
    it('should call POST with correct endpoint and prevention data', async () => {
      const patternId = 'pattern1';
      const settings = { enabled: true, severity: 'high' };
      const mockResponse = { success: true };
      mockPost.mockResolvedValue(mockResponse);

      const result = await preventError(patternId, settings);

      expect(mockPost).toHaveBeenCalledWith('/api/business-owner/user-error/patterns/pattern1/prevent', settings);
      expect(result).toEqual(mockResponse);
    });

    it('should handle network errors', async () => {
      const patternId = 'pattern1';
      const settings = { enabled: true };
      const mockError = new Error('Network error');
      mockPost.mockRejectedValue(mockError);

      await expect(preventError(patternId, settings)).rejects.toThrow('Network error');
      expect(mockPost).toHaveBeenCalledWith('/api/business-owner/user-error/patterns/pattern1/prevent', settings);
    });
  });

  describe('undoAction', () => {
    it('should call POST with correct endpoint and action ID', async () => {
      const actionId = 'action1';
      const mockResponse = { success: true, restored: true };
      mockPost.mockResolvedValue(mockResponse);

      const result = await undoAction(actionId);

      expect(mockPost).toHaveBeenCalledWith('/api/business-owner/user-error/actions/action1/undo');
      expect(result).toEqual(mockResponse);
    });

    it('should handle network errors', async () => {
      const actionId = 'action1';
      const mockError = new Error('Network error');
      mockPost.mockRejectedValue(mockError);

      await expect(undoAction(actionId)).rejects.toThrow('Network error');
      expect(mockPost).toHaveBeenCalledWith('/api/business-owner/user-error/actions/action1/undo');
    });
  });

  describe('getErrorHistory', () => {
    it('should call GET with correct endpoint and business ID', async () => {
      const businessId = 'business1';
      const mockResponse = { history: [] };
      mockGet.mockResolvedValue(mockResponse);

      const result = await getErrorHistory(businessId);

      expect(mockGet).toHaveBeenCalledWith('/api/business-owner/user-error/business1/history');
      expect(result).toEqual(mockResponse);
    });

    it('should handle API errors', async () => {
      const businessId = 'business1';
      const mockError = new Error('Network error');
      mockGet.mockRejectedValue(mockError);

      await expect(getErrorHistory(businessId)).rejects.toThrow('Network error');
      expect(mockGet).toHaveBeenCalledWith('/api/business-owner/user-error/business1/history');
    });
  });
});
