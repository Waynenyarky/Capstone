import React from 'react'
import { Button, Grid } from 'antd'
import { ReloadOutlined, CheckCircleOutlined } from '@ant-design/icons'
import AdminLayout from '../components/AdminLayout'
import { RequestsDesktopView, RequestsMobileView } from './requests'

export default function AdminRequests() {
  const screens = Grid.useBreakpoint()
  const isMobile = !screens.md

  return (
    <AdminLayout
      pageTitle="Requests"
      pageIcon={<CheckCircleOutlined />}
      headerActions={
        <Button
          icon={<ReloadOutlined />}
          onClick={() => window.dispatchEvent(new CustomEvent('admin-requests-refresh'))}
          aria-label="Refresh"
        />
      }
    >
      <div
        style={
          isMobile
            ? { overflow: 'auto', flex: 1 }
            : { height: '100%', minHeight: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }
        }
      >
        {isMobile ? (
          <RequestsMobileView />
        ) : (
          <RequestsDesktopView />
        )}
      </div>
    </AdminLayout>
  )
}
