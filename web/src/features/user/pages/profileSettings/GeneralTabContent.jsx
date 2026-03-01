import React from 'react'
import EditUserProfileForm from '@/features/user/components/EditUserProfileForm.jsx'
import PendingApprovalAlert from '@/features/user/components/PendingApprovalAlert.jsx'

export default function GeneralTabContent() {
  return (
    <div style={{ width: '100%', height: '100%', minHeight: 0, display: 'flex', flexDirection: 'column' }}>
      <PendingApprovalAlert />
      <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
        <EditUserProfileForm embedded simpleLayout />
      </div>
    </div>
  )
}
