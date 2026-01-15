import { Alert } from 'antd'

export default function DeletionWarningMessage({ roleLabel = 'account' }) {
  return (
    <Alert
      showIcon
      type="warning"
      message="This will schedule your account for deletion"
      description={`All ${roleLabel} data will be removed after the grace period. Audit trails may be retained as required.`}
      style={{ marginBottom: 16 }}
    />
  )
}
