import { getStaffList, createStaff, updateStaff, getStaffRoles } from '../staffService';
import { fetchJsonWithFallback } from '@/lib/http';
import { getCurrentUser } from '@/features/authentication/lib/authEvents';
import { vi, describe, it, expect, beforeEach } from 'vitest';

// Mock dependencies
vi.mock('@/lib/http');
vi.mock('@/features/authentication/lib/authEvents');

const mockFetchJson = vi.mocked(fetchJsonWithFallback);
const mockGetCurrentUser = vi.mocked(getCurrentUser);

describe('staffService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetCurrentUser.mockReturnValue({ id: 'admin1', token: 'token123' });
  });

  describe('getStaffList', () => {
    it('should call fetch with correct endpoint', async () => {
      const mockResponse = [
        { id: 'staff1', firstName: 'John', lastName: 'Doe', email: 'john@test.com' },
        { id: 'staff2', firstName: 'Jane', lastName: 'Smith', email: 'jane@test.com' }
      ];
      mockFetchJson.mockResolvedValue(mockResponse);

      const result = await getStaffList();

      expect(mockFetchJson).toHaveBeenCalledWith('/api/auth/staff', {
        method: 'GET'
      });
      expect(result).toEqual(mockResponse);
    });

    it('should handle array response format', async () => {
      const mockResponse = [{ id: 'staff1', firstName: 'John' }];
      mockFetchJson.mockResolvedValue(mockResponse);

      const result = await getStaffList();

      expect(result).toEqual(mockResponse);
    });

    it('should handle object response with staff property', async () => {
      const mockResponse = { staff: [{ id: 'staff1', firstName: 'John' }] };
      mockFetchJson.mockResolvedValue(mockResponse);

      const result = await getStaffList();

      expect(result).toEqual(mockResponse.staff);
    });

    it('should handle API errors', async () => {
      const mockError = new Error('Network error');
      mockFetchJson.mockRejectedValue(mockError);

      await expect(getStaffList()).rejects.toThrow('Network error');
    });
  });

  describe('createStaff', () => {
    it('should call fetch with correct endpoint and staff data', async () => {
      const staffData = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@lgu.gov.ph',
        role: 'inspector',
        lguId: 'lgu1'
      };
      const mockResponse = { success: true, staffId: 'staff1' };
      mockFetchJson.mockResolvedValue(mockResponse);

      const result = await createStaff(staffData);

      expect(mockFetchJson).toHaveBeenCalledWith('/api/auth/staff', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-user-id': 'admin1',
          'x-user-role': 'admin'
        },
        body: JSON.stringify(staffData)
      });
      expect(result).toEqual(mockResponse);
    });

    it('should handle step-up token option', async () => {
      const staffData = { firstName: 'John', email: 'john@test.com' };
      const options = { stepUpToken: 'stepup123' };
      const mockResponse = { success: true };
      mockFetchJson.mockResolvedValue(mockResponse);

      const result = await createStaff(staffData, options);

      expect(mockFetchJson).toHaveBeenCalledWith('/api/auth/staff', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-user-id': 'admin1',
          'x-user-role': 'admin',
          'X-Step-Up-Token': 'stepup123'
        },
        body: JSON.stringify(staffData)
      });
      expect(result).toEqual(mockResponse);
    });

    it('should handle network errors', async () => {
      const staffData = { firstName: 'John', email: 'john@test.com' };
      const mockError = new Error('Network error');
      mockFetchJson.mockRejectedValue(mockError);

      await expect(createStaff(staffData)).rejects.toThrow('Network error');
    });
  });

  describe('updateStaff', () => {
    it('should call fetch with correct endpoint and update data', async () => {
      const staffId = 'staff1';
      const updateData = {
        firstName: 'John Updated',
        role: 'senior_inspector'
      };
      const mockResponse = { success: true };
      mockFetchJson.mockResolvedValue(mockResponse);

      const result = await updateStaff(staffId, updateData);

      expect(mockFetchJson).toHaveBeenCalledWith('/api/auth/admin/staff/staff1', {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          'x-user-id': 'admin1',
          'x-user-role': 'admin'
        },
        body: JSON.stringify(updateData)
      });
      expect(result).toEqual(mockResponse);
    });

    it('should handle step-up token option', async () => {
      const staffId = 'staff1';
      const updateData = { firstName: 'Updated' };
      const options = { stepUpToken: 'stepup456' };
      const mockResponse = { success: true };
      mockFetchJson.mockResolvedValue(mockResponse);

      const result = await updateStaff(staffId, updateData, options);

      expect(mockFetchJson).toHaveBeenCalledWith('/api/auth/admin/staff/staff1', {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          'x-user-id': 'admin1',
          'x-user-role': 'admin',
          'X-Step-Up-Token': 'stepup456'
        },
        body: JSON.stringify(updateData)
      });
      expect(result).toEqual(mockResponse);
    });

    it('should handle network errors', async () => {
      const staffId = 'staff1';
      const updateData = { firstName: 'Updated' };
      const mockError = new Error('Network error');
      mockFetchJson.mockRejectedValue(mockError);

      await expect(updateStaff(staffId, updateData)).rejects.toThrow('Network error');
    });
  });

  describe('getStaffRoles', () => {
    it('should call fetch with correct endpoint', async () => {
      const mockResponse = [
        { id: 'admin', name: 'Administrator', permissions: ['all'] },
        { id: 'inspector', name: 'Inspector', permissions: ['view_applications', 'approve'] }
      ];
      mockFetchJson.mockResolvedValue(mockResponse);

      const result = await getStaffRoles();

      expect(mockFetchJson).toHaveBeenCalledWith('/api/auth/admin/staff-roles', {
        method: 'GET'
      });
      expect(result).toEqual(mockResponse);
    });

    it('should handle API errors', async () => {
      const mockError = new Error('Network error');
      mockFetchJson.mockRejectedValue(mockError);

      await expect(getStaffRoles()).rejects.toThrow('Network error');
    });
  });
});
