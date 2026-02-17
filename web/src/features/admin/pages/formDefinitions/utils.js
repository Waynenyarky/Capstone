import { CheckCircleOutlined, PauseCircleOutlined, StopOutlined } from '@ant-design/icons'

export function getFormGroupStatus(record) {
  if (record.retiredAt) {
    return { key: 'retired', label: 'Retired', icon: StopOutlined, color: undefined }
  }
  if (record.deactivatedUntil && new Date(record.deactivatedUntil) > new Date()) {
    return { key: 'deactivated', label: 'Deactivated', icon: PauseCircleOutlined, color: 'var(--ant-color-warning)' }
  }
  return { key: 'active', label: 'Active', icon: CheckCircleOutlined, color: 'var(--ant-color-success)' }
}
