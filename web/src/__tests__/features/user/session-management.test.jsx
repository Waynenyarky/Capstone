import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderWithProviders, screen } from '@/test/utils/renderWithProviders.jsx'
import ActiveSessions from '@/features/user/views/components/ActiveSessions.jsx'

const mockGetActiveSessions = vi.fn().mockResolvedValue({ sessions: [] })

vi.mock('@/features/authentication/services/sessionService.js', () => ({
  getActiveSessions: (...args) => mockGetActiveSessions(...args),
  invalidateSession: vi.fn().mockResolvedValue({}),
  invalidateAllSessions: vi.fn().mockResolvedValue({}),
  postSessionActivity: vi.fn().mockResolvedValue({}),
}))

vi.mock('@/shared/notifications.js', () => ({
  useNotifier: () => ({ success: vi.fn(), error: vi.fn() }),
}))

describe('ActiveSessions', () => {
  beforeEach(() => {
    mockGetActiveSessions.mockClear()
  })

  it('renders empty state without crashing', async () => {
    renderWithProviders(<ActiveSessions />)
    const empty = await screen.findByText(/No active sessions/i, {}, { timeout: 10000 })
    expect(empty).toBeInTheDocument()
    expect(mockGetActiveSessions).toHaveBeenCalled()
  }, 12000)
})
