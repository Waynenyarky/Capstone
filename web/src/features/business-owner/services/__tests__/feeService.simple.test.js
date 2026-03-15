import { getFeePreview, calculateWhatIfFees, getFeeImpactAnalysis, compareFeeScenarios, getFeeBreakdown, getFeeHistory, getFeeOptimizationSuggestions, projectFutureFees } from '../feeService';
import { get, post } from '@/lib/http';
import { vi, describe, it, expect, beforeEach } from 'vitest';

vi.mock('@/lib/http');
const mockGet = vi.mocked(get);
const mockPost = vi.mocked(post);

describe('feeService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getFeePreview', () => {
    it('should call GET with correct endpoint and LOB param', async () => {
      const mockResponse = { fee: 5000 };
      mockGet.mockResolvedValue(mockResponse);

      const result = await getFeePreview('Retail');

      expect(mockGet).toHaveBeenCalledWith('/api/business/fee-preview?lob=Retail');
      expect(result).toEqual(mockResponse);
    });

    it('should return null when lob is falsy', async () => {
      const result = await getFeePreview(null);
      expect(result).toBeNull();
      expect(mockGet).not.toHaveBeenCalled();
    });

    it('should handle API errors', async () => {
      mockGet.mockRejectedValue(new Error('Network error'));
      await expect(getFeePreview('Retail')).rejects.toThrow('Network error');
    });
  });

  describe('calculateWhatIfFees', () => {
    it('should call POST with correct endpoint', async () => {
      const data = { businessType: 'retail', employees: 10 };
      const mockResponse = { totalFee: 5000 };
      mockPost.mockResolvedValue(mockResponse);

      const result = await calculateWhatIfFees(data);

      expect(mockPost).toHaveBeenCalledWith('/api/business/fees/what-if', data);
      expect(result).toEqual(mockResponse);
    });

    it('should handle errors', async () => {
      mockPost.mockRejectedValue(new Error('Network error'));
      await expect(calculateWhatIfFees({})).rejects.toThrow('Network error');
    });
  });

  describe('getFeeImpactAnalysis', () => {
    it('should call POST with correct endpoint', async () => {
      const changes = { revenue: 100000 };
      const mockResponse = { impact: 'low' };
      mockPost.mockResolvedValue(mockResponse);

      const result = await getFeeImpactAnalysis('biz1', changes);

      expect(mockPost).toHaveBeenCalledWith('/api/business/fees/impact/biz1', changes);
      expect(result).toEqual(mockResponse);
    });
  });

  describe('compareFeeScenarios', () => {
    it('should call POST with correct endpoint', async () => {
      const scenarios = [{ type: 'a' }, { type: 'b' }];
      const mockResponse = { comparison: [] };
      mockPost.mockResolvedValue(mockResponse);

      const result = await compareFeeScenarios(scenarios);

      expect(mockPost).toHaveBeenCalledWith('/api/business/fees/compare', { scenarios });
      expect(result).toEqual(mockResponse);
    });
  });

  describe('getFeeBreakdown', () => {
    it('should call POST with correct endpoint', async () => {
      const data = { businessType: 'retail' };
      const mockResponse = { breakdown: [] };
      mockPost.mockResolvedValue(mockResponse);

      const result = await getFeeBreakdown(data);

      expect(mockPost).toHaveBeenCalledWith('/api/business/fees/breakdown', data);
      expect(result).toEqual(mockResponse);
    });
  });

  describe('getFeeHistory', () => {
    it('should call GET with business ID', async () => {
      const mockResponse = { history: [] };
      mockGet.mockResolvedValue(mockResponse);

      const result = await getFeeHistory('biz1');

      expect(mockGet).toHaveBeenCalledWith('/api/business/fees/history/biz1');
      expect(result).toEqual(mockResponse);
    });

    it('should call GET without business ID', async () => {
      const mockResponse = { history: [] };
      mockGet.mockResolvedValue(mockResponse);

      const result = await getFeeHistory();

      expect(mockGet).toHaveBeenCalledWith('/api/business/fees/history');
      expect(result).toEqual(mockResponse);
    });
  });

  describe('getFeeOptimizationSuggestions', () => {
    it('should call GET with correct endpoint', async () => {
      const mockResponse = { suggestions: [] };
      mockGet.mockResolvedValue(mockResponse);

      const result = await getFeeOptimizationSuggestions('biz1');

      expect(mockGet).toHaveBeenCalledWith('/api/business/fees/optimization/biz1');
      expect(result).toEqual(mockResponse);
    });
  });

  describe('projectFutureFees', () => {
    it('should call POST with correct endpoint', async () => {
      const data = { growthRate: 10 };
      const mockResponse = { projected: 6000 };
      mockPost.mockResolvedValue(mockResponse);

      const result = await projectFutureFees(data);

      expect(mockPost).toHaveBeenCalledWith('/api/business/fees/project', data);
      expect(result).toEqual(mockResponse);
    });
  });
});
