import { Modal, Space, Input } from 'antd'
import { Typography } from 'antd'

const { Text } = Typography

export default function ReturnToApplicantModal({ open, onClose, onConfirm, returnRequestOther, setReturnRequestOther }) {
  return (
    <Modal
      title="Return to Applicant"
      open={open}
      onCancel={onClose}
      onOk={onConfirm}
      okText="Return"
      cancelText="Cancel"
    >
      <Space direction="vertical" style={{ width: '100%' }} size={16}>
        <Text>
          Return this application to the applicant for additional information or corrections. Please specify the reason.
        </Text>
        <Input.TextArea
          placeholder="Please specify the reason for returning this application"
          value={returnRequestOther}
          onChange={(e) => setReturnRequestOther(e.target.value)}
          rows={3}
        />
      </Space>
    </Modal>
  )
}
