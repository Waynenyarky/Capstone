import { vi } from 'vitest';

export const useBusiness = vi.fn(() => ({
  business: { id: '123' },
  businesses: [],
  loading: false,
  error: null,
  updateBusinessProfile: vi.fn(),
  createBusiness: vi.fn(),
  deleteBusiness: vi.fn(),
  getBusinessById: vi.fn(),
  refreshBusiness: vi.fn()
}));

export default useBusiness;
