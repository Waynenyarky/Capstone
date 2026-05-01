import React from 'react'
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ConfigProvider } from 'antd'
import MaintenanceOverviewCards from '../MaintenanceOverviewCards.jsx'

const mockToken = {
  colorSuccess: '#52c41a',
  colorWarning: '#faad14',
  colorError: '#ff4d4f',
  colorInfo: '#1677ff',
  colorTextSecondary: '#8c8c8c',
  colorBorderSecondary: '#f0f0f0',
  colorFillTertiary: '#f5f5f5',
  colorPrimary: '#1677ff',
  borderRadius: 8,
}

const renderWithConfig = (ui) => {
  return render(
    <ConfigProvider theme={{ token: mockToken }}>
      {ui}
    </ConfigProvider>
  )
}

describe('MaintenanceOverviewCards', () => {
  const mockServices = [
    { name: 'Auth', status: 'healthy' },
    { name: 'Business', status: 'unhealthy' },
    { name: 'Admin', status: 'healthy' }
  ]

  const mockDependencies = {
    mongodb: 'connected',
    ipfs: 'connected'
  }

  const mockApprovalStats = {
    pending: 5,
    approved: 10,
    rejected: 2
  }

  const mockCurrent = {
    active: true,
    expectedResumeAt: new Date(Date.now() + 3600000).toISOString()
  }

  const defaultProps = {
    services: mockServices,
    dependencies: mockDependencies,
    approvalStats: mockApprovalStats,
    current: mockCurrent,
    token: mockToken,
  }

  it('renders service status cards', () => {
    renderWithConfig(<MaintenanceOverviewCards {...defaultProps} />)

    expect(screen.getByText(/service status/i)).toBeInTheDocument()
    expect(screen.getByText('Auth')).toBeInTheDocument()
    expect(screen.getByText('Business')).toBeInTheDocument()
    expect(screen.getByText('Admin')).toBeInTheDocument()
  })

  it('renders infrastructure status when dependencies provided', () => {
    renderWithConfig(<MaintenanceOverviewCards {...defaultProps} />)

    expect(screen.getByText(/infrastructure status/i)).toBeInTheDocument()
    expect(screen.getByText('mongodb')).toBeInTheDocument()
    expect(screen.getByText('ipfs')).toBeInTheDocument()
  })

  it('does not render infrastructure status when no dependencies', () => {
    renderWithConfig(<MaintenanceOverviewCards {...defaultProps} dependencies={null} />)

    expect(screen.queryByText(/infrastructure status/i)).not.toBeInTheDocument()
  })

  it('renders maintenance schedule when current provided', () => {
    renderWithConfig(<MaintenanceOverviewCards {...defaultProps} />)

    expect(screen.getByText(/maintenance schedule/i)).toBeInTheDocument()
    const statusElements = screen.getAllByText(/status/i)
    expect(statusElements.length).toBeGreaterThan(0)
  })

  it('does not render maintenance schedule when no current', () => {
    renderWithConfig(<MaintenanceOverviewCards {...defaultProps} current={null} />)

    expect(screen.queryByText(/maintenance schedule/i)).not.toBeInTheDocument()
  })

  it('renders request statistics', () => {
    renderWithConfig(<MaintenanceOverviewCards {...defaultProps} />)

    expect(screen.getByText(/request statistics/i)).toBeInTheDocument()
    expect(screen.getByText('5')).toBeInTheDocument()
    expect(screen.getByText('10')).toBeInTheDocument()
    expect(screen.getByText('2')).toBeInTheDocument()
  })

  it('shows active status for healthy services', () => {
    renderWithConfig(<MaintenanceOverviewCards {...defaultProps} />)

    const healthyElements = screen.getAllByText('healthy')
    expect(healthyElements.length).toBeGreaterThan(0)
  })

  it('shows correct status tags for services', () => {
    renderWithConfig(<MaintenanceOverviewCards {...defaultProps} />)

    const statusTags = screen.getAllByText('healthy')
    expect(statusTags.length).toBeGreaterThan(0)
  })

  it('shows connected status for dependencies', () => {
    renderWithConfig(<MaintenanceOverviewCards {...defaultProps} />)

    const connectedElements = screen.getAllByText('connected')
    expect(connectedElements.length).toBeGreaterThan(0)
  })

  it('shows Active tag when maintenance is active', () => {
    renderWithConfig(<MaintenanceOverviewCards {...defaultProps} />)

    expect(screen.getByText('Active')).toBeInTheDocument()
  })

  it('shows Inactive tag when maintenance is not active', () => {
    renderWithConfig(<MaintenanceOverviewCards {...defaultProps} current={{ active: false }} />)

    expect(screen.getByText('Inactive')).toBeInTheDocument()
  })

  it('renders resume time when provided', () => {
    renderWithConfig(<MaintenanceOverviewCards {...defaultProps} />)

    expect(screen.getByText(/resumes at/i)).toBeInTheDocument()
  })

  it('does not render resume time when not provided', () => {
    renderWithConfig(<MaintenanceOverviewCards {...defaultProps} current={{ active: true }} />)

    expect(screen.queryByText(/resumes at/i)).not.toBeInTheDocument()
  })
})
