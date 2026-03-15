import { getComplianceOverview, getUpcomingDeadlines, getActiveViolations, getOngoingRequirements, updateRequirement } from '../complianceMonitoringService';
import { get, post } from '@/lib/http';
import { vi, describe, it, expect, beforeEach } from 'vitest';

// Mock the HTTP module
vi.mock('@/lib/http');
const mockGet = vi.mocked(get);
const mockPost = vi.mocked(post);

describe('complianceMonitoringService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getComplianceOverview', () => {
    it('should call GET with correct endpoint and business ID', async () => {
      const businessId = 'business1';
      const mockResponse = { compliance: 85, status: 'Good' };
      mockGet.mockResolvedValue(mockResponse);

      const result = await getComplianceOverview(businessId);

      expect(mockGet).toHaveBeenCalledWith('/api/business-owner/compliance/business1/overview');
      expect(result).toEqual(mockResponse);
    });

    it('should handle API errors', async () => {
      const businessId = 'business1';
      const mockError = new Error('Network error');
      mockGet.mockRejectedValue(mockError);

      await expect(getComplianceOverview(businessId)).rejects.toThrow('Network error');
      expect(mockGet).toHaveBeenCalledWith('/api/business-owner/compliance/business1/overview');
    });
  });

  describe('getUpcomingDeadlines', () => {
    it('should call GET with correct endpoint and business ID', async () => {
      const businessId = 'business1';
      const mockResponse = { deadlines: [] };
      mockGet.mockResolvedValue(mockResponse);

      const result = await getUpcomingDeadlines(businessId);

      expect(mockGet).toHaveBeenCalledWith('/api/business-owner/compliance/business1/deadlines');
      expect(result).toEqual(mockResponse);
    });

    it('should handle API errors', async () => {
      const businessId = 'business1';
      const mockError = new Error('Network error');
      mockGet.mockRejectedValue(mockError);

      await expect(getUpcomingDeadlines(businessId)).rejects.toThrow('Network error');
      expect(mockGet).toHaveBeenCalledWith('/api/business-owner/compliance/business1/deadlines');
    });
  });

  describe('getActiveViolations', () => {
    it('should call GET with correct endpoint and business ID', async () => {
      const businessId = 'business1';
      const mockResponse = { violations: [] };
      mockGet.mockResolvedValue(mockResponse);

      const result = await getActiveViolations(businessId);

      expect(mockGet).toHaveBeenCalledWith('/api/business-owner/compliance/business1/violations');
      expect(result).toEqual(mockResponse);
    });

    it('should handle API errors', async () => {
      const businessId = 'business1';
      const mockError = new Error('Network error');
      mockGet.mockRejectedValue(mockError);

      await expect(getActiveViolations(businessId)).rejects.toThrow('Network error');
      expect(mockGet).toHaveBeenCalledWith('/api/business-owner/compliance/business1/violations');
    });
  });

  describe('getOngoingRequirements', () => {
    it('should call GET with correct endpoint and business ID', async () => {
      const businessId = 'business1';
      const mockResponse = { requirements: [] };
      mockGet.mockResolvedValue(mockResponse);

      const result = await getOngoingRequirements(businessId);

      expect(mockGet).toHaveBeenCalledWith('/api/business-owner/compliance/business1/requirements');
      expect(result).toEqual(mockResponse);
    });

    it('should handle API errors', async () => {
      const businessId = 'business1';
      const mockError = new Error('Network error');
      mockGet.mockRejectedValue(mockError);

      await expect(getOngoingRequirements(businessId)).rejects.toThrow('Network error');
      expect(mockGet).toHaveBeenCalledWith('/api/business-owner/compliance/business1/requirements');
    });
  });

  describe('updateRequirement', () => {
    it('should call POST with correct endpoint and update data', async () => {
      const requirementId = 'req1';
      const updateData = { status: 'Compliant', notes: 'All requirements met' };
      const mockResponse = { success: true };
      mockPost.mockResolvedValue(mockResponse);

      const result = await updateRequirement(requirementId, updateData);

      expect(mockPost).toHaveBeenCalledWith('/api/business-owner/compliance/requirements/req1/update', updateData);
      expect(result).toEqual(mockResponse);
    });

    it('should handle network errors', async () => {
      const requirementId = 'req1';
      const updateData = { status: 'Compliant' };
      const mockError = new Error('Network error');
      mockPost.mockRejectedValue(mockError);

      await expect(updateRequirement(requirementId, updateData)).rejects.toThrow('Network error');
      expect(mockPost).toHaveBeenCalledWith('/api/business-owner/compliance/requirements/req1/update', updateData);
    });
  });
});
