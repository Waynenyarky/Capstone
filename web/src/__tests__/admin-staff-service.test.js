import { fetchJsonWithFallback } from '@/lib/http.js'
import { updateStaff, resetStaffPassword } from '@/features/admin/services/staffService.js'

vi.mock('@/lib/http.js', () => ({
  fetchJsonWithFallback: vi.fn(() => Promise.resolve({ success: true })),
}))

describe('admin staff service', () => {
  beforeEach(() => {
    fetchJsonWithFallback.mockClear()
  })

  it('calls updateStaff with correct endpoint and payload', async () => {
    await updateStaff('staff123', { reason: 'test', firstName: 'New' })
    expect(fetchJsonWithFallback).toHaveBeenCalledWith('/api/auth/admin/staff/staff123', expect.objectContaining({
      method: 'PATCH',
    }))
  })

  it('calls resetStaffPassword with correct endpoint and payload', async () => {
    await resetStaffPassword('staff456', { reason: 'reset' })
    expect(fetchJsonWithFallback).toHaveBeenCalledWith('/api/auth/admin/staff/staff456/reset-password', expect.objectContaining({
      method: 'POST',
    }))
  })
})
