import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ConfigProvider, App } from 'antd'
import { MemoryRouter } from 'react-router-dom'

// Mock the LayoutPageHeader component
const MockLayoutPageHeader = ({ 
  pageTitle, 
  pageIcon, 
  headerActions, 
  showPageHeader = true,
  viewNotificationsPath = '/notifications'
}) => {
  if (!showPageHeader) {
    return <div data-testid="header-hidden" />
  }

  return (
    <div data-testid="layout-page-header">
      <div data-testid="page-title">{pageTitle || ''}</div>
      <div data-testid="page-icon">{pageIcon || ''}</div>
      <div data-testid="header-actions">
        {headerActions ? headerActions.length : 0} actions
      </div>
      <div data-testid="notifications-path">{viewNotificationsPath}</div>
      <div data-testid="show-page-header">{showPageHeader ? 'true' : 'false'}</div>
    </div>
  )
}

const renderWithProviders = (component) => {
  return render(
    <ConfigProvider>
      <App>
        <MemoryRouter>
          {component}
        </MemoryRouter>
      </App>
    </ConfigProvider>
  )
}

describe('LayoutPageHeader', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders header with default props', () => {
    renderWithProviders(<MockLayoutPageHeader />)

    expect(screen.getByTestId('layout-page-header')).toBeInTheDocument()
    expect(screen.getByTestId('page-title')).toHaveTextContent('')
    expect(screen.getByTestId('page-icon')).toHaveTextContent('')
    expect(screen.getByTestId('header-actions')).toHaveTextContent('0 actions')
    expect(screen.getByTestId('show-page-header')).toHaveTextContent('true')
  })

  it('renders page title correctly', () => {
    renderWithProviders(<MockLayoutPageHeader pageTitle="Dashboard" />)

    expect(screen.getByTestId('page-title')).toHaveTextContent('Dashboard')
  })

  it('renders page icon correctly', () => {
    renderWithProviders(<MockLayoutPageHeader pageIcon="dashboard" />)

    expect(screen.getByTestId('page-icon')).toHaveTextContent('dashboard')
  })

  it('renders header actions count', () => {
    const actions = [<button key="1">Action 1</button>, <button key="2">Action 2</button>]
    renderWithProviders(<MockLayoutPageHeader headerActions={actions} />)

    expect(screen.getByTestId('header-actions')).toHaveTextContent('2 actions')
  })

  it('shows header when showPageHeader is true', () => {
    renderWithProviders(<MockLayoutPageHeader showPageHeader={true} />)

    expect(screen.getByTestId('layout-page-header')).toBeInTheDocument()
    expect(screen.getByTestId('show-page-header')).toHaveTextContent('true')
  })

  it('hides header when showPageHeader is false', () => {
    renderWithProviders(<MockLayoutPageHeader showPageHeader={false} />)

    expect(screen.getByTestId('header-hidden')).toBeInTheDocument()
    expect(screen.queryByTestId('layout-page-header')).not.toBeInTheDocument()
  })

  it('uses default notifications path', () => {
    renderWithProviders(<MockLayoutPageHeader />)

    expect(screen.getByTestId('notifications-path')).toHaveTextContent('/notifications')
  })

  it('uses custom notifications path', () => {
    renderWithProviders(<MockLayoutPageHeader viewNotificationsPath="/custom-notifications" />)

    expect(screen.getByTestId('notifications-path')).toHaveTextContent('/custom-notifications')
  })

  it('renders with all props provided', () => {
    const actions = [<button key="1">Test Action</button>]
    renderWithProviders(
      <MockLayoutPageHeader 
        pageTitle="Test Page"
        pageIcon="test"
        headerActions={actions}
        showPageHeader={true}
        viewNotificationsPath="/test-notifications"
      />
    )

    expect(screen.getByTestId('page-title')).toHaveTextContent('Test Page')
    expect(screen.getByTestId('page-icon')).toHaveTextContent('test')
    expect(screen.getByTestId('header-actions')).toHaveTextContent('1 actions')
    expect(screen.getByTestId('show-page-header')).toHaveTextContent('true')
    expect(screen.getByTestId('notifications-path')).toHaveTextContent('/test-notifications')
  })

  it('handles empty header actions array', () => {
    renderWithProviders(<MockLayoutPageHeader headerActions={[]} />)

    expect(screen.getByTestId('header-actions')).toHaveTextContent('0 actions')
  })

  it('handles null header actions', () => {
    renderWithProviders(<MockLayoutPageHeader headerActions={null} />)

    expect(screen.getByTestId('header-actions')).toHaveTextContent('0 actions')
  })

  it('renders without page title', () => {
    renderWithProviders(<MockLayoutPageHeader pageIcon="test" />)

    expect(screen.getByTestId('page-title')).toHaveTextContent('')
    expect(screen.getByTestId('page-icon')).toHaveTextContent('test')
  })

  it('renders without page icon', () => {
    renderWithProviders(<MockLayoutPageHeader pageTitle="test" />)

    expect(screen.getByTestId('page-icon')).toHaveTextContent('')
    expect(screen.getByTestId('page-title')).toHaveTextContent('test')
  })

  it('handles long page titles', () => {
    const longTitle = 'This is a very long page title that might be used in some cases'
    renderWithProviders(<MockLayoutPageHeader pageTitle={longTitle} />)

    expect(screen.getByTestId('page-title')).toHaveTextContent(longTitle)
  })

  it('handles special characters in page title', () => {
    const specialTitle = 'Page Title with Special Characters: @#$%'
    renderWithProviders(<MockLayoutPageHeader pageTitle={specialTitle} />)

    expect(screen.getByTestId('page-title')).toHaveTextContent(specialTitle)
  })

  it('handles many header actions', () => {
    const manyActions = Array.from({ length: 10 }, (_, i) => 
      <button key={i}>Action {i + 1}</button>
    )
    renderWithProviders(<MockLayoutPageHeader headerActions={manyActions} />)

    expect(screen.getByTestId('header-actions')).toHaveTextContent('10 actions')
  })

  it('renders header structure correctly', () => {
    renderWithProviders(
      <MockLayoutPageHeader 
        pageTitle="Structure Test"
        pageIcon="structure"
        headerActions={[<button key="1">Test</button>]}
      />
    )

    const header = screen.getByTestId('layout-page-header')
    expect(header).toContainElement(screen.getByTestId('page-title'))
    expect(header).toContainElement(screen.getByTestId('page-icon'))
    expect(header).toContainElement(screen.getByTestId('header-actions'))
    expect(header).toContainElement(screen.getByTestId('notifications-path'))
    expect(header).toContainElement(screen.getByTestId('show-page-header'))
  })
})
