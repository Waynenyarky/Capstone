import React from 'react'
import { Collapse, Typography, Tag } from 'antd'
import dayjs from 'dayjs'

const { Text } = Typography
const { Panel } = Collapse

export default function MaintenancePreview({ formValues, token }) {
  const action = formValues?.action
  const whenToStart = formValues?.whenToStart
  const scheduledStart = formValues?.scheduledStartAt
  const expectedResume = formValues?.expectedResumeAt
  const reason = formValues?.reasonPreset && formValues.reasonPreset !== 'other' 
    ? formValues.reasonPreset 
    : formValues?.reason
  const message = formValues?.message

  if (!action) return null

  return (
    <Collapse defaultActiveKey={['preview']} style={{ marginTop: 16 }}>
      <Panel header="Live Preview" key="preview">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ padding: 16, background: token.colorBgContainer, borderRadius: 8, border: `1px solid ${token.colorBorderSecondary}` }}>
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
                  Starts: {dayjs(scheduledStart).format('MMM D, YYYY HH:mm')}
                </Text>
              )}
              {whenToStart === 'now' && (
                <Text type="secondary" style={{ fontSize: 12 }}>
                  Starts: Immediately after approval
                </Text>
              )}
              {expectedResume && (
                <Text type="secondary" style={{ fontSize: 12 }}>
                  Resumes: {dayjs(expectedResume).format('MMM D, YYYY HH:mm')}
                </Text>
              )}
              {reason && (
                <Text type="secondary" style={{ fontSize: 12 }}>
                  Reason: {reason}
                </Text>
              )}
            </div>
          </div>
        </div>
      </Panel>
    </Collapse>
  )
}
