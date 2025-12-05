import { Form } from 'antd'
import { notifyCategoryCreated } from "@/features/admin/services/lib/categoriesEvents.js"
import { fetchJsonWithFallback } from "@/lib/http.js"
import { useNotifier } from '@/shared/notifications.js'


export function useCategoryForm({ onCreated, onError } = {}) {
  const [form] = Form.useForm()
  const { success, error } = useNotifier()

  const handleFinish = async (values) => {
    try {
      const created = await fetchJsonWithFallback('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      })
      success('Category created')
      form.resetFields()
      if (typeof onCreated === 'function') onCreated(created)
      notifyCategoryCreated(created)
    } catch (err) {
      console.error('Create category failed:', err)
      error(err, 'Create category failed')
      if (typeof onError === 'function') onError(err)
    }
  }

  // Do not set default status; let Select show its placeholder

  const reset = () => form.resetFields()

  return { form, handleFinish, reset }
}