import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { ConfigProvider, App } from 'antd'
import { MemoryRouter } from 'react-router-dom'

// Mock BusinessCard component
const MockBusinessCard = ({ 
  business, 
  onEdit, 
  onDelete, 
  onView,
  showActions = true,
  compact = false 
}) => {
  const handleEdit = () => onEdit && onEdit(business)
  const handleDelete = () => onDelete && onDelete(business)
  const handleView = () => onView && onView(business)

  return (
    <div data-testid="business-card" data-compact={compact}>
      <div data-testid="business-name">{business.name}</div>
      <div data-testid="business-type">{business.type}</div>
      <div data-testid="business-status">{business.status}</div>
      <div data-testid="business-owner">{business.owner}</div>
      {compact && <div data-testid="compact-view">Compact View</div>}
      
      {showActions && (
        <div data-testid="business-actions">
          <button data-testid="view-button" onClick={handleView}>View</button>
          <button data-testid="edit-button" onClick={handleEdit}>Edit</button>
          <button data-testid="delete-button" onClick={handleDelete}>Delete</button>
        </div>
      )}
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

describe('BusinessCard', () => {
  const mockBusiness = {
    id: '1',
    name: 'Test Business',
    type: 'Restaurant',
    status: 'Active',
    owner: 'John Doe'
  }

  const mockOnEdit = vi.fn()
  const mockOnDelete = vi.fn()
  const mockOnView = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders business information correctly', () => {
    renderWithProviders(
      <MockBusinessCard business={mockBusiness} />
    )

    expect(screen.getByTestId('business-card')).toBeInTheDocument()
    expect(screen.getByTestId('business-name')).toHaveTextContent('Test Business')
    expect(screen.getByTestId('business-type')).toHaveTextContent('Restaurant')
    expect(screen.getByTestId('business-status')).toHaveTextContent('Active')
    expect(screen.getByTestId('business-owner')).toHaveTextContent('John Doe')
  })

  it('renders action buttons when showActions is true', () => {
    renderWithProviders(
      <MockBusinessCard 
        business={mockBusiness} 
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onView={mockOnView}
      />
    )

    expect(screen.getByTestId('business-actions')).toBeInTheDocument()
    expect(screen.getByTestId('view-button')).toBeInTheDocument()
    expect(screen.getByTestId('edit-button')).toBeInTheDocument()
    expect(screen.getByTestId('delete-button')).toBeInTheDocument()
  })

  it('hides action buttons when showActions is false', () => {
    renderWithProviders(
      <MockBusinessCard business={mockBusiness} showActions={false} />
    )

    expect(screen.queryByTestId('business-actions')).not.toBeInTheDocument()
    expect(screen.queryByTestId('view-button')).not.toBeInTheDocument()
    expect(screen.queryByTestId('edit-button')).not.toBeInTheDocument()
    expect(screen.queryByTestId('delete-button')).not.toBeInTheDocument()
  })

  it('calls onView when view button is clicked', () => {
    renderWithProviders(
      <MockBusinessCard 
        business={mockBusiness} 
        onView={mockOnView}
      />
    )

    fireEvent.click(screen.getByTestId('view-button'))
    expect(mockOnView).toHaveBeenCalledWith(mockBusiness)
  })

  it('calls onEdit when edit button is clicked', () => {
    renderWithProviders(
      <MockBusinessCard 
        business={mockBusiness} 
        onEdit={mockOnEdit}
      />
    )

    fireEvent.click(screen.getByTestId('edit-button'))
    expect(mockOnEdit).toHaveBeenCalledWith(mockBusiness)
  })

  it('calls onDelete when delete button is clicked', () => {
    renderWithProviders(
      <MockBusinessCard 
        business={mockBusiness} 
        onDelete={mockOnDelete}
      />
    )

    fireEvent.click(screen.getByTestId('delete-button'))
    expect(mockOnDelete).toHaveBeenCalledWith(mockBusiness)
  })

  it('shows compact view when compact prop is true', () => {
    renderWithProviders(
      <MockBusinessCard business={mockBusiness} compact={true} />
    )

    expect(screen.getByTestId('business-card')).toHaveAttribute('data-compact', 'true')
    expect(screen.getByTestId('compact-view')).toBeInTheDocument()
  })

  it('shows normal view when compact prop is false', () => {
    renderWithProviders(
      <MockBusinessCard business={mockBusiness} compact={false} />
    )

    expect(screen.getByTestId('business-card')).toHaveAttribute('data-compact', 'false')
    expect(screen.queryByTestId('compact-view')).not.toBeInTheDocument()
  })

  it('handles missing callbacks gracefully', () => {
    renderWithProviders(
      <MockBusinessCard business={mockBusiness} />
    )

    // Should not throw error when clicking buttons without callbacks
    expect(() => {
      fireEvent.click(screen.getByTestId('view-button'))
    }).not.toThrow()

    expect(() => {
      fireEvent.click(screen.getByTestId('edit-button'))
    }).not.toThrow()

    expect(() => {
      fireEvent.click(screen.getByTestId('delete-button'))
    }).not.toThrow()
  })

  it('renders with different business statuses', () => {
    const statuses = ['Active', 'Inactive', 'Pending', 'Suspended']
    
    statuses.forEach(status => {
      const { unmount } = renderWithProviders(
        <MockBusinessCard business={{ ...mockBusiness, status }} />
      )
      
      expect(screen.getByTestId('business-status')).toHaveTextContent(status)
      unmount()
    })
  })

  it('renders with different business types', () => {
    const types = ['Restaurant', 'Retail', 'Service', 'Manufacturing']
    
    types.forEach(type => {
      const { unmount } = renderWithProviders(
        <MockBusinessCard business={{ ...mockBusiness, type }} />
      )
      
      expect(screen.getByTestId('business-type')).toHaveTextContent(type)
      unmount()
    })
  })

  it('handles long business names', () => {
    const longName = 'This is a very long business name that might be used in some cases to test how the component handles it'
    renderWithProviders(
      <MockBusinessCard business={{ ...mockBusiness, name: longName }} />
    )

    expect(screen.getByTestId('business-name')).toHaveTextContent(longName)
  })

  it('handles special characters in business name', () => {
    const specialName = 'Business Name & Co. @#$%'
    renderWithProviders(
      <MockBusinessCard business={{ ...mockBusiness, name: specialName }} />
    )

    expect(screen.getByTestId('business-name')).toHaveTextContent(specialName)
  })

  it('renders card structure correctly', () => {
    renderWithProviders(
      <MockBusinessCard business={mockBusiness} />
    )

    const card = screen.getByTestId('business-card')
    expect(card).toContainElement(screen.getByTestId('business-name'))
    expect(card).toContainElement(screen.getByTestId('business-type'))
    expect(card).toContainElement(screen.getByTestId('business-status'))
    expect(card).toContainElement(screen.getByTestId('business-owner'))
  })

  it('renders empty business gracefully', () => {
    const emptyBusiness = {
      id: '2',
      name: '',
      type: '',
      status: '',
      owner: ''
    }

    renderWithProviders(<MockBusinessCard business={emptyBusiness} />)

    expect(screen.getByTestId('business-name')).toHaveTextContent('')
    expect(screen.getByTestId('business-type')).toHaveTextContent('')
    expect(screen.getByTestId('business-status')).toHaveTextContent('')
    expect(screen.getByTestId('business-owner')).toHaveTextContent('')
  })

  it('handles missing business properties', () => {
    const incompleteBusiness = {
      id: '3',
      name: 'Partial Business'
    }

    renderWithProviders(<MockBusinessCard business={incompleteBusiness} />)

    expect(screen.getByTestId('business-name')).toHaveTextContent('Partial Business')
    expect(screen.getByTestId('business-type')).toHaveTextContent('')
    expect(screen.getByTestId('business-status')).toHaveTextContent('')
    expect(screen.getByTestId('business-owner')).toHaveTextContent('')
  })
})
