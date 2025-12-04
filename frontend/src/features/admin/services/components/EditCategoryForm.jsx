import React from 'react'
import { Card, Form, Select, Input, Button, Flex, Typography } from 'antd'
import IconPicker from "@/shared/components/molecules/IconPicker.jsx"
import { useEditCategoryForm } from "@/features/admin/services/hooks/useEditCategoryForm.js"
import { useConfirmEditCategory } from "@/features/admin/services/hooks/useConfirmEditCategory.js"
import { CATEGORY_STATUS_OPTIONS } from "@/features/admin/services/constants/categoryStatus.js"
import { categoryNameRules, categoryDescriptionRules, categoryIconRules, categoryStatusRules } from "@/features/admin/services/validations/categoryRules.js"

export default function EditCategoryForm({ selectedCategoryId }) {
  const {
    categories,
    isLoading,
    selected,
    form,
    selectedId,
    onSave,
    saving,
  } = useEditCategoryForm(selectedCategoryId)
  const { confirm, ConfirmModal } = useConfirmEditCategory()
  const uniqueNameValidator = async (_, value) => {
    const name = String(value || '').trim()
    if (!name) return Promise.resolve()
    const exists = (categories || []).some((c) => String(c.id) !== String(selectedId) && String(c.name || '').trim().toLowerCase() === name.toLowerCase())
    if (exists) return Promise.reject(new Error('Category name must be unique'))
    return Promise.resolve()
  }

  const handleSaveClick = async () => {
    try {
      const values = await form.validateFields()
      const ok = await confirm(values, selected)
      if (!ok) return
      await onSave()
    } catch (err) { void err }
  }

  return (
    <Card title="Edit Category">
      <Form form={form} layout="vertical" disabled={isLoading} initialValues={{ categoryId: selectedId }}>
        {/* Hidden field to keep selected category ID in form values */}
        <Form.Item name="categoryId" style={{ display: 'none' }}>
          <Input type="hidden" />
        </Form.Item>
        <Form.Item
          name="icon"
          label="Category Icon"
          rules={categoryIconRules}
          validateTrigger={["onBlur","onSubmit"]}
          hasFeedback
        >
          <IconPicker />
        </Form.Item>
        <Form.Item
          name="name"
          label="Category Name"
          rules={[...categoryNameRules, { validator: uniqueNameValidator }]}
          validateTrigger={["onBlur","onSubmit"]}
          hasFeedback
        >
          <Input allowClear autoComplete="on" />
        </Form.Item>
        <Form.Item
          name="description"
          label="Category Description"
          rules={categoryDescriptionRules}
          validateTrigger={["onBlur","onSubmit"]}
          hasFeedback
        >
          <Input.TextArea allowClear autoComplete="on" />
        </Form.Item>
        <Form.Item
          name="status"
          label="Category Status"
          rules={categoryStatusRules}
          validateTrigger={["onBlur","onSubmit"]}
          hasFeedback
        >
          <Select allowClear placeholder="Select a status">
            {CATEGORY_STATUS_OPTIONS.map(opt => (
              <Select.Option key={opt.value} value={opt.value}>
                {opt.label}
              </Select.Option>
            ))}
          </Select>
        </Form.Item>
        <Flex justify="end" gap="small">
          <Button type="primary" onClick={handleSaveClick} loading={saving} disabled={!selectedId}>Save Changes</Button>
        </Flex>
      </Form>
      <ConfirmModal />
    </Card>
  )
}