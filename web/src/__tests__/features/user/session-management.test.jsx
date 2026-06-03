import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderWithProviders } from '@/test/utils/renderWithProviders.jsx'
import ActiveSessions from '@/features/user/components/ActiveSessions.jsx'

// Mock ThemeProvider to avoid localStorage usage in tests (ThemeProvider calls localStorage.getItem on init)
vi.mock('@/shared/theme/ThemeProvider.jsx', () => ({
  ThemeProvider: ({ children }) => <>{children}</>,
  THEMES: {},
  useAppTheme: () => 'default',
}))

const mockGetActiveSessions = vi.fn().mockResolvedValue({ sessions: [] })

vi.mock('@/features/authentication/services/sessionService.js', () => ({
  getActiveSessions: (...args) => mockGetActiveSessions(...args),
  invalidateSession: vi.fn().mockResolvedValue({}),
  invalidateAllSessions: vi.fn().mockResolvedValue({}),
  postSessionActivity: vi.fn().mockResolvedValue({}),
}))

vi.mock('@/shared/notifications.js', () => ({
  useNotifier: () => ({ success: vi.fn(), error: vi.fn() }),
  useAuthNotification: () => ({
    notificationSuccess: vi.fn(),
    notificationError: vi.fn(),
  }),
}))

describe('ActiveSessions', () => {
  beforeEach(() => {
    mockGetActiveSessions.mockClear()
  })

  it('renders empty state without crashing', async () => {
    renderWithProviders(<ActiveSessions />)
    // Just verify component renders without throwing
    expect(document.body).toBeTruthy()
  }, 12000)
})
