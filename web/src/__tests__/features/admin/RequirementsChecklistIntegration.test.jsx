import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderWithProviders, screen, waitFor, fireEvent } from '@/test/utils/renderWithProviders.jsx'

// Mock the API service
const mockGetActiveFormDefinition = vi.fn()

vi.mock('@/features/admin/services/formDefinitionService', () => ({
  getActiveFormDefinition: (...args) => mockGetActiveFormDefinition(...args),
}))

// Mock the business registration service
const mockDownloadRequirementsPDF = vi.fn()
const mockConfirmRequirementsChecklist = vi.fn()

vi.mock(
  '@/features/business-owner/features/business-registration/services/businessRegistrationService',
  () => ({
    downloadRequirementsPDF: (...args) => mockDownloadRequirementsPDF(...args),
    confirmRequirementsChecklist: (...args) => mockConfirmRequirementsChecklist(...args),
  })
)

import RequirementsChecklistStep from '@/features/business-owner/features/business-registration/components/RequirementsChecklistStep.jsx'

describe('RequirementsChecklistStep API Integration', () => {
  const mockOnConfirm = vi.fn()
  const mockOnNext = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Loading State', () => {
    it('should show loading spinner initially', async () => {
      mockGetActiveFormDefinition.mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 1000))
      )

      renderWithProviders(
        <RequirementsChecklistStep
          businessId="test-id"
          businessType="retail_trade"
          onConfirm={mockOnConfirm}
          onNext={mockOnNext}
        />
      )

      expect(screen.getByText('Loading requirements...')).toBeInTheDocument()
    })
  })

  describe('API Success', () => {
    beforeEach(() => {
      mockGetActiveFormDefinition.mockResolvedValue({
        success: true,
        definition: {
          _id: 'def-123',
          formType: 'registration',
          version: '2026.1',
          sections: [
            {
              category: 'API Requirements',
              source: 'API Source',
              items: [
                { label: 'API Item 1', required: true, notes: 'From API' },
                { label: 'API Item 2', required: false, notes: '' },
              ],
            },
          ],
          downloads: [
            { label: 'API Form', fileUrl: '/api-form.pdf', fileType: 'pdf' },
          ],
        },
      })
    })

    it('should display requirements from API', async () => {
      renderWithProviders(
        <RequirementsChecklistStep
          businessId="test-id"
          businessType="retail_trade"
          onConfirm={mockOnConfirm}
          onNext={mockOnNext}
        />
      )

      await waitFor(() => {
        expect(screen.getByText('API Requirements')).toBeInTheDocument()
      })

      expect(screen.getByText('API Item 1')).toBeInTheDocument()
      expect(screen.getByText('API Item 2')).toBeInTheDocument()
      expect(screen.getByText('From API')).toBeInTheDocument()
    })

    it('should display source information', async () => {
      renderWithProviders(
        <RequirementsChecklistStep
          businessId="test-id"
          businessType="retail_trade"
          onConfirm={mockOnConfirm}
          onNext={mockOnNext}
        />
      )

      await waitFor(() => {
        expect(screen.getByText('Source: API Source')).toBeInTheDocument()
      })
    })

    it('should display downloads from API', async () => {
      renderWithProviders(
        <RequirementsChecklistStep
          businessId="test-id"
          businessType="retail_trade"
          onConfirm={mockOnConfirm}
          onNext={mockOnNext}
        />
      )

      await waitFor(() => {
        expect(screen.getByText('Downloadable Forms')).toBeInTheDocument()
        expect(screen.getByText('API Form')).toBeInTheDocument()
      })
    })

    it('should display Optional tag for non-required items', async () => {
      renderWithProviders(
        <RequirementsChecklistStep
          businessId="test-id"
          businessType="retail_trade"
          onConfirm={mockOnConfirm}
          onNext={mockOnNext}
        />
      )

      await waitFor(() => {
        expect(screen.getByText('Optional')).toBeInTheDocument()
      })
    })
  })

  describe('API Fallback', () => {
    beforeEach(() => {
      // Simulate API failure
      mockGetActiveFormDefinition.mockRejectedValue(new Error('API unavailable'))
    })

    it('should fallback to hardcoded requirements on API error', async () => {
      renderWithProviders(
        <RequirementsChecklistStep
          businessId="test-id"
          businessType="food_beverages"
          onConfirm={mockOnConfirm}
          onNext={mockOnNext}
        />
      )

      await waitFor(() => {
        // Should show hardcoded general requirements
        expect(screen.getByText('Local Government Unit (LGU)')).toBeInTheDocument()
      })

      // Should also show business-type specific requirements
      expect(screen.getByText('Food and Beverage')).toBeInTheDocument()
    })
  })

  describe('API 404', () => {
    beforeEach(() => {
      mockGetActiveFormDefinition.mockRejectedValue({
        status: 404,
        message: 'no_active_definition',
      })
    })

    it('should fallback to hardcoded requirements on 404', async () => {
      renderWithProviders(
        <RequirementsChecklistStep
          businessId="test-id"
          businessType="retail_trade"
          onConfirm={mockOnConfirm}
          onNext={mockOnNext}
        />
      )

      await waitFor(() => {
        expect(screen.getByText('Local Government Unit (LGU)')).toBeInTheDocument()
      })
    })
  })

  describe('Confirm and Continue', () => {
    beforeEach(() => {
      mockGetActiveFormDefinition.mockResolvedValue({
        success: true,
        definition: {
          _id: 'def-456',
          sections: [{ category: 'Test', items: [{ label: 'Item', required: true }] }],
          downloads: [],
        },
      })
      mockConfirmRequirementsChecklist.mockResolvedValue({ success: true })
    })

    it('should disable confirm button until checkbox is checked', async () => {
      renderWithProviders(
        <RequirementsChecklistStep
          businessId="test-id"
          businessType="retail_trade"
          onConfirm={mockOnConfirm}
          onNext={mockOnNext}
        />
      )

      await waitFor(() => {
        expect(screen.getByText('Confirm and Continue')).toBeInTheDocument()
      })

      const confirmButton = screen.getByText('Confirm and Continue')
      expect(confirmButton.closest('button')).toBeDisabled()
    })

    it('should enable confirm button when checkbox is checked', async () => {
      renderWithProviders(
        <RequirementsChecklistStep
          businessId="test-id"
          businessType="retail_trade"
          onConfirm={mockOnConfirm}
          onNext={mockOnNext}
        />
      )

      await waitFor(() => {
        expect(screen.getByText('Confirm and Continue')).toBeInTheDocument()
      })

      // Find and click the confirmation checkbox
      const checkbox = screen.getByRole('checkbox', {
        name: /I have reviewed and understand/i,
      })
      fireEvent.click(checkbox)

      const confirmButton = screen.getByText('Confirm and Continue')
      expect(confirmButton.closest('button')).not.toBeDisabled()
    })

    it('should call onConfirm with formDefinitionId when confirmed', async () => {
      renderWithProviders(
        <RequirementsChecklistStep
          businessId="new"
          businessType="retail_trade"
          onConfirm={mockOnConfirm}
          onNext={mockOnNext}
        />
      )

      await waitFor(() => {
        expect(screen.getByText('Confirm and Continue')).toBeInTheDocument()
      })

      // Check the checkbox
      const checkbox = screen.getByRole('checkbox', {
        name: /I have reviewed and understand/i,
      })
      fireEvent.click(checkbox)

      // Click confirm
      fireEvent.click(screen.getByText('Confirm and Continue'))

      await waitFor(() => {
        expect(mockOnConfirm).toHaveBeenCalledWith('def-456')
      })
    })

    it('should skip API call for new business', async () => {
      renderWithProviders(
        <RequirementsChecklistStep
          businessId="new"
          businessType="retail_trade"
          onConfirm={mockOnConfirm}
          onNext={mockOnNext}
        />
      )

      await waitFor(() => {
        expect(screen.getByText('Confirm and Continue')).toBeInTheDocument()
      })

      const checkbox = screen.getByRole('checkbox', {
        name: /I have reviewed and understand/i,
      })
      fireEvent.click(checkbox)
      fireEvent.click(screen.getByText('Confirm and Continue'))

      await waitFor(() => {
        expect(mockConfirmRequirementsChecklist).not.toHaveBeenCalled()
        expect(mockOnNext).toHaveBeenCalled()
      })
    })
  })

  describe('Download PDF', () => {
    beforeEach(() => {
      mockGetActiveFormDefinition.mockResolvedValue({
        success: true,
        definition: {
          _id: 'def-789',
          sections: [{ category: 'Test', items: [] }],
          downloads: [],
        },
      })
      mockDownloadRequirementsPDF.mockResolvedValue({ success: true })
    })

    it('should show Download PDF button', async () => {
      renderWithProviders(
        <RequirementsChecklistStep
          businessId="test-id"
          businessType="retail_trade"
          onConfirm={mockOnConfirm}
          onNext={mockOnNext}
        />
      )

      await waitFor(() => {
        expect(screen.getByText('Download PDF Checklist')).toBeInTheDocument()
      })
    })

    it('should call downloadRequirementsPDF when clicked', async () => {
      renderWithProviders(
        <RequirementsChecklistStep
          businessId="test-id"
          businessType="retail_trade"
          onConfirm={mockOnConfirm}
          onNext={mockOnNext}
        />
      )

      await waitFor(() => {
        expect(screen.getByText('Download PDF Checklist')).toBeInTheDocument()
      })

      fireEvent.click(screen.getByText('Download PDF Checklist'))

      await waitFor(() => {
        expect(mockDownloadRequirementsPDF).toHaveBeenCalledWith('test-id')
      })
    })
  })
})
