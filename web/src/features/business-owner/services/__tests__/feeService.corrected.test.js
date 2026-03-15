import { getFeePreview, calculateWhatIfFees, getFeeImpactAnalysis, getFeeHistory, getFeeOptimizationSuggestions } from '../feeService';
import { get, post } from '@/lib/http';
import { vi, describe, it, expect, beforeEach } from 'vitest';

// Mock the HTTP module
vi.mock('@/lib/http');
const mockGet = vi.mocked(get);
const mockPost = vi.mocked(post);

describe('feeService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getFeePreview', () => {
    it('should call GET with correct endpoint and LOB parameter', async () => {
      const lob = 'retail';
      const mockResponse = { baseFee: 5000, totalFee: 5500 };
      mockGet.mockResolvedValue(mockResponse);

      const result = await getFeePreview(lob);

      expect(mockGet).toHaveBeenCalledWith('/api/business/fee-preview?lob=retail');
      expect(result).toEqual(mockResponse);
    });

    it('should return null when no LOB provided', async () => {
      const result = await getFeePreview(null);
      expect(result).toBeNull();
      expect(mockGet).not.toHaveBeenCalled();
    });

    it('should handle API errors', async () => {
      const lob = 'retail';
      const mockError = new Error('Network error');
      mockGet.mockRejectedValue(mockError);

      await expect(getFeePreview(lob)).rejects.toThrow('Network error');
      expect(mockGet).toHaveBeenCalledWith('/api/business/fee-preview?lob=retail');
    });
  });

  describe('calculateWhatIfFees', () => {
    it('should call POST with correct endpoint and business data', async () => {
      const businessData = { employees: 10, revenue: 100000 };
      const mockResponse = { projectedFee: 6000 };
      mockPost.mockResolvedValue(mockResponse);

      const result = await calculateWhatIfFees(businessData);

      expect(mockPost).toHaveBeenCalledWith('/api/business/fees/what-if', businessData);
      expect(result).toEqual(mockResponse);
    });

    it('should handle network errors', async () => {
      const businessData = { employees: 10 };
      const mockError = new Error('Network error');
      mockPost.mockRejectedValue(mockError);

      await expect(calculateWhatIfFees(businessData)).rejects.toThrow('Network error');
      expect(mockPost).toHaveBeenCalledWith('/api/business/fees/what-if', businessData);
    });
  });

  describe('getFeeImpactAnalysis', () => {
    it('should call POST with correct endpoint and analysis data', async () => {
      const businessId = 'business1';
      const changes = { employees: 15, revenue: 150000 };
      const mockResponse = { impact: '+$500', newFee: 6500 };
      mockPost.mockResolvedValue(mockResponse);

      const result = await getFeeImpactAnalysis(businessId, changes);

      expect(mockPost).toHaveBeenCalledWith('/api/business/fees/impact/business1', changes);
      expect(result).toEqual(mockResponse);
    });

    it('should handle network errors', async () => {
      const businessId = 'business1';
      const changes = { employees: 15 };
      const mockError = new Error('Network error');
      mockPost.mockRejectedValue(mockError);

      await expect(getFeeImpactAnalysis(businessId, changes)).rejects.toThrow('Network error');
      expect(mockPost).toHaveBeenCalledWith('/api/business/fees/impact/business1', changes);
    });
  });

  describe('getFeeHistory', () => {
    it('should call GET with correct endpoint and business ID', async () => {
      const businessId = 'business1';
      const mockResponse = { history: [] };
      mockGet.mockResolvedValue(mockResponse);

      const result = await getFeeHistory(businessId);

      expect(mockGet).toHaveBeenCalledWith('/api/business/fees/history/business1');
      expect(result).toEqual(mockResponse);
    });

    it('should call GET with general endpoint when no business ID', async () => {
      const mockResponse = { history: [] };
      mockGet.mockResolvedValue(mockResponse);

      const result = await getFeeHistory();

      expect(mockGet).toHaveBeenCalledWith('/api/business/fees/history');
      expect(result).toEqual(mockResponse);
    });

    it('should handle API errors', async () => {
      const businessId = 'business1';
      const mockError = new Error('Network error');
      mockGet.mockRejectedValue(mockError);

      await expect(getFeeHistory(businessId)).rejects.toThrow('Network error');
      expect(mockGet).toHaveBeenCalledWith('/api/business/fees/history/business1');
    });
  });

  describe('getFeeOptimizationSuggestions', () => {
    it('should call GET with correct endpoint and business ID', async () => {
      const businessId = 'business1';
      const mockResponse = { suggestions: [] };
      mockGet.mockResolvedValue(mockResponse);

      const result = await getFeeOptimizationSuggestions(businessId);

      expect(mockGet).toHaveBeenCalledWith('/api/business/fees/optimization/business1');
      expect(result).toEqual(mockResponse);
    });

    it('should handle API errors', async () => {
      const businessId = 'business1';
      const mockError = new Error('Network error');
      mockGet.mockRejectedValue(mockError);

      await expect(getFeeOptimizationSuggestions(businessId)).rejects.toThrow('Network error');
      expect(mockGet).toHaveBeenCalledWith('/api/business/fees/optimization/business1');
    });
  });
});
