import React from 'react'
import { Card, Table, Tag, Button, Space, Statistic, Row, Col } from 'antd'
import { DollarCircleOutlined } from '@ant-design/icons'

const PaymentsDue = ({ data }) => {
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
        if (status === 'Unpaid') color = 'orange'
        if (status === 'Paid') color = 'green'
        return <Tag color={color}>{status}</Tag>
      }
    },
  ]

  return (
    <Card 
      title={<Space><DollarCircleOutlined style={{ color: '#faad14' }} /> Payments Due</Space>}
      extra={<Button type="link" size="small">History</Button>}
      style={{ height: '100%' }}
    >
      <Row gutter={[16, 24]}>
        <Col span={24}>
          <div style={{ textAlign: 'center', background: '#fffbe6', padding: '16px', borderRadius: '8px', border: '1px solid #ffe58f' }}>
             <Statistic title="Total Outstanding" value={data.totalOutstanding} prefix="₱" precision={2} valueStyle={{ color: '#faad14' }} />
             <div style={{ marginTop: 8, fontSize: 12, color: '#8c8c8c' }}>
               Next due: {new Date(data.nearestDueDate).toLocaleDateString()}
             </div>
          </div>
        </Col>
        
        <Col span={24}>
          <Table 
            dataSource={data.list} 
            columns={columns} 
            pagination={false} 
            size="small"
            rowKey="id"
            showHeader={false}
          />
        </Col>

        <Col span={24} style={{ marginTop: 'auto' }}>
          <Space style={{ width: '100%' }} direction="vertical">
            <Button type="primary" block style={{ background: '#001529', borderColor: '#001529' }}>Pay Now</Button>
            <Button block>View Receipts</Button>
          </Space>
        </Col>
      </Row>
    </Card>
  )
}

export default PaymentsDue
