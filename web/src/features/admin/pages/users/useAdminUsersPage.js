import { useState, useCallback, useEffect, useRef } from 'react'
import { Form } from 'antd'
import { useStaffManagement, roleLabel, officeLabel } from '../../hooks'
import { updateStaff, resetStaffPassword } from '../../services'
import { useNotifier } from '@/shared/notifications'

export { roleLabel, officeLabel }

/** Staff status: active | pending (awaiting onboarding) | disabled (admin disabled) */
export function getStaffStatus(rec) {
  if (!rec) return null
  const isActive = rec.isActive !== false
  if (!isActive) return 'disabled'
  const needsOnboarding = rec.mustChangeCredentials || rec.mustSetupMfa
  if (needsOnboarding) return 'pending'
  return 'active'
}

export function getStaffStatusTag(rec) {
  const status = getStaffStatus(rec)
  if (status === 'active') return { label: 'Active', color: 'green' }
  if (status === 'pending') return { label: 'Pending', color: 'orange' }
  if (status === 'disabled') return { label: 'Disabled', color: 'red' }
  return { label: '—', color: 'default' }
}

export function useAdminUsersPage() {
  const staffMgmt = useStaffManagement()
  const { success, error } = useNotifier()
  const [lastUpdated, setLastUpdated] = useState(null)
  const prevLoadingRef = useRef(true)

  useEffect(() => {
    if (prevLoadingRef.current && !staffMgmt.loadingStaff) {
      setLastUpdated(new Date())
    }
    prevLoadingRef.current = staffMgmt.loadingStaff
  }, [staffMgmt.loadingStaff])

  const [editOpen, setEditOpen] = useState(false)
  const [editForm] = Form.useForm()
  const [editLoading, setEditLoading] = useState(false)
  const [editTarget, setEditTarget] = useState(null)

  const [resetOpen, setResetOpen] = useState(false)
  const [resetForm] = Form.useForm()
  const [resetLoading, setResetLoading] = useState(false)
  const [resetTarget, setResetTarget] = useState(null)

  const [disableOpen, setDisableOpen] = useState(false)
  const [disableForm] = Form.useForm()
  const [disableLoading, setDisableLoading] = useState(false)
  const [disableTarget, setDisableTarget] = useState(null)

  const openEditModal = useCallback((record) => {
    setEditTarget(record)
    editForm.setFieldsValue({
      firstName: record.firstName,
      lastName: record.lastName,
      email: record.email,
      phoneNumber: record.phoneNumber || '',
      office: record.office || undefined,
      role: record.role || undefined,
      isActive: record.isActive !== false,
      reasonType: undefined,
      reasonOther: '',
    })
    setEditOpen(true)
  }, [editForm])

  const handleEditSubmit = useCallback(async () => {
    try {
      const values = await editForm.validateFields()
      if (!editTarget?.id) return
      setEditLoading(true)
      const { reasonType, reasonOther, ...payload } = values
      await updateStaff(editTarget.id, payload)
      success('Staff updated')
      setEditOpen(false)
      setEditTarget(null)
      await staffMgmt.loadStaff()
    } catch (e) {
      if (e?.errorFields) return
      error(e, 'Failed to update staff')
    } finally {
      setEditLoading(false)
    }
  }, [editForm, editTarget, staffMgmt.loadStaff, success, error])

  const openResetModal = useCallback((record) => {
    setResetTarget(record)
    resetForm.setFieldsValue({ reasonType: undefined, reasonOther: '' })
    setResetOpen(true)
  }, [resetForm])

  const handleResetSubmit = useCallback(async () => {
    try {
      const values = await resetForm.validateFields()
      if (!resetTarget?.id) return
      setResetLoading(true)
      await resetStaffPassword(resetTarget.id, values)
      success('Temporary password issued')
      setResetOpen(false)
      setResetTarget(null)
      await staffMgmt.loadStaff()
    } catch (e) {
      if (e?.errorFields) return
      error(e, 'Failed to reset password')
    } finally {
      setResetLoading(false)
    }
  }, [resetForm, resetTarget, staffMgmt.loadStaff, success, error])

  const openDisableModal = useCallback((record) => {
    setDisableTarget(record)
    disableForm.setFieldsValue({ reasonType: undefined, reasonOther: '' })
    setDisableOpen(true)
  }, [disableForm])

  const handleDisableSubmit = useCallback(async () => {
    try {
      const values = await disableForm.validateFields()
      if (!disableTarget?.id) return
      setDisableLoading(true)
      await updateStaff(disableTarget.id, { isActive: false, reason: values.reason })
      success('Account disabled')
      setDisableOpen(false)
      setDisableTarget(null)
      await staffMgmt.loadStaff()
    } catch (e) {
      if (e?.errorFields) return
      error(e, 'Failed to disable account')
    } finally {
      setDisableLoading(false)
    }
  }, [disableForm, disableTarget, staffMgmt.loadStaff, success, error])

  const [activateOpen, setActivateOpen] = useState(false)
  const [activateForm] = Form.useForm()
  const [activateLoading, setActivateLoading] = useState(false)
  const [activateTarget, setActivateTarget] = useState(null)

  const openActivateModal = useCallback((record) => {
    setActivateTarget(record)
    activateForm.setFieldsValue({ reasonType: undefined, reasonOther: '' })
    setActivateOpen(true)
  }, [activateForm])

  const handleActivateSubmit = useCallback(async () => {
    try {
      const values = await activateForm.validateFields()
      if (!activateTarget?.id) return
      setActivateLoading(true)
      await updateStaff(activateTarget.id, { isActive: true, reason: values.reason })
      success('Account activated')
      setActivateOpen(false)
      setActivateTarget(null)
      await staffMgmt.loadStaff()
    } catch (e) {
      if (e?.errorFields) return
      error(e, 'Failed to activate account')
    } finally {
      setActivateLoading(false)
    }
  }, [activateForm, activateTarget, staffMgmt.loadStaff, success, error])

  return {
    ...staffMgmt,
    lastUpdated,
    editOpen,
    setEditOpen,
    editForm,
    editLoading,
    editTarget,
    openEditModal,
    handleEditSubmit,
    resetOpen,
    setResetOpen,
    resetForm,
    resetLoading,
    openResetModal,
    handleResetSubmit,
    disableOpen,
    setDisableOpen,
    disableForm,
    disableLoading,
    openDisableModal,
    handleDisableSubmit,
    activateOpen,
    setActivateOpen,
    activateForm,
    activateLoading,
    openActivateModal,
    handleActivateSubmit,
  }
}
