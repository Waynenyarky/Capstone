import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { Routes, Route, useLocation } from 'react-router-dom'
import ProtectedRoute from '../ProtectedRoute.jsx'
import { renderWithProviders, screen } from '@/test/utils/renderWithProviders.jsx'

// Mock auth hooks and helpers from the authentication barrel
const mockUseAuthSession = vi.fn()
const mockUseMaintenanceStatus = vi.fn()
const mockGetIsLoggingOut = vi.fn(() => false)

vi.mock('@/features/authentication', async () => {
  const actual = await vi.importActual('@/features/authentication')
  return {
    ...actual,
    useAuthSession: (...args) => mockUseAuthSession(...args),
    useMaintenanceStatus: (...args) => mockUseMaintenanceStatus(...args),
  }
})

vi.mock('@/features/authentication/lib/authEvents.js', async () => {
  const actual = await vi.importActual('@/features/authentication/lib/authEvents.js')
  return {
    ...actual,
    getIsLoggingOut: () => mockGetIsLoggingOut(),
  }
})

const LocationEcho = () => {
  const location = useLocation()
  return (
    <div data-testid="location">
      {location.pathname}::{location.state?.notification?.message || ''}
    </div>
  )
}

const Secure = () => <div>secure content</div>

describe('ProtectedRoute', () => {
  beforeEach(() => {
    mockUseMaintenanceStatus.mockReturnValue({ loading: false, active: false })
    mockGetIsLoggingOut.mockReturnValue(false)
  })

  it('renders children when authenticated and allowed', () => {
    mockUseAuthSession.mockReturnValue({
      currentUser: { token: 'token', role: 'user' },
      role: { slug: 'user' },
      isLoading: false,
    })

    renderWithProviders(
      <Routes>
        <Route path="/" element={<ProtectedRoute><Secure /></ProtectedRoute>} />
      </Routes>
    )

    expect(screen.getByText('secure content')).toBeInTheDocument()
  })

  it('redirects unauthenticated users to login with warning for sensitive routes', () => {
    mockUseAuthSession.mockReturnValue({
      currentUser: null,
      role: null,
      isLoading: false,
    })

    renderWithProviders(
      <Routes>
        <Route
          path="/admin/dashboard"
          element={<ProtectedRoute><Secure /></ProtectedRoute>}
        />
        <Route path="/login" element={<LocationEcho />} />
      </Routes>,
      { initialEntries: ['/admin/dashboard'] }
    )

    expect(screen.getByTestId('location').textContent).toContain('/login::Restricted Access')
  })

  it('redirects non-admin users to maintenance page when maintenance mode is active', () => {
    mockUseAuthSession.mockReturnValue({
      currentUser: { token: 'token', role: 'user' },
      role: { slug: 'user' },
      isLoading: false,
    })
    mockUseMaintenanceStatus.mockReturnValue({ loading: false, active: true })

    renderWithProviders(
      <Routes>
        <Route
          path="/dashboard"
          element={<ProtectedRoute><Secure /></ProtectedRoute>}
        />
        <Route path="/maintenance" element={<LocationEcho />} />
      </Routes>,
      { initialEntries: ['/dashboard'] }
    )

    expect(screen.getByTestId('location').textContent).toContain('/maintenance::')
  })
})
