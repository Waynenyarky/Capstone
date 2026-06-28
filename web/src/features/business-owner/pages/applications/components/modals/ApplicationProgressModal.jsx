import { Modal } from 'antd'
import ApplicationProgressTimeline from '../ApplicationProgressTimeline.jsx'

export default function ApplicationProgressModal({ open, onCancel, business, status, statusLower }) {
  return (
    <Modal
      title="Application Progress"
      open={open}
      onCancel={onCancel}
      footer={null}
      width={600}
    >
      <div style={{ padding: 16, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <ApplicationProgressTimeline
          business={business}
          status={status}
          statusLower={statusLower}
        />
      </div>
    </Modal>
  )
}
