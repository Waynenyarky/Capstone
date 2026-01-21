import { useState, useEffect, useCallback } from 'react'
import { Form } from 'antd'
import {
  getStaffList,
  createStaff,
  getOffices,
  createOffice,
  updateOffice,
  deleteOffice,
  getStaffRoles,
  createStaffRole,
  updateStaffRole,
  deleteStaffRole,
} from '../services'
import { useNotifier } from '@/shared/notifications'

export const officeGroups = [
  {
    label: 'Core Offices',
    options: [
      { value: 'OSBC', label: 'OSBC – One Stop Business Center' },
      { value: 'CHO', label: 'CHO – City Health Office' },
      { value: 'BFP', label: 'BFP – Bureau of Fire Protection' },
      { value: 'CEO / ZC', label: 'CEO / ZC – City Engineering Office / Zoning Clearance' },
      { value: 'BH', label: 'BH – Barangay Hall / Barangay Business Clearance' },
    ],
  },
  {
    label: 'Preneed / Inter-Govt Clearances',
    options: [
      { value: 'DTI', label: 'DTI – Department of Trade and Industry' },
      { value: 'SEC', label: 'SEC – Securities and Exchange Commission' },
      { value: 'CDA', label: 'CDA – Cooperative Development Authority' },
    ],
  },
  {
    label: 'Specialized / Conditional Offices',
    options: [
      { value: 'PNP-FEU', label: 'PNP‑FEU – Firearms & Explosives Unit' },
      { value: 'FDA / BFAD / DOH', label: 'FDA / BFAD / DOH – Food & Drug Administration / Bureau of Food & Drugs / Department of Health' },
      { value: 'PRC / PTR', label: 'PRC / PTR – Professional Regulatory Commission / Professional Tax Registration Boards' },
      { value: 'NTC', label: 'NTC – National Telecommunications Commission' },
      { value: 'POEA', label: 'POEA – Philippine Overseas Employment Administration' },
      { value: 'NIC', label: 'NIC – National Insurance Commission' },
      { value: 'ECC / ENV', label: 'ECC / ENV – Environmental Compliance Certificate / Environmental Office' },
    ],
  },
  {
    label: 'Support / Coordination Offices',
    options: [
      { value: 'CTO', label: "CTO – City Treasurer’s Office" },
      { value: 'MD', label: 'MD – Market Division / Sector-Specific Divisions' },
      { value: 'CLO', label: 'CLO – City Legal Office' },
    ],
  },
]

export const roleOptions = [
  { value: 'lgu_officer', label: 'LGU Officer' },
  { value: 'lgu_manager', label: 'LGU Manager' },
  { value: 'inspector', label: 'LGU Inspector' },
  { value: 'cso', label: 'Customer Support Officer' },
]

const defaultOffices = officeGroups.flatMap((group) =>
  (group.options || []).map((opt) => ({
    id: opt.value,
    code: opt.value,
    name: opt.label,
    group: group.label,
    isActive: true,
  }))
)

const defaultRoles = roleOptions.map((opt) => ({
  id: opt.value,
  slug: opt.value,
  name: opt.label,
  displayName: opt.label,
}))

export function roleLabel(role, options = roleOptions) {
  const key = String(role || '').toLowerCase()
  const fromOptions = (options || []).find((opt) => String(opt?.value || '').toLowerCase() === key)
  if (fromOptions?.label) return fromOptions.label
  const map = {
    lgu_officer: 'LGU Officer',
    lgu_manager: 'LGU Manager',
    inspector: 'LGU Inspector',
    cso: 'Customer Support Officer',
  }
  return map[key] || key
}

export function officeLabel(value, groups = officeGroups) {
  const v = String(value || '')
  for (const group of groups || []) {
    for (const opt of group.options) {
      if (opt.value === v) return opt.label
    }
  }
  return v
}

export function useStaffManagement() {
  const { success, error } = useNotifier()
  const [staff, setStaff] = useState([])
  const [loadingStaff, setLoadingStaff] = useState(false)
  const [tabKey, setTabKey] = useState('staff')
  const [createOpen, setCreateOpen] = useState(false)
  const [form] = Form.useForm()
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const [pendingValues, setPendingValues] = useState(null)
  const [successOpen, setSuccessOpen] = useState(false)
  const [successData, setSuccessData] = useState(null)
  const [offices, setOffices] = useState(defaultOffices)
  const [roles, setRoles] = useState(defaultRoles)
  const [loadingOffices, setLoadingOffices] = useState(false)
  const [loadingRoles, setLoadingRoles] = useState(false)

  const loadStaff = useCallback(async () => {
    setLoadingStaff(true)
    try {
      const staffList = await getStaffList()
      setStaff(staffList)
    } catch (e) {
      console.error('Load staff error:', e)
      setStaff([])
      error(e, 'Failed to load staff')
    } finally {
      setLoadingStaff(false)
    }
  }, [error])

  useEffect(() => {
    loadStaff()
  }, [loadStaff])

  const loadOffices = useCallback(async () => {
    setLoadingOffices(true)
    try {
      const list = await getOffices()
      if (Array.isArray(list) && list.length) {
        setOffices(list)
      } else {
        setOffices(defaultOffices)
      }
    } catch (e) {
      console.error('Load offices error:', e)
      setOffices(defaultOffices)
      error(e, 'Failed to load offices')
    } finally {
      setLoadingOffices(false)
    }
  }, [error])

  const loadRoles = useCallback(async () => {
    setLoadingRoles(true)
    try {
      const list = await getStaffRoles()
      if (Array.isArray(list) && list.length) {
        setRoles(list)
      } else {
        setRoles(defaultRoles)
      }
    } catch (e) {
      console.error('Load roles error:', e)
      setRoles(defaultRoles)
      error(e, 'Failed to load roles')
    } finally {
      setLoadingRoles(false)
    }
  }, [error])

  useEffect(() => {
    loadOffices()
    loadRoles()
  }, [loadOffices, loadRoles])

  const handleCreateSubmit = (values) => {
    setPendingValues(values)
    setConfirmOpen(true)
  }

  const handleConfirmCreate = async () => {
    const values = pendingValues || {}
    try {
      setConfirming(true)
      const startedAt = Date.now()
      const payload = {
        email: values.email,
        office: values.office,
        role: values.role,
      }
      const created = await createStaff(payload)
      const elapsed = Date.now() - startedAt
      if (elapsed < 1200) {
        await new Promise((r) => setTimeout(r, 1200 - elapsed))
      }
      success('Staff account created')
      form.resetFields()
      setCreateOpen(false)
      setConfirmOpen(false)
      setPendingValues(null)
      await loadStaff()
      setTabKey('staff')
      setSuccessData({
        id: created?.id,
        email: created?.email || values.email,
        office: created?.office || values.office,
        role: created?.role || values.role,
        status: 'Pending First Login & MFA Setup',
        username: created?.username,
        devTempPassword: created?.devTempPassword,
      })
      setSuccessOpen(true)
    } catch (e) {
      console.error('Create staff error:', e)
      error(e, 'Failed to create staff account')
    } finally {
      setConfirming(false)
    }
  }

  const openCreateModal = () => setCreateOpen(true)
  const closeCreateModal = () => setCreateOpen(false)
  const closeConfirmModal = () => !confirming && setConfirmOpen(false)
  const closeSuccessModal = () => setSuccessOpen(false)

  const addOffice = async (office) => {
    if (!office) return
    await createOffice(office)
    await loadOffices()
  }

  const updateOfficeEntry = async (officeId, updates) => {
    if (!officeId) return
    await updateOffice(officeId, updates)
    await loadOffices()
  }

  const removeOfficeEntry = async (officeId) => {
    if (!officeId) return
    await deleteOffice(officeId)
    await loadOffices()
  }

  const addRole = async (role) => {
    if (!role) return
    await createStaffRole(role)
    await loadRoles()
  }

  const updateRoleEntry = async (roleId, updates) => {
    if (!roleId) return
    await updateStaffRole(roleId, updates)
    await loadRoles()
  }

  const removeRoleEntry = async (roleId) => {
    if (!roleId) return
    await deleteStaffRole(roleId)
    await loadRoles()
  }

  const officeGroupsState = offices.reduce((acc, office) => {
    const groupLabel = office.group || 'Other Offices'
    let group = acc.find((item) => item.label === groupLabel)
    if (!group) {
      group = { label: groupLabel, options: [] }
      acc.push(group)
    }
    group.options.push({ value: office.code, label: office.name })
    return acc
  }, [])

  const roleOptionsState = roles.map((role) => ({
    value: role.slug,
    label: role.displayName || role.name || role.slug,
  }))

  return {
    staff,
    loadingStaff,
    loadStaff,
    tabKey,
    setTabKey,
    createOpen,
    openCreateModal,
    closeCreateModal,
    form,
    handleCreateSubmit,
    confirmOpen,
    closeConfirmModal,
    confirming,
    handleConfirmCreate,
    pendingValues,
    successOpen,
    successData,
    closeSuccessModal,
    offices,
    roles,
    loadingOffices,
    loadingRoles,
    officeGroupsState,
    roleOptionsState,
    addOffice,
    updateOffice: updateOfficeEntry,
    removeOffice: removeOfficeEntry,
    addRole,
    updateRole: updateRoleEntry,
    removeRole: removeRoleEntry,
    loadOffices,
    loadRoles,
  }
}
