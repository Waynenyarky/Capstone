import { Modal, Button, Typography, Space, Divider, Collapse } from 'antd'

const { Text } = Typography

const FAQ_ITEMS = [
  {
    key: '1',
    label: 'What are the content cards?',
    children: 'The three content cards show public announcements, staff announcements, and CMS updates. These display published and active items only (matching the landing page behavior). Click any card to go to Content Management for full control.',
  },
  {
    key: '2',
    label: 'Why don’t I see recent activity?',
    children: 'Recent admin activity shows the latest audit log entries from admin actions (logins, approvals, config changes). If the list is empty, no admin actions have been recorded recently, or the audit service may still be loading.',
  },
  {
    key: '3',
    label: 'When should I check the Security section?',
    children: 'Check Security whenever the dashboard shows open tamper incidents, or if you need to acknowledge, contain, or resolve audit-log tamper events. Resolving incidents with notes keeps the audit trail clear.',
  },
  {
    key: '4',
    label: 'Can I customize what appears on the dashboard?',
    children: 'The dashboard is fixed to content cards and maintenance status. Use the links on each card to jump to the corresponding admin page (Content Management, Site Settings) for full control.',
  },
]

export default function DashboardInfoModal({ open, onClose }) {
  return (
    <Modal
      title="About Admin Dashboard"
      open={open}
      onCancel={onClose}
      footer={[<Button key="close" onClick={onClose}>Close</Button>]}
      width={600}
    >
      <Space direction="vertical" size="middle" style={{ width: '100%' }}>
        <Text>
          The Admin Dashboard gives you a quick overview of key metrics and recent activity so you can see what needs attention at a glance.
        </Text>

        <Divider style={{ margin: '8px 0' }} />

        <div>
          <Text strong>What you see here</Text>
          <ul style={{ margin: '4px 0 0 0', paddingLeft: 20 }}>
            <li><Text><strong>Content cards</strong> — Public announcements, staff announcements, and CMS updates. These show published and active items only. Click a card to go to Content Management.</Text></li>
            <li><Text><strong>Maintenance status</strong> — Whether the system is in maintenance mode and the current message shown to users.</Text></li>
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
