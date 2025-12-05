import { Form, App } from 'antd'
import { useState } from 'react'
import { useAuthSession } from "@/features/authentication"
import { fetchJsonWithFallback } from "@/lib/http.js"
import { useNotifier } from '@/shared/notifications.js'

export function useConfirmDeleteAccountForm({ onSubmit, email, deleteToken } = {}) {
  const [form] = Form.useForm()
  const [isSubmitting, setSubmitting] = useState(false)
  const { logout } = useAuthSession()
  const { success, error } = useNotifier()

  const handleFinish = async () => {
    const payload = { email, deleteToken }
    try {
      setSubmitting(true)
      const data = await fetchJsonWithFallback('/api/auth/delete-account/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const date = data?.user?.deletionScheduledFor ? new Date(data.user.deletionScheduledFor) : null
      const dateStr = date ? date.toLocaleString() : 'in 30 days'
      success(`Account deletion scheduled for ${dateStr}`)
      form.resetFields()
      try { logout() } catch (err) { void err }
      if (typeof onSubmit === 'function') onSubmit(data)
    } catch (err) {
      console.error('Confirm delete account error:', err)
      error(err, 'Failed to schedule account deletion')
    } finally {
      setSubmitting(false)
    }
  }

  return { form, handleFinish, isSubmitting }
}