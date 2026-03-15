import React from 'react'
import { Card, Typography, Button, Space, Grid } from 'antd'
import { ArrowLeftOutlined } from '@ant-design/icons'

const { Title, Text, Paragraph } = Typography
const { useBreakpoint } = Grid

const GENERAL_PERMIT_CATEGORIES = [
  { value: 'construction', label: 'Construction Permit', description: 'Building construction, renovation, or demolition permits' },
  { value: 'special_event', label: 'Special Event Permit', description: 'Events, festivals, concerts, and public gatherings' },
  { value: 'health', label: 'Health Permit', description: 'Food establishments, health facilities, sanitary permits' },
  { value: 'environmental', label: 'Environmental Permit', description: 'Environmental compliance, waste management, pollution control' },
  { value: 'safety', label: 'Safety Permit', description: 'Fire safety, occupational safety, emergency preparedness' },
  { value: 'zoning', label: 'Zoning Permit', description: 'Land use, zoning compliance, location permits' },
  { value: 'signage', label: 'Signage Permit', description: 'Business signs, billboards, advertising displays' },
  { value: 'fish_pond', label: 'Fish Pond Permit', description: 'Aquaculture, fish pond operations, fishing permits' },
]

function GeneralPermitCategorySelector({ onSelect, onBack, token }) {
  const screens = useBreakpoint()
  const isMobile = !screens.md

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto' }}>
      <div style={{ marginBottom: 24 }}>
        <Button
          type="text"
          icon={<ArrowLeftOutlined />}
          onClick={onBack}
          style={{ marginBottom: 16 }}
        >
          Back to selection
        </Button>
        <Title level={3} style={{ marginBottom: 8 }}>
          Select General Permit Category
        </Title>
        <Paragraph type="secondary">
          Choose the specific type of general permit you need to apply for
        </Paragraph>
      </div>

      <Space direction={isMobile ? 'vertical' : 'horizontal'} size={16} wrap style={{ width: '100%' }}>
        {GENERAL_PERMIT_CATEGORIES.map((category) => (
          <Card
            key={category.value}
            hoverable
            style={{ 
              width: isMobile ? '100%' : 'calc(50% - 8px)',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              border: `1px solid ${token.colorBorderSecondary}`,
            }}
            bodyStyle={{ padding: 16 }}
            onClick={() => onSelect(category.value)}
          >
            <div>
              <Title level={5} style={{ margin: '0 0 8px 0' }}>
                {category.label}
              </Title>
              <Text type="secondary" style={{ fontSize: 12 }}>
                {category.description}
              </Text>
            </div>
          </Card>
        ))}
      </Space>

      <div style={{ textAlign: 'center', marginTop: 32 }}>
        <Text type="secondary">
          Don't see your category listed? Contact our support team for assistance.
        </Text>
      </div>
    </div>
  )
}

export default GeneralPermitCategorySelector
