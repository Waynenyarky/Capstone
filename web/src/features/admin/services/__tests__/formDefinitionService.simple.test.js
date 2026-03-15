import { getFormDefinitions, getFormDefinition, createFormDefinition, updateFormDefinition, deleteFormDefinition, getFormGroups, getFormGroupStats } from '../formDefinitionService';
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

describe('formDefinitionService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetCurrentUser.mockReturnValue({ id: 'admin1', token: 'token123' });
    mockAuthHeaders.mockReturnValue({ Authorization: 'Bearer token123', 'Content-Type': 'application/json' });
  });

  describe('getFormDefinitions', () => {
    it('should call fetch with correct endpoint and no parameters', async () => {
      const mockResponse = { forms: [] };
      mockFetchJson.mockResolvedValue(mockResponse);

      const result = await getFormDefinitions();

      expect(mockFetchJson).toHaveBeenCalledWith('/api/admin/forms', { method: 'GET' });
      expect(result).toEqual(mockResponse);
    });

    it('should call fetch with status filter', async () => {
      mockFetchJson.mockResolvedValue({ forms: [] });

      await getFormDefinitions({ status: 'active' });

      expect(mockFetchJson).toHaveBeenCalledWith('/api/admin/forms?status=active', { method: 'GET' });
    });

    it('should handle API errors', async () => {
      mockFetchJson.mockRejectedValue(new Error('Network error'));
      await expect(getFormDefinitions()).rejects.toThrow('Network error');
    });
  });

  describe('getFormDefinition', () => {
    it('should call fetch with correct endpoint and form ID', async () => {
      const mockResponse = { form: { id: 'form1' } };
      mockFetchJson.mockResolvedValue(mockResponse);

      const result = await getFormDefinition('form1');

      expect(mockFetchJson).toHaveBeenCalledWith('/api/admin/forms/form1', { method: 'GET' });
      expect(result).toEqual(mockResponse);
    });

    it('should handle API errors', async () => {
      mockFetchJson.mockRejectedValue(new Error('Network error'));
      await expect(getFormDefinition('form1')).rejects.toThrow('Network error');
    });
  });

  describe('createFormDefinition', () => {
    it('should call fetch with correct endpoint and data', async () => {
      const formData = { name: 'Business Registration Form' };
      const mockResponse = { success: true };
      mockFetchJson.mockResolvedValue(mockResponse);

      const result = await createFormDefinition(formData);

      expect(mockFetchJson).toHaveBeenCalledWith('/api/admin/forms', expect.objectContaining({
        method: 'POST',
        body: JSON.stringify(formData),
      }));
      expect(result).toEqual(mockResponse);
    });

    it('should handle errors', async () => {
      mockFetchJson.mockRejectedValue(new Error('Network error'));
      await expect(createFormDefinition({})).rejects.toThrow('Network error');
    });
  });

  describe('updateFormDefinition', () => {
    it('should call fetch with correct endpoint and data', async () => {
      const updateData = { name: 'Updated Form' };
      const mockResponse = { success: true };
      mockFetchJson.mockResolvedValue(mockResponse);

      const result = await updateFormDefinition('form1', updateData);

      expect(mockFetchJson).toHaveBeenCalledWith('/api/admin/forms/form1', expect.objectContaining({
        method: 'PUT',
        body: JSON.stringify(updateData),
      }));
      expect(result).toEqual(mockResponse);
    });

    it('should handle errors', async () => {
      mockFetchJson.mockRejectedValue(new Error('Network error'));
      await expect(updateFormDefinition('form1', {})).rejects.toThrow('Network error');
    });
  });

  describe('deleteFormDefinition', () => {
    it('should call fetch with correct endpoint', async () => {
      const mockResponse = { success: true };
      mockFetchJson.mockResolvedValue(mockResponse);

      const result = await deleteFormDefinition('form1');

      expect(mockFetchJson).toHaveBeenCalledWith('/api/admin/forms/form1', expect.objectContaining({
        method: 'DELETE',
      }));
      expect(result).toEqual(mockResponse);
    });

    it('should handle errors', async () => {
      mockFetchJson.mockRejectedValue(new Error('Network error'));
      await expect(deleteFormDefinition('form1')).rejects.toThrow('Network error');
    });
  });

  describe('getFormGroups', () => {
    it('should call fetch with correct endpoint', async () => {
      mockFetchJson.mockResolvedValue({ groups: [] });

      const result = await getFormGroups();

      expect(mockFetchJson).toHaveBeenCalledWith('/api/admin/forms/groups', { method: 'GET' });
      expect(result).toEqual({ groups: [] });
    });
  });

  describe('getFormGroupStats', () => {
    it('should call fetch with correct endpoint', async () => {
      mockFetchJson.mockResolvedValue({ stats: {} });

      const result = await getFormGroupStats();

      expect(mockFetchJson).toHaveBeenCalledWith('/api/admin/forms/groups/stats', { method: 'GET' });
      expect(result).toEqual({ stats: {} });
    });
  });
});
