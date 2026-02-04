import React from 'react'
import { Tag, Space, Button } from 'antd'
import { MessageOutlined } from '@ant-design/icons'

const REGISTRATION_STATUS_CONFIG = {
  draft: { color: 'default', text: 'Draft', description: 'Application not yet started' },
  requirements_viewed: { color: 'processing', text: 'Requirements Viewed', description: 'Reviewing requirements' },
  form_completed: { color: 'processing', text: 'Form Completed', description: 'Application form filled' },
  documents_uploaded: { color: 'processing', text: 'Documents Uploaded', description: 'Documents submitted' },
  bir_registered: { color: 'processing', text: 'BIR Registered', description: 'BIR registration completed' },
  agencies_registered: { color: 'processing', text: 'Agencies Registered', description: 'Agency registrations completed' },
  submitted: { color: 'processing', text: 'Pending for Approval', description: 'Submitted to LGU Officer' },
  resubmit: { color: 'processing', text: 'Resubmit', description: 'Resubmitted to LGU Officer for review' },
  under_review: { color: 'processing', text: 'Under Review', description: 'Application is being reviewed by LGU Officer' },
  approved: { color: 'success', text: 'Approved', description: 'Permit approved' },
  rejected: { color: 'error', text: 'Rejected', description: 'Application rejected' },
  needs_revision: { color: 'warning', text: 'Needs Revision', description: 'Requires corrections' }
}

const RENEWAL_STATUS_CONFIG = {
  draft: { color: 'default', text: 'Draft', description: 'Renewal not yet submitted' },
  submitted: { color: 'processing', text: 'Pending for Approval', description: 'Submitted to LGU Officer' },
  under_review: { color: 'processing', text: 'Under Review', description: 'Renewal is being reviewed by LGU Officer' },
  approved: { color: 'success', text: 'Approved', description: 'Renewal approved' },
  rejected: { color: 'error', text: 'Rejected', description: 'Renewal rejected' }
}

const PAYMENT_STATUS_CONFIG = {
  pending: { color: 'warning', text: 'Payment Pending', description: 'Payment not yet completed' },
  paid: { color: 'success', text: 'Paid', description: 'Payment completed' },
  failed: { color: 'error', text: 'Payment Failed', description: 'Payment processing failed' }
}

export function getRegistrationStatusTag(status, record = null, onViewComments) {
  const config = REGISTRATION_STATUS_CONFIG[status] || { color: 'default', text: status, description: '' }
  const showCommentsIcon = (status === 'needs_revision' || status === 'rejected') && record && onViewComments
  return (
    <Space size="small">
      <Tag color={config.color} title={config.description}>{config.text}</Tag>
      {showCommentsIcon && (
        <Button type="link" size="small" icon={<MessageOutlined />} onClick={() => onViewComments(record, 'registration')} title="View review comments" />
      )}
    </Space>
  )
}

/** Status tag only (no comments button) - for use in modals */
export function getRegistrationStatusTagDisplay(status) {
  const config = REGISTRATION_STATUS_CONFIG[status] || { color: 'default', text: status, description: '' }
  return <Tag color={config.color} title={config.description}>{config.text}</Tag>
}

export function getRenewalStatusTag(status) {
  const config = RENEWAL_STATUS_CONFIG[status] || { color: 'default', text: status, description: '' }
  return <Tag color={config.color} title={config.description}>{config.text}</Tag>
}

export function getPaymentStatusTag(status) {
  const config = PAYMENT_STATUS_CONFIG[status] || { color: 'default', text: status, description: '' }
  return <Tag color={config.color} title={config.description}>{config.text}</Tag>
}

export function formatDate(dateString) {
  if (!dateString) return 'N/A'
  try {
    return new Date(dateString).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
  } catch {
    return 'N/A'
  }
}

export const REGISTRATION_STATUS_ORDER = {
  draft: 0, requirements_viewed: 1, form_completed: 2, documents_uploaded: 3,
  bir_registered: 4, agencies_registered: 5, submitted: 6, resubmit: 6, under_review: 6,
  needs_revision: 7, approved: 8, rejected: 9
}

export const RENEWAL_STATUS_ORDER = {
  draft: 0, submitted: 1, under_review: 1, approved: 2, rejected: 3
}
