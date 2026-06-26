import { useState, useEffect, useCallback } from 'react'
import { App } from 'antd'
import { PermitApplicationService } from '@/features/staffs/lgu-officer/infrastructure/services/permitApplicationService'
import { getActiveFormDefinition, getPublicFormDefinition } from '@/features/admin/services/formDefinitionService'

export function useApplicationData(initialApplication, form) {
  const [application, setApplication] = useState(initialApplication)
  const [formDefinition, setFormDefinition] = useState(null)
  const [formDefLoading, setFormDefLoading] = useState(false)
  const [loading, setLoading] = useState(false)
  const { message } = App.useApp()

  const permitService = new PermitApplicationService()

  const loadApplicationDetails = useCallback(async () => {
    if (!initialApplication?.applicationId) return

    setLoading(true)
    try {
      const details = await permitService.getApplicationById(
        initialApplication.applicationId,
        initialApplication.businessId
      )
      setApplication(details)
    } catch (error) {
      console.error('Failed to load application details:', error)
      message.error('Failed to load application details')
    } finally {
      setLoading(false)
    }
  }, [initialApplication?.applicationId, initialApplication?.businessId, message])

  useEffect(() => {
    if (initialApplication) {
      setApplication(initialApplication)
      loadApplicationDetails()
      form.resetFields()
    }
  }, [initialApplication?.applicationId, loadApplicationDetails, form])

  useEffect(() => {
    const app = application || initialApplication
    if (!app?.applicationId) {
      setFormDefinition(null)
      return
    }

    let cancelled = false
    setFormDefLoading(true)
    setFormDefinition(null)

    const formDefId = app?.formDefinitionId
    const formType = app?.formType || 'permit'

    const fetchDef = async () => {
      try {
        let res
        if (formDefId) {
          res = await getPublicFormDefinition(formDefId)
        } else {
          res = await getActiveFormDefinition(formType, app?.businessRegistration?.businessType || null, null)
        }
        if (cancelled) return
        if (res?.success && res?.definition) {
          setFormDefinition(res.definition)
        }
      } catch (e) {
        if (!cancelled) console.error('Failed to load form definition for review:', e)
      } finally {
        if (!cancelled) setFormDefLoading(false)
      }
    }
    fetchDef()
    return () => { cancelled = true }
  }, [application?.applicationId, application?.formDefinitionId, application?.formType, application?.businessRegistration?.businessType, initialApplication])

  return {
    application,
    setApplication,
    formDefinition,
    formDefLoading,
    loading,
    loadApplicationDetails,
  }
}
