import { Grid } from 'antd'
import { FormOutlined } from '@ant-design/icons'

import AdminLayout from '../components/AdminLayout'
import { AdminFormsDesktopView, AdminFormsMobileView } from './forms/index'

export default function AdminForms() {
  const screens = Grid.useBreakpoint()
  const isMobile = !screens.md

  return (
    <AdminLayout pageTitle="Forms" pageIcon={<FormOutlined />}>
      {isMobile ? <AdminFormsMobileView /> : <AdminFormsDesktopView />}
    </AdminLayout>
  )
}
