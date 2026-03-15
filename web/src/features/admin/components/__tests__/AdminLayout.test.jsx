import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ConfigProvider, App } from 'antd'
import AdminLayout from '../AdminLayout.jsx'

// Mock the dependencies
vi.mock('@/features/authentication', () => ({
  AppSidebar: ({ itemOverrides, hiddenKeys }) => (
    <div data-testid="app-sidebar">
      <div data-testid="sidebar-overrides">{JSON.stringify(itemOverrides)}</div>
      <div data-testid="sidebar-hidden">{JSON.stringify(hiddenKeys)}</div>
    </div>
  ),
  useAuthSession: () => ({
    currentUser: { id: '1', name: 'Test User' },
    role: 'admin'
  })
}))

vi.mock('@/features/shared', () => ({
  LayoutPageHeader: ({ pageTitle, pageIcon, headerActions, showPageHeader }) => (
    <div data-testid="layout-page-header" data-show-page-header={showPageHeader}>
      <div data-testid="page-title">{pageTitle}</div>
      <div data-testid="page-icon">{pageIcon}</div>
      <div data-testid="header-actions">{JSON.stringify(headerActions)}</div>
      <div data-testid="show-page-header">{showPageHeader ? 'true' : 'false'}</div>
    </div>
  )
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

describe('AdminLayout', () => {
  const mockChildren = <div data-testid="test-children">Test Content</div>

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders children content', () => {
    renderWithProviders(
      <AdminLayout>{mockChildren}</AdminLayout>
    )

    expect(screen.getByTestId('test-children')).toBeInTheDocument()
    expect(screen.getByText('Test Content')).toBeInTheDocument()
  })

  it('renders sidebar by default', () => {
    renderWithProviders(
      <AdminLayout>{mockChildren}</AdminLayout>
    )

    expect(screen.getByTestId('app-sidebar')).toBeInTheDocument()
  })

  it('hides sidebar when hideSidebar prop is true', () => {
    renderWithProviders(
      <AdminLayout hideSidebar={true}>{mockChildren}</AdminLayout>
    )

    expect(screen.queryByTestId('app-sidebar')).not.toBeInTheDocument()
  })

  it('passes sidebar overrides correctly', () => {
    const overrides = { key1: 'value1' }
    renderWithProviders(
      <AdminLayout sidebarOverrides={overrides}>{mockChildren}</AdminLayout>
    )

    expect(screen.getByTestId('sidebar-overrides')).toHaveTextContent(JSON.stringify(overrides))
  })

  it('passes hidden sidebar keys correctly', () => {
    const hiddenKeys = ['key1', 'key2']
    renderWithProviders(
      <AdminLayout hiddenSidebarKeys={hiddenKeys}>{mockChildren}</AdminLayout>
    )

    expect(screen.getByTestId('sidebar-hidden')).toHaveTextContent(JSON.stringify(hiddenKeys))
  })

  it('renders page header by default', () => {
    renderWithProviders(
      <AdminLayout pageTitle="Test Page">{mockChildren}</AdminLayout>
    )

    expect(screen.getByTestId('layout-page-header')).toBeInTheDocument()
  })

  it('hides page header when showPageHeader is false', () => {
    renderWithProviders(
      <AdminLayout showPageHeader={false} pageTitle="Test Page">{mockChildren}</AdminLayout>
    )

    expect(screen.getByTestId('layout-page-header')).toBeInTheDocument()
    expect(screen.getByTestId('show-page-header')).toHaveTextContent('false')
  })

  it('passes page title to header', () => {
    const pageTitle = "Admin Dashboard"
    renderWithProviders(
      <AdminLayout pageTitle={pageTitle}>{mockChildren}</AdminLayout>
    )

    expect(screen.getByTestId('page-title')).toHaveTextContent(pageTitle)
  })

  it('passes page icon to header', () => {
    const pageIcon = "dashboard"
    renderWithProviders(
      <AdminLayout pageIcon={pageIcon}>{mockChildren}</AdminLayout>
    )

    expect(screen.getByTestId('page-icon')).toHaveTextContent(pageIcon)
  })

  it('passes header actions to header', () => {
    const headerActions = [<button key="1">Action 1</button>, <button key="2">Action 2</button>]
    renderWithProviders(
      <AdminLayout headerActions={headerActions}>{mockChildren}</AdminLayout>
    )

    expect(screen.getByTestId('header-actions')).toBeInTheDocument()
  })

  it('renders without page title', () => {
    renderWithProviders(
      <AdminLayout>{mockChildren}</AdminLayout>
    )

    expect(screen.getByTestId('layout-page-header')).toBeInTheDocument()
    expect(screen.getByTestId('page-title')).toHaveTextContent('')
  })

  it('renders without page icon', () => {
    renderWithProviders(
      <AdminLayout pageTitle="Test">{mockChildren}</AdminLayout>
    )

    expect(screen.getByTestId('page-icon')).toHaveTextContent('')
  })

  it('renders without header actions', () => {
    renderWithProviders(
      <AdminLayout pageTitle="Test">{mockChildren}</AdminLayout>
    )

    expect(screen.getByTestId('header-actions')).toHaveTextContent('')
  })

  it('renders with all props configured', () => {
    const props = {
      pageTitle: "Full Test Page",
      pageIcon: "test-icon",
      headerActions: [<button key="1">Test Action</button>],
      sidebarOverrides: { test: 'override' },
      hiddenSidebarKeys: ['hidden'],
      hideSidebar: false,
      showPageHeader: true
    }

    renderWithProviders(
      <AdminLayout {...props}>{mockChildren}</AdminLayout>
    )

    expect(screen.getByTestId('test-children')).toBeInTheDocument()
    expect(screen.getByTestId('app-sidebar')).toBeInTheDocument()
    expect(screen.getByTestId('layout-page-header')).toBeInTheDocument()
    expect(screen.getByTestId('page-title')).toHaveTextContent(props.pageTitle)
    expect(screen.getByTestId('page-icon')).toHaveTextContent(props.pageIcon)
    expect(screen.getByTestId('sidebar-overrides')).toHaveTextContent(JSON.stringify(props.sidebarOverrides))
    expect(screen.getByTestId('sidebar-hidden')).toHaveTextContent(JSON.stringify(props.hiddenSidebarKeys))
  })

  it('renders layout structure correctly', () => {
    renderWithProviders(
      <AdminLayout pageTitle="Structure Test">{mockChildren}</AdminLayout>
    )

    // Check that main layout elements exist
    expect(screen.getByTestId('app-sidebar')).toBeInTheDocument()
    expect(screen.getByTestId('layout-page-header')).toBeInTheDocument()
    expect(screen.getByTestId('test-children')).toBeInTheDocument()
  })

  it('handles empty children gracefully', () => {
    renderWithProviders(
      <AdminLayout />
    )

    expect(screen.getByTestId('app-sidebar')).toBeInTheDocument()
    expect(screen.getByTestId('layout-page-header')).toBeInTheDocument()
  })

  it('handles null children gracefully', () => {
    renderWithProviders(
      <AdminLayout>{null}</AdminLayout>
    )

    expect(screen.getByTestId('app-sidebar')).toBeInTheDocument()
    expect(screen.getByTestId('layout-page-header')).toBeInTheDocument()
  })

  it('renders with complex children', () => {
    const complexChildren = (
      <div>
        <h1>Complex Content</h1>
        <p>This is a test paragraph</p>
        <button>Test Button</button>
      </div>
    )

    renderWithProviders(
      <AdminLayout>{complexChildren}</AdminLayout>
    )

    expect(screen.getByText('Complex Content')).toBeInTheDocument()
    expect(screen.getByText('This is a test paragraph')).toBeInTheDocument()
    expect(screen.getByText('Test Button')).toBeInTheDocument()
  })
})
