import React from 'react'
import { Form, App } from 'antd'
import { useCategoryTable } from "@/features/admin/services/hooks/useCategoryTable.js"
import { fetchJsonWithFallback } from "@/lib/http.js"
import { notifyCategoryUpdated } from "@/features/admin/services/lib/categoriesEvents.js"
import { useNotifier } from '@/shared/notifications.js'

export function useEditCategoryForm(selectedCategoryId) {
  const { categories, reloadCategories, isLoading } = useCategoryTable()
  const [form] = Form.useForm()
  const { success, error } = useNotifier()
  const [selectedId, setSelectedId] = React.useState(selectedCategoryId || null)
  const [saving, setSaving] = React.useState(false)

  const selected = React.useMemo(() => {
    return categories.find((c) => String(c.id) === String(selectedId)) || null
  }, [categories, selectedId])

  React.useEffect(() => {
    if (selectedCategoryId && selectedCategoryId !== selectedId) {
      setSelectedId(selectedCategoryId)
    }
  }, [selectedCategoryId, selectedId])

  React.useEffect(() => {
    if (selected) {
      form.setFieldsValue({
        categoryId: selected.id,
        icon: selected.icon || undefined,
        name: selected.name || '',
        description: selected.description || '',
        status: selected.status || undefined,
      })
    } else {
      form.resetFields()
    }
  }, [selected, form])

  const onSave = async () => {
    try {
      const values = await form.validateFields()
      const id = String(values.categoryId ?? selected?.id ?? selectedId ?? '').trim()
      if (!id) {
        error('Select a category')
        return
      }
      const payload = {
        icon: values.icon,
        name: values.name,
        description: values.description,
        status: values.status,
      }
      setSaving(true)
      const updated = await fetchJsonWithFallback(`/api/categories/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      success('Category updated')
      setSaving(false)
      try { notifyCategoryUpdated(updated) } catch (err) { void err }
      await reloadCategories()
    } catch (err) {
      setSaving(false)
      if (err?.message) error(err.message)
    }
  }

  return {
    categories,
    isLoading,
    selected,
    form,
    selectedId,
    setSelectedId,
    onSave,
    saving,
  }
}