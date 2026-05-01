// Pagination and timing constants
export const REQUESTS_PAGE_SIZE = 20
export const REQUEST_EXPIRY_HOURS = 48
export const HISTORY_PAGE_SIZE = 20

// Navigation items
export const NAV_ITEMS = [
  { key: 'overview', label: 'Overview', icon: 'DashboardOutlined' },
  { key: 'announcements', label: 'Announcements', icon: 'NotificationOutlined' },
  { key: 'requests', label: 'Maintenance', icon: 'ToolOutlined' },
]

export const TAB_ITEMS = [
  { key: 'requests', label: 'Requests' },
  { key: 'history', label: 'History' },
]

// History filter options
export const HISTORY_REASON_OPTIONS = [
  { value: 'Scheduled maintenance', label: 'Scheduled maintenance' },
  { value: 'Emergency maintenance', label: 'Emergency maintenance' },
  { value: 'System upgrade', label: 'System upgrade' },
  { value: 'Temporary outage', label: 'Temporary outage' },
  { value: '__others__', label: 'Others' },
]

export const PRESET_HISTORY_REASONS = [
  'Scheduled maintenance',
  'Emergency maintenance',
  'System upgrade',
  'Temporary outage',
]

// Request modal options
export const WHEN_TO_START_OPTIONS = [
  { value: 'now', label: 'Start now (after approval)' },
  { value: 'scheduled', label: 'Schedule for date and time' },
]

export const REASON_PRESET_OTHER = 'other'

export const REASON_PRESET_OPTIONS = [
  { value: 'scheduled', label: 'Scheduled maintenance' },
  { value: 'emergency', label: 'Emergency maintenance' },
  { value: 'upgrade', label: 'System upgrade' },
  { value: 'outage', label: 'Temporary outage' },
  { value: REASON_PRESET_OTHER, label: 'Others' },
]

export const PRESET_REASONS = {
  scheduled: 'Scheduled maintenance',
  emergency: 'Emergency maintenance',
  upgrade: 'System upgrade',
  outage: 'Temporary outage',
}

export const PRESET_MESSAGES = {
  scheduled: 'We are currently performing scheduled maintenance to improve our services. During this time, the system will be temporarily unavailable. We apologize for any inconvenience this may cause and appreciate your patience. Service will be restored as soon as the maintenance is complete. Please check back later for updates.',
  emergency: 'Our systems are undergoing emergency maintenance to address a critical system issue. Our technical team is working diligently to resolve the matter as quickly as possible. We apologize for the unexpected interruption and appreciate your understanding. Service will be restored once the issue is resolved.',
  upgrade: 'We are performing a system upgrade to enhance our platform and provide you with better service. During this upgrade, the system will be temporarily unavailable. We apologize for any inconvenience and thank you for your patience. The upgraded system will be available shortly.',
  outage: 'We are currently experiencing a temporary service outage due to unforeseen technical difficulties. Our team is actively working to identify and resolve the issue. We sincerely apologize for the disruption and are working to restore full service as soon as possible. Thank you for your patience and understanding.',
}

// Status colors (Ant Design semantic color names)
export const STATUS_COLORS = {
  pending: 'processing',
  approved: 'success',
  rejected: 'error',
  expired: 'default',
}

// Card colors (Ant Design semantic color names for theme support)
export const CARD_COLORS = {
  auth: 'blue',
  business: 'green',
  admin: 'purple',
  audit: 'cyan',
  ai: 'magenta',
  mongodb: 'green',
  ipfs: 'cyan',
  pending: 'orange',
  approved: 'green',
  rejected: 'red',
  on: 'green',
  off: 'default',
}

// Action labels
export const ACTION_LABELS = {
  admin_approval_request: 'Request submitted',
  admin_approval_approved: 'Approved',
  admin_approval_rejected: 'Rejected',
  maintenance_mode: 'Maintenance mode',
}

// FAQ items for info modal
export const FAQ_ITEMS = [
  {
    key: '1',
    label: 'Who can turn maintenance mode on or off?',
    children: 'Only admins can request to enable or disable maintenance mode. The request appears on this page and often requires approval (e.g. from another admin) depending on your setup. Once approved, the change takes effect and non-admin users see the maintenance page.',
  },
  {
    key: '2',
    label: 'What do users see when maintenance is on?',
    children: 'Non-admin users are redirected to the public maintenance page and see the message you configured. They cannot log in or use the main app until maintenance mode is turned off. Admins can still access the admin area.',
  },
  {
    key: '3',
    label: 'Can I change the maintenance message?',
    children: 'Yes. When enabling or requesting maintenance mode, you can set the message shown to users (e.g. expected end time, contact info). Update it when you request a change or through the maintenance configuration if your system supports it.',
  },
  {
    key: '4',
    label: 'Why is there a pending request to enable/disable?',
    children: 'Your system may require a second admin to approve maintenance changes. Pending requests appear here until someone approves or rejects them. Use the Requests page if you need to approve a maintenance request.',
  },
]

// Maintenance timing constraints
export const MIN_MAINTENANCE_DURATION_HOURS = 1
export const MAX_MAINTENANCE_DURATION_DAYS = 7
export const MAX_SCHEDULING_HORIZON_DAYS = 30
