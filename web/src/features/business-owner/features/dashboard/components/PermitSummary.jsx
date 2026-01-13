import React from 'react'
import { Card, Table, Tag, Button, Space, Statistic, Row, Col, theme } from 'antd'
import { FileProtectOutlined } from '@ant-design/icons'
import { Link } from 'react-router-dom'

const PermitSummary = ({ data }) => {
  const { token } = theme.useToken();
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
      title={<Space><FileProtectOutlined style={{ color: token.colorPrimary }} /> Permit Summary</Space>}
      extra={<Button type="link" size="small">View All</Button>}
      style={{ height: '100%', boxShadow: token.boxShadowSecondary, borderRadius: token.borderRadiusLG }}
    >
      <Row gutter={[16, 24]}>
        <Col span={24}>
           <Row gutter={16}>
            <Col span={8} style={{ textAlign: 'center' }}>
              <Statistic title="Active" value={data.active} valueStyle={{ color: token.colorSuccess }} />
            </Col>
            <Col span={8} style={{ textAlign: 'center', borderLeft: `1px solid ${token.colorBorderSecondary}`, borderRight: `1px solid ${token.colorBorderSecondary}` }}>
              <Statistic title="Pending" value={data.pending} valueStyle={{ color: token.colorWarning }} />
            </Col>
            <Col span={8} style={{ textAlign: 'center' }}>
              <Statistic title="Expiring" value={data.expiring} valueStyle={{ color: token.colorError }} />
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
            <Button type="primary" block style={{ background: token.colorPrimary, borderColor: token.colorPrimary }}>Apply for New Permit</Button>
            <Button block>Renew Existing Permits</Button>
          </Space>
        </Col>
      </Row>
    </Card>
  )
}

export default PermitSummary
