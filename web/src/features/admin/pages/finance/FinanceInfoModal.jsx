import { Modal, Button, Typography, Space, Divider, Collapse } from 'antd'

const { Text } = Typography

const FAQ_ITEMS = [
  {
    key: '1',
    label: 'Where do transaction amounts come from?',
    children: 'Transactions are created when fees are computed and paid (e.g. permit applications, renewals). Amounts reflect the fee configuration in effect at the time and any penalties or surcharges applied.',
  },
  {
    key: '2',
    label: 'How do I generate a report for a specific period?',
    children: 'Use the Reports tab to select a date range and generate financial reports. You can export data for accounting, reconciliation, or compliance. Reports reflect collections and fees for the chosen period.',
  },
  {
    key: '3',
    label: 'Can I correct or void a transaction?',
    children: 'Transaction data is tied to the permit system; corrections or voids depend on your organization’s policy and whether the backend supports adjustments. Use filters and search in the Transactions tab to find the relevant records.',
  },
  {
    key: '4',
    label: 'How do fee changes affect existing transactions?',
    children: 'Existing transactions keep the amounts that were calculated when they were created. Fee configuration changes in Fee Configuration apply only to new fee calculations, not to past transactions.',
  },
]

export default function FinanceInfoModal({ open, onClose }) {
  return (
    <Modal
      title="About Finance"
      open={open}
      onCancel={onClose}
      footer={[<Button key="close" onClick={onClose}>Close</Button>]}
      width={600}
    >
      <Space direction="vertical" size="middle" style={{ width: '100%' }}>
        <Text>
          The Finance section gives you an overview of revenue, fees, and financial reporting for the permit system. Use it to monitor collections, inspect transactions, and generate reports.
        </Text>

        <Divider style={{ margin: '8px 0' }} />

        <div>
          <Text strong>What you can do</Text>
          <ul style={{ margin: '4px 0 0 0', paddingLeft: 20 }}>
            <li><Text><strong>Overview</strong> — Summary of collections, fees, and key financial metrics at a glance.</Text></li>
            <li><Text><strong>Transactions</strong> — List of financial transactions with filters and search. Use it to find payments, permit fees, renewals, and related amounts.</Text></li>
            <li><Text><strong>Reports</strong> — Generate and export financial reports for a given period (e.g. monthly or quarterly) for accounting or compliance.</Text></li>
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
