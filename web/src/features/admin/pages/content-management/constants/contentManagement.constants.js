export const CONTENT_TYPES = [
  { key: 'public-announcements', label: 'Public Announcements', icon: 'NotificationOutlined' },
  { key: 'staff-announcements', label: 'Staff Announcements', icon: 'NotificationOutlined' },
  { key: 'faqs', label: 'FAQs', icon: 'QuestionCircleOutlined' },
  { key: 'instructions', label: 'Instructions', icon: 'InfoCircleOutlined' },
  { key: 'privacy-policy', label: 'Privacy Policy', icon: 'SafetyOutlined' },
  { key: 'terms-of-service', label: 'Terms of Service', icon: 'FileProtectOutlined' },
  { key: 'bizclear-manual', label: 'BizClear Manual', icon: 'BookOutlined' },
  { key: 'application-processes', label: 'Application Processes', icon: 'AppstoreOutlined' },
]

export const CONTENT_TYPE_CONFIG = {
  'public-announcements': { showAddButton: true, audience: 'public' },
  'staff-announcements': { showAddButton: true, audience: 'staff' },
  'faqs': { showAddButton: false },
  'instructions': { showAddButton: false },
  'privacy-policy': { showAddButton: false, pageSlotId: 'privacy-policy' },
  'terms-of-service': { showAddButton: false, pageSlotId: 'terms-of-service' },
  'bizclear-manual': { showAddButton: false, pageSlotId: 'bizclear-manual' },
  'application-processes': { showAddButton: false, placeholder: true },
}

export const PAGE_CONTENT_TYPES = ['privacy-policy', 'terms-of-service', 'bizclear-manual']

export const PAGE_SIZE = 20
