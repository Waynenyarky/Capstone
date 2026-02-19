import React, { useState, useCallback, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Button, Grid, Typography } from 'antd'
import { InfoCircleOutlined, ReloadOutlined, TeamOutlined } from '@ant-design/icons'
import AdminLayout from '../components/AdminLayout'
import { useAuthSession } from '@/features/authentication'
import { useAdminUsersPage } from './users/useAdminUsersPage'
import UserManagementContent from './users/UserManagementContent'
import AdminUsersModals from './users/AdminUsersModals'

const { Text } = Typography

export default function AdminUsers() {
  const [searchParams] = useSearchParams()
  const screens = Grid.useBreakpoint()
  const isMobile = !screens.md
  const [infoOpen, setInfoOpen] = useState(false)
  const closeInfo = useCallback(() => setInfoOpen(false), [])
  const { currentUser } = useAuthSession()

  const api = useAdminUsersPage()
  const {
    tabKey,
    setTabKey,
    staff,
    loadingStaff,
    loadStaff,
    lastUpdated,
    openCreateModal,
    officeGroupsState,
    roleOptionsState,
    openEditModal,
    openResetModal,
    openDisableModal,
    openActivateModal,
    activateLoading,
    form,
    editForm,
    disableForm,
  } = api

  const MOCK_STAFF = {
    id: 'dev-mock-staff',
    firstName: 'Dev',
    lastName: 'Staff',
    email: 'dev.staff@example.com',
    phoneNumber: '',
    office: 'OSBC',
    role: 'inspector',
    isActive: true,
  }

  useEffect(() => {
    if (import.meta.env.MODE === 'production') return undefined
    const handler = (event) => {
      const { action, tab, prefillInvalid, useFirstStaff, openUserDetail, useFirstUser, openAdminEdit, useFirstAdmin } = event?.detail || {}
      if (action === 'setTab' && tab) {
        setTabKey(tab)
      } else if (action === 'openCreateModal') {
        openCreateModal()
        if (prefillInvalid) {
          setTimeout(() => {
            form?.setFieldsValue({
              email: 'invalid-email',
              office: undefined,
              role: undefined,
            })
          }, 150)
        }
      } else if (action === 'openEditModal' && useFirstStaff) {
        const record = staff?.[0] || MOCK_STAFF
        openEditModal(record)
        if (prefillInvalid) {
          setTimeout(() => {
            editForm?.setFieldsValue({
              firstName: '',
              reasonType: 'others',
              reasonOther: 'x',
            })
          }, 150)
        }
      } else if (action === 'openResetModal' && useFirstStaff) {
        openResetModal(staff?.[0] || MOCK_STAFF)
      } else if (action === 'openDisableModal' && useFirstStaff) {
        const record = staff?.[0] || MOCK_STAFF
        openDisableModal(record)
        if (prefillInvalid && disableForm) {
          setTimeout(() => {
            disableForm.setFieldsValue({ reasonType: 'others', reasonOther: 'ab' })
          }, 150)
        }
      } else if (action === 'openActivateModal' && useFirstStaff) {
        openActivateModal(staff?.[0] || MOCK_STAFF)
      } else if (action === 'openUserDetail' && useFirstUser) {
        setTabKey('business')
        setTimeout(() => {
          window.dispatchEvent(new CustomEvent('devtools:usermgmt-open-user-detail'))
        }, 200)
      } else if (action === 'openAdminEdit' && useFirstAdmin) {
        setTabKey('admins')
        setTimeout(() => {
          window.dispatchEvent(new CustomEvent('devtools:usermgmt-open-admin-edit'))
        }, 200)
      }
    }
    window.addEventListener('devtools:usermgmt', handler)
    return () => window.removeEventListener('devtools:usermgmt', handler)
  }, [setTabKey, openCreateModal, openEditModal, openResetModal, openDisableModal, openActivateModal, form, editForm, disableForm, staff])

  useEffect(() => {
    const tab = searchParams.get('tab')
    if (tab === 'logs') setTabKey('logs')
  }, [searchParams, setTabKey])

  const initialLogId = searchParams.get('logId') || null

  return (
    <AdminLayout
      pageTitle="User Management"
      pageIcon={<TeamOutlined />}
      headerActions={
        <>
          {lastUpdated && (
            <Text type="secondary" style={{ fontSize: 12 }}>
              Last updated: {lastUpdated.toLocaleTimeString()}
            </Text>
          )}
          <Button  icon={<ReloadOutlined />} onClick={loadStaff} loading={loadingStaff} aria-label="Refresh staff" />
          <Button  icon={<InfoCircleOutlined />} onClick={() => setInfoOpen(true)} aria-label="About" />
        </>
      }
    >
      <div style={isMobile ? { overflow: 'auto' } : { height: '100%', minHeight: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <UserManagementContent
          tabKey={tabKey}
          setTabKey={setTabKey}
          isMobile={isMobile}
          staff={staff}
          loadingStaff={loadingStaff}
          officeGroupsState={officeGroupsState}
          roleOptionsState={roleOptionsState}
          openEditModal={openEditModal}
          openResetModal={openResetModal}
          openDisableModal={openDisableModal}
          openActivateModal={openActivateModal}
          openCreateModal={openCreateModal}
          loadStaff={loadStaff}
          currentUserId={currentUser?.id}
          initialLogId={initialLogId}
        />
        <AdminUsersModals
          {...api}
          infoOpen={infoOpen}
          closeInfo={closeInfo}
          isMobile={isMobile}
        />
        {api.stepUpModal}
      </div>
    </AdminLayout>
  )
}
