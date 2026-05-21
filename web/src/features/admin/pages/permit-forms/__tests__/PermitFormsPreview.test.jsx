import React from 'react'
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ConfigProvider } from 'antd'
import PermitFormsPreview from '../components/PermitFormsPreview.jsx'

const mockToken = {
  colorBorderSecondary: '#f0f0f0',
  colorBgContainer: '#ffffff',
  colorBgLayout: '#f5f5f5',
  borderRadiusLG: 8,
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
    downloadableFile: { cid: 'QmTest123', fileName: 'form.pdf', size: 1024 },
    order: 0,
  },
  {
    cardId: 'card-2',
    title: 'Occupational Permit',
    description: '',
    requirements: [],
    downloadableFile: { cid: '', fileName: '', size: 0 },
    order: 1,
  },
]

describe('PermitFormsPreview', () => {
  it('renders section title', () => {
    renderWithConfig(
      <PermitFormsPreview cards={mockCards} sectionDescription="Test desc" token={mockToken} />
    )
    expect(screen.getByText('Forms and Requirements')).toBeInTheDocument()
  })

  it('renders section description', () => {
    renderWithConfig(
      <PermitFormsPreview cards={mockCards} sectionDescription="Test desc" token={mockToken} />
    )
    expect(screen.getByText('Test desc')).toBeInTheDocument()
  })

  it('does not render description when empty', () => {
    renderWithConfig(
      <PermitFormsPreview cards={mockCards} sectionDescription="" token={mockToken} />
    )
    expect(screen.queryByText('Test desc')).not.toBeInTheDocument()
  })

  it('renders all card titles', () => {
    renderWithConfig(
      <PermitFormsPreview cards={mockCards} sectionDescription="" token={mockToken} />
    )
    expect(screen.getByText('Business Permit')).toBeInTheDocument()
    expect(screen.getByText('Occupational Permit')).toBeInTheDocument()
  })

  it('renders card description when present', () => {
    renderWithConfig(
      <PermitFormsPreview cards={mockCards} sectionDescription="" token={mockToken} />
    )
    expect(screen.getByText('Required for all businesses')).toBeInTheDocument()
  })

  it('renders requirements as list items', () => {
    renderWithConfig(
      <PermitFormsPreview cards={mockCards} sectionDescription="" token={mockToken} />
    )
    expect(screen.getByText('DTI Registration')).toBeInTheDocument()
    expect(screen.getByText('Barangay Clearance')).toBeInTheDocument()
  })

  it('renders download button when file attached', () => {
    renderWithConfig(
      <PermitFormsPreview cards={mockCards} sectionDescription="" token={mockToken} />
    )
    const downloadBtns = screen.getAllByText('Download Form')
    expect(downloadBtns.length).toBe(1)
  })

  it('renders empty state when no cards', () => {
    renderWithConfig(
      <PermitFormsPreview cards={[]} sectionDescription="" token={mockToken} />
    )
    expect(screen.getByText('No permit form cards to preview')).toBeInTheDocument()
  })
})
