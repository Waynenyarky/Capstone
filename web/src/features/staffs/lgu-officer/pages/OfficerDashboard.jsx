import { Outlet } from 'react-router-dom'
import StaffLayout from '../../components/StaffLayout'
import { OfficerRealtimeProvider } from '../contexts/OfficerRealtimeContext'
import { OfficerDataProvider } from '../contexts/OfficerDataContext'

export default function OfficerDashboard() {
  return (
    <OfficerRealtimeProvider>
      <OfficerDataProvider>
        <StaffLayout
          hideSidebar={false}
          _noContentWrap
        >
          <Outlet />
        </StaffLayout>
      </OfficerDataProvider>
    </OfficerRealtimeProvider>
  )
}
