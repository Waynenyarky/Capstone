import { Modal, Drawer } from 'antd'
import ApplicationProgressTimeline from '@/features/business-owner/components/views/pending-application/ApplicationProgressTimeline'

export default function ApplicationProgressModal({ open, onClose, application, status, statusLower, latestAppeal, isMobile }) {
  if (isMobile) {
    return (
      <Drawer
        title="Application Progress"
        open={open}
        onClose={onClose}
        placement="right"
        width="75%"
      >
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <ApplicationProgressTimeline
            business={application}
            status={status}
            statusLower={statusLower}
            latestAppeal={latestAppeal}
          />
        </div>
      </Drawer>
    )
  }

  return (
    <Modal
      title="Application Progress"
      open={open}
      onCancel={onClose}
      footer={null}
      width={600}
    >
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
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
