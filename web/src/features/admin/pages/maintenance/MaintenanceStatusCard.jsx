import React from 'react'
import { Card, Tag, Typography, Tooltip, Spin } from 'antd'
import { InfoCircleOutlined } from '@ant-design/icons'

const { Text } = Typography

const statusHelp = 'This reflects what the public sees. Turning maintenance on or off requires an approved request.'

export default function MaintenanceStatusCard({ current, loading }) {
  const isActive = current?.isActive === true

  return (
    <Card
      loading={loading}
      title={
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
          Maintenance mode
          <Tooltip title={statusHelp}>
            <InfoCircleOutlined style={{ color: 'var(--ant-color-text-tertiary)', fontSize: 14 }} />
          </Tooltip>
        </span>
      }
    >
      {loading && !current ? (
        <Spin size="small" />
      ) : isActive ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div>
            <Tag color="green">On</Tag>
            <Text type="secondary" style={{ marginLeft: 8 }}>
              Maintenance mode is on. Non-admin users are redirected to the maintenance page.
            </Text>
          </div>
          <div>
            <Text type="secondary">Message shown to users:</Text>
            <div style={{ marginTop: 4, padding: 12, background: 'var(--ant-colorFillQuaternary)', borderRadius: 6 }}>
              <Text>{current.message || 'No message set'}</Text>
            </div>
          </div>
          <div>
            <Text type="secondary">Expected resume: </Text>
            <Text>
              {current.expectedResumeAt
                ? new Date(current.expectedResumeAt).toLocaleString()
                : 'Not set'}
            </Text>
          </div>
        </div>
      ) : (
        <div>
          <Tag color="default">Off</Tag>
          <Text type="secondary" style={{ marginLeft: 8 }}>
            System running normally. No maintenance window active.
          </Text>
        </div>
      )}
    </Card>
  )
}
