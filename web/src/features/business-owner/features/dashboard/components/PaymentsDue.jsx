import React from 'react'
import { Card, Table, Tag, Button, Space, Statistic, Row, Col, Empty, theme } from 'antd'
import { DollarCircleOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'

const PaymentsDue = ({ data }) => {
  const { token } = theme.useToken();
  const navigate = useNavigate()
  if (!data) return null

  const columns = [
    {
      title: 'Invoice',
      dataIndex: 'invoice',
      key: 'invoice',
      ellipsis: true,
    },
    {
      title: 'Amount',
      dataIndex: 'amount',
      key: 'amount',
      render: amount => `₱${amount.toLocaleString()}`
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: status => {
        let color = 'default'
        if (status === 'Overdue') color = 'red'
        if (status === 'Unpaid') color = token.colorWarning
        if (status === 'Paid') color = 'green'
        return <Tag color={color}>{status}</Tag>
      }
    },
  ]

  return (
    <Card 
      title={<Space><DollarCircleOutlined style={{ color: token.colorPrimary }} /> Payments Due</Space>}
      extra={<Button type="link" size="small" onClick={() => navigate('/owner/payments')}>History</Button>}
      style={{ height: '100%', boxShadow: token.boxShadowSecondary, borderRadius: token.borderRadiusLG }}
    >
      <Row gutter={[16, 24]}>
        <Col span={24}>
          <div style={{ textAlign: 'center', background: token.colorWarningBg, padding: '16px', borderRadius: '8px', border: `1px solid ${token.colorWarningBorder}` }}>
             <Statistic title="Total Outstanding" value={data.totalOutstanding} prefix="₱" precision={2} valueStyle={{ color: token.colorWarningText }} />
             <div style={{ marginTop: 8, fontSize: 12, color: token.colorTextSecondary }}>
               Next due: {new Date(data.nearestDueDate).toLocaleDateString()}
             </div>
          </div>
        </Col>
        
        <Col span={24}>
          {(data.list || []).length === 0 ? (
            <Empty description="No payments due" style={{ padding: 24 }} />
          ) : (
            <Table 
              dataSource={data.list} 
              columns={columns} 
              pagination={false} 
              size="small"
              rowKey="id"
              showHeader={false}
              scroll={{ x: 'max-content' }}
            />
          )}
        </Col>

        <Col span={24} style={{ marginTop: 'auto' }}>
          <Space style={{ width: '100%' }} direction="vertical">
            <Button type="primary" block style={{ background: token.colorPrimary, borderColor: token.colorPrimary }} onClick={() => navigate('/owner/payments')}>Pay Now</Button>
            <Button block onClick={() => navigate('/owner/payments')}>View Receipts</Button>
          </Space>
        </Col>
      </Row>
    </Card>
  )
}

export default PaymentsDue
