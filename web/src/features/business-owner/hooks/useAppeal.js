import { useState, useEffect } from 'react'
import { App } from 'antd'
import { submitAppeal, getAppeals } from '../services/appealsService'

export function useAppeal(businessId, isRejected) {
  const { message } = App.useApp()
  const [appealOpen, setAppealOpen] = useState(false)
  const [appealSubmitting, setAppealSubmitting] = useState(false)
  const [latestAppeal, setLatestAppeal] = useState(null)

  useEffect(() => {
    let mounted = true

    const loadAppealStatus = async () => {
      if (!isRejected || !businessId) {
        if (mounted) setLatestAppeal(null)
        return
      }

      try {
        const res = await getAppeals({ page: 1, limit: 50 })
        const payload = res?.data ?? res
        const appeals = Array.isArray(payload)
          ? payload
          : Array.isArray(payload?.data)
            ? payload.data
            : []

        const latest = appeals
          .filter((item) => (item?.businessId || '') === businessId)
          .sort((a, b) => new Date(b?.createdAt || 0).getTime() - new Date(a?.createdAt || 0).getTime())[0] || null

        if (mounted) setLatestAppeal(latest)
      } catch {
        if (mounted) setLatestAppeal(null)
      }
    }

    loadAppealStatus()
    return () => {
      mounted = false
    }
  }, [isRejected, businessId])

  const handleSubmitAppeal = async (values) => {
    if (!businessId) {
      message.error('Unable to file appeal: business ID is missing.')
      return
    }

    setAppealSubmitting(true)
    try {
      const created = await submitAppeal({
        businessId,
        appealType: values.appealType,
        description: values.description,
      })
      const createdAppeal = created?.data ?? created
      if (createdAppeal && typeof createdAppeal === 'object') {
        setLatestAppeal(createdAppeal)
      }
      message.success('Appeal submitted successfully.')
      setAppealOpen(false)
      return true
    } catch (err) {
      message.error(err?.message || 'Failed to submit appeal')
      return false
    } finally {
      setAppealSubmitting(false)
    }
  }

  return {
    appealOpen,
    setAppealOpen,
    appealSubmitting,
    latestAppeal,
    handleSubmitAppeal,
  }
}
