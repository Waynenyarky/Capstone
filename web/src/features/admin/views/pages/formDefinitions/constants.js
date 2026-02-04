import {
  EditOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  InboxOutlined,
} from '@ant-design/icons'

// Re-export industry constants from central location
export {
  INDUSTRY_SCOPE_OPTIONS as INDUSTRY_OPTIONS,
  INDUSTRY_SCOPE_LABELS as INDUSTRY_LABELS,
} from '@/constants'

export const FORM_TYPES = [
  { value: 'registration', label: 'Business Registration' },
  { value: 'permit', label: 'Business Permit' },
  { value: 'renewal', label: 'Business Renewal' },
  { value: 'cessation', label: 'Cessation' },
  { value: 'violation', label: 'Violation' },
  { value: 'appeal', label: 'Appeal' },
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

// Editor panel status
export const STATUS_COLORS = {
  draft: 'default',
  pending_approval: 'processing',
  published: 'success',
  archived: 'warning',
}

export const STATUS_LABELS = {
  draft: 'Draft',
  pending_approval: 'Pending Approval',
  published: 'Active',
  archived: 'Retired',
}

export const STATUS_ICONS = {
  draft: EditOutlined,
  pending_approval: ClockCircleOutlined,
  published: CheckCircleOutlined,
  archived: InboxOutlined,
}

export const DEACTIVATE_REASON_TEMPLATES = [
  { value: 'maintenance', label: 'Form under maintenance', message: 'This form is temporarily unavailable due to scheduled maintenance.' },
  { value: 'updating', label: 'Updating requirements', message: 'We are updating the form requirements. Please check back soon.' },
  { value: 'technical', label: 'Technical updates', message: 'This form is temporarily unavailable while we perform technical updates.' },
  { value: 'compliance', label: 'Compliance review', message: 'This form is under compliance review and will be available again shortly.' },
  { value: 'custom', label: 'Custom message', message: null },
]
