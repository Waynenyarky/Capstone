import React from 'react'
import { Form, InputNumber, Input, Tag, Card, Row, Col } from 'antd'

const { TextArea } = Input

const RiskProfileForm = ({ form, initialValues, onValuesChange, riskLevel }) => {
  const getRiskColor = (level) => {
    switch (level) {
      case 'low': return 'green'
      case 'medium': return 'orange'
      case 'high': return 'red'
      default: return 'default'
    }
  }

  const getRiskText = (level) => {
    switch (level) {
      case 'low': return 'Low Risk'
      case 'medium': return 'Medium Risk'
      case 'high': return 'High Risk'
      default: return 'Not Calculated'
    }
  }

  // Form is already provided by parent, just render form items
  return (
    <Card title="Risk Profile Details" style={{ marginBottom: 24 }}>
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name={['riskProfile', 'businessSize']}
              label="Business Size (Number of Employees)"
            >
              <InputNumber
                style={{ width: '100%' }}
                min={0}
                placeholder="Enter number of employees"
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name={['riskProfile', 'annualRevenue']}
              label="Annual Revenue (PHP)"
            >
              <InputNumber
                style={{ width: '100%' }}
                min={0}
                formatter={value => `₱ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                parser={value => value.replace(/₱\s?|(,*)/g, '')}
                placeholder="Enter annual revenue"
              />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item
          name={['riskProfile', 'businessActivitiesDescription']}
          label="Business Activities Description"
        >
          <TextArea
            rows={4}
            placeholder="Describe the main activities and operations of your business"
          />
        </Form.Item>

        <Form.Item label="Risk Level (System Calculated)">
          <div>
            <Tag color={getRiskColor(riskLevel)} style={{ fontSize: 14, padding: '4px 12px' }}>
              {getRiskText(riskLevel)}
            </Tag>
            <div style={{ marginTop: 8, color: '#666', fontSize: 12 }}>
              Risk level is automatically calculated based on business size, revenue, type, and other factors.
            </div>
          </div>
        </Form.Item>
      </Card>
  )
}

export default RiskProfileForm
