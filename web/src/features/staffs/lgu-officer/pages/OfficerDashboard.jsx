import { Outlet } from 'react-router-dom'
import StaffLayout from '../../components/StaffLayout'
import { OfficerRealtimeProvider } from '../contexts/OfficerRealtimeContext'
import { OfficerDataProvider } from '../contexts/OfficerDataContext'
import RegisterOwnerModal from '../components/RegisterOwnerModal'
import { useState } from 'react'

export default function OfficerDashboard() {
  const [registerOwnerOpen, setRegisterOwnerOpen] = useState(false)

  const handleRegisterSuccess = () => {
    setRegisterOwnerOpen(false)
  }

  return (
    <OfficerRealtimeProvider>
      <OfficerDataProvider>
        <StaffLayout
          hideSidebar={false}
          _noContentWrap
        >
          <Outlet />
        </StaffLayout>
        <RegisterOwnerModal
          open={registerOwnerOpen}
          onClose={() => setRegisterOwnerOpen(false)}
          onSuccess={handleRegisterSuccess}
        />
      </OfficerDataProvider>
    </OfficerRealtimeProvider>
  )
}
