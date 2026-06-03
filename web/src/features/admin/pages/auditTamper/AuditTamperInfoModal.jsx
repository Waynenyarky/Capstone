import { Modal, Button, Typography, Space, Divider, Collapse } from 'antd'

const { Text } = Typography

const FAQ_ITEMS = [
  {
    key: '1',
    label: 'What is a tamper incident?',
    children: 'When the system detects that an audit log entry has been altered (hash mismatch or inconsistency with on-chain records), it creates a tamper incident. These are security events that require review and response.',
  },
  {
    key: '2',
    label: 'What do Acknowledge, Contain, and Resolve mean?',
    children: 'Acknowledge means you have reviewed the incident. Contain restricts further actions until the issue is investigated (you can lift containment later). Resolve closes the incident after you add required notes describing what was done.',
  },
  {
    key: '3',
    label: 'Do I have to resolve every incident?',
    children: 'Yes. Open and acknowledged incidents should be resolved with notes for audit compliance. Resolving records who handled it and what action was taken.',
  },
  {
    key: '4',
    label: 'What appears in the History tab?',
    children: 'The History tab shows security-related audit events: lockouts, restricted field attempts, approvals, deletions, and similar actions. Click a row to see full details in the right panel.',
  },
  {
    key: '5',
    label: 'Can I export or filter incidents?',
    children: 'Use the table pagination to browse incidents (e.g. 20 per page). Active and resolved incidents are listed; you can use the detail panel to review and perform actions on each incident.',
  },
]

export default function AuditTamperInfoModal({ open, onClose }) {
  return (
    <Modal
      title="About Security (Audit & Tamper)"
      open={open}
      onCancel={onClose}
      footer={[<Button key="close" onClick={onClose}>Close</Button>]}
      width={600}
    >
      <Space direction="vertical" size="middle" style={{ width: '100%' }}>
        <Text>
          This page helps you monitor and respond to <strong>audit log tampering</strong>. The system verifies that audit log entries have not been altered by comparing stored hashes and, when available, on-chain records. When a mismatch is detected, a tamper incident is created and you can act on it here.
        </Text>

        <Divider style={{ margin: '8px 0' }} />

        <div>
          <Text strong>What you can do</Text>
          <ul style={{ margin: '4px 0 0 0', paddingLeft: 20 }}>
            <li><Text><strong>Overview</strong> — See summary counts: total, open, acknowledged, and resolved incidents. If there are open incidents, a warning and link to the Incidents tab are shown.</Text></li>
            <li><Text><strong>Incidents</strong> — Table of tamper incidents (active first, then resolved). Click a row to open the detail panel. Use <strong>Acknowledge</strong>, <strong>Contain</strong> (or lift containment), and <strong>Resolve</strong> with required notes. Pagination lets you browse 20 results per page.</Text></li>
            <li><Text><strong>History</strong> — Security-related audit logs (lockouts, restricted field attempts, approvals, deletions). Click a log to view full details in the right panel.</Text></li>
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
