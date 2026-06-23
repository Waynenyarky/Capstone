import { Grid } from 'antd'
import { DollarOutlined } from '@ant-design/icons'

import AdminLayout from '../components/AdminLayout'
import { AdminFeesDesktopView, AdminFeesMobileView } from './fees/index'

export default function AdminFees() {
  const screens = Grid.useBreakpoint()
  const isMobile = !screens.md

  return (
    <AdminLayout pageTitle="Fees" pageIcon={<DollarOutlined />}>
      {isMobile ? <AdminFeesMobileView /> : <AdminFeesDesktopView />}
    </AdminLayout>
  )
}
