import React from 'react'
import { Button, Space, Grid } from 'antd'
import {
  FormOutlined,
  ReloadOutlined,
  InfoCircleOutlined,
} from '@ant-design/icons'

import AdminLayout from '../components/AdminLayout'
import { FormDefinitionsDesktopView, FormDefinitionsMobileView } from './formDefinitions/components'

export default function AdminFormDefinitions() {
  const screens = Grid.useBreakpoint()
  const isMobile = !screens.md

  return (
    <AdminLayout
      pageTitle="Form Definitions"
      pageIcon={<FormOutlined />}
      headerActions={
        <Space size="middle">
          <Button icon={<ReloadOutlined />} aria-label="Refresh">
            {isMobile ? 'Refresh' : ''}
          </Button>
          <Button icon={<InfoCircleOutlined />} type={isMobile ? 'text' : ''} aria-label="About">
            {isMobile ? 'Info' : ''}
          </Button>
        </Space>
      }
    >
      {isMobile ? <FormDefinitionsMobileView /> : <FormDefinitionsDesktopView />}
    </AdminLayout>
  )
}
