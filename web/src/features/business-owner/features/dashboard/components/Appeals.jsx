import React from 'react'
import { Card, Table, Tag, Button, Space, Statistic, Row, Col, Empty, theme } from 'antd'
import { ContainerOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'

const Appeals = ({ data }) => {
  const { token } = theme.useToken()
  const navigate = useNavigate()
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
      title={<Space><ContainerOutlined style={{ color: token.colorPrimary }} /> Appeals</Space>}
      extra={<Button type="link" size="small" onClick={() => navigate('/owner/my-appeals')}>All Appeals</Button>}
      style={{ height: '100%', boxShadow: token.boxShadowSecondary, borderRadius: token.borderRadiusLG }}
    >
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={8}>
          <Statistic title="Active" value={data.active} />
        </Col>
        <Col xs={24} sm={8}>
          <Statistic title="Under Review" value={data.underReview} />
        </Col>
        <Col xs={24} sm={8}>
          <Statistic title="Decided" value={data.decided} />
        </Col>
        
        <Col span={24}>
          {(data.list || []).length === 0 ? (
            <Empty description="No active appeals" style={{ padding: 24 }} />
          ) : (
            <Table 
              dataSource={data.list} 
              columns={columns} 
              pagination={false} 
              size="small"
              rowKey="id"
              scroll={{ x: 'max-content' }}
            />
          )}
        </Col>

        <Col span={24}>
          <Space style={{ width: '100%' }}>
            <Button type="primary" block style={{ background: token.colorPrimary, borderColor: token.colorPrimary }} onClick={() => navigate('/owner/my-appeals')}>File Appeal</Button>
            <Button block onClick={() => navigate('/owner/my-appeals')}>Status</Button>
          </Space>
        </Col>
      </Row>
    </Card>
  )
}

export default Appeals
