import React, { useState, useCallback } from 'react'
import { Button, Space, Grid } from 'antd'
import {
  FormOutlined,
  ReloadOutlined,
  InfoCircleOutlined,
} from '@ant-design/icons'

import AdminLayout from '../components/AdminLayout'
import { FormDefinitionsDesktopView, FormDefinitionsMobileView } from './formDefinitions/components'
import FormDefinitionsInfoModal from './FormDefinitionsInfoModal'

export default function AdminFormDefinitions() {
  const screens = Grid.useBreakpoint()
  const isMobile = !screens.md
  const [refreshKey, setRefreshKey] = useState(0)
  const [infoOpen, setInfoOpen] = useState(false)

  const handleRefresh = useCallback(() => setRefreshKey((k) => k + 1), [])
  const openInfo = useCallback(() => setInfoOpen(true), [])
  const closeInfo = useCallback(() => setInfoOpen(false), [])

  return (
    <AdminLayout
      pageTitle="Form Definitions"
      pageIcon={<FormOutlined />}
      headerActions={
        <Space size="middle">
          <Button icon={<ReloadOutlined />} onClick={handleRefresh} aria-label="Refresh">
            Refresh
          </Button>
          <Button icon={<InfoCircleOutlined />} type={isMobile ? 'text' : 'default'} onClick={openInfo} aria-label="About">
            About
          </Button>
        </Space>
      }
    >
      {isMobile ? (
        <FormDefinitionsMobileView refreshKey={refreshKey} />
      ) : (
        <FormDefinitionsDesktopView refreshKey={refreshKey} />
      )}
      <FormDefinitionsInfoModal open={infoOpen} onClose={closeInfo} isMobile={isMobile} />
    </AdminLayout>
  )
}
