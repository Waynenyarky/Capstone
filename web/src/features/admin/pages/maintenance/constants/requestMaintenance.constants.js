/** Predefined reason keys; value 'other' means use custom reason. */
export const REASON_PRESET_OTHER = 'other'

export const REASON_PRESET_OPTIONS = [
  { value: 'scheduled', label: 'Scheduled maintenance' },
  { value: 'emergency', label: 'Emergency maintenance' },
  { value: 'upgrade', label: 'System upgrade' },
  { value: 'outage', label: 'Temporary outage' },
  { value: REASON_PRESET_OTHER, label: 'Others' },
]

export const WHEN_TO_START_OPTIONS = [
  { value: 'now', label: 'Start now (after approval)' },
  { value: 'scheduled', label: 'Schedule for date and time' },
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

export const MIN_MAINTENANCE_DURATION_HOURS = 1
export const MAX_MAINTENANCE_DURATION_DAYS = 7
export const MAX_SCHEDULING_HORIZON_DAYS = 30

/** Disable-flow presets */
export const DISABLE_REASON_PRESET_OPTIONS = [
  { value: 'completed', label: 'Maintenance completed' },
  { value: 'resolved', label: 'Issue resolved' },
  { value: 'emergency_end', label: 'Emergency end' },
  { value: REASON_PRESET_OTHER, label: 'Others' },
]

export const DISABLE_PRESET_REASONS = {
  completed: 'Maintenance completed',
  resolved: 'Issue resolved',
  emergency_end: 'Emergency end',
}

export const DISABLE_PRESET_MESSAGES = {
  completed: 'Scheduled maintenance has been completed successfully. All services are now fully operational. Thank you for your patience during the maintenance window.',
  resolved: 'The issue that required maintenance has been resolved. All services are now back to normal operation. Thank you for your understanding.',
  emergency_end: 'Maintenance mode is being ended early due to an urgent need to restore services. All systems are being brought back online immediately.',
}

export function getMaintenanceMessage(values) {
  if (!values) return ''
  return (values.message || '').trim()
}
