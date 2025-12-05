import { Form, Input, Button, Flex, Card, Select } from 'antd'
import { categoryNameRules, categoryDescriptionRules, categoryIconRules, categoryStatusRules } from "@/features/admin/services/validations/categoryRules.js"
import { CATEGORY_STATUS_OPTIONS } from "@/features/admin/services/constants/categoryStatus.js"
import IconPicker from "@/shared/components/molecules/IconPicker.jsx"
import { useCategoryForm } from "@/features/admin/services/hooks/useCategoryForm.js"
import { useConfirmCreateCategory } from "@/features/admin/services/hooks/useConfirmCreateCategory.js"
import { useCategoryTable } from "@/features/admin/services/hooks/useCategoryTable.js"

export default function CreateCategoryForm() {
  const { form, handleFinish } = useCategoryForm()
  const { confirm, ConfirmModal } = useConfirmCreateCategory()
  const { categories } = useCategoryTable()
  const uniqueNameValidator = async (_, value) => {
    const name = String(value || '').trim()
    if (!name) return Promise.resolve()
    const exists = (categories || []).some((c) => String(c.name || '').trim().toLowerCase() === name.toLowerCase())
    if (exists) return Promise.reject(new Error('Category name must be unique'))
    return Promise.resolve()
  }
  const onFinish = async (values) => {
    const ok = await confirm(values)
    if (!ok) return
    await handleFinish(values)
  }
  // Quick helper to prefill demo data for fast local testing
  const handlePrefillDemo = () => {
    const rand = Math.floor(1000 + Math.random() * 9000)
    form.setFieldsValue({
      icon: 'HeartOutlined',
      name: `Companionship ${rand}`,
      description: 'Friendly home care companionship and support.',
      status: 'active',
    })
  }
  return (
    <Card title="Create Category" >
      <Form form={form} layout="vertical" onFinish={onFinish}>
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
          <Button onClick={handlePrefillDemo}>Prefill Demo</Button>
          <Button type="primary" htmlType="submit">Continue</Button>
        </Flex>
      </Form>
      <ConfirmModal />
    </Card>
  )
}
