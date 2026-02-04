import { useState, useEffect } from 'react'
import { Form, App } from 'antd'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { usePermitApplications } from './usePermitApplications'
import { usePermitApplicationFilters } from './usePermitApplicationFilters'
import { buildUploadFileList, normFile } from '../utils/formUtils'
import { setRegistrationFormValues } from '../utils/setRegistrationFormValues'
import { buildRegistrationUpdatePayload } from '../utils/editPayloads'
import { parseReviewComments, parseReviewCommentsFromRecord } from '../utils/reviewComments'
import { getBusinessProfile, setPrimaryBusiness, updateBusiness } from '@/features/business-owner/services/businessProfileService'
import { getApplicationStatus } from '@/features/business-owner/features/business-registration/services/businessRegistrationService'
import { uploadBusinessRegistrationFile } from '@/features/business-owner/features/business-registration/services/businessRegistrationService'
import { getRenewalStatus, updateGrossReceipts } from '@/features/business-owner/features/business-renewal/services/businessRenewalService'
import { resolveAvatarUrl } from '@/lib/utils'

export function usePermitApplicationPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { message } = App.useApp()
  const { permits, renewals, loading, refresh, hasNoBusinesses } = usePermitApplications()

  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'registrations')
  useEffect(() => {
    setActiveTab(searchParams.get('tab') || 'registrations')
  }, [searchParams])

  const {
    registrationFilters,
    setRegistrationFilters,
    renewalFilters,
    setRenewalFilters,
    clearRegistrationFilters,
    clearRenewalFilters,
    hasActiveRegistrationFilters,
    hasActiveRenewalFilters,
    filteredPermits,
    filteredRenewals,
    renewalYears
  } = usePermitApplicationFilters(permits, renewals)

  const [viewModalVisible, setViewModalVisible] = useState(false)
  const [requirementsModalVisible, setRequirementsModalVisible] = useState(false)
  const [editModalVisible, setEditModalVisible] = useState(false)
  const [commentsModalVisible, setCommentsModalVisible] = useState(false)
  const [selectedRecord, setSelectedRecord] = useState(null)
  const [modalType, setModalType] = useState(null)
  const [modalData, setModalData] = useState(null)
  const [modalLoading, setModalLoading] = useState(false)
  const [selectedComments, setSelectedComments] = useState(null)
  const [refreshing, setRefreshing] = useState(false)
  const [editForm] = Form.useForm()
  const hasEmployeesValue = Form.useWatch('hasEmployees', editForm)

  const handleRefresh = async () => {
    setRefreshing(true)
    try {
      await refresh()
      message.success('Status refreshed successfully')
    } catch (error) {
      console.error('Failed to refresh:', error)
      message.error('Failed to refresh status')
    } finally {
      setRefreshing(false)
    }
  }

  const handleView = async (record, type) => {
    setSelectedRecord(record)
    setModalType(type)
    setModalLoading(true)
    setViewModalVisible(true)
    try {
      if (type === 'registration') {
        const statusData = await getApplicationStatus(record.businessId)
        const profile = await getBusinessProfile()
        const business = profile?.businesses?.find(b => b.businessId === record.businessId)
        setModalData({
          ...record,
          ...statusData,
          businessDetails: business,
          requirementsChecklist: business?.requirementsChecklist,
          lguDocuments: business?.lguDocuments,
          birRegistration: business?.birRegistration,
          otherAgencyRegistrations: business?.otherAgencyRegistrations
        })
      } else {
        try {
          const statusData = await getRenewalStatus(record.businessId, record.renewalId)
          setModalData({ ...record, ...statusData })
        } catch (error) {
          setModalData(record)
          if (error?.message?.includes('not found')) message.warning('Renewal details may be incomplete. Using available data.')
        }
      }
    } catch (error) {
      console.error('Failed to load data:', error)
      message.error('Failed to load details')
      setModalData(record)
    } finally {
      setModalLoading(false)
    }
  }

  const handleViewRequirements = async (record) => {
    setSelectedRecord(record)
    setModalType('registration')
    setModalLoading(true)
    setRequirementsModalVisible(true)
    try {
      const statusData = await getApplicationStatus(record.businessId)
      const profile = await getBusinessProfile()
      const business = profile?.businesses?.find(b => b.businessId === record.businessId)
      setModalData({
        ...record,
        ...statusData,
        businessDetails: business,
        requirementsChecklist: business?.requirementsChecklist,
        lguDocuments: business?.lguDocuments,
        birRegistration: business?.birRegistration,
        otherAgencyRegistrations: business?.otherAgencyRegistrations
      })
    } catch (error) {
      console.error('Failed to load requirements data:', error)
      message.error('Failed to load requirements details')
      setModalData(record)
    } finally {
      setModalLoading(false)
    }
  }

  const handleEdit = async (record, type) => {
    setSelectedRecord(record)
    setModalType(type)
    setModalLoading(true)
    setEditModalVisible(true)
    try {
      if (type === 'registration') {
        const statusData = await getApplicationStatus(record.businessId)
        const profile = await getBusinessProfile()
        const business = profile?.businesses?.find(b => b.businessId === record.businessId)
        setModalData({
          ...record,
          ...statusData,
          businessDetails: business,
          ownerIdentity: profile?.ownerIdentity || {},
          businessRegistration: business?.businessRegistration || business || {},
          location: business?.location || {},
          lguDocuments: business?.lguDocuments || {},
          birRegistration: business?.birRegistration || {},
          otherAgencyRegistrations: business?.otherAgencyRegistrations || {},
          requirementsChecklist: business?.requirementsChecklist || {}
        })
        setRegistrationFormValues(editForm, business, record, profile, buildUploadFileList)
      } else {
        try {
          const statusData = await getRenewalStatus(record.businessId, record.renewalId)
          setModalData({ ...record, ...statusData })
          const amount = statusData.grossReceipts?.amount ?? statusData.grossReceipts?.cy2025
          editForm.setFieldsValue({ grossReceipts: amount ?? 0 })
        } catch (error) {
          try {
            const profile = await getBusinessProfile()
            const business = profile?.businesses?.find(b => b.businessId === record.businessId)
            const renewal = business?.renewals?.find(r => r.renewalId === record.renewalId)
            const amount = renewal?.grossReceipts?.amount ?? renewal?.grossReceipts?.cy2025 ?? 0
            setModalData(record)
            editForm.setFieldsValue({ grossReceipts: amount })
          } catch {
            setModalData(record)
            editForm.setFieldsValue({ grossReceipts: 0 })
          }
          if (error?.message?.includes('not found')) message.warning('Renewal details may be incomplete. Using available data.')
        }
      }
    } catch (error) {
      console.error('Failed to load data:', error)
      message.error('Failed to load details')
      setModalData(record)
    } finally {
      setModalLoading(false)
    }
  }

  const handleViewComments = async (record) => {
    try {
      const statusData = await getApplicationStatus(record.businessId)
      const parsed = parseReviewComments(statusData, record)
      setSelectedComments(parsed)
      setCommentsModalVisible(true)
    } catch (error) {
      console.error('Failed to load comments:', error)
      message.error('Failed to load review comments')
      const parsed = parseReviewCommentsFromRecord(record)
      setSelectedComments(parsed)
      setCommentsModalVisible(true)
    }
  }

  const customUploadRequest = async ({ file, onSuccess, onError }, fieldName) => {
    try {
      const businessId = selectedRecord?.businessId
      if (!businessId) throw new Error('Business ID is missing. Please close and reopen the modal.')
      const result = await uploadBusinessRegistrationFile(businessId, file, fieldName)
      const uploadedUrl = result?.url
      if (!uploadedUrl) throw new Error('Upload failed: missing file URL')
      const displayUrl = resolveAvatarUrl(uploadedUrl)
      const isImageFile = fieldName === 'idPicture' || file.type?.startsWith('image/') || /\.(jpg|jpeg|png|gif|webp|bmp)$/i.test(uploadedUrl)
      const updatedFile = { ...file, status: 'done', url: displayUrl, thumbUrl: isImageFile ? displayUrl : undefined, response: { url: uploadedUrl } }
      onSuccess({ url: uploadedUrl }, updatedFile)
      setTimeout(() => {
        const currentFileList = editForm.getFieldValue(fieldName) || []
        const updatedFileList = currentFileList.map(f => (f.uid === file.uid || f.name === file.name) ? updatedFile : f)
        if (JSON.stringify(currentFileList) !== JSON.stringify(updatedFileList)) editForm.setFieldValue(fieldName, updatedFileList)
      }, 150)
    } catch (error) {
      console.error('Document upload failed:', error)
      message.error(error?.message || 'Failed to upload document. Please try again.')
      onError?.(error)
    }
  }

  const handleResubmit = async () => {
    try {
      const values = await editForm.validateFields()
      setModalLoading(true)
      const updateData = buildRegistrationUpdatePayload(values, modalData, { resubmit: true })
      await updateBusiness(selectedRecord.businessId, updateData)
      if (values.isPrimary !== modalData.isPrimary && values.isPrimary) await setPrimaryBusiness(selectedRecord.businessId)
      message.success('Application updated successfully. You can now resubmit your application.')
      setEditModalVisible(false)
      setModalData(null)
      editForm.resetFields()
      refresh()
    } catch (error) {
      if (!error.errorFields) message.error(error?.message || 'Failed to resubmit application')
    } finally {
      setModalLoading(false)
    }
  }

  const handleEditSubmit = async () => {
    try {
      const values = await editForm.validateFields()
      setModalLoading(true)
      if (modalType === 'registration') {
        const updateData = buildRegistrationUpdatePayload(values, modalData)
        await updateBusiness(selectedRecord.businessId, updateData)
        if (values.isPrimary !== modalData.isPrimary && values.isPrimary) {
          await setPrimaryBusiness(selectedRecord.businessId)
          message.success('Business set as primary successfully')
        } else message.success('Business details updated successfully')
      } else if (modalType === 'renewal') {
        if (values.grossReceipts != null) {
          const renewalYear = modalData.renewalYear || new Date().getFullYear()
          const calendarYear = renewalYear - 1
          await updateGrossReceipts(selectedRecord.businessId, selectedRecord.renewalId, {
            amount: Number(values.grossReceipts),
            calendarYear,
            excludesVat: true,
            excludesReturns: true,
            excludesUncollected: true,
            branchAllocations: []
          })
          message.success('Gross receipts updated successfully')
        }
      }
      setEditModalVisible(false)
      editForm.resetFields()
      refresh()
    } catch (error) {
      if (!error.errorFields) message.error(error?.message || 'Failed to save changes')
    } finally {
      setModalLoading(false)
    }
  }

  const canEdit = (record, type) => {
    if (type === 'registration') return ['draft', 'needs_revision', 'rejected'].includes(record.status)
    if (type === 'renewal') return record.renewalStatus === 'draft'
    return false
  }

  const closeEditModal = () => {
    setEditModalVisible(false)
    setModalData(null)
    editForm.resetFields()
  }

  const setActiveTabAndNavigate = (key) => {
    setActiveTab(key)
    navigate(`/owner/permits?tab=${key}`, { replace: true })
  }

  const closeViewModal = () => {
    setViewModalVisible(false)
    setModalData(null)
  }

  const closeRequirementsModal = () => {
    setRequirementsModalVisible(false)
    setModalData(null)
  }

  const closeCommentsModal = () => {
    setCommentsModalVisible(false)
    setSelectedComments(null)
  }

  return {
    navigate,
    token: null, // page will use theme.useToken() for token
    activeTab,
    setActiveTabAndNavigate,
    loading,
    refreshing,
    hasNoBusinesses,
    // filters
    registrationFilters,
    setRegistrationFilters,
    renewalFilters,
    setRenewalFilters,
    clearRegistrationFilters,
    clearRenewalFilters,
    hasActiveRegistrationFilters,
    hasActiveRenewalFilters,
    filteredPermits,
    filteredRenewals,
    renewalYears,
    // modals
    viewModalVisible,
    requirementsModalVisible,
    editModalVisible,
    modalType,
    modalData,
    modalLoading,
    selectedRecord,
    selectedComments,
    commentsModalVisible,
    editForm,
    hasEmployeesValue,
    normFile,
    // handlers
    handleRefresh,
    handleView,
    handleViewRequirements,
    handleEdit,
    handleViewComments,
    customUploadRequest,
    handleResubmit,
    handleEditSubmit,
    canEdit,
    closeEditModal,
    closeViewModal,
    closeRequirementsModal,
    closeCommentsModal
  }
}
