import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { ConfigProvider } from 'antd'
import FileUploadButton from '../components/FileUploadButton.jsx'

vi.mock('@/features/admin/services/permitFormsService', () => ({
  uploadPermitFormFile: vi.fn(),
}))

const mockToken = {
  colorPrimary: '#1677ff',
  colorBorderSecondary: '#f0f0f0',
  colorBgContainer: '#ffffff',
}

const renderWithConfig = (ui) => {
  return render(
    <ConfigProvider theme={{ token: mockToken }}>
      {ui}
    </ConfigProvider>
  )
}

describe('FileUploadButton', () => {
  const defaultProps = {
    value: { cid: '', fileName: '', size: 0 },
    onChange: vi.fn(),
    token: mockToken,
  }

  it('renders upload button when no file', () => {
    renderWithConfig(<FileUploadButton {...defaultProps} />)
    expect(screen.getByText('Upload PDF')).toBeInTheDocument()
  })

  it('renders file info when file is attached', () => {
    const withFile = {
      ...defaultProps,
      value: { cid: 'QmTest123', fileName: 'permit-form.pdf', size: 2048 },
    }
    renderWithConfig(<FileUploadButton {...withFile} />)
    expect(screen.getByText('permit-form.pdf')).toBeInTheDocument()
    expect(screen.getByText('(2.0 KB)')).toBeInTheDocument()
  })

  it('renders preview and remove buttons when file attached', () => {
    const withFile = {
      ...defaultProps,
      value: { cid: 'QmTest123', fileName: 'permit-form.pdf', size: 2048 },
    }
    renderWithConfig(<FileUploadButton {...withFile} />)
    expect(screen.getByText('Preview')).toBeInTheDocument()
    expect(screen.getByText('Remove')).toBeInTheDocument()
  })

  it('calls onChange with empty file data when remove clicked', () => {
    const withFile = {
      ...defaultProps,
      value: { cid: 'QmTest123', fileName: 'permit-form.pdf', size: 2048 },
    }
    renderWithConfig(<FileUploadButton {...withFile} />)
    fireEvent.click(screen.getByText('Remove'))
    expect(defaultProps.onChange).toHaveBeenCalledWith({ cid: '', fileName: '', size: 0 })
  })

  it('opens preview modal when preview clicked', () => {
    const withFile = {
      ...defaultProps,
      value: { cid: 'QmTest123', fileName: 'permit-form.pdf', size: 2048 },
    }
    renderWithConfig(<FileUploadButton {...withFile} />)
    fireEvent.click(screen.getByText('Preview'))
    expect(screen.getByText('permit-form.pdf')).toBeInTheDocument()
  })
})
