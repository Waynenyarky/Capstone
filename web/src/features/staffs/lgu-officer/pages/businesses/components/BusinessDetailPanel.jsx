import { Typography } from 'antd'
import { useCallback } from 'react'

const { Title, Text } = Typography

export default function BusinessDetailPanel({ business }) {
  const handleHeaderAction = useCallback(() => {
    // Header buttons should not work for now
  }, [])

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header with disabled actions */}
      <div style={{ 
        padding: '16px 24px', 
        borderBottom: '1px solid #f0f0f0',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div>
          <Title level={4} style={{ margin: 0 }}>
            {business?.businessName || 'Business Details'}
          </Title>
          <Text type="secondary" style={{ fontSize: 12 }}>
            {business?.applicationReferenceNumber || 'No reference number'}
          </Text>
        </div>
        {/* Header buttons - disabled for now */}
        <div style={{ display: 'flex', gap: 8 }}>
          {/* Placeholder for future header actions */}
        </div>
      </div>

      {/* Empty body for now */}
      <div style={{ 
        flex: 1, 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        padding: 24
      }}>
        <Text type="secondary">Business details coming soon...</Text>
      </div>
    </div>
  )
}
