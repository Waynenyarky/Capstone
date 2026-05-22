import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ConfigProvider, App } from 'antd'
import ContentManagementPage from '../ContentManagementPage'

// Mock the dependencies
vi.mock('@/lib/http.js', () => ({
  get: vi.fn(() => Promise.resolve([])),
  put: vi.fn(() => Promise.resolve({})),
  post: vi.fn(() => Promise.resolve({})),
  del: vi.fn(() => Promise.resolve({})),
}))

vi.mock('@/features/admin/components/AdminLayout', () => ({
  default: ({ children, pageTitle }) => (
    <div data-testid="admin-layout">
      <div data-testid="page-title">{pageTitle}</div>
      {children}
    </div>
  ),
}))

const renderWithProviders = (component) => {
  return render(
    <ConfigProvider>
      <App>
        {component}
      </App>
    </ConfigProvider>
  )
}

describe('ContentManagementPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders content type selector', () => {
    renderWithProviders(<ContentManagementPage />)
    expect(screen.getByRole('combobox')).toBeInTheDocument()
  })

  it('renders search input', () => {
    renderWithProviders(<ContentManagementPage />)
    expect(screen.getByPlaceholderText('Search...')).toBeInTheDocument()
  })

  it('renders filter button', () => {
    renderWithProviders(<ContentManagementPage />)
    expect(screen.getByLabelText('Toggle filters')).toBeInTheDocument()
  })
})
