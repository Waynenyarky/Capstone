import React from 'react'
import { Tabs, Table, Card, Button, Typography, Tag, Space, List, Statistic, Alert, Badge, theme } from 'antd'
import BusinessOwnerLayout from '@/features/business-owner/views/components/BusinessOwnerLayout'
import { DollarCircleOutlined, HistoryOutlined, RobotOutlined, CheckCircleOutlined, FilePdfOutlined } from '@ant-design/icons'
import PaymentModal from '../components/PaymentModal'
import { usePayments } from '../hooks/usePayments'
import { useAppTheme, THEMES } from '@/shared/theme/ThemeProvider'

const { Title, Text } = Typography

export default function PaymentsPage() {
  const {
    activeTab,
    setActiveTab,
    bills,
    history,
    loading,
    selectedBill,
    setSelectedBill,
    handlePay
  } = usePayments()
  
  const { token } = theme.useToken()
  const { currentTheme } = useAppTheme()

  const brandColor = currentTheme === THEMES.DEFAULT ? '#001529' : token.colorPrimary

  const columns = [
    { title: 'Invoice #', dataIndex: 'invoiceNumber', key: 'invoiceNumber' },
    { title: 'Type', dataIndex: 'type', key: 'type' },
    { title: 'Amount', dataIndex: 'amount', key: 'amount', render: (val) => `₱${val.toFixed(2)}` },
    { title: 'Method', dataIndex: 'method', key: 'method' },
    { title: 'Date', dataIndex: 'date', key: 'date' },
    { title: 'Transaction ID', dataIndex: 'transactionId', key: 'transactionId' },
    { 
      title: 'Status', 
      dataIndex: 'status', 
      key: 'status',
      render: (status) => <Tag color="green" icon={<CheckCircleOutlined />}>{status}</Tag>
    },
    {
        title: 'Receipt',
        key: 'receipt',
        render: () => <Button type="link" icon={<FilePdfOutlined />} size="small">Download</Button>
    }
  ]

  const tabItems = [
    {
      key: '1',
      label: (
        <span>
          <DollarCircleOutlined /> Pending Bills <Badge count={bills.length} offset={[8, -2]} size="small" style={{ backgroundColor: '#faad14' }} />
        </span>
      ),
      children: (
        <List
          grid={{ gutter: 16, xs: 1, sm: 2, md: 3 }}
          dataSource={bills}
          loading={loading}
          renderItem={item => (
            <List.Item>
              <Card 
                title={item.type} 
                extra={<Tag color="#faad14">Unpaid</Tag>}
                style={{ borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}
                actions={[
                  <Button type="primary" onClick={() => setSelectedBill(item)} style={{ background: token.colorPrimary, borderColor: token.colorPrimary }}>Pay Now</Button>
                ]}
              >
                <Statistic 
                  title="Amount Due" 
                  value={item.amount} 
                  precision={2} 
                  prefix="₱" 
                  valueStyle={{ color: '#faad14' }}
                />
                <div style={{ marginTop: 12 }}>
                  <Text type="secondary">Due Date: {item.dueDate}</Text>
                  <br />
                  <Text type="secondary" style={{ fontSize: 12 }}>Inv: {item.invoiceNumber}</Text>
                </div>
              </Card>
            </List.Item>
          )}
        />
      )
    },
    {
      key: '2',
      label: (
        <span>
          <HistoryOutlined /> Payment History
        </span>
      ),
      children: (
        <Card>
          <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'flex-end' }}>
            <Tag color="blue">Blockchain Verified</Tag>
          </div>
          <Table columns={columns} dataSource={history} rowKey="id" loading={loading} />
        </Card>
      )
    }
  ]

  return (
    <BusinessOwnerLayout pageTitle="Payments">
        <div>
          <Title level={2} style={{ marginBottom: 32, color: brandColor }}>Payments & Billing</Title>
          
          {bills.length > 0 && (
            <Alert 
              message={<Space><RobotOutlined /> AI Reminder</Space>}
              description={`You have ${bills.length} pending bill(s). The Mayor's Permit fee is due soon. Pay now to avoid penalties.`}
              type="info" 
              showIcon 
              closable
              style={{ marginBottom: 24 }}
            />
          )}

          <Tabs activeKey={activeTab} onChange={setActiveTab} type="card" items={tabItems} />

          <PaymentModal 
            open={!!selectedBill} 
            bill={selectedBill} 
            onCancel={() => setSelectedBill(null)} 
            onPay={handlePay}
          />
        </div>
    </BusinessOwnerLayout>
  )
}
