import { getDataCorruptionEvents, restoreBackup, validateIntegrity, getRecoveryHistory } from '../dataRecoveryService';
import { get, post } from '@/lib/http';
import { vi, describe, it, expect, beforeEach } from 'vitest';

// Mock the HTTP module
vi.mock('@/lib/http');
const mockGet = vi.mocked(get);
const mockPost = vi.mocked(post);

describe('dataRecoveryService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getDataCorruptionEvents', () => {
    it('should call GET with correct endpoint and business ID', async () => {
      const businessId = 'business1';
      const mockResponse = { events: [] };
      mockGet.mockResolvedValue(mockResponse);

      const result = await getDataCorruptionEvents(businessId);

      expect(mockGet).toHaveBeenCalledWith('/api/business-owner/data-recovery/business1/events');
      expect(result).toEqual(mockResponse);
    });

    it('should handle API errors', async () => {
      const businessId = 'business1';
      const mockError = new Error('Network error');
      mockGet.mockRejectedValue(mockError);

      await expect(getDataCorruptionEvents(businessId)).rejects.toThrow('Network error');
      expect(mockGet).toHaveBeenCalledWith('/api/business-owner/data-recovery/business1/events');
    });
  });

  describe('restoreBackup', () => {
    it('should call POST with correct endpoint and restore data', async () => {
      const eventId = 'event1';
      const restoreData = { targetBusinessId: 'business1' };
      const mockResponse = { success: true };
      mockPost.mockResolvedValue(mockResponse);

      const result = await restoreBackup(eventId, restoreData);

      expect(mockPost).toHaveBeenCalledWith('/api/business-owner/data-recovery/events/event1/restore', restoreData);
      expect(result).toEqual(mockResponse);
    });

    it('should handle network errors', async () => {
      const eventId = 'event1';
      const restoreData = { targetBusinessId: 'business1' };
      const mockError = new Error('Network error');
      mockPost.mockRejectedValue(mockError);

      await expect(restoreBackup(eventId, restoreData)).rejects.toThrow('Network error');
      expect(mockPost).toHaveBeenCalledWith('/api/business-owner/data-recovery/events/event1/restore', restoreData);
    });
  });

  describe('validateIntegrity', () => {
    it('should call POST with correct endpoint and business ID', async () => {
      const businessId = 'business1';
      const mockResponse = { integrity: 'valid', issues: [] };
      mockPost.mockResolvedValue(mockResponse);

      const result = await validateIntegrity(businessId);

      expect(mockPost).toHaveBeenCalledWith('/api/business-owner/data-recovery/business1/validate');
      expect(result).toEqual(mockResponse);
    });

    it('should handle API errors', async () => {
      const businessId = 'business1';
      const mockError = new Error('Network error');
      mockPost.mockRejectedValue(mockError);

      await expect(validateIntegrity(businessId)).rejects.toThrow('Network error');
      expect(mockPost).toHaveBeenCalledWith('/api/business-owner/data-recovery/business1/validate');
    });
  });

  describe('getRecoveryHistory', () => {
    it('should call GET with correct endpoint and business ID', async () => {
      const businessId = 'business1';
      const mockResponse = { history: [] };
      mockGet.mockResolvedValue(mockResponse);

      const result = await getRecoveryHistory(businessId);

      expect(mockGet).toHaveBeenCalledWith('/api/business-owner/data-recovery/business1/history');
      expect(result).toEqual(mockResponse);
    });

    it('should handle API errors', async () => {
      const businessId = 'business1';
      const mockError = new Error('Network error');
      mockGet.mockRejectedValue(mockError);

      await expect(getRecoveryHistory(businessId)).rejects.toThrow('Network error');
      expect(mockGet).toHaveBeenCalledWith('/api/business-owner/data-recovery/business1/history');
    });
  });
});
