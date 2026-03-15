import { getRiskProfile, getRiskFactors, getRiskImpactAnalysis, getRiskReductionRecommendations, submitRiskAppeal } from '../riskProfileService';
import { get, post } from '@/lib/http';
import { vi, describe, it, expect, beforeEach } from 'vitest';

// Mock the HTTP module
vi.mock('@/lib/http');
const mockGet = vi.mocked(get);
const mockPost = vi.mocked(post);

describe('riskProfileService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getRiskProfile', () => {
    it('should call GET with correct endpoint and business ID', async () => {
      const businessId = 'business1';
      const mockResponse = { riskScore: 75, level: 'Medium' };
      mockGet.mockResolvedValue(mockResponse);

      const result = await getRiskProfile(businessId);

      expect(mockGet).toHaveBeenCalledWith('/api/business-owner/risk-profile/business1');
      expect(result).toEqual(mockResponse);
    });

    it('should handle API errors', async () => {
      const businessId = 'business1';
      const mockError = new Error('Network error');
      mockGet.mockRejectedValue(mockError);

      await expect(getRiskProfile(businessId)).rejects.toThrow('Network error');
      expect(mockGet).toHaveBeenCalledWith('/api/business-owner/risk-profile/business1');
    });
  });

  describe('getRiskFactors', () => {
    it('should call GET with correct endpoint and business ID', async () => {
      const businessId = 'business1';
      const mockResponse = { factors: [] };
      mockGet.mockResolvedValue(mockResponse);

      const result = await getRiskFactors(businessId);

      expect(mockGet).toHaveBeenCalledWith('/api/business-owner/risk-profile/business1/factors');
      expect(result).toEqual(mockResponse);
    });

    it('should handle API errors', async () => {
      const businessId = 'business1';
      const mockError = new Error('Network error');
      mockGet.mockRejectedValue(mockError);

      await expect(getRiskFactors(businessId)).rejects.toThrow('Network error');
      expect(mockGet).toHaveBeenCalledWith('/api/business-owner/risk-profile/business1/factors');
    });
  });

  describe('getRiskImpactAnalysis', () => {
    it('should call GET with correct endpoint and business ID', async () => {
      const businessId = 'business1';
      const mockResponse = { impact: 'High', fees: 5000 };
      mockGet.mockResolvedValue(mockResponse);

      const result = await getRiskImpactAnalysis(businessId);

      expect(mockGet).toHaveBeenCalledWith('/api/business-owner/risk-profile/business1/impact');
      expect(result).toEqual(mockResponse);
    });

    it('should handle API errors', async () => {
      const businessId = 'business1';
      const mockError = new Error('Network error');
      mockGet.mockRejectedValue(mockError);

      await expect(getRiskImpactAnalysis(businessId)).rejects.toThrow('Network error');
      expect(mockGet).toHaveBeenCalledWith('/api/business-owner/risk-profile/business1/impact');
    });
  });

  describe('getRiskReductionRecommendations', () => {
    it('should call GET with correct endpoint and business ID', async () => {
      const businessId = 'business1';
      const mockResponse = { recommendations: [] };
      mockGet.mockResolvedValue(mockResponse);

      const result = await getRiskReductionRecommendations(businessId);

      expect(mockGet).toHaveBeenCalledWith('/api/business-owner/risk-profile/business1/recommendations');
      expect(result).toEqual(mockResponse);
    });

    it('should handle API errors', async () => {
      const businessId = 'business1';
      const mockError = new Error('Network error');
      mockGet.mockRejectedValue(mockError);

      await expect(getRiskReductionRecommendations(businessId)).rejects.toThrow('Network error');
      expect(mockGet).toHaveBeenCalledWith('/api/business-owner/risk-profile/business1/recommendations');
    });
  });

  describe('submitRiskAppeal', () => {
    it('should call POST with correct endpoint and appeal data', async () => {
      const businessId = 'business1';
      const appealData = { reason: 'Incorrect assessment', evidence: ['doc1.pdf'] };
      const mockResponse = { success: true, appealId: 'appeal1' };
      mockPost.mockResolvedValue(mockResponse);

      const result = await submitRiskAppeal(businessId, appealData);

      expect(mockPost).toHaveBeenCalledWith('/api/business-owner/risk-profile/business1/appeal', appealData);
      expect(result).toEqual(mockResponse);
    });

    it('should handle network errors', async () => {
      const businessId = 'business1';
      const appealData = { reason: 'Incorrect assessment' };
      const mockError = new Error('Network error');
      mockPost.mockRejectedValue(mockError);

      await expect(submitRiskAppeal(businessId, appealData)).rejects.toThrow('Network error');
      expect(mockPost).toHaveBeenCalledWith('/api/business-owner/risk-profile/business1/appeal', appealData);
    });
  });
});
