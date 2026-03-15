import React from 'react'
import { Typography, Card, Grid, theme } from 'antd'
import { GENERAL_PERMIT_CATEGORIES } from '../constants/businessFormConstants'

const { Title, Text } = Typography
const { useBreakpoint } = Grid

function GeneralPermitCategorySelector({ onSelect }) {
  const { token } = theme.useToken()
  const screens = useBreakpoint()
  const isMobile = !screens.md

  return (
    <div>
      <Title level={4} style={{ marginBottom: 8 }}>Select Permit Category</Title>
      <Typography.Paragraph type="secondary" style={{ marginBottom: 24 }}>
        Choose the type of general permit you want to apply for.
      </Typography.Paragraph>

      <div style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)',
        gap: 12
      }}>
        {GENERAL_PERMIT_CATEGORIES.map((category) => (
          <Card
            key={category.value}
            hoverable
            onClick={() => onSelect(category.value)}
            style={{
              cursor: 'pointer',
              border: `1px solid ${token.colorBorder}`,
              transition: 'all 0.2s',
            }}
            styles={{
              body: { padding: 24 }
            }}
          >
            <Text strong>{category.label}</Text>
          </Card>
        ))}
      </div>
    </div>
  )
}

export default GeneralPermitCategorySelector
