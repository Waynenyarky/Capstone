import { Modal } from 'antd'
import DynamicPageContent from '@/shared/components/DynamicPageContent'

export default function BizClearManualModal({ open, onClose }) {
  return (
    <Modal
      title="BizClear Manual"
      open={open}
      onCancel={onClose}
      footer={null}
      width={800}
      style={{ top: 20 }}
    >
      <DynamicPageContent slotId="bizclear-manual" embedded compact />
    </Modal>
  )
}
