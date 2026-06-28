import { Modal } from 'antd'
import ApplicationProgressTimeline from '@/features/business-owner/pages/applications/components/ApplicationProgressTimeline'

export default function ApplicationProgressModal({ open, onClose, application, status, statusLower, latestAppeal }) {
  return (
    <Modal
      title="Application Progress"
      open={open}
      onCancel={onClose}
      footer={null}
      width={600}
    >
      <div style={{ padding: 16, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <ApplicationProgressTimeline
          business={application}
          status={status}
          statusLower={statusLower}
          latestAppeal={latestAppeal}
        />
      </div>
    </Modal>
  )
}
