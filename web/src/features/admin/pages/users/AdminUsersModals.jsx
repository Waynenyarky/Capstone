import React from 'react'
import EditStaffModal from './EditStaffModal'
import ResetPasswordModal from './ResetPasswordModal'
import DisableAccountModal from './DisableAccountModal'
import ActivateAccountModal from './ActivateAccountModal'
import CreateStaffModals from './CreateStaffModals'
import UserManagementInfoModal from './UserManagementInfoModal'

export default function AdminUsersModals({
  editOpen,
  setEditOpen,
  editForm,
  editLoading,
  handleEditSubmit,
  resetOpen,
  setResetOpen,
  resetForm,
  resetLoading,
  handleResetSubmit,
  disableOpen,
  setDisableOpen,
  disableForm,
  disableLoading,
  handleDisableSubmit,
  activateOpen,
  setActivateOpen,
  activateForm,
  activateLoading,
  handleActivateSubmit,
  createOpen,
  closeCreateModal,
  form,
  handleCreateSubmit,
  confirmOpen,
  closeConfirmModal,
  confirming,
  handleConfirmCreate,
  pendingValues,
  successOpen,
  closeSuccessModal,
  successData,
  officeGroupsState,
  roleOptionsState,
  setTabKey,
  openCreateModal,
  infoOpen,
  closeInfo,
  isMobile,
}) {
  return (
    <>
      <EditStaffModal
        open={editOpen}
        onCancel={() => setEditOpen(false)}
        onOk={handleEditSubmit}
        loading={editLoading}
        form={editForm}
        officeGroupsState={officeGroupsState}
        roleOptionsState={roleOptionsState}
      />
      <ResetPasswordModal
        open={resetOpen}
        onCancel={() => setResetOpen(false)}
        onOk={handleResetSubmit}
        loading={resetLoading}
        form={resetForm}
      />
      <DisableAccountModal
        open={disableOpen}
        onCancel={() => setDisableOpen(false)}
        onOk={handleDisableSubmit}
        loading={disableLoading}
        form={disableForm}
      />
      <ActivateAccountModal
        open={activateOpen}
        onCancel={() => setActivateOpen(false)}
        onOk={handleActivateSubmit}
        loading={activateLoading}
        form={activateForm}
      />
      <CreateStaffModals
        createOpen={createOpen}
        onCloseCreate={closeCreateModal}
        form={form}
        onCreateSubmit={handleCreateSubmit}
        confirmOpen={confirmOpen}
        onCloseConfirm={closeConfirmModal}
        confirming={confirming}
        onConfirmCreate={handleConfirmCreate}
        pendingValues={pendingValues}
        successOpen={successOpen}
        onCloseSuccess={closeSuccessModal}
        successData={successData}
        officeGroupsState={officeGroupsState}
        roleOptionsState={roleOptionsState}
        setTabKey={setTabKey}
        openCreateModal={openCreateModal}
      />
      <UserManagementInfoModal open={infoOpen} onClose={closeInfo} isMobile={isMobile} />
    </>
  )
}
