import React from 'react'
import { Modal, Button, Typography, Space, Divider, Collapse } from 'antd'

const { Text } = Typography

const FAQ_ITEMS = [
  {
    key: '1',
    label: 'What do the KPI numbers mean?',
    children: 'Pending shows requests awaiting your action (e.g. maintenance mode, profile edits). Open tamper is the count of security incidents that are not yet resolved. Forms shows how many form groups and published versions exist. Click any card to go to that section.',
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
    children: 'The dashboard is fixed to key metrics and recent activity. Use the links on each KPI card to jump to the corresponding admin page (Requests, Security, Form Definitions) for full control.',
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
            <li><Text><strong>KPI cards</strong> — Pending approval requests, open tamper incidents, and form group counts. Click a card to go to the related section (Requests, Security, Form Definitions).</Text></li>
            <li><Text><strong>Maintenance status</strong> — Whether the system is in maintenance mode and the current message shown to users.</Text></li>
            <li><Text><strong>Recent admin activity</strong> — Latest audit log entries from admin actions (logins, approvals, updates). Helps you spot recent changes.</Text></li>
            <li><Text><strong>Security summary</strong> — Tamper incident counts and a quick link to acknowledge, contain, or resolve incidents in the Security section.</Text></li>
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
