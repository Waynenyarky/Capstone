import React, { useState, useCallback } from 'react'
import { Button, Grid, Typography } from 'antd'
import { ReloadOutlined, CheckCircleOutlined, InfoCircleOutlined } from '@ant-design/icons'
import AdminLayout from '../components/AdminLayout'
import { RequestsDesktopView, RequestsMobileView } from './requests'
import RequestsInfoModal from './requests/RequestsInfoModal'

const { Text } = Typography

export default function AdminRequests() {
  const screens = Grid.useBreakpoint()
  const isMobile = !screens.md
  const [lastUpdated, setLastUpdated] = useState(null)
  const [infoOpen, setInfoOpen] = useState(false)

  const handleRefresh = useCallback(() => {
    window.dispatchEvent(new CustomEvent('admin-requests-refresh'))
    setLastUpdated(new Date())
  }, [])

  const mainHeaderActions = (
    <>
      {lastUpdated && (
        <Text type="secondary" style={{ fontSize: 12 }}>
          Last updated: {lastUpdated.toLocaleTimeString()}
        </Text>
      )}
      <Button icon={<ReloadOutlined />} onClick={handleRefresh} aria-label="Refresh" />
      <Button icon={<InfoCircleOutlined />} onClick={() => setInfoOpen(true)} aria-label="About" />
    </>
  )

  return (
    <AdminLayout
      pageTitle="Requests"
      pageIcon={<CheckCircleOutlined />}
      headerActions={mainHeaderActions}
    >
      <div
        style={
          isMobile
            ? { overflow: 'auto', flex: 1 }
            : { height: '100%', minHeight: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }
        }
      >
        {isMobile ? (
          <RequestsMobileView onLastUpdated={setLastUpdated} />
        ) : (
          <RequestsDesktopView onLastUpdated={setLastUpdated} />
        )}
      </div>
      <RequestsInfoModal open={infoOpen} onClose={() => setInfoOpen(false)} />
    </AdminLayout>
  )
}
