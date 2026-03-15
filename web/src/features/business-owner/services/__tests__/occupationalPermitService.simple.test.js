import { getOccupationalPermits, getLabExamResults, scheduleLabExam, getOccupationalPermitDetails, updateOccupationalPermit } from '../occupationalPermitService';
import { get, post } from '@/lib/http';
import { vi, describe, it, expect, beforeEach } from 'vitest';

// Mock the HTTP module
vi.mock('@/lib/http');
const mockGet = vi.mocked(get);
const mockPost = vi.mocked(post);

describe('occupationalPermitService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getOccupationalPermits', () => {
    it('should call GET with correct endpoint and business ID', async () => {
      const businessId = 'business1';
      const mockResponse = { permits: [] };
      mockGet.mockResolvedValue(mockResponse);

      const result = await getOccupationalPermits(businessId);

      expect(mockGet).toHaveBeenCalledWith('/api/business-owner/occupational-permits/business1');
      expect(result).toEqual(mockResponse);
    });

    it('should handle API errors', async () => {
      const businessId = 'business1';
      const mockError = new Error('Network error');
      mockGet.mockRejectedValue(mockError);

      await expect(getOccupationalPermits(businessId)).rejects.toThrow('Network error');
      expect(mockGet).toHaveBeenCalledWith('/api/business-owner/occupational-permits/business1');
    });
  });

  describe('getLabExamResults', () => {
    it('should call GET with correct endpoint and business ID', async () => {
      const businessId = 'business1';
      const mockResponse = { results: [] };
      mockGet.mockResolvedValue(mockResponse);

      const result = await getLabExamResults(businessId);

      expect(mockGet).toHaveBeenCalledWith('/api/business-owner/occupational-permits/business1/lab-results');
      expect(result).toEqual(mockResponse);
    });

    it('should handle API errors', async () => {
      const businessId = 'business1';
      const mockError = new Error('Network error');
      mockGet.mockRejectedValue(mockError);

      await expect(getLabExamResults(businessId)).rejects.toThrow('Network error');
      expect(mockGet).toHaveBeenCalledWith('/api/business-owner/occupational-permits/business1/lab-results');
    });
  });

  describe('scheduleLabExam', () => {
    it('should call POST with correct endpoint and exam data', async () => {
      const permitId = 'permit1';
      const examData = {
        examDate: '2024-01-15',
        examType: 'medical',
        labLocation: 'Lab A'
      };
      const mockResponse = { success: true, appointmentId: 'apt1' };
      mockPost.mockResolvedValue(mockResponse);

      const result = await scheduleLabExam(permitId, examData);

      expect(mockPost).toHaveBeenCalledWith('/api/business-owner/occupational-permits/permit1/schedule-exam', examData);
      expect(result).toEqual(mockResponse);
    });

    it('should handle network errors', async () => {
      const permitId = 'permit1';
      const examData = { examDate: '2024-01-15' };
      const mockError = new Error('Network error');
      mockPost.mockRejectedValue(mockError);

      await expect(scheduleLabExam(permitId, examData)).rejects.toThrow('Network error');
      expect(mockPost).toHaveBeenCalledWith('/api/business-owner/occupational-permits/permit1/schedule-exam', examData);
    });
  });

  describe('getOccupationalPermitDetails', () => {
    it('should call GET with correct endpoint and permit ID', async () => {
      const permitId = 'permit1';
      const mockResponse = { id: permitId, status: 'active' };
      mockGet.mockResolvedValue(mockResponse);

      const result = await getOccupationalPermitDetails(permitId);

      expect(mockGet).toHaveBeenCalledWith('/api/business-owner/occupational-permits/permits/permit1');
      expect(result).toEqual(mockResponse);
    });

    it('should handle API errors', async () => {
      const permitId = 'permit1';
      const mockError = new Error('Network error');
      mockGet.mockRejectedValue(mockError);

      await expect(getOccupationalPermitDetails(permitId)).rejects.toThrow('Network error');
      expect(mockGet).toHaveBeenCalledWith('/api/business-owner/occupational-permits/permits/permit1');
    });
  });

  describe('updateOccupationalPermit', () => {
    it('should call POST with correct endpoint and update data', async () => {
      const permitId = 'permit1';
      const updateData = {
        medicalCertificate: 'cert1.pdf',
        examResults: 'results1.pdf'
      };
      const mockResponse = { success: true };
      mockPost.mockResolvedValue(mockResponse);

      const result = await updateOccupationalPermit(permitId, updateData);

      expect(mockPost).toHaveBeenCalledWith('/api/business-owner/occupational-permits/permits/permit1/update', updateData);
      expect(result).toEqual(mockResponse);
    });

    it('should handle network errors', async () => {
      const permitId = 'permit1';
      const updateData = { medicalCertificate: 'cert1.pdf' };
      const mockError = new Error('Network error');
      mockPost.mockRejectedValue(mockError);

      await expect(updateOccupationalPermit(permitId, updateData)).rejects.toThrow('Network error');
      expect(mockPost).toHaveBeenCalledWith('/api/business-owner/occupational-permits/permits/permit1/update', updateData);
    });
  });
});
