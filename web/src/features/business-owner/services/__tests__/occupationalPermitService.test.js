import { 
  getOccupationalPermits, 
  getLabExamResults, 
  scheduleLabExam, 
  getOccupationalPermitDetails, 
  updateOccupationalPermit 
} from '../occupationalPermitService';
import { get, post } from '@/lib/http';
import { vi, describe, it, expect, beforeEach, test } from 'vitest';

vi.mock('@/lib/http');
const mockGet = vi.mocked(get);
const mockPost = vi.mocked(post);

describe('occupationalPermitService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getOccupationalPermits', () => {
    test('should call GET with correct endpoint and business ID', async () => {
      const businessId = 'business1';
      const mockPermits = [
        {
          id: 'permit1',
          type: 'Food Handler Permit',
          status: 'Pending Exam',
          description: 'Required for food service businesses',
          permitId: 'OCC-2023-001',
          validUntil: '2024-12-31',
          progress: 75,
          completedRequirements: 3,
          totalRequirements: 4
        },
        {
          id: 'permit2',
          type: 'Medical Certificate',
          status: 'Completed',
          description: 'Medical fitness certificate',
          permitId: 'OCC-2023-002',
          validUntil: '2024-06-30',
          progress: 100,
          completedRequirements: 2,
          totalRequirements: 2
        }
      ];
      mockGet.mockResolvedValue({ permits: mockPermits });

      const result = await getOccupationalPermits(businessId);

      expect(mockGet).toHaveBeenCalledWith('/api/business-owner/occupational-permits/business1');
      expect(result).toEqual({ permits: mockPermits });
    });

    test('should handle empty permits', async () => {
      const businessId = 'business1';
      mockGet.mockResolvedValue({ permits: [] });

      const result = await getOccupationalPermits(businessId);

      expect(result).toEqual({ permits: [] });
      expect(mockGet).toHaveBeenCalledWith('/api/business-owner/occupational-permits/business1');
    });

    test('should handle API errors', async () => {
      const businessId = 'business1';
      const mockError = new Error('Network error');
      mockGet.mockRejectedValue(mockError);

      await expect(getOccupationalPermits(businessId)).rejects.toThrow('Network error');
      expect(mockGet).toHaveBeenCalledWith('/api/business-owner/occupational-permits/business1');
    });

    test('should handle server error responses', async () => {
      const businessId = 'business1';
      const mockErrorResponse = { error: 'Business not found' };
      mockGet.mockResolvedValue(mockErrorResponse);

      const result = await getOccupationalPermits(businessId);

      expect(result).toEqual(mockErrorResponse);
      expect(mockGet).toHaveBeenCalledWith('/api/business-owner/occupational-permits/business1');
    });

    test('should handle null response', async () => {
      const businessId = 'business1';
      mockGet.mockResolvedValue(null);

      const result = await getOccupationalPermits(businessId);

      expect(result).toBeNull();
      expect(mockGet).toHaveBeenCalledWith('/api/business-owner/occupational-permits/business1');
    });

    test('should handle undefined response', async () => {
      const businessId = 'business1';
      mockGet.mockResolvedValue(undefined);

      const result = await getOccupationalPermits(businessId);

      expect(result).toBeUndefined();
      expect(mockGet).toHaveBeenCalledWith('/api/business-owner/occupational-permits/business1');
    });

    test('should handle special characters in business ID', async () => {
      const businessId = 'business-with-special-chars-123';
      const mockResponse = { permits: [] };
      mockGet.mockResolvedValue(mockResponse);

      const result = await getOccupationalPermits(businessId);

      expect(mockGet).toHaveBeenCalledWith('/api/business-owner/occupational-permits/business-with-special-chars-123');
      expect(result).toEqual(mockResponse);
    });

    test('should handle very long business ID', async () => {
      const businessId = 'a'.repeat(1000);
      const mockResponse = { permits: [] };
      mockGet.mockResolvedValue(mockResponse);

      const result = await getOccupationalPermits(businessId);

      expect(mockGet).toHaveBeenCalledWith(`/api/business-owner/occupational-permits/${businessId}`);
      expect(result).toEqual(mockResponse);
    });
  });

  describe('getLabExamResults', () => {
    test('should call GET with correct endpoint and business ID', async () => {
      const businessId = 'business1';
      const mockResults = [
        {
          id: 'result1',
          examType: 'Food Handler Test',
          status: 'Passed',
          examDate: '2023-12-01',
          score: 85,
          certificateUrl: 'https://example.com/certificate1.pdf'
        },
        {
          id: 'result2',
          examType: 'Medical Screening',
          status: 'Failed',
          examDate: '2023-11-20',
          score: 45,
          certificateUrl: null
        }
      ];
      mockGet.mockResolvedValue({ results: mockResults });

      const result = await getLabExamResults(businessId);

      expect(mockGet).toHaveBeenCalledWith('/api/business-owner/occupational-permits/business1/lab-results');
      expect(result).toEqual({ results: mockResults });
    });

    test('should handle empty lab results', async () => {
      const businessId = 'business1';
      mockGet.mockResolvedValue({ results: [] });

      const result = await getLabExamResults(businessId);

      expect(result).toEqual({ results: [] });
      expect(mockGet).toHaveBeenCalledWith('/api/business-owner/occupational-permits/business1/lab-results');
    });

    test('should handle invalid business ID', async () => {
      const businessId = 'invalid-business';
      const mockErrorResponse = { error: 'Business not found' };
      mockGet.mockResolvedValue(mockErrorResponse);

      const result = await getLabExamResults(businessId);

      expect(result).toEqual(mockErrorResponse);
      expect(mockGet).toHaveBeenCalledWith('/api/business-owner/occupational-permits/invalid-business/lab-results');
    });

    test('should handle network errors', async () => {
      const businessId = 'business1';
      const mockError = new Error('Network error');
      mockGet.mockRejectedValue(mockError);

      await expect(getLabExamResults(businessId)).rejects.toThrow('Network error');
      expect(mockGet).toHaveBeenCalledWith('/api/business-owner/occupational-permits/business1/lab-results');
    });

    test('should handle server errors', async () => {
      const businessId = 'business1';
      const mockError = new Error('Internal server error');
      mockGet.mockRejectedValue(mockError);

      await expect(getLabExamResults(businessId)).rejects.toThrow('Internal server error');
      expect(mockGet).toHaveBeenCalledWith('/api/business-owner/occupational-permits/business1/lab-results');
    });

    test('should handle results without certificates', async () => {
      const businessId = 'business1';
      const mockResults = [
        {
          id: 'result1',
          examType: 'Incomplete Test',
          status: 'Pending',
          examDate: '2023-12-15',
          score: null,
          certificateUrl: null
        }
      ];
      mockGet.mockResolvedValue({ results: mockResults });

      const result = await getLabExamResults(businessId);

      expect(result).toEqual({ results: mockResults });
      expect(mockGet).toHaveBeenCalledWith('/api/business-owner/occupational-permits/business1/lab-results');
    });

    test('should handle large results dataset', async () => {
      const businessId = 'business1';
      const largeResults = Array.from({ length: 1000 }, (_, i) => ({
        id: `result${i}`,
        examType: `Test ${i}`,
        status: 'Passed',
        examDate: '2023-12-01',
        score: 80 + (i % 20),
        certificateUrl: `https://example.com/certificate${i}.pdf`
      }));
      mockGet.mockResolvedValue({ results: largeResults });

      const result = await getLabExamResults(businessId);

      expect(result).toEqual({ results: largeResults });
      expect(mockGet).toHaveBeenCalledWith('/api/business-owner/occupational-permits/business1/lab-results');
    });
  });

  describe('scheduleLabExam', () => {
    test('should call POST with correct endpoint and scheduling data', async () => {
      const permitId = 'permit1';
      const schedulingData = {
        examDate: '2023-12-15',
        examTime: '09:00',
        location: 'main',
        notes: 'Need wheelchair accessibility'
      };
      const mockResponse = { 
        success: true, 
        scheduledAt: '2023-12-01T10:00:00Z',
        examId: 'exam1'
      };
      mockPost.mockResolvedValue(mockResponse);

      const result = await scheduleLabExam(permitId, schedulingData);

      expect(mockPost).toHaveBeenCalledWith('/api/business-owner/occupational-permits/permit1/schedule-exam', schedulingData);
      expect(result).toEqual(mockResponse);
    });

    test('should handle minimal scheduling data', async () => {
      const permitId = 'permit1';
      const schedulingData = {
        examDate: '2023-12-15',
        examTime: '09:00',
        location: 'main'
      };
      const mockResponse = { success: true, examId: 'exam1' };
      mockPost.mockResolvedValue(mockResponse);

      const result = await scheduleLabExam(permitId, schedulingData);

      expect(mockPost).toHaveBeenCalledWith('/api/business-owner/occupational-permits/permit1/schedule-exam', schedulingData);
      expect(result).toEqual(mockResponse);
    });

    test('should handle full scheduling data with all fields', async () => {
      const permitId = 'permit1';
      const schedulingData = {
        examDate: '2023-12-15',
        examTime: '14:00',
        location: 'north',
        notes: 'Special requirements: wheelchair access, extra time',
        contactInfo: 'contact@example.com',
        emergencyContact: 'emergency@example.com',
        medicalConditions: 'Asthma, allergies',
        preferredLanguage: 'Spanish'
      };
      const mockResponse = { success: true, examId: 'exam1' };
      mockPost.mockResolvedValue(mockResponse);

      const result = await scheduleLabExam(permitId, schedulingData);

      expect(mockPost).toHaveBeenCalledWith('/api/business-owner/occupational-permits/permit1/schedule-exam', schedulingData);
      expect(result).toEqual(mockResponse);
    });

    test('should handle invalid permit ID', async () => {
      const permitId = 'invalid-permit';
      const schedulingData = { examDate: '2023-12-15', examTime: '09:00', location: 'main' };
      const mockErrorResponse = { error: 'Permit not found' };
      mockPost.mockResolvedValue(mockErrorResponse);

      const result = await scheduleLabExam(permitId, schedulingData);

      expect(result).toEqual(mockErrorResponse);
      expect(mockPost).toHaveBeenCalledWith('/api/business-owner/occupational-permits/invalid-permit/schedule-exam', schedulingData);
    });

    test('should handle validation errors', async () => {
      const permitId = 'permit1';
      const schedulingData = {
        examDate: '', // Invalid date
        examTime: '', // Invalid time
        location: '' // Invalid location
      };
      const mockErrorResponse = { 
        error: 'Validation failed',
        details: ['Exam date is required', 'Exam time is required', 'Location is required']
      };
      mockPost.mockResolvedValue(mockErrorResponse);

      const result = await scheduleLabExam(permitId, schedulingData);

      expect(result).toEqual(mockErrorResponse);
      expect(mockPost).toHaveBeenCalledWith('/api/business-owner/occupational-permits/permit1/schedule-exam', schedulingData);
    });

    test('should handle scheduling conflicts', async () => {
      const permitId = 'permit1';
      const schedulingData = { examDate: '2023-12-15', examTime: '09:00', location: 'main' };
      const mockErrorResponse = { error: 'Time slot already booked' };
      mockPost.mockResolvedValue(mockErrorResponse);

      const result = await scheduleLabExam(permitId, schedulingData);

      expect(result).toEqual(mockErrorResponse);
      expect(mockPost).toHaveBeenCalledWith('/api/business-owner/occupational-permits/permit1/schedule-exam', schedulingData);
    });

    test('should handle network errors', async () => {
      const permitId = 'permit1';
      const schedulingData = { examDate: '2023-12-15', examTime: '09:00', location: 'main' };
      const mockError = new Error('Network error');
      mockPost.mockRejectedValue(mockError);

      await expect(scheduleLabExam(permitId, schedulingData)).rejects.toThrow('Network error');
      expect(mockPost).toHaveBeenCalledWith('/api/business-owner/occupational-permits/permit1/schedule-exam', schedulingData);
    });

    test('should handle server errors', async () => {
      const permitId = 'permit1';
      const schedulingData = { examDate: '2023-12-15', examTime: '09:00', location: 'main' };
      const mockError = new Error('Internal server error');
      mockPost.mockRejectedValue(mockError);

      await expect(scheduleLabExam(permitId, schedulingData)).rejects.toThrow('Internal server error');
      expect(mockPost).toHaveBeenCalledWith('/api/business-owner/occupational-permits/permit1/schedule-exam', schedulingData);
    });

    test('should handle empty scheduling data', async () => {
      const permitId = 'permit1';
      const schedulingData = {};
      const mockResponse = { success: true, examId: 'exam1' };
      mockPost.mockResolvedValue(mockResponse);

      const result = await scheduleLabExam(permitId, schedulingData);

      expect(mockPost).toHaveBeenCalledWith('/api/business-owner/occupational-permits/permit1/schedule-exam', schedulingData);
      expect(result).toEqual(mockResponse);
    });

    test('should handle special characters in permit ID', async () => {
      const permitId = 'permit-with-special-chars-123';
      const schedulingData = { examDate: '2023-12-15', examTime: '09:00', location: 'main' };
      const mockResponse = { success: true, examId: 'exam1' };
      mockPost.mockResolvedValue(mockResponse);

      const result = await scheduleLabExam(permitId, schedulingData);

      expect(mockPost).toHaveBeenCalledWith('/api/business-owner/occupational-permits/permit-with-special-chars-123/schedule-exam', schedulingData);
      expect(result).toEqual(mockResponse);
    });
  });

  describe('getOccupationalPermitDetails', () => {
    test('should call GET with correct endpoint and permit ID', async () => {
      const permitId = 'permit1';
      const mockPermit = {
        id: 'permit1',
        type: 'Food Handler Permit',
        status: 'Pending Exam',
        description: 'Required for food service businesses',
        permitId: 'OCC-2023-001',
        validUntil: '2024-12-31',
        progress: 75,
        completedRequirements: 3,
        totalRequirements: 4,
        requirements: [
          {
            name: 'Application Form',
            description: 'Complete application form',
            completed: true,
            examDate: null
          },
          {
            name: 'Lab Exam',
            description: 'Food handler laboratory test',
            completed: false,
            examDate: null
          }
        ]
      };
      mockGet.mockResolvedValue(mockPermit);

      const result = await getOccupationalPermitDetails(permitId);

      expect(mockGet).toHaveBeenCalledWith('/api/business-owner/occupational-permits/permits/permit1');
      expect(result).toEqual(mockPermit);
    });

    test('should handle invalid permit ID', async () => {
      const permitId = 'invalid-permit';
      const mockErrorResponse = { error: 'Permit not found' };
      mockGet.mockResolvedValue(mockErrorResponse);

      const result = await getOccupationalPermitDetails(permitId);

      expect(result).toEqual(mockErrorResponse);
      expect(mockGet).toHaveBeenCalledWith('/api/business-owner/occupational-permits/permits/invalid-permit');
    });

    test('should handle network errors', async () => {
      const permitId = 'permit1';
      const mockError = new Error('Network error');
      mockGet.mockRejectedValue(mockError);

      await expect(getOccupationalPermitDetails(permitId)).rejects.toThrow('Network error');
      expect(mockGet).toHaveBeenCalledWith('/api/business-owner/occupational-permits/permits/permit1');
    });

    test('should handle server errors', async () => {
      const permitId = 'permit1';
      const mockError = new Error('Internal server error');
      mockGet.mockRejectedValue(mockError);

      await expect(getOccupationalPermitDetails(permitId)).rejects.toThrow('Internal server error');
      expect(mockGet).toHaveBeenCalledWith('/api/business-owner/occupational-permits/permits/permit1');
    });

    test('should handle permit without requirements', async () => {
      const permitId = 'permit1';
      const mockPermit = {
        id: 'permit1',
        type: 'Simple Permit',
        status: 'Completed',
        description: 'Permit without requirements',
        permitId: 'OCC-2023-001',
        validUntil: '2024-12-31',
        progress: 100
        // No requirements array
      };
      mockGet.mockResolvedValue(mockPermit);

      const result = await getOccupationalPermitDetails(permitId);

      expect(result).toEqual(mockPermit);
      expect(mockGet).toHaveBeenCalledWith('/api/business-owner/occupational-permits/permits/permit1');
    });
  });

  describe('updateOccupationalPermit', () => {
    test('should call POST with correct endpoint and update data', async () => {
      const permitId = 'permit1';
      const updateData = {
        status: 'Completed',
        completedRequirements: 4,
        notes: 'All requirements completed'
      };
      const mockResponse = { 
        success: true, 
        updatedAt: '2023-12-01T11:00:00Z',
        permitId: 'permit1'
      };
      mockPost.mockResolvedValue(mockResponse);

      const result = await updateOccupationalPermit(permitId, updateData);

      expect(mockPost).toHaveBeenCalledWith('/api/business-owner/occupational-permits/permits/permit1/update', updateData);
      expect(result).toEqual(mockResponse);
    });

    test('should handle partial update data', async () => {
      const permitId = 'permit1';
      const updateData = { notes: 'Updated notes only' };
      const mockResponse = { success: true };
      mockPost.mockResolvedValue(mockResponse);

      const result = await updateOccupationalPermit(permitId, updateData);

      expect(mockPost).toHaveBeenCalledWith('/api/business-owner/occupational-permits/permits/permit1/update', updateData);
      expect(result).toEqual(mockResponse);
    });

    test('should handle invalid permit ID', async () => {
      const permitId = 'invalid-permit';
      const updateData = { status: 'Completed' };
      const mockErrorResponse = { error: 'Permit not found' };
      mockPost.mockResolvedValue(mockErrorResponse);

      const result = await updateOccupationalPermit(permitId, updateData);

      expect(result).toEqual(mockErrorResponse);
      expect(mockPost).toHaveBeenCalledWith('/api/business-owner/occupational-permits/permits/invalid-permit/update', updateData);
    });

    test('should handle validation errors', async () => {
      const permitId = 'permit1';
      const updateData = { status: 'Invalid Status' };
      const mockErrorResponse = { 
        error: 'Validation failed',
        details: ['Invalid status value']
      };
      mockPost.mockResolvedValue(mockErrorResponse);

      const result = await updateOccupationalPermit(permitId, updateData);

      expect(result).toEqual(mockErrorResponse);
      expect(mockPost).toHaveBeenCalledWith('/api/business-owner/occupational-permits/permits/permit1/update', updateData);
    });

    test('should handle network errors', async () => {
      const permitId = 'permit1';
      const updateData = { status: 'Completed' };
      const mockError = new Error('Network error');
      mockPost.mockRejectedValue(mockError);

      await expect(updateOccupationalPermit(permitId, updateData)).rejects.toThrow('Network error');
      expect(mockPost).toHaveBeenCalledWith('/api/business-owner/occupational-permits/permits/permit1/update', updateData);
    });

    test('should handle server errors', async () => {
      const permitId = 'permit1';
      const updateData = { status: 'Completed' };
      const mockError = new Error('Internal server error');
      mockPost.mockRejectedValue(mockError);

      await expect(updateOccupationalPermit(permitId, updateData)).rejects.toThrow('Internal server error');
      expect(mockPost).toHaveBeenCalledWith('/api/business-owner/occupational-permits/permits/permit1/update', updateData);
    });

    test('should handle empty update data', async () => {
      const permitId = 'permit1';
      const updateData = {};
      const mockResponse = { success: true };
      mockPost.mockResolvedValue(mockResponse);

      const result = await updateOccupationalPermit(permitId, updateData);

      expect(mockPost).toHaveBeenCalledWith('/api/business-owner/occupational-permits/permits/permit1/update', updateData);
      expect(result).toEqual(mockResponse);
    });

    test('should handle special characters in permit ID', async () => {
      const permitId = 'permit-with-special-chars-123';
      const updateData = { status: 'Completed' };
      const mockResponse = { success: true };
      mockPost.mockResolvedValue(mockResponse);

      const result = await updateOccupationalPermit(permitId, updateData);

      expect(mockPost).toHaveBeenCalledWith('/api/business-owner/occupational-permits/permits/permit-with-special-chars-123/update', updateData);
      expect(result).toEqual(mockResponse);
    });
  });

  describe('Service Integration', () => {
    test('should handle complete occupational permit workflow', async () => {
      const businessId = 'business1';
      const permitId = 'permit1';
      const schedulingData = {
        examDate: '2023-12-15',
        examTime: '09:00',
        location: 'main'
      };
      const updateData = { status: 'Completed' };

      // Mock getOccupationalPermits
      const mockPermits = [{ id: permitId, type: 'Food Handler Permit', status: 'Pending Exam' }];
      mockGet.mockResolvedValueOnce({ permits: mockPermits });

      // Mock getLabExamResults
      const mockResults = [{ id: 'result1', examType: 'Food Handler Test', status: 'Passed' }];
      mockGet.mockResolvedValueOnce({ results: mockResults });

      // Mock scheduleLabExam
      const mockScheduleResponse = { success: true, examId: 'exam1' };
      mockPost.mockResolvedValueOnce(mockScheduleResponse);

      // Mock getOccupationalPermitDetails
      const mockPermitDetails = {
        id: permitId,
        type: 'Food Handler Permit',
        status: 'Exam Scheduled',
        requirements: []
      };
      mockGet.mockResolvedValueOnce(mockPermitDetails);

      // Mock updateOccupationalPermit
      const mockUpdateResponse = { success: true, updatedAt: '2023-12-01T11:00:00Z' };
      mockPost.mockResolvedValueOnce(mockUpdateResponse);

      // Complete workflow
      const permits = await getOccupationalPermits(businessId);
      const results = await getLabExamResults(businessId);
      const scheduleResult = await scheduleLabExam(permitId, schedulingData);
      const details = await getOccupationalPermitDetails(permitId);
      const updateResult = await updateOccupationalPermit(permitId, updateData);

      expect(permits).toEqual({ permits: mockPermits });
      expect(results).toEqual({ results: mockResults });
      expect(scheduleResult).toEqual(mockScheduleResponse);
      expect(details).toEqual(mockPermitDetails);
      expect(updateResult).toEqual(mockUpdateResponse);

      expect(mockGet).toHaveBeenCalledTimes(3);
      expect(mockPost).toHaveBeenCalledTimes(2);
    });

    test('should handle error propagation in workflow', async () => {
      const businessId = 'business1';
      const mockError = new Error('Service unavailable');
      mockGet.mockRejectedValue(mockError);

      await expect(getOccupationalPermits(businessId)).rejects.toThrow('Service unavailable');
      expect(mockGet).toHaveBeenCalledWith('/api/business-owner/occupational-permits/business1');
    });
  });

  describe('Data Validation', () => {
    test('should handle malformed scheduling data', async () => {
      const permitId = 'permit1';
      const schedulingData = {
        examDate: null,
        examTime: undefined,
        location: '',
        notes: [null, undefined, '']
      };
      const mockResponse = { success: true, examId: 'exam1' };
      mockPost.mockResolvedValue(mockResponse);

      const result = await scheduleLabExam(permitId, schedulingData);

      expect(mockPost).toHaveBeenCalledWith('/api/business-owner/occupational-permits/permit1/schedule-exam', schedulingData);
      expect(result).toEqual(mockResponse);
    });

    test('should handle very long permit ID', async () => {
      const permitId = 'a'.repeat(1000);
      const mockPermit = { id: permitId, type: 'Test Permit', status: 'Pending' };
      mockGet.mockResolvedValue(mockPermit);

      const result = await getOccupationalPermitDetails(permitId);

      expect(mockGet).toHaveBeenCalledWith(`/api/business-owner/occupational-permits/permits/${permitId}`);
      expect(result).toEqual(mockPermit);
    });

    test('should handle malformed update data', async () => {
      const permitId = 'permit1';
      const updateData = {
        status: null,
        completedRequirements: undefined,
        notes: [null, undefined, ''],
        requirements: [null, {}]
      };
      const mockResponse = { success: true };
      mockPost.mockResolvedValue(mockResponse);

      const result = await updateOccupationalPermit(permitId, updateData);

      expect(mockPost).toHaveBeenCalledWith('/api/business-owner/occupational-permits/permits/permit1/update', updateData);
      expect(result).toEqual(mockResponse);
    });
  });

  describe('Performance', () => {
    test('should handle concurrent requests', async () => {
      const businessId = 'business1';
      const permitId = 'permit1';
      const schedulingData = { examDate: '2023-12-15', examTime: '09:00', location: 'main' };
      const updateData = { status: 'Completed' };

      const mockPermits = { permits: [] };
      const mockResults = { results: [] };
      const mockPermit = { id: permitId, type: 'Test Permit', status: 'Pending' };
      const mockResponse = { success: true };

      mockGet.mockResolvedValueOnce(mockPermits);
      mockGet.mockResolvedValueOnce(mockResults);
      mockGet.mockResolvedValueOnce(mockPermit);
      mockPost.mockResolvedValueOnce(mockResponse);
      mockPost.mockResolvedValueOnce(mockResponse);

      // Make concurrent requests
      const [permitsResult, resultsResult, detailsResult, scheduleResult, updateResult] = await Promise.all([
        getOccupationalPermits(businessId),
        getLabExamResults(businessId),
        getOccupationalPermitDetails(permitId),
        scheduleLabExam(permitId, schedulingData),
        updateOccupationalPermit(permitId, updateData)
      ]);

      expect(permitsResult).toEqual(mockPermits);
      expect(resultsResult).toEqual(mockResults);
      expect(detailsResult).toEqual(mockPermit);
      expect(scheduleResult).toEqual(mockResponse);
      expect(updateResult).toEqual(mockResponse);
      expect(mockGet).toHaveBeenCalledTimes(3);
      expect(mockPost).toHaveBeenCalledTimes(2);
    });

    test('should handle request timeout scenarios', async () => {
      const businessId = 'business1';
      const timeoutError = new Error('Request timeout');
      timeoutError.code = 'ECONNABORTED';
      mockGet.mockRejectedValue(timeoutError);

      await expect(getOccupationalPermits(businessId)).rejects.toThrow('Request timeout');
    });
  });

  describe('Error Handling', () => {
    test('should handle 404 errors', async () => {
      const permitId = 'nonexistent-permit';
      const notFoundError = new Error('Not Found');
      notFoundError.response = { status: 404 };
      mockGet.mockRejectedValue(notFoundError);

      await expect(getOccupationalPermitDetails(permitId)).rejects.toThrow('Not Found');
    });

    test('should handle 500 errors', async () => {
      const businessId = 'business1';
      const serverError = new Error('Internal Server Error');
      serverError.response = { status: 500 };
      mockGet.mockRejectedValue(serverError);

      await expect(getOccupationalPermits(businessId)).rejects.toThrow('Internal Server Error');
    });

    test('should handle authentication errors', async () => {
      const businessId = 'business1';
      const authError = new Error('Unauthorized');
      authError.response = { status: 401 };
      mockGet.mockRejectedValue(authError);

      await expect(getLabExamResults(businessId)).rejects.toThrow('Unauthorized');
    });

    test('should handle rate limiting errors', async () => {
      const permitId = 'permit1';
      const schedulingData = { examDate: '2023-12-15', examTime: '09:00', location: 'main' };
      const rateLimitError = new Error('Too Many Requests');
      rateLimitError.response = { status: 429 };
      mockPost.mockRejectedValue(rateLimitError);

      await expect(scheduleLabExam(permitId, schedulingData)).rejects.toThrow('Too Many Requests');
    });
  });
});
