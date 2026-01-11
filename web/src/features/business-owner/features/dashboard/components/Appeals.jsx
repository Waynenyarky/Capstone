import React from 'react'
import { Card, Table, Tag, Button, Space, Statistic, Row, Col } from 'antd'
import { ContainerOutlined } from '@ant-design/icons'

const Appeals = ({ data }) => {
  if (!data) return null

  const columns = [
    {
      title: 'Ref No',
      dataIndex: 'refNo',
      key: 'refNo',
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: status => <Tag color="processing">{status}</Tag>
    },
  ]

  return (
    <Card 
      title={<Space><ContainerOutlined style={{ color: '#003a70' }} /> Appeals</Space>}
      extra={<Button type="link" size="small">All Appeals</Button>}
      style={{ height: '100%', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', borderRadius: 8 }}
    >
      <Row gutter={[16, 16]}>
        <Col span={8}>
          <Statistic title="Active" value={data.active} />
        </Col>
        <Col span={8}>
          <Statistic title="Under Review" value={data.underReview} />
        </Col>
        <Col span={8}>
          <Statistic title="Decided" value={data.decided} />
        </Col>
        
        <Col span={24}>
          <Table 
            dataSource={data.list} 
            columns={columns} 
            pagination={false} 
            size="small"
            rowKey="id"
          />
        </Col>

        <Col span={24}>
          <Space style={{ width: '100%' }}>
            <Button type="primary" block style={{ background: '#003a70', borderColor: '#003a70' }}>File Appeal</Button>
            <Button block>Status</Button>
          </Space>
        </Col>
      </Row>
    </Card>
  )
}

export default Appeals
