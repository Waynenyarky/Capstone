import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { ConfigProvider, theme } from 'antd'
import MaintenanceFilterPanel from '../MaintenanceFilterPanel.jsx'

const mockToken = {
  colorTextQuaternary: '#bfbfbf',
  colorBorder: '#d9d9d9',
  colorPrimary: '#1677ff',
  colorBgContainer: '#ffffff',
}

const renderWithConfig = (ui) => {
  return render(
    <ConfigProvider theme={{ token: mockToken }}>
      {ui}
    </ConfigProvider>
  )
}

describe('MaintenanceFilterPanel', () => {
  const defaultProps = {
    searchValue: '',
    onSearchChange: vi.fn(),
    statusFilter: null,
    onStatusChange: vi.fn(),
    reasonFilter: null,
    onReasonChange: vi.fn(),
    showAllRequests: false,
    onToggleShowAll: vi.fn(),
    filterOpen: false,
    onToggleFilter: vi.fn(),
    onClearFilters: vi.fn(),
    activeFilterCount: 0,
    onExport: vi.fn(),
    exportDisabled: false,
    token: mockToken,
  }

  it('renders search input', () => {
    renderWithConfig(<MaintenanceFilterPanel {...defaultProps} />)

    const searchInput = screen.getByPlaceholderText(/search by requester/i)
    expect(searchInput).toBeInTheDocument()
  })

  it('renders filter button', () => {
    renderWithConfig(<MaintenanceFilterPanel {...defaultProps} />)

    const filterButton = screen.getByRole('button', { name: /filter/i })
    expect(filterButton).toBeInTheDocument()
  })

  it('renders export button', () => {
    renderWithConfig(<MaintenanceFilterPanel {...defaultProps} />)

    const exportButton = screen.getByRole('button', { name: /download/i })
    expect(exportButton).toBeInTheDocument()
  })

  it('calls onSearchChange when typing in search', () => {
    const onSearchChange = vi.fn()
    renderWithConfig(<MaintenanceFilterPanel {...defaultProps} onSearchChange={onSearchChange} />)

    const searchInput = screen.getByPlaceholderText(/search by requester/i)
    fireEvent.change(searchInput, { target: { value: 'test' } })

    expect(onSearchChange).toHaveBeenCalledWith('test')
  })

  it('calls onToggleFilter when filter button clicked', () => {
    const onToggleFilter = vi.fn()
    renderWithConfig(<MaintenanceFilterPanel {...defaultProps} onToggleFilter={onToggleFilter} />)

    const filterButton = screen.getByRole('button', { name: /filter/i })
    fireEvent.click(filterButton)

    expect(onToggleFilter).toHaveBeenCalled()
  })

  it('calls onExport when export button clicked', () => {
    const onExport = vi.fn()
    renderWithConfig(<MaintenanceFilterPanel {...defaultProps} onExport={onExport} />)

    const exportButton = screen.getByRole('button', { name: /download/i })
    fireEvent.click(exportButton)

    expect(onExport).toHaveBeenCalled()
  })

  it('disables export button when exportDisabled is true', () => {
    renderWithConfig(<MaintenanceFilterPanel {...defaultProps} exportDisabled={true} />)

    const exportButton = screen.getByRole('button', { name: /download/i })
    expect(exportButton).toBeDisabled()
  })

  it('shows filter dropdown when filterOpen is true', () => {
    renderWithConfig(<MaintenanceFilterPanel {...defaultProps} filterOpen={true} />)

    const statusElements = screen.getAllByText(/status/i)
    const reasonElements = screen.getAllByText(/reason/i)
    expect(statusElements.length).toBeGreaterThan(0)
    expect(reasonElements.length).toBeGreaterThan(0)
  })

  it('does not show filter dropdown when filterOpen is false', () => {
    renderWithConfig(<MaintenanceFilterPanel {...defaultProps} filterOpen={false} />)

    const statusElements = screen.queryAllByText(/status/i)
    const reasonElements = screen.queryAllByText(/reason/i)
    expect(statusElements.length).toBe(0)
    expect(reasonElements.length).toBe(0)
  })

  it('calls onStatusChange when status filter changes', () => {
    const onStatusChange = vi.fn()
    renderWithConfig(<MaintenanceFilterPanel {...defaultProps} filterOpen={true} onStatusChange={onStatusChange} />)

    const statusElements = screen.getAllByText(/status/i)
    expect(statusElements.length).toBeGreaterThan(0)
  })

  it('calls onReasonChange when reason filter changes', () => {
    const onReasonChange = vi.fn()
    renderWithConfig(<MaintenanceFilterPanel {...defaultProps} filterOpen={true} onReasonChange={onReasonChange} />)

    const reasonElements = screen.getAllByText(/reason/i)
    expect(reasonElements.length).toBeGreaterThan(0)
  })

  it('calls onToggleShowAll when toggle button clicked', () => {
    const onToggleShowAll = vi.fn()
    renderWithConfig(<MaintenanceFilterPanel {...defaultProps} filterOpen={true} onToggleShowAll={onToggleShowAll} />)

    const toggleButton = screen.getByRole('button', { name: /show all/i })
    fireEvent.click(toggleButton)

    expect(onToggleShowAll).toHaveBeenCalled()
  })

  it('calls onClearFilters when clear button clicked', () => {
    const onClearFilters = vi.fn()
    renderWithConfig(<MaintenanceFilterPanel {...defaultProps} filterOpen={true} activeFilterCount={2} onClearFilters={onClearFilters} />)

    const clearButton = screen.getByRole('button', { name: /clear all filters/i })
    fireEvent.click(clearButton)

    expect(onClearFilters).toHaveBeenCalled()
  })

  it('does not show clear button when no active filters', () => {
    renderWithConfig(<MaintenanceFilterPanel {...defaultProps} filterOpen={true} activeFilterCount={0} />)

    expect(screen.queryByText(/clear all filters/i)).not.toBeInTheDocument()
  })
})
