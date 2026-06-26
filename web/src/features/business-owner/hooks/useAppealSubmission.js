import { useState, useCallback } from 'react'
import { App } from 'antd'
import { submitAppeal } from '../services/appealsService'
import { uploadFile } from '../services/businessRegistrationService'

export function useAppealSubmission({ business, onRefresh }) {
  const { modal } = App.useApp()
  const [appealModalOpen, setAppealModalOpen] = useState(false)
  const [showAppealPaymentModal, setShowAppealPaymentModal] = useState(false)
  const [appealLetter, setAppealLetter] = useState('')
  const [appealFiles, setAppealFiles] = useState([])
  const [submittingAppeal, setSubmittingAppeal] = useState(false)
  const [appealReceiptData, setAppealReceiptData] = useState(null)

  const handleAppealPaymentSuccess = useCallback(async (receiptId) => {
    setSubmittingAppeal(true)
    try {
      const businessId = business?.businessId || business?._id

      // Upload files to IPFS first
      const evidenceUrls = []
      for (const file of appealFiles) {
        if (file.originFileObj) {
          try {
            const uploadResult = await uploadFile(businessId, file.originFileObj, 'appeal_evidence')
            const cid = uploadResult?.data?.cid || uploadResult?.cid
            if (cid) {
              evidenceUrls.push(cid)
            }
          } catch (uploadErr) {
            console.error('Failed to upload appeal evidence file:', uploadErr)
            modal.warning({
              title: 'Upload Failed',
              content: `Failed to upload file: ${file.name}. The appeal will be submitted without this file.`,
            })
          }
        } else if (file.url || file.cid) {
          // Already uploaded, use existing URL/CID
          evidenceUrls.push(file.url || file.cid)
        }
      }

      await submitAppeal({
        businessId,
        appealType: 'rejection_appeal',
        description: appealLetter,
        evidence: evidenceUrls,
      })
      setAppealReceiptData({
        receiptId,
        transactionDate: new Date().toLocaleString(),
        transactionName: 'Appeal Processing Fee',
        fees: [{ label: 'Appeal Processing Fee', amount: 500 }],
        totalAmount: 500,
        applicationReferenceNumber: business.applicationReferenceNumber || 'N/A',
      })
      modal.success({
        title: 'Appeal Submitted Successfully',
        content: `Your appeal has been submitted with receipt ID: ${receiptId}. The LGU will review your case and respond within 5-7 business days.`,
      })
      setAppealLetter('')
      setAppealFiles([])
      setAppealModalOpen(false)
      setShowAppealPaymentModal(false)
      onRefresh?.()
    } catch (err) {
      modal.error({
        title: 'Failed to Submit Appeal',
        content: err?.message || 'An error occurred while submitting your appeal. Please try again.',
      })
    } finally {
      setSubmittingAppeal(false)
    }
  }, [business, appealLetter, appealFiles, modal, onRefresh])

  const handleAppealPaymentFail = useCallback(() => {
    modal.error({
      title: 'Payment Failed',
      content: 'The payment transaction failed. Please try again or contact support if the issue persists.',
    })
    setShowAppealPaymentModal(false)
  }, [modal])

  const handleOpenAppealModal = useCallback(() => {
    setAppealModalOpen(true)
  }, [])

  const handleCloseAppealModal = useCallback(() => {
    setAppealModalOpen(false)
  }, [])

  const handleSubmitAppeal = useCallback(() => {
    if (!appealLetter.trim()) {
      modal.warning({
        title: 'Appeal Letter Required',
        content: 'Please provide an appeal letter explaining why you believe the rejection should be reconsidered.',
      })
      return
    }
    setAppealModalOpen(false)
    setShowAppealPaymentModal(true)
  }, [appealLetter, modal])

  return {
    appealModalOpen,
    showAppealPaymentModal,
    appealLetter,
    appealFiles,
    submittingAppeal,
    appealReceiptData,
    setAppealLetter,
    setAppealFiles,
    handleAppealPaymentSuccess,
    handleAppealPaymentFail,
    handleOpenAppealModal,
    handleCloseAppealModal,
    handleSubmitAppeal,
  }
}
