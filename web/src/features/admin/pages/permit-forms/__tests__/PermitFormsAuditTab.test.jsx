import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ConfigProvider } from 'antd'
import PermitFormsAuditTab from '../components/PermitFormsAuditTab.jsx'

vi.mock('@/features/admin/services/permitFormsService', () => ({
  getPermitFormsAudit: vi.fn().mockResolvedValue({
    logs: [],
    total: 0,
    page: 1,
    limit: 20,
    totalPages: 1,
  }),
}))

const mockToken = {
  colorBgContainer: '#ffffff',
}

const renderWithConfig = (ui) => {
  return render(
    <ConfigProvider theme={{ token: mockToken }}>
      {ui}
    </ConfigProvider>
  )
}

describe('PermitFormsAuditTab', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders without crashing', () => {
    renderWithConfig(<PermitFormsAuditTab token={mockToken} />)
    // When no logs, shows empty state
    expect(screen.getByText(/No audit logs yet/)).toBeInTheDocument()
  })
})
