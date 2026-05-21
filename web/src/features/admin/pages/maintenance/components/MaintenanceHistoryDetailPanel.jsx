import React from 'react'
import { Typography, Tag, Descriptions, Space, theme, Empty } from 'antd'
import { HistoryOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'

const { Text, Title } = Typography

function userName(user) {
  if (!user) return '—'
  if (typeof user === 'object') {
    const name = [user.firstName, user.lastName].filter(Boolean).join(' ')
    return name || user.email || user._id || '—'
  }
  return '—'
}

function userEmail(user) {
  if (!user || typeof user !== 'object') return ''
  return user.email || ''
}

const STATUS_COLORS = {
  approved: 'success',
  rejected: 'error',
}

export default function MaintenanceHistoryDetailPanel({ approval, token: tokenProp }) {
  const { token } = theme.useToken()
  const t = tokenProp ?? token

  if (!approval) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', padding: 24 }}>
        <Empty
          image={<HistoryOutlined style={{ fontSize: 48, color: t.colorTextQuaternary }} />}
          styles={{ image: { height: 60 } }}
          description={<Text type="secondary">Select a record to view details</Text>}
        />
      </div>
    )
  }

  const details = approval.requestDetails || {}
  const actionLabel = details.action === 'enable' ? 'Enable maintenance' : 'Disable maintenance'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header - same structure as LogDetailPanel */}
      <div
        style={{
          flexShrink: 0,
          padding: '16px 16px',
          borderBottom: `1px solid ${t.colorBorderSecondary}`,
          display: 'flex',
          alignItems: 'flex-start',
          gap: 12,
        }}
      >
        <span
          style={{
            width: 32,
            height: 32,
            borderRadius: t.borderRadius,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: t.colorFillTertiary,
            color: t.colorPrimary,
            flexShrink: 0,
          }}
        >
          <HistoryOutlined style={{ fontSize: 16 }} />
        </span>
        <div style={{ minWidth: 0, flex: 1 }}>
          <Title level={5} style={{ margin: 0, lineHeight: 1.3 }}>
            {actionLabel}
          </Title>
          <Text type="secondary" style={{ fontSize: 12 }}>
            {userName(approval.requestedBy)} {userEmail(approval.requestedBy) ? `(${userEmail(approval.requestedBy)})` : ''}
          </Text>
        </div>
      </div>

      {/* Content - same Descriptions style as LogDetailPanel */}
      <div style={{ flex: 1, minHeight: 0, overflow: 'auto', padding: '16px 20px' }}>
        <Descriptions
          column={1}
          size="small"
          styles={{
            label: { color: t.colorTextSecondary, fontSize: 12, paddingBottom: 2 },
            content: { fontSize: 13, paddingBottom: 12 },
          }}
        >
          <Descriptions.Item label="Status">
            <Tag color={STATUS_COLORS[approval.status]} style={{ textTransform: 'capitalize' }}>{approval.status}</Tag>
          </Descriptions.Item>
          <Descriptions.Item label="Requested by">
            {userName(approval.requestedBy)}
            {userEmail(approval.requestedBy) && (
              <Text type="secondary" style={{ marginLeft: 8 }}>({userEmail(approval.requestedBy)})</Text>
            )}
          </Descriptions.Item>
          {approval.createdAt && (
            <Descriptions.Item label="Created">
              {dayjs(approval.createdAt).format('MMMM D, YYYY HH:mm:ss')}
            </Descriptions.Item>
          )}
          <Descriptions.Item label="Action">{actionLabel}</Descriptions.Item>
          {details.message != null && details.message !== '' && (
            <Descriptions.Item label="Public Announcement Message">{details.message}</Descriptions.Item>
          )}
          {details.expectedResumeAt && (
            <Descriptions.Item label="Expected resume">
              {dayjs(details.expectedResumeAt).format('MMMM D, YYYY HH:mm')}
            </Descriptions.Item>
          )}
          <Descriptions.Item label="Approvals">
            {approval.approvals?.filter((a) => a.approved).length ?? 0} / {approval.requiredApprovals ?? 2}
          </Descriptions.Item>
        </Descriptions>

        {approval.approvals?.length > 0 && (
          <div style={{ marginTop: 16 }}>
            <Text strong style={{ display: 'block', marginBottom: 8, fontSize: 13 }}>Admin votes</Text>
            <Space direction="vertical" style={{ width: '100%' }} size="small">
              {approval.approvals.map((a, i) => (
                <div
                  key={i}
                  style={{
                    padding: 8,
                    background: t.colorFillQuaternary,
                    borderRadius: t.borderRadius,
                    fontSize: 12,
                  }}
                >
                  <Space>
                    <Tag color={a.approved ? 'success' : 'error'}>
                      {a.approved ? 'Approved' : 'Rejected'}
                    </Tag>
                    {userName(a.adminId)}
                    {a.timestamp && (
                      <Text type="secondary">{dayjs(a.timestamp).format('MMM D, YYYY HH:mm')}</Text>
                    )}
                  </Space>
                  {a.comment && (
                    <div style={{ marginTop: 4 }}>
                      <Text type="secondary">{a.comment}</Text>
                    </div>
                  )}
                </div>
              ))}
            </Space>
          </div>
        )}
      </div>
    </div>
  )
}
