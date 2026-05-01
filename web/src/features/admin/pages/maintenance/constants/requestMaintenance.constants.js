/** Predefined reason keys; value 'other' means use custom reason. */
export const REASON_PRESET_OTHER = 'other'

export const REASON_PRESET_OPTIONS = [
  { value: 'scheduled', label: 'Scheduled maintenance' },
  { value: 'emergency', label: 'Emergency maintenance' },
  { value: 'upgrade', label: 'System upgrade' },
  { value: 'outage', label: 'Temporary outage' },
  { value: REASON_PRESET_OTHER, label: 'Others' },
]

const PRESET_REASONS = {
  scheduled: 'Scheduled maintenance',
  emergency: 'Emergency maintenance',
  upgrade: 'System upgrade',
  outage: 'Temporary outage',
}

const PRESET_MESSAGES = {
  scheduled: 'We are currently performing scheduled maintenance to improve our services. During this time, the system will be temporarily unavailable. We apologize for any inconvenience this may cause and appreciate your patience. Service will be restored as soon as the maintenance is complete. Please check back later for updates.',
  emergency: 'Our systems are undergoing emergency maintenance to address a critical system issue. Our technical team is working diligently to resolve the matter as quickly as possible. We apologize for the unexpected interruption and appreciate your understanding. Service will be restored once the issue is resolved.',
  upgrade: 'We are performing a system upgrade to enhance our platform and provide you with better service. During this upgrade, the system will be temporarily unavailable. We apologize for any inconvenience and thank you for your patience. The upgraded system will be available shortly.',
  outage: 'We are currently experiencing a temporary service outage due to unforeseen technical difficulties. Our team is actively working to identify and resolve the issue. We sincerely apologize for the disruption and are working to restore full service as soon as possible. Thank you for your patience and understanding.',
}

export function getMaintenanceMessage(values) {
  if (!values) return ''
  return (values.message || '').trim()
}
