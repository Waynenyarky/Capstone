import { useState, useCallback, useEffect } from 'react'
import dayjs from 'dayjs'
import { getPayments } from '../services/paymentsService'
import { getPostRequirements } from '../services/postRequirementsService'

export function usePermitProgress(business, businessId, permitDownloaded = false) {
  const [payments, setPayments] = useState([])
  const [postReqs, setPostReqs] = useState([])
  const [paymentsLoading, setPaymentsLoading] = useState(true)
  const [postReqsLoading, setPostReqsLoading] = useState(true)

  const refetchPayments = useCallback(() => {
    if (!businessId) return
    setPaymentsLoading(true)
    getPayments({ businessId })
      .then(data => setPayments(Array.isArray(data) ? data : data?.data || []))
      .catch(() => setPayments([]))
      .finally(() => setPaymentsLoading(false))
  }, [businessId])

  useEffect(() => {
    refetchPayments()
  }, [refetchPayments])

  useEffect(() => {
    if (!businessId) return
    setPostReqsLoading(true)
    getPostRequirements({ businessId })
      .then(data => setPostReqs(Array.isArray(data) ? data : data?.data || data?.requirements || []))
      .catch(() => setPostReqs([]))
      .finally(() => setPostReqsLoading(false))
  }, [businessId])

  const pendingPayments = payments.filter(p => p.status === 'pending' && !p.paidAt)
  const pendingTotal = pendingPayments.reduce((sum, p) => sum + (p.amount || 0), 0)
  const allPaid = payments.length > 0 && pendingPayments.length === 0
  const hasPayments = payments.length > 0

  const hasActivePermit = !!(business?.permitNumber && business?.permitStatus === 'active')

  const pendingPostReqs = postReqs.filter(r => r.status === 'pending' || r.status === 'overdue' || r.status === 'non_compliant')
  const allPostReqsVerified = postReqs.length > 0 && pendingPostReqs.length === 0
  const hasPostReqs = postReqs.length > 0

  // Compute current step (0-indexed) - New flow: Approved -> Payment -> Download -> Inspection -> Post-Requirements
  let currentStep = 0 // Start with Approved Application
  let stepStatuses = ['finish', 'wait', 'wait', 'wait', 'wait']

  // Step 1: Payment Status
  if (hasPayments && allPaid) {
    stepStatuses[1] = 'finish'
    currentStep = 2
  } else if (hasPayments && pendingPayments.length > 0) {
    stepStatuses[1] = 'process'
    currentStep = 1
  } else if (!hasPayments) {
    stepStatuses[1] = 'process'
    currentStep = 1
  }

  // Step 2: Download Permit (available after payment)
  if (permitDownloaded) {
    stepStatuses[2] = 'finish'
    if (currentStep < 3) currentStep = 3
  } else if (stepStatuses[1] === 'finish') {
    stepStatuses[2] = 'process'
    if (currentStep < 2) currentStep = 2
  }

  // Step 3: Inspection Status (awaiting after permit download)
  if (permitDownloaded) {
    stepStatuses[3] = 'process' // Awaiting inspection after permit download
    if (currentStep < 3) currentStep = 3
  }

  // Step 4: Post-Requirements
  if (hasPostReqs && allPostReqsVerified) {
    stepStatuses[4] = 'finish'
    if (currentStep < 5) currentStep = 5
  } else if (hasPostReqs && pendingPostReqs.length > 0) {
    stepStatuses[4] = 'process'
    if (currentStep < 4) currentStep = 4
  } else if (!hasPostReqs && permitDownloaded) {
    stepStatuses[4] = 'wait'
  }

  // Determine the primary next action
  let nextAction = null
  if (pendingPayments.length > 0) {
    nextAction = { type: 'payment', total: pendingTotal, count: pendingPayments.length }
  } else if (hasPayments && allPaid && !permitDownloaded) {
    nextAction = { type: 'permit_pending' }
  } else if (permitDownloaded) {
    nextAction = { type: 'inspection_pending' }
  } else if (hasPostReqs && pendingPostReqs.length > 0) {
    const overdue = pendingPostReqs.filter(r => r.status === 'overdue' || (r.dueDate && dayjs(r.dueDate).isBefore(dayjs())))
    nextAction = { type: 'post_requirements', pending: pendingPostReqs.length, overdue: overdue.length }
  } else if (!hasPayments) {
    nextAction = { type: 'awaiting_assessment' }
  }

  return {
    payments,
    postReqs,
    paymentsLoading,
    postReqsLoading,
    refetchPayments,
    pendingPayments,
    pendingTotal,
    allPaid,
    hasPayments,
    hasActivePermit,
    pendingPostReqs,
    allPostReqsVerified,
    hasPostReqs,
    currentStep,
    stepStatuses,
    nextAction,
  }
}
