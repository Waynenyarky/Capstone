import React, { createRef } from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderWithProviders, screen, fireEvent, waitFor } from '@/test/utils/renderWithProviders.jsx'

// ─── Mocks ────────────────────────────────────────────────────────
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => vi.fn(),
    useParams: () => ({}),
    useSearchParams: () => [new URLSearchParams(), vi.fn()],
  }
})

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

// Mock the form definition service
vi.mock('@/features/admin/services/formDefinitionService', () => ({
  getFormGroups: vi.fn().mockResolvedValue({ success: true, groups: [] }),
  getFormGroupStats: vi.fn().mockResolvedValue({ success: true, stats: { activated: 3, deactivated: 1, retired: 2, pending: 0 } }),
  getFormDefinitionsAuditLog: vi.fn().mockResolvedValue({ success: true, entries: [] }),
  getFormGroup: vi.fn().mockResolvedValue({ success: true, group: {}, versions: [] }),
  createFormGroup: vi.fn().mockResolvedValue({ success: true, group: { _id: 'g1' }, definition: { _id: 'd1', sections: [] } }),
  createFormGroupVersion: vi.fn().mockResolvedValue({ success: true, definition: { _id: 'd2', version: '2026.2', sections: [] } }),
  getFormDefinition: vi.fn().mockResolvedValue({ success: true, definition: { _id: 'd1', sections: [] } }),
  updateFormDefinition: vi.fn().mockResolvedValue({ success: true, definition: { _id: 'd1', sections: [] } }),
  deleteFormDefinition: vi.fn().mockResolvedValue({ success: true }),
  submitForApproval: vi.fn().mockResolvedValue({ success: true }),
  deactivateFormGroup: vi.fn().mockResolvedValue({ success: true }),
  reactivateFormGroup: vi.fn().mockResolvedValue({ success: true }),
  uploadFormTemplate: vi.fn().mockResolvedValue({ success: true, download: { label: 'test.pdf', fileUrl: '/test.pdf', fileType: 'pdf', fileSize: 1000 } }),
}))

import AdminFormDefinitions from '@/features/admin/views/pages/AdminFormDefinitions.jsx'
import FormContentEditor from '@/features/admin/views/pages/formDefinitions/components/FormContentEditor.jsx'

// ─── Page-level tests ─────────────────────────────────────────────
describe('AdminFormDefinitions Page', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render the page title', async () => {
    renderWithProviders(<AdminFormDefinitions />)
    expect(screen.getByText('Form Definitions')).toBeInTheDocument()
  })

  it('should show Overview and Logs in navigation', () => {
    renderWithProviders(<AdminFormDefinitions />)
    expect(screen.getAllByText('Overview').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Logs').length).toBeGreaterThan(0)
  })

  it('should show Global Forms in navigation', () => {
    renderWithProviders(<AdminFormDefinitions />)
    expect(screen.getAllByText('Global Forms').length).toBeGreaterThan(0)
  })

  it('should show PSIC industry options', () => {
    renderWithProviders(<AdminFormDefinitions />)
    expect(screen.getByText('Agriculture, forestry and fishing')).toBeInTheDocument()
    expect(screen.getByText('Manufacturing')).toBeInTheDocument()
  })

  it('should show overview stats on load', async () => {
    renderWithProviders(<AdminFormDefinitions />)
    await waitFor(() => {
      expect(screen.getByText('Form summary')).toBeInTheDocument()
    })
    expect(screen.getByText('Active forms')).toBeInTheDocument()
    expect(screen.getByText('Deactivated forms')).toBeInTheDocument()
    expect(screen.getByText('Retired forms')).toBeInTheDocument()
  })
})

// ─── FormContentEditor tests ─────────────────────────────────────
describe('FormContentEditor', () => {
  it('should render with initial empty sections', () => {
    renderWithProviders(<FormContentEditor initialSections={[]} />)
    expect(screen.getByText('Add section')).toBeInTheDocument()
  })

  it('should render with provided initial sections', () => {
    const sections = [
      {
        category: 'Test Section',
        source: 'BIR',
        notes: '',
        items: [
          { label: 'Test Field', type: 'text', required: true, helpText: '', placeholder: '', validation: {}, dropdownSource: 'static', dropdownOptions: [] },
        ],
      },
    ]
    renderWithProviders(<FormContentEditor initialSections={sections} />)
    expect(screen.getByText('Section 1')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Test Field')).toBeInTheDocument()
  })

  it('should render add section button', () => {
    renderWithProviders(<FormContentEditor initialSections={[]} />)
    const addButton = screen.getByText('Add section')
    expect(addButton).toBeInTheDocument()
  })

  it('should expose getSections via ref', () => {
    const ref = createRef()
    const sections = [
      {
        category: 'Test',
        source: '',
        notes: '',
        items: [{ label: 'Field 1', type: 'text', required: true }],
      },
    ]

    renderWithProviders(<FormContentEditor ref={ref} initialSections={sections} />)

    expect(ref.current).toBeTruthy()
    expect(typeof ref.current.getSections).toBe('function')

    const result = ref.current.getSections()
    expect(result.length).toBe(1)
    expect(result[0].category).toBe('Test')
    expect(result[0].items.length).toBe(1)
    expect(result[0].items[0].label).toBe('Field 1')
    expect(result[0].items[0].type).toBe('text')
  })

  it('should show section metadata fields', () => {
    const sections = [
      {
        category: 'LGU Requirements',
        source: 'BPLO',
        notes: 'Important notes',
        items: [],
      },
    ]
    renderWithProviders(<FormContentEditor initialSections={sections} />)
    expect(screen.getByDisplayValue('LGU Requirements')).toBeInTheDocument()
  })

  it('should render download field type with upload UI', () => {
    const sections = [
      {
        category: 'Downloads',
        source: '',
        notes: '',
        items: [{
          label: 'Application Form',
          type: 'download',
          required: true,
          helpText: '',
          placeholder: '',
          validation: {},
          dropdownSource: 'static',
          dropdownOptions: [],
          downloadFileName: 'app.pdf',
          downloadFileSize: 1000,
          downloadFileType: 'pdf',
          downloadFileUrl: '/forms/app.pdf',
        }],
      },
    ]
    renderWithProviders(<FormContentEditor initialSections={sections} />)
    expect(screen.getByDisplayValue('Application Form')).toBeInTheDocument()
  })

  it('should call onChange when sections are modified', () => {
    const onChange = vi.fn()
    renderWithProviders(
      <FormContentEditor
        initialSections={[{ category: 'Test', source: '', notes: '', items: [] }]}
        onChange={onChange}
      />
    )

    // Click "Add field" button
    const addFieldBtn = screen.getByText('Add field')
    fireEvent.click(addFieldBtn)

    expect(onChange).toHaveBeenCalled()
  })

  it('should render in mobile mode', () => {
    const sections = [
      {
        category: 'Test',
        source: '',
        notes: '',
        items: [{ label: 'Field', type: 'text', required: true }],
      },
    ]
    renderWithProviders(<FormContentEditor initialSections={sections} isMobile />)
    expect(screen.getByDisplayValue('Field')).toBeInTheDocument()
  })

  it('should support multiple field types in one section', () => {
    const sections = [
      {
        category: 'Mixed Fields',
        source: '',
        notes: '',
        items: [
          { label: 'Text Field', type: 'text', required: true },
          { label: 'File Upload', type: 'file', required: true },
          { label: 'Date Field', type: 'date', required: false },
          { label: 'Number Field', type: 'number', required: true },
        ],
      },
    ]
    renderWithProviders(<FormContentEditor initialSections={sections} />)
    expect(screen.getByDisplayValue('Text Field')).toBeInTheDocument()
    expect(screen.getByDisplayValue('File Upload')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Date Field')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Number Field')).toBeInTheDocument()
  })
})

// ─── Constants tests ──────────────────────────────────────────────
describe('Form Definitions Constants', () => {
  it('should export all required constants', async () => {
    const constants = await import('@/features/admin/views/pages/formDefinitions/constants.js')

    expect(constants.FORM_TYPES).toBeDefined()
    expect(constants.FORM_TYPES.length).toBeGreaterThan(0)

    // Ensure inspections is included
    const inspections = constants.FORM_TYPES.find((t) => t.value === 'inspections')
    expect(inspections).toBeTruthy()
    expect(inspections.label).toBe('Inspections')

    expect(constants.FIELD_TYPES).toBeDefined()
    expect(constants.FIELD_TYPES.length).toBe(10)

    // All field types should be present
    const fieldTypeValues = constants.FIELD_TYPES.map((t) => t.value)
    expect(fieldTypeValues).toContain('text')
    expect(fieldTypeValues).toContain('textarea')
    expect(fieldTypeValues).toContain('number')
    expect(fieldTypeValues).toContain('date')
    expect(fieldTypeValues).toContain('select')
    expect(fieldTypeValues).toContain('multiselect')
    expect(fieldTypeValues).toContain('file')
    expect(fieldTypeValues).toContain('download')
    expect(fieldTypeValues).toContain('checkbox')
    expect(fieldTypeValues).toContain('address')

    expect(constants.FIELD_TYPE_DEFAULTS).toBeDefined()
    expect(constants.FIELD_SPAN_OPTIONS).toBeDefined()
    expect(constants.DEACTIVATE_REASON_TEMPLATES).toBeDefined()
  })
})
