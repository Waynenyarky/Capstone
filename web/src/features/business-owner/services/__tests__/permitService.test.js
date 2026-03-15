import { 
  getPermitCategories, 
  submitPermitApplication, 
  getPermitApplications, 
  getPermitApplicationDetails, 
  updatePermitApplication 
} from '../permitService';
import { get, post } from '@/lib/http';
import { vi, describe, it, expect, beforeEach, test } from 'vitest';

vi.mock('@/lib/http');
const mockGet = vi.mocked(get);
const mockPost = vi.mocked(post);

describe('permitService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getPermitCategories', () => {
    test('should call GET with correct endpoint', async () => {
      const mockCategories = [
        {
          id: 'cat1',
          name: 'Business Permit',
          processingTime: '5-7 days',
          requirements: ['Business registration', 'Valid ID']
        },
        {
          id: 'cat2',
          name: 'Health Permit',
          processingTime: '3-5 days',
          requirements: ['Health certificate', 'Inspection report']
        }
      ];
      mockGet.mockResolvedValue({ categories: mockCategories });

      const result = await getPermitCategories();

      expect(mockGet).toHaveBeenCalledWith('/api/business-owner/permits/categories');
      expect(result).toEqual({ categories: mockCategories });
    });

    test('should handle empty categories', async () => {
      mockGet.mockResolvedValue({ categories: [] });

      const result = await getPermitCategories();

      expect(result).toEqual({ categories: [] });
      expect(mockGet).toHaveBeenCalledWith('/api/business-owner/permits/categories');
    });

    test('should handle API errors', async () => {
      const mockError = new Error('Network error');
      mockGet.mockRejectedValue(mockError);

      await expect(getPermitCategories()).rejects.toThrow('Network error');
      expect(mockGet).toHaveBeenCalledWith('/api/business-owner/permits/categories');
    });

    test('should handle server error responses', async () => {
      const mockErrorResponse = { error: 'Service unavailable' };
      mockGet.mockResolvedValue(mockErrorResponse);

      const result = await getPermitCategories();

      expect(result).toEqual(mockErrorResponse);
      expect(mockGet).toHaveBeenCalledWith('/api/business-owner/permits/categories');
    });

    test('should handle null response', async () => {
      mockGet.mockResolvedValue(null);

      const result = await getPermitCategories();

      expect(result).toBeNull();
      expect(mockGet).toHaveBeenCalledWith('/api/business-owner/permits/categories');
    });

    test('should handle undefined response', async () => {
      mockGet.mockResolvedValue(undefined);

      const result = await getPermitCategories();

      expect(result).toBeUndefined();
      expect(mockGet).toHaveBeenCalledWith('/api/business-owner/permits/categories');
    });
  });

  describe('submitPermitApplication', () => {
    test('should call POST with correct endpoint and application data', async () => {
      const applicationData = {
        businessId: 'business1',
        categoryId: 'cat1',
        description: 'Test application',
        documents: [],
        businessName: 'Test Business'
      };
      const mockResponse = { 
        success: true, 
        applicationId: 'app1',
        submittedAt: '2023-12-01T10:00:00Z'
      };
      mockPost.mockResolvedValue(mockResponse);

      const result = await submitPermitApplication(applicationData);

      expect(mockPost).toHaveBeenCalledWith('/api/business-owner/permits/apply', applicationData);
      expect(result).toEqual(mockResponse);
    });

    test('should handle application with documents', async () => {
      const applicationData = {
        businessId: 'business1',
        categoryId: 'cat1',
        description: 'Test application with documents',
        documents: [
          {
            name: 'document.pdf',
            url: 'https://example.com/document.pdf',
            type: 'application/pdf'
          }
        ],
        businessName: 'Test Business'
      };
      const mockResponse = { success: true, applicationId: 'app1' };
      mockPost.mockResolvedValue(mockResponse);

      const result = await submitPermitApplication(applicationData);

      expect(mockPost).toHaveBeenCalledWith('/api/business-owner/permits/apply', applicationData);
      expect(result).toEqual(mockResponse);
    });

    test('should handle minimal application data', async () => {
      const applicationData = {
        businessId: 'business1',
        categoryId: 'cat1',
        description: 'Minimal application'
      };
      const mockResponse = { success: true, applicationId: 'app1' };
      mockPost.mockResolvedValue(mockResponse);

      const result = await submitPermitApplication(applicationData);

      expect(mockPost).toHaveBeenCalledWith('/api/business-owner/permits/apply', applicationData);
      expect(result).toEqual(mockResponse);
    });

    test('should handle validation errors', async () => {
      const applicationData = {
        businessId: 'invalid-business',
        categoryId: 'invalid-category',
        description: ''
      };
      const mockErrorResponse = { 
        error: 'Validation failed',
        details: ['Invalid business ID', 'Invalid category ID', 'Description is required']
      };
      mockPost.mockResolvedValue(mockErrorResponse);

      const result = await submitPermitApplication(applicationData);

      expect(result).toEqual(mockErrorResponse);
      expect(mockPost).toHaveBeenCalledWith('/api/business-owner/permits/apply', applicationData);
    });

    test('should handle network errors', async () => {
      const applicationData = { businessId: 'business1', categoryId: 'cat1', description: 'Test' };
      const mockError = new Error('Network error');
      mockPost.mockRejectedValue(mockError);

      await expect(submitPermitApplication(applicationData)).rejects.toThrow('Network error');
      expect(mockPost).toHaveBeenCalledWith('/api/business-owner/permits/apply', applicationData);
    });

    test('should handle server errors', async () => {
      const applicationData = { businessId: 'business1', categoryId: 'cat1', description: 'Test' };
      const mockError = new Error('Internal server error');
      mockPost.mockRejectedValue(mockError);

      await expect(submitPermitApplication(applicationData)).rejects.toThrow('Internal server error');
      expect(mockPost).toHaveBeenCalledWith('/api/business-owner/permits/apply', applicationData);
    });

    test('should handle empty application data', async () => {
      const applicationData = {};
      const mockResponse = { success: true, applicationId: 'app1' };
      mockPost.mockResolvedValue(mockResponse);

      const result = await submitPermitApplication(applicationData);

      expect(mockPost).toHaveBeenCalledWith('/api/business-owner/permits/apply', applicationData);
      expect(result).toEqual(mockResponse);
    });
  });

  describe('getPermitApplications', () => {
    test('should call GET with correct endpoint and business ID', async () => {
      const businessId = 'business1';
      const mockApplications = [
        {
          applicationId: 'app1',
          category: 'Business Permit',
          status: 'Submitted',
          submittedDate: '2023-12-01',
          progress: 25
        },
        {
          applicationId: 'app2',
          category: 'Health Permit',
          status: 'Under Review',
          submittedDate: '2023-12-02',
          progress: 50
        }
      ];
      mockGet.mockResolvedValue({ applications: mockApplications });

      const result = await getPermitApplications(businessId);

      expect(mockGet).toHaveBeenCalledWith('/api/business-owner/permits/business1/applications');
      expect(result).toEqual({ applications: mockApplications });
    });

    test('should handle empty applications', async () => {
      const businessId = 'business1';
      mockGet.mockResolvedValue({ applications: [] });

      const result = await getPermitApplications(businessId);

      expect(result).toEqual({ applications: [] });
      expect(mockGet).toHaveBeenCalledWith('/api/business-owner/permits/business1/applications');
    });

    test('should handle invalid business ID', async () => {
      const businessId = 'invalid-business';
      const mockErrorResponse = { error: 'Business not found' };
      mockGet.mockResolvedValue(mockErrorResponse);

      const result = await getPermitApplications(businessId);

      expect(result).toEqual(mockErrorResponse);
      expect(mockGet).toHaveBeenCalledWith('/api/business-owner/permits/invalid-business/applications');
    });

    test('should handle network errors', async () => {
      const businessId = 'business1';
      const mockError = new Error('Network error');
      mockGet.mockRejectedValue(mockError);

      await expect(getPermitApplications(businessId)).rejects.toThrow('Network error');
      expect(mockGet).toHaveBeenCalledWith('/api/business-owner/permits/business1/applications');
    });

    test('should handle server errors', async () => {
      const businessId = 'business1';
      const mockError = new Error('Internal server error');
      mockGet.mockRejectedValue(mockError);

      await expect(getPermitApplications(businessId)).rejects.toThrow('Internal server error');
      expect(mockGet).toHaveBeenCalledWith('/api/business-owner/permits/business1/applications');
    });

    test('should handle large applications dataset', async () => {
      const businessId = 'business1';
      const largeApplications = Array.from({ length: 1000 }, (_, i) => ({
        applicationId: `app${i}`,
        category: 'Business Permit',
        status: 'Submitted',
        submittedDate: '2023-12-01',
        progress: 25
      }));
      mockGet.mockResolvedValue({ applications: largeApplications });

      const result = await getPermitApplications(businessId);

      expect(result).toEqual({ applications: largeApplications });
      expect(mockGet).toHaveBeenCalledWith('/api/business-owner/permits/business1/applications');
    });

    test('should handle special characters in business ID', async () => {
      const businessId = 'business-with-special-chars-123';
      const mockResponse = { applications: [] };
      mockGet.mockResolvedValue(mockResponse);

      const result = await getPermitApplications(businessId);

      expect(mockGet).toHaveBeenCalledWith('/api/business-owner/permits/business-with-special-chars-123/applications');
      expect(result).toEqual(mockResponse);
    });
  });

  describe('getPermitApplicationDetails', () => {
    test('should call GET with correct endpoint and application ID', async () => {
      const applicationId = 'app1';
      const mockApplication = {
        applicationId: 'app1',
        category: 'Business Permit',
        status: 'Under Review',
        description: 'Test application description',
        submittedDate: '2023-12-01',
        documents: [
          {
            name: 'document.pdf',
            url: 'https://example.com/document.pdf',
            type: 'application/pdf'
          }
        ],
        progress: 50,
        reviewComments: 'Application is under review'
      };
      mockGet.mockResolvedValue(mockApplication);

      const result = await getPermitApplicationDetails(applicationId);

      expect(mockGet).toHaveBeenCalledWith('/api/business-owner/permits/applications/app1');
      expect(result).toEqual(mockApplication);
    });

    test('should handle invalid application ID', async () => {
      const applicationId = 'invalid-app';
      const mockErrorResponse = { error: 'Application not found' };
      mockGet.mockResolvedValue(mockErrorResponse);

      const result = await getPermitApplicationDetails(applicationId);

      expect(result).toEqual(mockErrorResponse);
      expect(mockGet).toHaveBeenCalledWith('/api/business-owner/permits/applications/invalid-app');
    });

    test('should handle network errors', async () => {
      const applicationId = 'app1';
      const mockError = new Error('Network error');
      mockGet.mockRejectedValue(mockError);

      await expect(getPermitApplicationDetails(applicationId)).rejects.toThrow('Network error');
      expect(mockGet).toHaveBeenCalledWith('/api/business-owner/permits/applications/app1');
    });

    test('should handle server errors', async () => {
      const applicationId = 'app1';
      const mockError = new Error('Internal server error');
      mockGet.mockRejectedValue(mockError);

      await expect(getPermitApplicationDetails(applicationId)).rejects.toThrow('Internal server error');
      expect(mockGet).toHaveBeenCalledWith('/api/business-owner/permits/applications/app1');
    });

    test('should handle application without documents', async () => {
      const applicationId = 'app1';
      const mockApplication = {
        applicationId: 'app1',
        category: 'Business Permit',
        status: 'Submitted',
        description: 'Test application',
        submittedDate: '2023-12-01',
        documents: [],
        progress: 25
      };
      mockGet.mockResolvedValue(mockApplication);

      const result = await getPermitApplicationDetails(applicationId);

      expect(result).toEqual(mockApplication);
      expect(mockGet).toHaveBeenCalledWith('/api/business-owner/permits/applications/app1');
    });
  });

  describe('updatePermitApplication', () => {
    test('should call POST with correct endpoint and update data', async () => {
      const applicationId = 'app1';
      const updateData = {
        description: 'Updated description',
        documents: [
          {
            name: 'new-document.pdf',
            url: 'https://example.com/new-document.pdf',
            type: 'application/pdf'
          }
        ]
      };
      const mockResponse = { 
        success: true, 
        updatedAt: '2023-12-01T11:00:00Z',
        applicationId: 'app1'
      };
      mockPost.mockResolvedValue(mockResponse);

      const result = await updatePermitApplication(applicationId, updateData);

      expect(mockPost).toHaveBeenCalledWith('/api/business-owner/permits/applications/app1/update', updateData);
      expect(result).toEqual(mockResponse);
    });

    test('should handle partial update data', async () => {
      const applicationId = 'app1';
      const updateData = { description: 'Updated description only' };
      const mockResponse = { success: true };
      mockPost.mockResolvedValue(mockResponse);

      const result = await updatePermitApplication(applicationId, updateData);

      expect(mockPost).toHaveBeenCalledWith('/api/business-owner/permits/applications/app1/update', updateData);
      expect(result).toEqual(mockResponse);
    });

    test('should handle invalid application ID', async () => {
      const applicationId = 'invalid-app';
      const updateData = { description: 'Updated description' };
      const mockErrorResponse = { error: 'Application not found' };
      mockPost.mockResolvedValue(mockErrorResponse);

      const result = await updatePermitApplication(applicationId, updateData);

      expect(result).toEqual(mockErrorResponse);
      expect(mockPost).toHaveBeenCalledWith('/api/business-owner/permits/applications/invalid-app/update', updateData);
    });

    test('should handle validation errors', async () => {
      const applicationId = 'app1';
      const updateData = { description: '' };
      const mockErrorResponse = { 
        error: 'Validation failed',
        details: ['Description cannot be empty']
      };
      mockPost.mockResolvedValue(mockErrorResponse);

      const result = await updatePermitApplication(applicationId, updateData);

      expect(result).toEqual(mockErrorResponse);
      expect(mockPost).toHaveBeenCalledWith('/api/business-owner/permits/applications/app1/update', updateData);
    });

    test('should handle network errors', async () => {
      const applicationId = 'app1';
      const updateData = { description: 'Updated description' };
      const mockError = new Error('Network error');
      mockPost.mockRejectedValue(mockError);

      await expect(updatePermitApplication(applicationId, updateData)).rejects.toThrow('Network error');
      expect(mockPost).toHaveBeenCalledWith('/api/business-owner/permits/applications/app1/update', updateData);
    });

    test('should handle server errors', async () => {
      const applicationId = 'app1';
      const updateData = { description: 'Updated description' };
      const mockError = new Error('Internal server error');
      mockPost.mockRejectedValue(mockError);

      await expect(updatePermitApplication(applicationId, updateData)).rejects.toThrow('Internal server error');
      expect(mockPost).toHaveBeenCalledWith('/api/business-owner/permits/applications/app1/update', updateData);
    });

    test('should handle empty update data', async () => {
      const applicationId = 'app1';
      const updateData = {};
      const mockResponse = { success: true };
      mockPost.mockResolvedValue(mockResponse);

      const result = await updatePermitApplication(applicationId, updateData);

      expect(mockPost).toHaveBeenCalledWith('/api/business-owner/permits/applications/app1/update', updateData);
      expect(result).toEqual(mockResponse);
    });

    test('should handle special characters in application ID', async () => {
      const applicationId = 'app-with-special-chars-123';
      const updateData = { description: 'Updated description' };
      const mockResponse = { success: true };
      mockPost.mockResolvedValue(mockResponse);

      const result = await updatePermitApplication(applicationId, updateData);

      expect(mockPost).toHaveBeenCalledWith('/api/business-owner/permits/applications/app-with-special-chars-123/update', updateData);
      expect(result).toEqual(mockResponse);
    });
  });

  describe('Service Integration', () => {
    test('should handle complete permit application workflow', async () => {
      const businessId = 'business1';
      const applicationData = {
        businessId: 'business1',
        categoryId: 'cat1',
        description: 'Test application'
      };
      const applicationId = 'app1';

      // Mock getPermitCategories
      const mockCategories = [{ id: 'cat1', name: 'Business Permit' }];
      mockGet.mockResolvedValueOnce({ categories: mockCategories });

      // Mock submitPermitApplication
      const mockSubmitResponse = { success: true, applicationId };
      mockPost.mockResolvedValueOnce(mockSubmitResponse);

      // Mock getPermitApplications
      const mockApplications = [{ applicationId, category: 'Business Permit', status: 'Submitted' }];
      mockGet.mockResolvedValueOnce({ applications: mockApplications });

      // Mock getPermitApplicationDetails
      const mockApplicationDetails = {
        applicationId,
        category: 'Business Permit',
        status: 'Submitted',
        description: 'Test application'
      };
      mockGet.mockResolvedValueOnce(mockApplicationDetails);

      // Mock updatePermitApplication
      const mockUpdateResponse = { success: true, updatedAt: '2023-12-01T11:00:00Z' };
      mockPost.mockResolvedValueOnce(mockUpdateResponse);

      // Complete workflow
      const categories = await getPermitCategories();
      const submitResult = await submitPermitApplication(applicationData);
      const applications = await getPermitApplications(businessId);
      const details = await getPermitApplicationDetails(applicationId);
      const updateResult = await updatePermitApplication(applicationId, { description: 'Updated' });

      expect(categories).toEqual({ categories: mockCategories });
      expect(submitResult).toEqual(mockSubmitResponse);
      expect(applications).toEqual({ applications: mockApplications });
      expect(details).toEqual(mockApplicationDetails);
      expect(updateResult).toEqual(mockUpdateResponse);

      expect(mockGet).toHaveBeenCalledTimes(3);
      expect(mockPost).toHaveBeenCalledTimes(2);
    });

    test('should handle error propagation in workflow', async () => {
      const mockError = new Error('Service unavailable');
      mockGet.mockRejectedValue(mockError);

      await expect(getPermitCategories()).rejects.toThrow('Service unavailable');
      expect(mockGet).toHaveBeenCalledWith('/api/business-owner/permits/categories');
    });
  });

  describe('Data Validation', () => {
    test('should handle malformed application data', async () => {
      const applicationData = {
        businessId: null,
        categoryId: undefined,
        description: '',
        documents: [null, undefined, '']
      };
      const mockResponse = { success: true, applicationId: 'app1' };
      mockPost.mockResolvedValue(mockResponse);

      const result = await submitPermitApplication(applicationData);

      expect(mockPost).toHaveBeenCalledWith('/api/business-owner/permits/apply', applicationData);
      expect(result).toEqual(mockResponse);
    });

    test('should handle very long business ID', async () => {
      const businessId = 'a'.repeat(1000);
      const mockResponse = { applications: [] };
      mockGet.mockResolvedValue(mockResponse);

      const result = await getPermitApplications(businessId);

      expect(mockGet).toHaveBeenCalledWith(`/api/business-owner/permits/${businessId}/applications`);
      expect(result).toEqual(mockResponse);
    });

    test('should handle very long application ID', async () => {
      const applicationId = 'a'.repeat(1000);
      const mockApplication = { applicationId, category: 'Test Permit', status: 'Submitted' };
      mockGet.mockResolvedValue(mockApplication);

      const result = await getPermitApplicationDetails(applicationId);

      expect(mockGet).toHaveBeenCalledWith(`/api/business-owner/permits/applications/${applicationId}`);
      expect(result).toEqual(mockApplication);
    });
  });

  describe('Performance', () => {
    test('should handle concurrent requests', async () => {
      const businessId = 'business1';
      const applicationId = 'app1';
      const updateData = { description: 'Updated description' };

      const mockCategories = { categories: [] };
      const mockApplications = { applications: [] };
      const mockApplication = { applicationId, category: 'Test Permit' };
      const mockResponse = { success: true };

      mockGet.mockResolvedValueOnce(mockCategories);
      mockGet.mockResolvedValueOnce(mockApplications);
      mockGet.mockResolvedValueOnce(mockApplication);
      mockPost.mockResolvedValueOnce(mockResponse);

      // Make concurrent requests
      const [categoriesResult, applicationsResult, detailsResult, updateResult] = await Promise.all([
        getPermitCategories(),
        getPermitApplications(businessId),
        getPermitApplicationDetails(applicationId),
        updatePermitApplication(applicationId, updateData)
      ]);

      expect(categoriesResult).toEqual(mockCategories);
      expect(applicationsResult).toEqual(mockApplications);
      expect(detailsResult).toEqual(mockApplication);
      expect(updateResult).toEqual(mockResponse);
      expect(mockGet).toHaveBeenCalledTimes(3);
      expect(mockPost).toHaveBeenCalledTimes(1);
    });

    test('should handle request timeout scenarios', async () => {
      const timeoutError = new Error('Request timeout');
      timeoutError.code = 'ECONNABORTED';
      mockGet.mockRejectedValue(timeoutError);

      await expect(getPermitCategories()).rejects.toThrow('Request timeout');
    });
  });

  describe('Error Handling', () => {
    test('should handle 404 errors', async () => {
      const applicationId = 'nonexistent-app';
      const notFoundError = new Error('Not Found');
      notFoundError.response = { status: 404 };
      mockGet.mockRejectedValue(notFoundError);

      await expect(getPermitApplicationDetails(applicationId)).rejects.toThrow('Not Found');
    });

    test('should handle 500 errors', async () => {
      const applicationData = { businessId: 'business1', categoryId: 'cat1', description: 'Test' };
      const serverError = new Error('Internal Server Error');
      serverError.response = { status: 500 };
      mockPost.mockRejectedValue(serverError);

      await expect(submitPermitApplication(applicationData)).rejects.toThrow('Internal Server Error');
    });

    test('should handle authentication errors', async () => {
      const businessId = 'business1';
      const authError = new Error('Unauthorized');
      authError.response = { status: 401 };
      mockGet.mockRejectedValue(authError);

      await expect(getPermitApplications(businessId)).rejects.toThrow('Unauthorized');
    });

    test('should handle rate limiting errors', async () => {
      const applicationId = 'app1';
      const updateData = { description: 'Updated description' };
      const rateLimitError = new Error('Too Many Requests');
      rateLimitError.response = { status: 429 };
      mockPost.mockRejectedValue(rateLimitError);

      await expect(updatePermitApplication(applicationId, updateData)).rejects.toThrow('Too Many Requests');
    });
  });
});
