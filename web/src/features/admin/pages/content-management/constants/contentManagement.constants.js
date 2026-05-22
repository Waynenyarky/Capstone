export const CONTENT_TYPES = [
  { key: 'public-announcements', label: 'Public Announcements', icon: 'NotificationOutlined' },
  { key: 'staff-announcements', label: 'Staff Announcements', icon: 'NotificationOutlined' },
  { key: 'faqs', label: 'FAQs', icon: 'QuestionCircleOutlined' },
  { key: 'instructions', label: 'Instructions', icon: 'InfoCircleOutlined' },
  { key: 'application-processes', label: 'Application Processes', icon: 'AppstoreOutlined' },
]

export const CONTENT_TYPE_CONFIG = {
  'public-announcements': { showAddButton: true, audience: 'public' },
  'staff-announcements': { showAddButton: true, audience: 'staff' },
  'faqs': { showAddButton: false },
  'instructions': { showAddButton: false },
  'application-processes': { showAddButton: false, placeholder: true },
}

export const PAGE_SIZE = 20
