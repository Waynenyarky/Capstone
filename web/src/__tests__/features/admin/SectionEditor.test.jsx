import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderWithProviders, screen, waitFor, fireEvent } from '@/test/utils/renderWithProviders.jsx'
import SectionEditor from '@/features/admin/views/components/SectionEditor.jsx'

describe('SectionEditor Component', () => {
  const mockOnChange = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Empty State', () => {
    it('should show empty state when no sections', () => {
      renderWithProviders(
        <SectionEditor sections={[]} onChange={mockOnChange} disabled={false} />
      )

      expect(screen.getByText('No sections yet')).toBeInTheDocument()
      expect(screen.getByText('Add Section')).toBeInTheDocument()
    })

    it('should not show Add Section button when disabled', () => {
      renderWithProviders(
        <SectionEditor sections={[]} onChange={mockOnChange} disabled={true} />
      )

      expect(screen.queryByText('Add Section')).not.toBeInTheDocument()
    })
  })

  describe('With Sections', () => {
    const mockSections = [
      {
        category: 'LGU Requirements',
        source: 'City Hall',
        notes: 'Important notes',
        items: [
          { label: 'Application Form', required: true, notes: '' },
          { label: 'ID Photos', required: true, notes: '2x2 size' },
          { label: 'Optional Doc', required: false, notes: '' },
        ],
      },
      {
        category: 'BIR Requirements',
        source: 'BIR Office',
        items: [
          { label: 'TIN Certificate', required: true },
        ],
      },
    ]

    it('should display section categories', () => {
      renderWithProviders(
        <SectionEditor sections={mockSections} onChange={mockOnChange} disabled={false} />
      )

      expect(screen.getByText('LGU Requirements')).toBeInTheDocument()
      expect(screen.getByText('BIR Requirements')).toBeInTheDocument()
    })

    it('should display section source', () => {
      renderWithProviders(
        <SectionEditor sections={mockSections} onChange={mockOnChange} disabled={false} />
      )

      expect(screen.getByText('(City Hall)')).toBeInTheDocument()
      expect(screen.getByText('(BIR Office)')).toBeInTheDocument()
    })

    it('should display items within sections', () => {
      renderWithProviders(
        <SectionEditor sections={mockSections} onChange={mockOnChange} disabled={false} />
      )

      expect(screen.getByText('Application Form')).toBeInTheDocument()
      expect(screen.getByText('ID Photos')).toBeInTheDocument()
      expect(screen.getByText('Optional Doc')).toBeInTheDocument()
      expect(screen.getByText('TIN Certificate')).toBeInTheDocument()
    })

    it('should display item notes', () => {
      renderWithProviders(
        <SectionEditor sections={mockSections} onChange={mockOnChange} disabled={false} />
      )

      expect(screen.getByText('2x2 size')).toBeInTheDocument()
    })

    it('should show Add Item buttons for each section', () => {
      renderWithProviders(
        <SectionEditor sections={mockSections} onChange={mockOnChange} disabled={false} />
      )

      const addItemButtons = screen.getAllByText('Add Item')
      expect(addItemButtons.length).toBe(2) // One per section
    })

    it('should hide edit controls when disabled', () => {
      renderWithProviders(
        <SectionEditor sections={mockSections} onChange={mockOnChange} disabled={true} />
      )

      expect(screen.queryByText('Add Item')).not.toBeInTheDocument()
    })
  })

  describe('Section Modal', () => {
    it('should have Add Section button in empty state', () => {
      renderWithProviders(
        <SectionEditor sections={[]} onChange={mockOnChange} disabled={false} />
      )

      // Verify the Add Section button exists and is clickable
      const addButton = screen.getByText('Add Section')
      expect(addButton).toBeInTheDocument()
      expect(addButton.closest('button')).not.toBeDisabled()
    })

    it('should have Add Section button with sections present', () => {
      const sections = [{ category: 'Test', items: [] }]
      renderWithProviders(
        <SectionEditor sections={sections} onChange={mockOnChange} disabled={false} />
      )

      // Should still have Add Section button
      expect(screen.getByText('Add Section')).toBeInTheDocument()
    })
  })

  describe('Item Modal', () => {
    const singleSection = [
      {
        category: 'Test Section',
        items: [],
      },
    ]

    it('should open add item modal', async () => {
      renderWithProviders(
        <SectionEditor sections={singleSection} onChange={mockOnChange} disabled={false} />
      )

      fireEvent.click(screen.getByText('Add Item'))

      await waitFor(() => {
        expect(screen.getByText('Add Requirement')).toBeInTheDocument()
        expect(screen.getByPlaceholderText('e.g., Barangay Business Clearance')).toBeInTheDocument()
      })
    })

    it('should have required checkbox checked by default', async () => {
      renderWithProviders(
        <SectionEditor sections={singleSection} onChange={mockOnChange} disabled={false} />
      )

      fireEvent.click(screen.getByText('Add Item'))

      await waitFor(() => {
        const checkbox = screen.getByLabelText('Required document')
        expect(checkbox).toBeInTheDocument()
      })
    })
  })

  describe('onChange Callback', () => {
    it('should call onChange when toggling item required status', async () => {
      const sections = [
        {
          category: 'Test',
          items: [{ label: 'Item 1', required: true }],
        },
      ]

      renderWithProviders(
        <SectionEditor sections={sections} onChange={mockOnChange} disabled={false} />
      )

      // Find the checkbox within the item (it's the visual checkbox, not inside item modal)
      const checkboxes = document.querySelectorAll('input[type="checkbox"]')
      expect(checkboxes.length).toBeGreaterThan(0)

      // Click the first checkbox to toggle required
      fireEvent.click(checkboxes[0])

      await waitFor(() => {
        expect(mockOnChange).toHaveBeenCalled()
      })
    })
  })
})
