import {
  EditOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  InboxOutlined,
  ShoppingOutlined,
  CoffeeOutlined,
  ToolOutlined,
  BuildOutlined,
  EnvironmentOutlined,
  HomeOutlined,
  CarOutlined,
  BankOutlined,
  ThunderboltOutlined,
  CloudOutlined,
  LaptopOutlined,
  SafetyCertificateOutlined,
  TeamOutlined,
  ReadOutlined,
  MedicineBoxOutlined,
  SmileOutlined,
  UserOutlined,
  GlobalOutlined,
} from '@ant-design/icons'

// Re-export industry constants from central location (PSIC 2019 sections)
import { INDUSTRY_SCOPE_OPTIONS } from '@/constants'
export {
  INDUSTRY_SCOPE_OPTIONS as INDUSTRY_OPTIONS,
  INDUSTRY_SCOPE_LABELS as INDUSTRY_LABELS,
} from '@/constants'

// Industry options for form definitions (includes "All Industries")
export const FORM_DEFINITIONS_INDUSTRY_OPTIONS = [
  { value: 'all', label: 'All Industries' },
  ...INDUSTRY_SCOPE_OPTIONS,
]

// PSIC 2019 sections – for left panel industry list
// Sorted alphabetically by industry description
const _INDUSTRIES_RAW = [
  { value: 'a', label: 'Agriculture, forestry and fishing', icon: EnvironmentOutlined },
  { value: 'b', label: 'Mining and quarrying', icon: ToolOutlined },
  { value: 'c', label: 'Manufacturing', icon: BuildOutlined },
  { value: 'd', label: 'Electricity, gas, steam and air conditioning supply', icon: ThunderboltOutlined },
  { value: 'e', label: 'Water supply; sewerage; waste management and remediation activities', icon: CloudOutlined },
  { value: 'f', label: 'Construction', icon: HomeOutlined },
  { value: 'g', label: 'Wholesale and retail trade; repair of motor vehicles and motorcycles', icon: ShoppingOutlined },
  { value: 'h', label: 'Transport and storage', icon: CarOutlined },
  { value: 'i', label: 'Accommodation and food service activities', icon: CoffeeOutlined },
  { value: 'j', label: 'Information and communication', icon: LaptopOutlined },
  { value: 'k', label: 'Financial and insurance activities', icon: BankOutlined },
  { value: 'l', label: 'Real estate activities', icon: HomeOutlined },
  { value: 'm', label: 'Professional, scientific and technical activities', icon: SafetyCertificateOutlined },
  { value: 'n', label: 'Administrative and support service activities', icon: TeamOutlined },
  { value: 'o', label: 'Public administration and defence; compulsory social security', icon: SafetyCertificateOutlined },
  { value: 'p', label: 'Education', icon: ReadOutlined },
  { value: 'q', label: 'Human health and social work activities', icon: MedicineBoxOutlined },
  { value: 'r', label: 'Arts, entertainment and recreation', icon: SmileOutlined },
  { value: 's', label: 'Other service activities', icon: ToolOutlined },
  { value: 't', label: 'Activities of households as employers', icon: UserOutlined },
  { value: 'u', label: 'Activities of extraterritorial organizations and bodies', icon: GlobalOutlined },
]
export const FORM_DEFINITIONS_INDUSTRIES_ONLY = _INDUSTRIES_RAW.sort(
  (a, b) => a.label.localeCompare(b.label)
)

export const FORM_TYPES = [
  { value: 'registration', label: 'Business Registration' },
  { value: 'permit', label: 'Business Permit' },
  { value: 'renewal', label: 'Business Renewal' },
  { value: 'cessation', label: 'Cessation' },
  { value: 'violation', label: 'Violation' },
  { value: 'appeal', label: 'Appeal' },
  { value: 'inspections', label: 'Inspections' },
]

/** Group form types for UI (e.g., tabs, filters) */
export const FORM_TYPE_CATEGORIES = {
  business: ['registration', 'permit', 'renewal', 'cessation'],
  compliance: ['violation'],
  disputes: ['appeal'],
}

export const STATUS_OPTIONS = [
  { value: 'active', label: 'Active only' },
  { value: 'all', label: 'Include retired' },
]

export const FORM_TYPE_LABELS = {
  registration: 'Registration',
  permit: 'Permit',
  renewal: 'Renewal',
  cessation: 'Cessation',
  violation: 'Violation',
  appeal: 'Appeal',
  inspections: 'Inspections',
}

export const ACTION_LABELS = {
  created: 'Created',
  updated: 'Updated',
  submitted_for_approval: 'Submitted',
  published: 'Published',
  archived: 'Archived',
  rejected: 'Rejected',
}

export const TABLE_MIN_WIDTH = 320

// Form status: pending, active, deactivated, retired
export const STATUS_COLORS = {
  pending: 'processing',
  active: 'success',
  deactivated: 'warning',
  retired: 'default',
}

export const STATUS_LABELS = {
  pending: 'Pending',
  active: 'Active',
  deactivated: 'Deactivated',
  retired: 'Retired',
}

export const STATUS_ICONS = {
  pending: ClockCircleOutlined,
  active: CheckCircleOutlined,
  deactivated: InboxOutlined,
  retired: InboxOutlined,
}

// ─── Form builder field types ───
export const FIELD_TYPES = [
  { value: 'text', label: 'Text' },
  { value: 'textarea', label: 'Text Area' },
  { value: 'number', label: 'Number' },
  { value: 'date', label: 'Date' },
  { value: 'select', label: 'Dropdown' },
  { value: 'multiselect', label: 'Multi-select' },
  { value: 'file', label: 'File Upload' },
  { value: 'download', label: 'Downloadable Form' },
  { value: 'checkbox', label: 'Checkbox' },
  { value: 'address', label: 'Philippine Address (PSGC)' },
]

export const FIELD_TYPE_LABELS = Object.fromEntries(
  FIELD_TYPES.map((t) => [t.value, t.label])
)

/** Default validation, placeholder, and dropdown config per field type */
export const FIELD_TYPE_DEFAULTS = {
  text: {
    placeholder: 'Enter text',
    validation: { minLength: 1, maxLength: 500 },
    dropdownSource: 'static',
    dropdownOptions: [],
  },
  textarea: {
    placeholder: 'Enter text...',
    validation: { minLength: 1, maxLength: 2000 },
    dropdownSource: 'static',
    dropdownOptions: [],
  },
  number: {
    placeholder: 'e.g. 0',
    validation: { minValue: 0 },
    dropdownSource: 'static',
    dropdownOptions: [],
  },
  date: {
    placeholder: '',
    validation: {},
    dropdownSource: 'static',
    dropdownOptions: [],
  },
  select: {
    placeholder: 'Select...',
    validation: {},
    dropdownSource: 'static',
    dropdownOptions: [],
  },
  multiselect: {
    placeholder: 'Select one or more...',
    validation: {},
    dropdownSource: 'static',
    dropdownOptions: [],
  },
  file: {
    placeholder: '',
    validation: { acceptedFileTypes: 'pdf,jpg,png', maxFileSize: 10 },
    dropdownSource: 'static',
    dropdownOptions: [],
  },
  download: {
    placeholder: '',
    validation: { acceptedFileTypes: 'pdf,jpg,png', maxFileSize: 10 },
    dropdownSource: 'static',
    dropdownOptions: [],
  },
  checkbox: {
    placeholder: '',
    validation: {},
    dropdownSource: 'static',
    dropdownOptions: [],
  },
  address: {
    placeholder: '',
    validation: {},
    dropdownSource: 'static',
    dropdownOptions: [],
  },
}

// Dropdown data sources
export const DROPDOWN_SOURCES = [
  { value: 'static', label: 'Custom options (define below)' },
  { value: 'psgc_province', label: 'Philippine provinces (PSGC)' },
  { value: 'psgc_city', label: 'Philippine cities / municipalities (PSGC)' },
  { value: 'psgc_barangay', label: 'Philippine barangays (PSGC)' },
  { value: 'industries', label: 'PSIC industries' },
]

// Validation rule types
export const VALIDATION_RULES = [
  { value: 'minLength', label: 'Minimum length', inputType: 'number' },
  { value: 'maxLength', label: 'Maximum length', inputType: 'number' },
  { value: 'pattern', label: 'Regex pattern', inputType: 'text' },
  { value: 'minValue', label: 'Minimum value', inputType: 'number' },
  { value: 'maxValue', label: 'Maximum value', inputType: 'number' },
  { value: 'maxFileSize', label: 'Max file size (MB)', inputType: 'number' },
  { value: 'acceptedFileTypes', label: 'Accepted file types', inputType: 'text' },
]

// Field layout: span for grid (24 = full width, 12 = half, 8 = third)
export const FIELD_SPAN_OPTIONS = [
  { value: 24, label: 'Full width' },
  { value: 12, label: 'Half width' },
  { value: 8, label: 'Third width' },
]

export const DEACTIVATE_REASON_TEMPLATES = [
  { value: 'maintenance', label: 'Form under maintenance', message: 'This form is temporarily unavailable due to scheduled maintenance.' },
  { value: 'updating', label: 'Updating requirements', message: 'We are updating the form requirements. Please check back soon.' },
  { value: 'technical', label: 'Technical updates', message: 'This form is temporarily unavailable while we perform technical updates.' },
  { value: 'compliance', label: 'Compliance review', message: 'This form is under compliance review and will be available again shortly.' },
  { value: 'custom', label: 'Custom message', message: null },
]
