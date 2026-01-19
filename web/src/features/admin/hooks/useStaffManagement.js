import { useState, useEffect, useCallback } from 'react'
import { Form } from 'antd'
import { getStaffList, createStaff } from '../services'
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

export function roleLabel(role) {
  const key = String(role || '').toLowerCase()
  const map = {
    lgu_officer: 'LGU Officer',
    lgu_manager: 'LGU Manager',
    inspector: 'LGU Inspector',
    cso: 'Customer Support Officer',
  }
  return map[key] || key
}

export function officeLabel(value) {
  const v = String(value || '')
  for (const group of officeGroups) {
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
    closeSuccessModal
  }
}
