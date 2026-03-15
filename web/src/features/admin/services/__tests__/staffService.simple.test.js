import { getStaffList, createStaff, updateStaff, getStaffRoles, getOffices } from '../staffService';
import { fetchJsonWithFallback } from '@/lib/http';
import { getCurrentUser } from '@/features/authentication/lib/authEvents';
import { authHeaders } from '@/lib/authHeaders';
import { vi, describe, it, expect, beforeEach } from 'vitest';

vi.mock('@/lib/http');
vi.mock('@/features/authentication/lib/authEvents');
vi.mock('@/lib/authHeaders');

const mockFetchJson = vi.mocked(fetchJsonWithFallback);
const mockGetCurrentUser = vi.mocked(getCurrentUser);
const mockAuthHeaders = vi.mocked(authHeaders);

describe('staffService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetCurrentUser.mockReturnValue({ id: 'admin1', token: 'token123' });
    mockAuthHeaders.mockReturnValue({ Authorization: 'Bearer token123', 'Content-Type': 'application/json' });
  });

  describe('getStaffList', () => {
    it('should call fetch with correct endpoint', async () => {
      const mockStaff = [{ id: 'staff1', name: 'John' }];
      mockFetchJson.mockResolvedValue(mockStaff);

      const result = await getStaffList();

      expect(mockFetchJson).toHaveBeenCalledWith('/api/auth/staff', { method: 'GET' });
      expect(result).toEqual(mockStaff);
    });

    it('should return staff array from object response', async () => {
      mockFetchJson.mockResolvedValue({ staff: [{ id: 'staff1' }] });

      const result = await getStaffList();

      expect(result).toEqual([{ id: 'staff1' }]);
    });

    it('should return empty array for non-array response', async () => {
      mockFetchJson.mockResolvedValue({});

      const result = await getStaffList();

      expect(result).toEqual([]);
    });

    it('should handle API errors', async () => {
      mockFetchJson.mockRejectedValue(new Error('Network error'));
      await expect(getStaffList()).rejects.toThrow('Network error');
    });
  });

  describe('createStaff', () => {
    it('should call fetch with correct endpoint and data', async () => {
      const payload = { firstName: 'John', email: 'john@test.com' };
      const mockResponse = { success: true };
      mockFetchJson.mockResolvedValue(mockResponse);

      const result = await createStaff(payload);

      expect(mockFetchJson).toHaveBeenCalledWith('/api/auth/staff', expect.objectContaining({
        method: 'POST',
        body: JSON.stringify(payload),
      }));
      expect(result).toEqual(mockResponse);
    });

    it('should handle errors', async () => {
      mockFetchJson.mockRejectedValue(new Error('Network error'));
      await expect(createStaff({})).rejects.toThrow('Network error');
    });
  });

  describe('updateStaff', () => {
    it('should call fetch with correct endpoint', async () => {
      const payload = { firstName: 'Updated' };
      const mockResponse = { success: true };
      mockFetchJson.mockResolvedValue(mockResponse);

      const result = await updateStaff('staff1', payload);

      expect(mockFetchJson).toHaveBeenCalledWith('/api/auth/admin/staff/staff1', expect.objectContaining({
        method: 'PATCH',
        body: JSON.stringify(payload),
      }));
      expect(result).toEqual(mockResponse);
    });

    it('should handle errors', async () => {
      mockFetchJson.mockRejectedValue(new Error('Network error'));
      await expect(updateStaff('staff1', {})).rejects.toThrow('Network error');
    });
  });

  describe('getStaffRoles', () => {
    it('should call fetch with correct endpoint', async () => {
      const mockRoles = [{ id: 'admin', name: 'Admin' }];
      mockFetchJson.mockResolvedValue(mockRoles);

      const result = await getStaffRoles();

      expect(mockFetchJson).toHaveBeenCalledWith('/api/auth/admin/staff-roles', { method: 'GET' });
      expect(result).toEqual(mockRoles);
    });

    it('should return roles from object response', async () => {
      mockFetchJson.mockResolvedValue({ roles: [{ id: 'admin' }] });

      const result = await getStaffRoles();

      expect(result).toEqual([{ id: 'admin' }]);
    });

    it('should handle API errors', async () => {
      mockFetchJson.mockRejectedValue(new Error('Network error'));
      await expect(getStaffRoles()).rejects.toThrow('Network error');
    });
  });

  describe('getOffices', () => {
    it('should call fetch with correct endpoint', async () => {
      const mockOffices = [{ id: 'office1', name: 'Main' }];
      mockFetchJson.mockResolvedValue(mockOffices);

      const result = await getOffices();

      expect(mockFetchJson).toHaveBeenCalledWith('/api/auth/admin/offices', { method: 'GET' });
      expect(result).toEqual(mockOffices);
    });

    it('should handle API errors', async () => {
      mockFetchJson.mockRejectedValue(new Error('Network error'));
      await expect(getOffices()).rejects.toThrow('Network error');
    });
  });
});
