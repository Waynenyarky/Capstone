import { Modal } from 'antd'
import OwnerInfoReadOnlyView from '../../../../components/OwnerInfoReadOnlyView'

export default function OwnerDetailsModal({ open, onClose, application, ownerIdentity, businessReg, ownerName }) {
  return (
    <Modal
      title="Owner Details"
      open={open}
      onCancel={onClose}
      footer={null}
      width={800}
    >
      <div style={{ maxHeight: '70vh', overflowY: 'auto' }}>
        <OwnerInfoReadOnlyView
          application={application}
          ownerIdentity={ownerIdentity}
          businessReg={businessReg}
          ownerName={ownerName}
        />
      </div>
    </Modal>
  )
}
