import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderWithProviders, screen, waitFor, fireEvent } from '@/test/utils/renderWithProviders.jsx'

// Mock the services
const mockGetFormGroups = vi.fn()
const mockCreateFormGroup = vi.fn()

vi.mock('@/features/admin/services', async () => {
  const actual = await vi.importActual('@/features/admin/services')
  return {
    ...actual,
    getFormGroups: (...args) => mockGetFormGroups(...args),
    createFormGroup: (...args) => mockCreateFormGroup(...args),
  }
})

// Mock navigation
const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useParams: () => ({}),
    useSearchParams: () => [new URLSearchParams(), vi.fn()],
  }
})

// Mock authentication (AdminLayout uses useAuthSession)
vi.mock('@/features/authentication', async (importOriginal) => {
  const actual = await importOriginal()
  return {
    ...actual,
    AppSidebar: () => <div data-testid="mock-sidebar">Sidebar</div>,
    useAuthSession: () => ({
      currentUser: { email: 'admin@test.com', role: 'admin' },
      role: 'admin',
      logout: vi.fn(),
      isLoading: false,
    }),
  }
})

import AdminFormDefinitions from '@/features/admin/views/pages/AdminFormDefinitions.jsx'

/** On mobile, header actions are in a dropdown; open it and return the New Definition button. */
async function openHeaderActionsAndGetNewDefinition() {
  const ellipsisBtn = screen.queryByRole('button', { name: /ellipsis/i })
  if (ellipsisBtn) {
    fireEvent.click(ellipsisBtn)
    await waitFor(() => {
      expect(screen.getByText('New Definition')).toBeInTheDocument()
    })
  }
  return screen.getByText('New Definition')
}

describe('AdminFormDefinitions Page', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetFormGroups.mockResolvedValue({
      success: true,
      groups: [
        {
          _id: '1',
          formType: 'registration',
          industryScope: 'retail_trade',
          displayName: 'Business Registration - Retail Trade',
          lastUpdated: '2026-01-15T10:00:00Z',
        },
        {
          _id: '2',
          formType: 'permit',
          industryScope: 'food_beverages',
          displayName: 'Business Permit - Food & Beverages',
          lastUpdated: '2026-01-10T10:00:00Z',
        },
      ],
      pagination: { page: 1, limit: 20, total: 2, pages: 1 },
    })
  })

  it('should render the page title', async () => {
    renderWithProviders(<AdminFormDefinitions />)

    await waitFor(() => {
      expect(screen.getByText('Form Definitions')).toBeInTheDocument()
    })
  })

  it('should load form groups and display table', async () => {
    renderWithProviders(<AdminFormDefinitions />)

    await waitFor(() => {
      expect(mockGetFormGroups).toHaveBeenCalled()
    })

    // Search placeholder indicates table is present
    expect(screen.getByPlaceholderText('Search form type or industry')).toBeInTheDocument()
  })

  it('should show New Definition button', async () => {
    renderWithProviders(<AdminFormDefinitions />)

    await waitFor(() => {
      expect(mockGetFormGroups).toHaveBeenCalled()
    })
    // On mobile, button is in dropdown - open it first
    const newDefBtn = await openHeaderActionsAndGetNewDefinition()
    expect(newDefBtn).toBeInTheDocument()
  })

  it('should open create modal when clicking New Definition', async () => {
    renderWithProviders(<AdminFormDefinitions />)

    await waitFor(() => {
      expect(mockGetFormGroups).toHaveBeenCalled()
    })

    const newDefBtn = await openHeaderActionsAndGetNewDefinition()
    fireEvent.click(newDefBtn)

    expect(await screen.findByText('New Form Group', {}, { timeout: 3000 })).toBeInTheDocument()
    expect(screen.getByText('Form Type')).toBeInTheDocument()
    expect(screen.getAllByText('Industry').length).toBeGreaterThan(0)
  })

  it('should show table with form groups data', async () => {
    renderWithProviders(<AdminFormDefinitions />)

    await waitFor(() => {
      expect(mockGetFormGroups).toHaveBeenCalled()
    })
    // Table shows data; check pagination total
    await waitFor(() => {
      expect(screen.getByText(/Total \d+ form groups/)).toBeInTheDocument()
    })
  })
})

describe('Form Definitions Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetFormGroups.mockResolvedValue({
      success: true,
      groups: [],
      pagination: { page: 1, limit: 20, total: 0, pages: 0 },
    })
  })

  it('should show create modal with form type and industry', async () => {
    mockCreateFormGroup.mockResolvedValue({
      success: true,
      group: {
        _id: 'new-1',
        formType: 'registration',
        industryScope: 'retail_trade',
      },
    })

    renderWithProviders(<AdminFormDefinitions />)

    await waitFor(() => {
      expect(mockGetFormGroups).toHaveBeenCalled()
    })

    const newDefBtn = await openHeaderActionsAndGetNewDefinition()
    fireEvent.click(newDefBtn)

    await waitFor(() => {
      expect(screen.getByText('New Form Group')).toBeInTheDocument()
    })

    expect(screen.getByText('Create')).toBeInTheDocument()
  })
})
