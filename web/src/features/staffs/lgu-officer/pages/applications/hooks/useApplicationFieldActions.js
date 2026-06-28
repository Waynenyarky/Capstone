import { App } from 'antd'
import { PermitApplicationService } from '@/features/staffs/lgu-officer/services/permitApplicationService'

export function useApplicationFieldActions(application, setApplication) {
  const { message } = App.useApp()
  const permitService = new PermitApplicationService()

  const handleFieldDecision = async (fieldKey, payload) => {
    const appId = application?.applicationId || application?.businessId || application?._id
    if (!appId) {
      console.error('[useApplicationFieldActions] No applicationId or businessId, cannot update field decision')
      return
    }

    try {
      const updated = await permitService.updateFieldDecisions({
        applicationId: appId,
        businessId: application.businessId,
        fieldKey,
        status: payload.status,
        reasonCode: payload.reasonCode,
        reasonOther: payload.reasonOther,
      })
      if (updated) setApplication(updated)
    } catch (error) {
      console.error('Failed to update field decision:', error)
      message.error(error?.message || 'Failed to update field decision')
    }
  }

  const handleSaveLob = async (payload) => {
    if (!application?.applicationId) return
    try {
      const updated = await permitService.updateLobFormData({
        applicationId: application.applicationId,
        businessId: application.businessId,
        businessDescriptionText: payload.businessDescriptionText,
        businessActivities: payload.businessActivities,
      })
      if (updated) setApplication(updated)
      message.success('LOB changes saved')
    } catch (error) {
      console.error('Failed to save LOB:', error)
      message.error(error?.message || 'Failed to save LOB changes')
    }
  }

  return { handleFieldDecision, handleSaveLob }
}
