import React from 'react'
import { Card, Table, Tag, Button, Space, Typography, Row, Col, Alert } from 'antd'
import { SafetyCertificateOutlined } from '@ant-design/icons'

const { Text } = Typography

const InspectionsViolations = ({ data }) => {
  if (!data) return null

  const columns = [
    {
      title: 'Date',
      dataIndex: 'date',
      key: 'date',
      render: date => new Date(date).toLocaleDateString(),
    },
    {
      title: 'Finding',
      dataIndex: 'finding',
      key: 'finding',
      ellipsis: true,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: status => <Tag color={status === 'Open' ? 'red' : 'green'}>{status}</Tag>
    },
  ]

  return (
    <Card 
      title={<Space><SafetyCertificateOutlined style={{ color: '#003a70' }} /> Inspections & Violations</Space>}
      extra={<Button type="link" size="small">Details</Button>}
      style={{ height: '100%', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', borderRadius: 8 }}
    >
      <Row gutter={[16, 24]}>
        <Col span={24}>
           {data.upcoming && (
             <Alert 
               message="Upcoming Inspection" 
               description={`${new Date(data.upcoming.date).toLocaleDateString()} - ${data.upcoming.inspector}`}
               type="info" 
               showIcon 
               style={{ border: '1px solid #91d5ff', background: '#e6f7ff' }}
             />
           )}
        </Col>

        <Col span={24}>
           <Row gutter={16} align="middle" style={{ background: '#fafafa', padding: 16, borderRadius: 8 }}>
             <Col span={12} style={{ textAlign: 'center', borderRight: '1px solid #f0f0f0' }}>
               <Text type="secondary" style={{ fontSize: 12 }}>Last Inspection Result</Text>
               <div style={{ marginTop: 4 }}>
                 <Tag color={data.recentResult === 'Passed' ? 'success' : data.recentResult === 'Failed' ? 'error' : '#faad14'} style={{ fontSize: 14, padding: '4px 10px' }}>
                    {data.recentResult}
                 </Tag>
               </div>
             </Col>
             <Col span={12} style={{ textAlign: 'center' }}>
               <Text type="secondary" style={{ fontSize: 12 }}>Open Violations</Text>
               <div style={{ fontSize: 24, fontWeight: 'bold', color: data.openViolations > 0 ? '#cf1322' : '#3f8600', lineHeight: 1 }}>
                 {data.openViolations}
               </div>
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
            <Button block>View Inspection Reports</Button>
            <Button type="primary" ghost block style={{ color: '#003a70', borderColor: '#003a70' }}>Submit Compliance Evidence</Button>
          </Space>
        </Col>
      </Row>
    </Card>
  )
}

export default InspectionsViolations
