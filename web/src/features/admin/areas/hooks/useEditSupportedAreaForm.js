import { useCallback, useMemo, useState } from 'react'
import { App } from 'antd'
import { useNotifier } from '@/shared/notifications.js'
import { useAddSupportedAreas } from "@/features/admin/areas/hooks/useAddSupportedAreas.js"

export function useEditSupportedAreaForm(provinceName) {
  const { modal } = App.useApp()
  const { success } = useNotifier()
  const { areasByProvince, saveAreas, reloadAreas, isLoading } = useAddSupportedAreas()
  const [isSaving, setIsSaving] = useState(false)

  const record = useMemo(() => {
    const list = Array.isArray(areasByProvince) ? areasByProvince : []
    return list.find((grp) => String(grp?.province).trim() === String(provinceName).trim()) || null
  }, [areasByProvince, provinceName])

  const computeDiff = useCallback((nextCities, nextActive) => {
    const prevCities = Array.isArray(record?.cities) ? record.cities : []
    const prevActive = record?.active !== false
    const nextSet = new Set((Array.isArray(nextCities) ? nextCities : []).map((c) => String(c)))
    const prevSet = new Set(prevCities.map((c) => String(c)))
    const addedCities = [...nextSet].filter((c) => !prevSet.has(c))
    const removedCities = [...prevSet].filter((c) => !nextSet.has(c))
    const statusChange = prevActive !== (nextActive !== false)
    return { addedCities, removedCities, statusChange, prevActive, nextActive: nextActive !== false }
  }, [record])

  const updateProvince = useCallback(async (nextCities, nextActive, { confirm = true } = {}) => {
    if (!record) return { saved: false }
    const { addedCities, removedCities, statusChange, prevActive } = computeDiff(nextCities, nextActive)

    const performSave = async () => {
      setIsSaving(true)
      const nextAreas = (Array.isArray(areasByProvince) ? areasByProvince : []).map((grp) => {
        if (String(grp?.province).trim() === String(provinceName).trim()) {
          return {
            province: grp.province,
            cities: Array.isArray(nextCities) ? nextCities : [],
            active: nextActive === false ? false : true,
          }
        }
        return grp
      })
      const res = await saveAreas(nextAreas)
      setIsSaving(false)
      return res
    }

    if (!confirm) {
      return performSave()
    }

    const summaryLines = []
    if (addedCities.length > 0) summaryLines.push(`Add: ${addedCities.join(', ')}`)
    if (removedCities.length > 0) summaryLines.push(`Remove: ${removedCities.join(', ')}`)
    if (statusChange) summaryLines.push(`Status: ${prevActive ? 'Active' : 'Inactive'} → ${nextActive !== false ? 'Active' : 'Inactive'}`)

    return new Promise((resolve) => {
      modal.confirm({
        title: `Confirm edits for ${provinceName}`,
        content: summaryLines.length > 0 ? summaryLines.join('\n') : 'No changes detected',
        okText: 'Save Changes',
        cancelText: 'Cancel',
        onOk: async () => {
          const res = await performSave()
          if (res?.saved) success('Supported area updated')
          resolve(res)
        },
        onCancel: () => resolve({ saved: false }),
      })
    })
  }, [areasByProvince, computeDiff, provinceName, record, saveAreas, success, modal])

  const toggleActive = useCallback(async (nextActive, { withConfirm = true } = {}) => {
    if (!record) return { saved: false }
    const prevActive = record?.active !== false
    const label = nextActive === false ? 'Deactivate' : 'Activate'

    const perform = () => updateProvince(record.cities || [], nextActive, { confirm: false })

    if (!withConfirm) {
      return perform()
    }

    return new Promise((resolve) => {
      modal.confirm({
        title: `${label} ${provinceName}?`,
        content: `Status: ${prevActive ? 'Active' : 'Inactive'} → ${nextActive === false ? 'Inactive' : 'Active'}`,
        okText: label,
        cancelText: 'Cancel',
        onOk: async () => {
          const res = await perform()
          if (res?.saved) success(`Province ${label.toLowerCase()}d`)
          resolve(res)
        },
        onCancel: () => resolve({ saved: false }),
      })
    })
  }, [record, updateProvince, provinceName, success, modal])

  const saveFromForm = useCallback(async (form, { confirm = true, onSaved } = {}) => {
    try {
      const values = await (form && typeof form.validateFields === 'function' ? form.validateFields() : Promise.resolve({}))
      const nextCities = Array.isArray(values?.cities) ? values.cities : []
      const nextActive = values?.active === false ? false : true
      const res = await updateProvince(nextCities, nextActive, { confirm })
      if (res?.saved && typeof onSaved === 'function') onSaved(res)
      return res
    } catch (err) {
      void err
      return { saved: false }
    }
  }, [updateProvince])

  return {
    record,
    isLoading,
    isSaving,
    reloadAreas,
    updateProvince,
    toggleActive,
    saveFromForm,
    computeDiff,
  }
}