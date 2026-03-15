import { getLGUs, getLGU, createLGU, updateLGU, deleteLGU, getActiveLGUs, getLGURegions } from '../lguService';
import { fetchJsonWithFallback } from '@/lib/http';
import { vi, describe, it, expect, beforeEach } from 'vitest';

vi.mock('@/lib/http');
const mockFetchJson = vi.mocked(fetchJsonWithFallback);

describe('lguService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getLGUs', () => {
    it('should call fetch with correct endpoint and no parameters', async () => {
      const mockResponse = { lgus: [] };
      mockFetchJson.mockResolvedValue(mockResponse);

      const result = await getLGUs();

      expect(mockFetchJson).toHaveBeenCalledWith('/api/admin/lgus', { method: 'GET' });
      expect(result).toEqual(mockResponse);
    });

    it('should call fetch with region filter', async () => {
      const mockResponse = { lgus: [] };
      mockFetchJson.mockResolvedValue(mockResponse);

      await getLGUs({ region: 'NCR' });

      expect(mockFetchJson).toHaveBeenCalledWith('/api/admin/lgus?region=NCR', { method: 'GET' });
    });

    it('should handle API errors', async () => {
      mockFetchJson.mockRejectedValue(new Error('Network error'));
      await expect(getLGUs()).rejects.toThrow('Network error');
    });
  });

  describe('getLGU', () => {
    it('should call fetch with correct endpoint and code', async () => {
      const mockResponse = { lgu: { code: 'MNL' } };
      mockFetchJson.mockResolvedValue(mockResponse);

      const result = await getLGU('MNL');

      expect(mockFetchJson).toHaveBeenCalledWith('/api/admin/lgus/MNL', { method: 'GET' });
      expect(result).toEqual(mockResponse);
    });

    it('should handle API errors', async () => {
      mockFetchJson.mockRejectedValue(new Error('Network error'));
      await expect(getLGU('MNL')).rejects.toThrow('Network error');
    });
  });

  describe('createLGU', () => {
    it('should call fetch with correct endpoint and data', async () => {
      const lguData = { name: 'Manila', code: 'MNL', region: 'NCR' };
      const mockResponse = { success: true };
      mockFetchJson.mockResolvedValue(mockResponse);

      const result = await createLGU(lguData);

      expect(mockFetchJson).toHaveBeenCalledWith('/api/admin/lgus', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(lguData),
      });
      expect(result).toEqual(mockResponse);
    });

    it('should handle errors', async () => {
      mockFetchJson.mockRejectedValue(new Error('Network error'));
      await expect(createLGU({})).rejects.toThrow('Network error');
    });
  });

  describe('updateLGU', () => {
    it('should call fetch with correct endpoint and data', async () => {
      const updateData = { name: 'Updated Manila' };
      const mockResponse = { success: true };
      mockFetchJson.mockResolvedValue(mockResponse);

      const result = await updateLGU('MNL', updateData);

      expect(mockFetchJson).toHaveBeenCalledWith('/api/admin/lgus/MNL', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData),
      });
      expect(result).toEqual(mockResponse);
    });

    it('should handle errors', async () => {
      mockFetchJson.mockRejectedValue(new Error('Network error'));
      await expect(updateLGU('MNL', {})).rejects.toThrow('Network error');
    });
  });

  describe('deleteLGU', () => {
    it('should call fetch with correct endpoint', async () => {
      const mockResponse = { success: true };
      mockFetchJson.mockResolvedValue(mockResponse);

      const result = await deleteLGU('MNL');

      expect(mockFetchJson).toHaveBeenCalledWith('/api/admin/lgus/MNL', { method: 'DELETE' });
      expect(result).toEqual(mockResponse);
    });
  });

  describe('getActiveLGUs', () => {
    it('should call fetch with correct public endpoint', async () => {
      const mockResponse = { lgus: [] };
      mockFetchJson.mockResolvedValue(mockResponse);

      const result = await getActiveLGUs();

      expect(mockFetchJson).toHaveBeenCalledWith('/api/lgus/public/active', { method: 'GET' });
      expect(result).toEqual(mockResponse);
    });
  });

  describe('getLGURegions', () => {
    it('should call fetch with correct endpoint', async () => {
      const mockResponse = { regions: [] };
      mockFetchJson.mockResolvedValue(mockResponse);

      const result = await getLGURegions();

      expect(mockFetchJson).toHaveBeenCalledWith('/api/lgus/public/regions', { method: 'GET' });
      expect(result).toEqual(mockResponse);
    });
  });
});
