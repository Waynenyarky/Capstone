import { render, screen } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import CompactListCard from '../CompactListCard.jsx'

describe('CompactListCard', () => {
  const mockItems = [
    { key: '1', label: 'First item' },
    { key: '2', label: 'Second item' },
  ]

  it('renders title with icon', () => {
    render(
      <BrowserRouter>
        <CompactListCard
          icon={() => <span data-testid="icon">Icon</span>}
          title="Test Title"
          items={mockItems}
          viewAllLabel="View all"
          viewAllTo="/test"
        />
      </BrowserRouter>
    )

    expect(screen.getByText('Test Title')).toBeInTheDocument()
    expect(screen.getByTestId('icon')).toBeInTheDocument()
  })

  it('renders 2 preview items', () => {
    render(
      <BrowserRouter>
        <CompactListCard
          title="Test"
          items={mockItems}
          viewAllLabel="View all"
          viewAllTo="/test"
        />
      </BrowserRouter>
    )

    expect(screen.getByText('First item')).toBeInTheDocument()
    expect(screen.getByText('Second item')).toBeInTheDocument()
  })

  it('renders view-all link', () => {
    render(
      <BrowserRouter>
        <CompactListCard
          title="Test"
          items={mockItems}
          viewAllLabel="View all 5 items →"
          viewAllTo="/test"
        />
      </BrowserRouter>
    )

    expect(screen.getByText('View all 5 items →')).toBeInTheDocument()
  })

  it('shows empty message when no items', () => {
    render(
      <BrowserRouter>
        <CompactListCard
          title="Test"
          items={[]}
          viewAllLabel="View all"
          viewAllTo="/test"
          emptyMessage="No items found"
        />
      </BrowserRouter>
    )

    expect(screen.getByText('No items found')).toBeInTheDocument()
  })

  it('shows skeleton when loading', () => {
    render(
      <BrowserRouter>
        <CompactListCard
          title="Test"
          items={mockItems}
          viewAllLabel="View all"
          viewAllTo="/test"
          loading={true}
        />
      </BrowserRouter>
    )

    expect(document.querySelector('.ant-skeleton')).toBeInTheDocument()
  })

  it('limits items to 2 preview rows', () => {
    const manyItems = [
      { key: '1', label: 'Item 1' },
      { key: '2', label: 'Item 2' },
      { key: '3', label: 'Item 3' },
      { key: '4', label: 'Item 4' },
    ]

    render(
      <BrowserRouter>
        <CompactListCard
          title="Test"
          items={manyItems}
          viewAllLabel="View all"
          viewAllTo="/test"
        />
      </BrowserRouter>
    )

    expect(screen.getByText('Item 1')).toBeInTheDocument()
    expect(screen.getByText('Item 2')).toBeInTheDocument()
    expect(screen.queryByText('Item 3')).not.toBeInTheDocument()
    expect(screen.queryByText('Item 4')).not.toBeInTheDocument()
  })
})
