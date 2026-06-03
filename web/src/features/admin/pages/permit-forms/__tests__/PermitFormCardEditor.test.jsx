import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { ConfigProvider, Modal } from 'antd'
import PermitFormCardEditor from '../components/PermitFormCardEditor.jsx'

vi.mock('@/features/admin/services/permitFormsService', () => ({
  uploadPermitFormFile: vi.fn(),
}))

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

const mockCard = {
  cardId: 'card-1',
  title: 'Business Permit',
  description: 'Required for all businesses',
  requirements: ['DTI Registration', 'Barangay Clearance'],
  downloadableFile: { cid: '', fileName: '', size: 0 },
  order: 0,
}

describe('PermitFormCardEditor', () => {
  const defaultProps = {
    card: mockCard,
    onUpdate: vi.fn(),
    onDelete: vi.fn(),
    token: mockToken,
  }

  it('renders card title in header', () => {
    renderWithConfig(<PermitFormCardEditor {...defaultProps} />)
    expect(screen.getByText('Business Permit')).toBeInTheDocument()
  })

  it('renders title input with current value', () => {
    renderWithConfig(<PermitFormCardEditor {...defaultProps} />)
    const titleInput = screen.getByDisplayValue('Business Permit')
    expect(titleInput).toBeInTheDocument()
  })

  it('renders description textarea with current value', () => {
    renderWithConfig(<PermitFormCardEditor {...defaultProps} />)
    const descInput = screen.getByDisplayValue('Required for all businesses')
    expect(descInput).toBeInTheDocument()
  })

  it('renders requirement inputs', () => {
    renderWithConfig(<PermitFormCardEditor {...defaultProps} />)
    expect(screen.getByDisplayValue('DTI Registration')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Barangay Clearance')).toBeInTheDocument()
  })

  it('calls onUpdate when title changes', () => {
    renderWithConfig(<PermitFormCardEditor {...defaultProps} />)
    const titleInput = screen.getByDisplayValue('Business Permit')
    fireEvent.change(titleInput, { target: { value: 'Updated Title' } })
    expect(defaultProps.onUpdate).toHaveBeenCalledWith('card-1', { title: 'Updated Title' })
  })

  it('calls onUpdate when description changes', () => {
    renderWithConfig(<PermitFormCardEditor {...defaultProps} />)
    const descInput = screen.getByDisplayValue('Required for all businesses')
    fireEvent.change(descInput, { target: { value: 'Updated desc' } })
    expect(defaultProps.onUpdate).toHaveBeenCalledWith('card-1', { description: 'Updated desc' })
  })

  it('calls onUpdate when requirement changes', () => {
    renderWithConfig(<PermitFormCardEditor {...defaultProps} />)
    const reqInput = screen.getByDisplayValue('DTI Registration')
    fireEvent.change(reqInput, { target: { value: 'Updated Req' } })
    expect(defaultProps.onUpdate).toHaveBeenCalledWith('card-1', {
      requirements: ['Updated Req', 'Barangay Clearance'],
    })
  })

  it('renders add requirement button', () => {
    renderWithConfig(<PermitFormCardEditor {...defaultProps} />)
    expect(screen.getByText('Add Requirement')).toBeInTheDocument()
  })

  it('calls onUpdate with new requirement when add button clicked', () => {
    renderWithConfig(<PermitFormCardEditor {...defaultProps} />)
    fireEvent.click(screen.getByText('Add Requirement'))
    expect(defaultProps.onUpdate).toHaveBeenCalledWith('card-1', {
      requirements: ['DTI Registration', 'Barangay Clearance', ''],
    })
  })

  it('renders delete card button', () => {
    renderWithConfig(<PermitFormCardEditor {...defaultProps} />)
    const deleteBtn = screen.getByRole('button', { name: /delete/i })
    expect(deleteBtn).toBeInTheDocument()
  })

  it('calls onDelete when delete button clicked', () => {
    const confirmSpy = vi.spyOn(Modal, 'confirm').mockImplementation(({ onOk }) => onOk?.())

    renderWithConfig(<PermitFormCardEditor {...defaultProps} />)
    const deleteBtn = screen.getByRole('button', { name: /delete/i })
    fireEvent.click(deleteBtn)
    expect(defaultProps.onDelete).toHaveBeenCalledWith('card-1')

    confirmSpy.mockRestore()
  })

  it('renders empty requirements message when no requirements', () => {
    const cardNoReqs = { ...mockCard, requirements: [] }
    renderWithConfig(<PermitFormCardEditor {...defaultProps} card={cardNoReqs} />)
    expect(screen.getByText(/No requirements added yet/)).toBeInTheDocument()
  })

  it('renders upload button when no file attached', () => {
    renderWithConfig(<PermitFormCardEditor {...defaultProps} />)
    expect(screen.getByText('Upload PDF')).toBeInTheDocument()
  })

  it('renders file info when file is attached', () => {
    const cardWithFile = {
      ...mockCard,
      downloadableFile: { cid: 'QmTest123', fileName: 'form.pdf', size: 1024 },
    }
    renderWithConfig(<PermitFormCardEditor {...defaultProps} card={cardWithFile} />)
    expect(screen.getByText('form.pdf')).toBeInTheDocument()
  })
})
