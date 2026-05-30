import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { ConfigProvider } from 'antd'
import PermitFormsEditor from '../components/PermitFormsEditor.jsx'

const mockToken = {
  colorBorderSecondary: '#f0f0f0',
  colorBgContainer: '#ffffff',
  colorTextQuaternary: '#bfbfbf',
  colorPrimary: '#1677ff',
}

const renderWithConfig = (ui) => {
  return render(
    <ConfigProvider theme={{ token: mockToken }}>
      {ui}
    </ConfigProvider>
  )
}

const mockCards = [
  {
    cardId: 'card-1',
    title: 'Business Permit',
    description: 'Required for all businesses',
    requirements: ['DTI Registration', 'Barangay Clearance'],
    downloadableFile: { cid: '', fileName: '', size: 0 },
    order: 0,
  },
  {
    cardId: 'card-2',
    title: 'Occupational Permit',
    description: 'Required for employees',
    requirements: ['Valid ID'],
    downloadableFile: { cid: '', fileName: '', size: 0 },
    order: 1,
  },
]

describe('PermitFormsEditor', () => {
  const defaultProps = {
    cards: mockCards,
    sectionDescription: 'Test description',
    onUpdateCards: vi.fn(),
    onUpdateDescription: vi.fn(),
    onUpdateCard: vi.fn(),
    onDeleteCard: vi.fn(),
    token: mockToken,
  }

  it('renders section description textarea', () => {
    renderWithConfig(<PermitFormsEditor {...defaultProps} />)
    const textarea = screen.getByDisplayValue('Test description')
    expect(textarea).toBeInTheDocument()
  })

  it('renders all cards', () => {
    renderWithConfig(<PermitFormsEditor {...defaultProps} />)
    expect(screen.getByText('Business Permit')).toBeInTheDocument()
    expect(screen.getByText('Occupational Permit')).toBeInTheDocument()
  })

  it('renders empty state when no cards', () => {
    renderWithConfig(<PermitFormsEditor {...defaultProps} cards={[]} />)
    expect(screen.getByText(/No permit form cards yet/)).toBeInTheDocument()
  })

  it('renders reordering arrows for each card', () => {
    renderWithConfig(<PermitFormsEditor {...defaultProps} />)
    // Each card gets an up and down arrow button
    const allButtons = screen.getAllByRole('button')
    // At least 2 arrow-up and 2 arrow-down buttons (plus delete buttons)
    expect(allButtons.length).toBeGreaterThanOrEqual(4)
  })

  it('calls onUpdateDescription when section description changes', () => {
    renderWithConfig(<PermitFormsEditor {...defaultProps} />)
    const textarea = screen.getByDisplayValue('Test description')
    fireEvent.change(textarea, { target: { value: 'Updated description' } })
    expect(defaultProps.onUpdateDescription).toHaveBeenCalledWith('Updated description')
  })
})
