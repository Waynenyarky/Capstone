import React, { useState, useCallback } from 'react'
import { Row, Col, Card, Tabs, Button } from 'antd'
import { PlusOutlined } from '@ant-design/icons'
import UserManagementDesktopView from './UserManagementDesktopView'
import StaffAccountsTab from './StaffAccountsTab'
import StaffByOfficeRoleTab from './StaffByOfficeRoleTab'
import AdminAccountsTab from './AdminAccountsTab'
import AdminLogsTab from './AdminLogsTab'
import OverviewTab from './OverviewTab'
import { UsersTable } from '@/features/admin/users'

const TAB_ITEMS = [
  { key: 'overview', label: 'Overview' },
  { key: 'logs', label: 'History' },
  { key: 'staff', label: 'Staff Accounts' },
  { key: 'office-role', label: 'Staff by Office & Role' },
  { key: 'admins', label: 'Admins' },
  { key: 'business', label: 'Business Owners' },
]

export default function UserManagementContent({
  tabKey,
  setTabKey,
  isMobile,
  staff,
  loadingStaff,
  officeGroupsState,
  roleOptionsState,
  openEditModal,
  openResetModal,
  openDisableModal,
  openActivateModal,
  activateLoading,
  openCreateModal,
  loadStaff,
  currentUserId,
}) {
  const [selectedStaffId, setSelectedStaffId] = useState(null)

  const onNavigateToStaff = useCallback((staffId) => {
    setSelectedStaffId(staffId)
    setTabKey('staff')
  }, [setTabKey])

  const clearSelectedStaffId = useCallback(() => setSelectedStaffId(null), [])

  const tabChildren = {
    overview: <OverviewTab staff={staff} />,
    staff: (
      <StaffAccountsTab
        staff={staff}
        loading={loadingStaff}
        officeGroupsState={officeGroupsState}
        roleOptionsState={roleOptionsState}
        onEdit={openEditModal}
        onResetPassword={openResetModal}
        onDisableAccount={openDisableModal}
        onActivateAccount={openActivateModal}
        activateLoading={activateLoading}
        onAddEmployee={isMobile ? openCreateModal : undefined}
        selectedStaffId={selectedStaffId}
        clearSelectedStaffId={clearSelectedStaffId}
      />
    ),
    'office-role': (
      <StaffByOfficeRoleTab
        staff={staff}
        loading={loadingStaff}
        officeGroupsState={officeGroupsState}
        roleOptionsState={roleOptionsState}
        onNavigateToStaff={onNavigateToStaff}
      />
    ),
    admins: (
      <AdminAccountsTab currentUserId={currentUserId} />
    ),
    business: <UsersTable />,
    logs: <AdminLogsTab />,
  }

  if (isMobile) {
    return (
      <Row gutter={[16, 16]}>
        <Col span={24}>
          <Card styles={{ body: { background: 'transparent' } }} style={{ background: 'transparent' }}>
            <Tabs
              activeKey={tabKey}
              onChange={setTabKey}
              items={TAB_ITEMS.map(({ key, label }) => ({ key, label, children: tabChildren[key] }))}
            />
          </Card>
        </Col>
      </Row>
    )
  }

  return (
    <UserManagementDesktopView
      tabKey={tabKey}
      setTabKey={setTabKey}
      tabItems={TAB_ITEMS}
      tabChildren={tabChildren}
      headerActions={
        tabKey === 'staff' ? (
          <Button type="primary" icon={<PlusOutlined />} onClick={openCreateModal}>
            Add Employee
          </Button>
        ) : null
      }
    />
  )
}
