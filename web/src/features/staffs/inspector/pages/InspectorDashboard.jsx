import React from 'react'
import { Result, Typography } from 'antd'
import { MobileOutlined } from '@ant-design/icons'
import StaffLayout from '../../components/StaffLayout'

const { Paragraph } = Typography

export default function InspectorDashboard() {
  return (
    <StaffLayout pageTitle="Inspector" pageIcon={<MobileOutlined />}>
      <div style={{ padding: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1 }}>
        <Result
          icon={<MobileOutlined style={{ color: '#1890ff' }} />}
          title="Inspector Portal"
          subTitle="Inspections are managed through the BizClear mobile app."
        >
          <Paragraph type="secondary" style={{ textAlign: 'center', maxWidth: 400, margin: '0 auto' }}>
            Download the BizClear mobile app to view assigned inspections, conduct on-site inspections,
            complete checklists, record violations, capture evidence, and submit inspection reports.
          </Paragraph>
        </Result>
      </div>
    </StaffLayout>
  )
}
