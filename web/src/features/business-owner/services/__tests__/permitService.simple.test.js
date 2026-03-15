import { getPermitCategories, submitPermitApplication, getPermitApplications, getPermitApplicationDetails, updatePermitApplication } from '../permitService';
import { get, post } from '@/lib/http';
import { vi, describe, it, expect, beforeEach } from 'vitest';

// Mock the HTTP module
vi.mock('@/lib/http');
const mockGet = vi.mocked(get);
const mockPost = vi.mocked(post);

describe('permitService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getPermitCategories', () => {
    it('should call GET with correct endpoint', async () => {
      const mockResponse = { categories: [] };
      mockGet.mockResolvedValue(mockResponse);

      const result = await getPermitCategories();

      expect(mockGet).toHaveBeenCalledWith('/api/business-owner/permits/categories');
      expect(result).toEqual(mockResponse);
    });

    it('should handle API errors', async () => {
      const mockError = new Error('Network error');
      mockGet.mockRejectedValue(mockError);

      await expect(getPermitCategories()).rejects.toThrow('Network error');
      expect(mockGet).toHaveBeenCalledWith('/api/business-owner/permits/categories');
    });
  });

  describe('submitPermitApplication', () => {
    it('should call POST with correct endpoint and application data', async () => {
      const applicationData = {
        permitType: 'general',
        businessId: 'business1',
        documents: []
      };
      const mockResponse = { success: true, applicationId: 'app1' };
      mockPost.mockResolvedValue(mockResponse);

      const result = await submitPermitApplication(applicationData);

      expect(mockPost).toHaveBeenCalledWith('/api/business-owner/permits/apply', applicationData);
      expect(result).toEqual(mockResponse);
    });

    it('should handle network errors', async () => {
      const applicationData = { permitType: 'general' };
      const mockError = new Error('Network error');
      mockPost.mockRejectedValue(mockError);

      await expect(submitPermitApplication(applicationData)).rejects.toThrow('Network error');
      expect(mockPost).toHaveBeenCalledWith('/api/business-owner/permits/apply', applicationData);
    });
  });

  describe('getPermitApplications', () => {
    it('should call GET with correct endpoint and business ID', async () => {
      const businessId = 'business1';
      const mockResponse = { applications: [] };
      mockGet.mockResolvedValue(mockResponse);

      const result = await getPermitApplications(businessId);

      expect(mockGet).toHaveBeenCalledWith('/api/business-owner/permits/business1/applications');
      expect(result).toEqual(mockResponse);
    });

    it('should handle API errors', async () => {
      const businessId = 'business1';
      const mockError = new Error('Network error');
      mockGet.mockRejectedValue(mockError);

      await expect(getPermitApplications(businessId)).rejects.toThrow('Network error');
      expect(mockGet).toHaveBeenCalledWith('/api/business-owner/permits/business1/applications');
    });
  });

  describe('getPermitApplicationDetails', () => {
    it('should call GET with correct endpoint and application ID', async () => {
      const applicationId = 'app1';
      const mockResponse = { id: applicationId, status: 'pending' };
      mockGet.mockResolvedValue(mockResponse);

      const result = await getPermitApplicationDetails(applicationId);

      expect(mockGet).toHaveBeenCalledWith('/api/business-owner/permits/applications/app1');
      expect(result).toEqual(mockResponse);
    });

    it('should handle API errors', async () => {
      const applicationId = 'app1';
      const mockError = new Error('Network error');
      mockGet.mockRejectedValue(mockError);

      await expect(getPermitApplicationDetails(applicationId)).rejects.toThrow('Network error');
      expect(mockGet).toHaveBeenCalledWith('/api/business-owner/permits/applications/app1');
    });
  });

  describe('updatePermitApplication', () => {
    it('should call POST with correct endpoint and update data', async () => {
      const applicationId = 'app1';
      const updateData = {
        status: 'submitted',
        documents: ['doc1.pdf']
      };
      const mockResponse = { success: true };
      mockPost.mockResolvedValue(mockResponse);

      const result = await updatePermitApplication(applicationId, updateData);

      expect(mockPost).toHaveBeenCalledWith('/api/business-owner/permits/applications/app1/update', updateData);
      expect(result).toEqual(mockResponse);
    });

    it('should handle network errors', async () => {
      const applicationId = 'app1';
      const updateData = { status: 'submitted' };
      const mockError = new Error('Network error');
      mockPost.mockRejectedValue(mockError);

      await expect(updatePermitApplication(applicationId, updateData)).rejects.toThrow('Network error');
      expect(mockPost).toHaveBeenCalledWith('/api/business-owner/permits/applications/app1/update', updateData);
    });
  });
});
