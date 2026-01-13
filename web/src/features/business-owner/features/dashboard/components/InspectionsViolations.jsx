import React from 'react'
import { Card, Table, Tag, Button, Space, Typography, Row, Col, Alert, theme } from 'antd'
import { SafetyCertificateOutlined } from '@ant-design/icons'
import { Link } from 'react-router-dom'

const { Text } = Typography

const InspectionsViolations = ({ data }) => {
  const { token } = theme.useToken();
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
      title={<Space><SafetyCertificateOutlined style={{ color: token.colorPrimary }} /> Inspections & Violations</Space>}
      extra={<Link to="/owner/inspections"><Button type="link" size="small">Details</Button></Link>}
      style={{ height: '100%', boxShadow: token.boxShadowSecondary, borderRadius: token.borderRadiusLG }}
    >
      <Row gutter={[16, 24]}>
        <Col span={24}>
           {data.upcoming && (
             <Alert 
               message="Upcoming Inspection" 
               description={`${new Date(data.upcoming.date).toLocaleDateString()} - ${data.upcoming.inspector}`}
               type="info" 
               showIcon 
               style={{ border: `1px solid ${token.colorInfoBorder}`, background: token.colorInfoBg }}
             />
           )}
        </Col>

        <Col span={24}>
           <Row gutter={16} align="middle" style={{ background: token.colorFillAlter, padding: 16, borderRadius: 8 }}>
             <Col span={12} style={{ textAlign: 'center', borderRight: `1px solid ${token.colorBorderSecondary}` }}>
               <Text type="secondary" style={{ fontSize: 12 }}>Last Inspection Result</Text>
               <div style={{ marginTop: 4 }}>
                 <Tag color={data.recentResult === 'Passed' ? 'success' : data.recentResult === 'Failed' ? 'error' : 'warning'} style={{ fontSize: 14, padding: '4px 10px' }}>
                    {data.recentResult}
                 </Tag>
               </div>
             </Col>
             <Col span={12} style={{ textAlign: 'center' }}>
               <Text type="secondary" style={{ fontSize: 12 }}>Open Violations</Text>
               <div style={{ fontSize: 24, fontWeight: 'bold', color: data.openViolations > 0 ? token.colorError : token.colorSuccess, lineHeight: 1 }}>
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
            <Link to="/owner/inspections"><Button block>View Inspection Reports</Button></Link>
            <Link to="/owner/inspections"><Button type="primary" ghost block style={{ color: token.colorPrimary, borderColor: token.colorPrimary }}>Submit Compliance Evidence</Button></Link>
          </Space>
        </Col>
      </Row>
    </Card>
  )
}

export default InspectionsViolations
