/** Predefined reason keys; value 'other' means use custom reason. */
export const REASON_PRESET_OTHER = 'other'

export const REASON_PRESET_OPTIONS = [
  { value: 'scheduled', label: 'Scheduled maintenance' },
  { value: 'emergency', label: 'Emergency maintenance' },
  { value: 'upgrade', label: 'System upgrade' },
  { value: 'outage', label: 'Temporary outage' },
  { value: REASON_PRESET_OTHER, label: 'Others' },
]

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
