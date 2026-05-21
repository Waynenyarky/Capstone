import React from 'react'
import { Collapse, Typography, Tag } from 'antd'
import dayjs from 'dayjs'

const { Text, Paragraph } = Typography
const { Panel } = Collapse

export default function MaintenancePreview({ formValues, token }) {
  const action = formValues?.action
  const whenToStart = formValues?.whenToStart
  const scheduledStart = formValues?.scheduledStartAt
  const expectedResume = formValues?.expectedResumeAt
  const message = formValues?.message

  if (!action) return null

  const content = (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ padding: 16, background: token.colorBgContainer, borderRadius: 8, border: `0.5px solid ${token.colorBorderSecondary}` }}>
        <div style={{ marginBottom: 12 }}>
          <Tag color={action === 'enable' ? 'green' : 'red'} style={{ marginBottom: 8 }}>
            {action === 'enable' ? 'Enable' : 'Disable'} Maintenance Mode
          </Tag>
        </div>
        {message && (
          <Text style={{ fontSize: 14, display: 'block', marginBottom: 12 }}>
            {message}
          </Text>
        )}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {whenToStart === 'scheduled' && scheduledStart && (
            <Text type="secondary" style={{ fontSize: 12 }}>
              Starting at: {dayjs(scheduledStart).format('MMM D, YYYY HH:mm')}
            </Text>
          )}
          {whenToStart === 'now' && (
            <Text type="secondary" style={{ fontSize: 12 }}>
              Starting at: Immediately after approval
            </Text>
          )}
          {expectedResume && (
            <Text type="secondary" style={{ fontSize: 12 }}>
              Back online at: {dayjs(expectedResume).format('MMM D, YYYY HH:mm')}
            </Text>
          )}
        </div>
      </div>
    </div>
  )

  // Card view for immediate start (matches public landing page style)
  if (whenToStart === 'now') {
    return (
      <div style={{ marginTop: 16 }}>
        <div
          style={{
            padding: 16,
            border: `0.5px solid ${token.colorBorderSecondary}`,
            borderRadius: token.borderRadius,
            background: token.colorBgContainer,
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 8 }}>
            <div style={{ color: token.colorPrimary }}>
              {action === 'enable' ? 'System Maintenance Underway' : 'Maintenance Disabled'}
            </div>
            {message && (
              <Paragraph style={{ marginBottom: 0, fontSize: 14 }}>
                {message}
              </Paragraph>
            )}
            {whenToStart === 'now' && (
              <Text type="secondary" style={{ fontSize: 12, display: 'block', marginTop: 8 }}>
                Starting at: Immediately after approval
              </Text>
            )}
            {expectedResume && (
              <Text type="secondary" style={{ fontSize: 12, display: 'block', marginTop: 4 }}>
                Back online at: {dayjs(expectedResume).format('MMM D, YYYY h:mm A')}
              </Text>
            )}
          </div>
        </div>
      </div>
    )
  }

  // Accordion view for scheduled maintenance
  return (
    <Collapse defaultActiveKey={['preview']} style={{ marginTop: 16 }}>
      <Panel header="Live Preview" key="preview">
        {content}
      </Panel>
    </Collapse>
  )
}
