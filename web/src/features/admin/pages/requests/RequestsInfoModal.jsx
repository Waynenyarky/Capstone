import { Modal, Button, Typography, Space, Divider, Collapse } from 'antd'

const { Text } = Typography

const FAQ_ITEMS = [
  {
    key: '1',
    label: 'What types of requests appear here?',
    children: 'Approval requests that require admin action: maintenance mode on/off, profile edits (e.g. email or sensitive field changes), and other configurable request types. Each request is created when a user or process asks for something that needs admin approval.',
  },
  {
    key: '2',
    label: 'Do I have to add notes when approving or rejecting?',
    children: 'Notes are optional but recommended. They are stored in the audit trail and help document why a request was approved or rejected. Use them for compliance and for the requester to understand the outcome.',
  },
  {
    key: '3',
    label: 'What happens after I approve or reject?',
    children: 'The request moves to history and the requester is notified (if notifications are enabled). Approved actions (e.g. maintenance mode) take effect; rejected requests do not. All decisions are logged for audit.',
  },
  {
    key: '4',
    label: 'How do I find an old request?',
    children: 'Use the History tab and the filters (date range, status, type) to find resolved requests. Click a row to see full details and any notes you or other admins added.',
  },
]

export default function RequestsInfoModal({ open, onClose }) {
  return (
    <Modal
      title="About Requests"
      open={open}
      onCancel={onClose}
      footer={[<Button key="close" onClick={onClose}>Close</Button>]}
      width={600}
    >
      <Space direction="vertical" size="middle" style={{ width: '100%' }}>
        <Text>
          The Requests page lists approval requests that require admin action—such as maintenance mode, profile edits, or other configurable request types. You review, approve, or reject each request; all actions are logged for audit.
        </Text>

        <Divider style={{ margin: '8px 0' }} />

        <div>
          <Text strong>What you can do</Text>
          <ul style={{ margin: '4px 0 0 0', paddingLeft: 20 }}>
            <li><Text><strong>Pending</strong> — See requests awaiting review. Open a request to view details, then approve or reject with optional notes. The requester is notified of the outcome.</Text></li>
            <li><Text><strong>History</strong> — Browse resolved requests for audit. Use filters (e.g. date range, type, status) to find specific requests and click a row for full details.</Text></li>
          </ul>
        </div>

        <div>
          <Text strong>Frequently asked questions</Text>
          <Collapse
            size="small"
            items={FAQ_ITEMS}
            style={{ marginTop: 8 }}
            bordered={false}
          />
        </div>
      </Space>
    </Modal>
  )
}
