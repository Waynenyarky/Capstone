import React from 'react'
import { Card, Table, Tag, Button, Space, Statistic, Row, Col } from 'antd'
import { FileProtectOutlined } from '@ant-design/icons'

const PermitSummary = ({ data }) => {
  if (!data) return null

  const columns = [
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
      ellipsis: true,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: status => {
        let color = 'green'
        if (status === 'Expiring Soon') color = 'orange'
        if (status === 'Expired') color = 'red'
        return <Tag color={color}>{status}</Tag>
      }
    },
    {
      title: 'Expiry',
      dataIndex: 'expiry',
      key: 'expiry',
      render: date => new Date(date).toLocaleDateString(),
      responsive: ['md']
    },
  ]

  return (
    <Card 
      title={<Space><FileProtectOutlined style={{ color: '#003a70' }} /> Permit Summary</Space>}
      extra={<Button type="link" size="small">View All</Button>}
      style={{ height: '100%', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', borderRadius: 8 }}
    >
      <Row gutter={[16, 24]}>
        <Col span={24}>
           <Row gutter={16}>
            <Col span={8} style={{ textAlign: 'center' }}>
              <Statistic title="Active" value={data.active} valueStyle={{ color: '#3f8600' }} />
            </Col>
            <Col span={8} style={{ textAlign: 'center', borderLeft: '1px solid #f0f0f0', borderRight: '1px solid #f0f0f0' }}>
              <Statistic title="Pending" value={data.pending} valueStyle={{ color: '#faad14' }} />
            </Col>
            <Col span={8} style={{ textAlign: 'center' }}>
              <Statistic title="Expiring" value={data.expiring} valueStyle={{ color: '#cf1322' }} />
            </Col>
           </Row>
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
            <Button type="primary" block style={{ background: '#003a70', borderColor: '#003a70' }}>Apply for New Permit</Button>
            <Button block>Renew Existing Permits</Button>
          </Space>
        </Col>
      </Row>
    </Card>
  )
}

export default PermitSummary
