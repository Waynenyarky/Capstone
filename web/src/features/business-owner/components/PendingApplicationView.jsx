import React from 'react'
import { Typography, Card, Space, theme, Button, Alert, Modal, Image, App, Form, Select, Input, Steps, Collapse } from 'antd'
import {
  ClockCircleOutlined,
  SearchOutlined,
  ExclamationCircleOutlined,
  EditOutlined,
  EyeOutlined,
  SendOutlined,
  DeleteOutlined,
  DownloadOutlined,
  CheckCircleOutlined,
} from '@ant-design/icons'
import { resolveIpfsUrl } from '@/lib/ipfsUtils'
import { submitAppeal, getAppeals, getAppealStatusLabel } from '../services/appealsService'
import { REJECTION_REASON_OPTIONS } from '@/features/staffs/lgu-officer/constants/rejectionReasons'

const { Title, Text, Paragraph } = Typography

function formatFieldKey(fieldKey) {
  if (!fieldKey || typeof fieldKey !== 'string') return 'Requested update'
  return fieldKey
    .replace(/^\d+\./, '') // Remove numeric prefix like "0."
    .replace(/^section_\d+_/i, '')
    .replace(/^lob_/i, '')
    .replace(/_/g, ' ')
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/\b\w/g, (char) => char.toUpperCase())
    .trim()
}

function getRejectedFieldItems(fieldReviewDecisions, sections) {
  if (!fieldReviewDecisions || typeof fieldReviewDecisions !== 'object') return []

  return Object.entries(fieldReviewDecisions)
    .filter(([, decision]) => decision?.status === 'rejected')
    .map(([fieldKey, decision]) => {
      // Get field label from form definition (same logic as LGU officer side)
      let fieldLabel = null
      const parts = String(fieldKey).split('.')
      if (parts.length >= 2 && sections && sections.length > 0) {
        const sectionIdx = parseInt(parts[0])
        const itemKey = parts.slice(1).join('.')
        const section = sections?.[sectionIdx]
        if (section?.items) {
          // Try exact match first
          let item = section.items.find(it => (it.key || it.label) === itemKey)
          // Try startsWith match
          if (!item) {
            item = section.items.find(it => itemKey.startsWith(it.key || it.label))
          }
          // Try matching by key without section prefix
          if (!item) {
            item = section.items.find(it => {
              const itKey = it.key || it.label
              return itKey && (itemKey.includes(itKey) || itKey.includes(itemKey))
            })
          }
          if (item) {
            fieldLabel = item.label || item.key
          }
        }
      }
      
      // If still no label, try searching all sections
      if (!fieldLabel && sections && sections.length > 0) {
        for (const section of sections) {
          if (section?.items) {
            const itemKey = parts.length >= 2 ? parts.slice(1).join('.') : fieldKey
            const item = section.items.find(it => {
              const itKey = it.key || it.label
              return itKey === itemKey || (itKey && itemKey.includes(itKey))
            })
            if (item) {
              fieldLabel = item.label || item.key
              break
            }
          }
        }
      }
      
      // Fallback to formatFieldKey if no label found from form definition
      if (!fieldLabel) {
        fieldLabel = formatFieldKey(fieldKey)
      }
      
      // Get reason using REJECTION_REASON_OPTIONS lookup (same as LGU officer side)
      const reason = decision?.reasonOther || 
                     REJECTION_REASON_OPTIONS.find((r) => r.value === decision?.reasonCode)?.label || 
                     decision?.reasonCode || 
                     'Needs correction'
      
      return {
        fieldKey,
        label: fieldLabel,
        reason,
      }
    })
}

function getTaskOwner(status) {
  const statusLower = (status || '').toLowerCase()
  switch (statusLower) {
    case 'draft':
    case 'needs_revision':
      return { label: 'Waiting on you', color: 'warning' }
    case 'submitted':
    case 'under_review':
    case 'resubmit':
      return { label: 'Waiting on LGU', color: 'processing' }
    case 'appeal_pending':
      return { label: 'Appeal Under Review', color: 'processing' }
    case 'approved':
    case 'active':
      return { label: 'Completed', color: 'success' }
    case 'rejected':
      return { label: 'Closed', color: 'error' }
    default:
      return { label: 'In progress', color: 'default' }
  }
}

// Application Progress Timeline Component
function ApplicationProgressTimeline({ business, status, statusLower, latestAppeal }) {
  const isRejected = statusLower === 'rejected' || statusLower === 'appeal_pending'
  const isApproved = statusLower === 'approved'
  const isAppealPending = statusLower === 'appeal_pending'
  const hasActiveAppeal = business.hasActiveAppeal || isAppealPending
  const appealExhausted = business.appealExhausted
  const hasAppeal = hasActiveAppeal || appealExhausted || latestAppeal
  
  const steps = [
    {
      title: 'Draft Completed',
      description: business.createdAt ? formatDate(business.createdAt) : 'Not started',
      icon: statusLower === 'draft' ? <ClockCircleOutlined /> : <CheckCircleOutlined />,
      status: 'finish'
    },
    {
      title: 'Submitted to LGU',
      description: business.submittedAt ? formatDate(business.submittedAt) : 'Not submitted',
      icon: statusLower === 'draft' ? <ClockCircleOutlined /> : <CheckCircleOutlined />,
      status: ['submitted', 'under_review', 'needs_revision', 'resubmit', 'approved', 'rejected', 'appeal_pending'].includes(statusLower) ? 'finish' : 'wait'
    },
    {
      title: statusLower === 'needs_revision' ? 'Review Completed' : 'Under Review',
      description: statusLower === 'submitted' ? 'Expected within 24 hours' 
                  : statusLower === 'under_review' ? `Officer: ${business.reviewedBy?.name || 'Assigned'}`
                  : statusLower === 'needs_revision' ? `Officer: ${business.reviewedBy?.name || 'Completed'}`
                  : business.reviewedAt ? formatDate(business.reviewedAt)
                  : 'Pending',
      icon: statusLower === 'under_review' ? <SearchOutlined /> 
           : statusLower === 'needs_revision' ? <CheckCircleOutlined />
           : <ClockCircleOutlined />,
      status: statusLower === 'under_review' ? 'process' 
           : statusLower === 'needs_revision' ? 'finish'
           : ['approved', 'rejected', 'appeal_pending'].includes(statusLower) ? 'finish'
           : 'wait'
    },
    {
      title: statusLower === 'needs_revision' ? 'Resubmit to Review' 
           : (isRejected || isAppealPending) ? 'Rejected'
           : isApproved ? 'Approved'
           : 'Decision Pending',
      description: statusLower === 'needs_revision' ? 'Make requested changes'
                  : statusLower === 'approved' ? formatDate(business.reviewedAt)
                  : (statusLower === 'rejected' || isAppealPending) ? formatDate(business.reviewedAt)
                  : 'Pending',
      icon: statusLower === 'needs_revision' ? <EditOutlined />
           : statusLower === 'approved' ? <CheckCircleOutlined />
           : (statusLower === 'rejected' || isAppealPending) ? <ExclamationCircleOutlined />
           : <ClockCircleOutlined />,
      status: statusLower === 'needs_revision' ? 'process'
           : (isRejected || isAppealPending) ? 'error'
           : isApproved ? 'finish'
           : 'wait'
    }
  ]
  
  // Add appeal steps for rejected applications that have filed an appeal
  if (isRejected && hasAppeal) {
    // Step 5: Appeal Filed
    steps.push({
      title: 'Appeal Filed',
      description: latestAppeal?.createdAt ? formatDate(latestAppeal.createdAt) : 'Submitted',
      icon: <CheckCircleOutlined />,
      status: 'finish'
    })
    
    // Step 6: Appeal Decision
    if (latestAppeal?.status === 'approved') {
      steps.push({
        title: 'Appeal Approved',
        description: 'Application returned for re-review',
        icon: <CheckCircleOutlined />,
        status: 'finish'
      })
    } else if (latestAppeal?.status === 'rejected' || appealExhausted) {
      steps.push({
        title: 'Appeal Rejected',
        description: 'Final decision',
        icon: <ExclamationCircleOutlined />,
        status: 'error'
      })
    } else {
      // Appeal pending (submitted or under_review)
      steps.push({
        title: 'Appeal Decision',
        description: 'Awaiting review',
        icon: <ClockCircleOutlined />,
        status: 'process'
      })
    }
  }
  
  // Add final "Approved" step only if not rejected
  if (!isRejected) {
    steps.push({
      title: 'Approved',
      description: statusLower === 'approved' ? formatDate(business.reviewedAt) : 'Pending',
      icon: statusLower === 'approved' ? <CheckCircleOutlined /> : <ClockCircleOutlined />,
      status: statusLower === 'approved' ? 'finish' : 'wait'
    })
  }

  const currentStep = steps.findIndex(step => step.status === 'process') || steps.findIndex(step => step.status === 'wait')

  return (
    <Steps
      style={{ padding: 12}}
      direction="vertical"
      size="small"
      current={currentStep}
      items={steps}
    />
  )
}

// Application Details Component
function ApplicationDetails({ business }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
      <div>
        <Text type="secondary" style={{ fontSize: 12 }}>Submitted</Text>
        <div><Text strong>{formatDate(business.submittedAt)}</Text></div>
      </div>
      <div>
        <Text type="secondary" style={{ fontSize: 12 }}>Last Reviewed</Text>
        <div><Text strong>{business.reviewedAt ? formatDate(business.reviewedAt) : 'Not yet reviewed'}</Text></div>
      </div>
      <div>
        <Text type="secondary" style={{ fontSize: 12 }}>Business Type</Text>
        <div><Text strong>{business.registrationType === 'temporary' ? 'Temporary' : 'Regular'}</Text></div>
      </div>
      <div>
        <Text type="secondary" style={{ fontSize: 12 }}>Reference Number</Text>
        <div><Text strong>{business.applicationReferenceNumber || 'Pending'}</Text></div>
      </div>
      {business.reviewedBy && (
        <div style={{ gridColumn: '1 / -1', paddingTop: 16, borderTop: '1px solid #f0f0f0' }}>
          <Text type="secondary" style={{ fontSize: 12 }}>Reviewing Officer</Text>
          <div><Text strong>{business.reviewedBy.name || 'LGU Officer'}</Text></div>
        </div>
      )}
    </div>
  )
}


// FAQ Section Component
function FAQSection() {
  return (
    <div>
      <Text type="secondary" style={{ fontSize: 12, fontWeight: 600, textTransform: 'uppercase', marginBottom: 16, display: 'block' }}>
        Frequently Asked Questions
      </Text>
      <Collapse
        items={[
          {
            key: '1',
            label: 'How long does the review process take?',
            children: (
              <div>
                <Text>The review process typically takes 3-5 business days after your application is assigned to an LGU officer.</Text>
                <ul style={{ marginBottom: 0, paddingLeft: 20, marginTop: 8 }}>
                  <li><strong>Submitted applications:</strong> Usually assigned within 24 hours</li>
                  <li><strong>Under review:</strong> Officer assessment takes 3-5 business days</li>
                  <li><strong>Revisions needed:</strong> Additional time depends on how quickly you respond</li>
                  <li><strong>Approved:</strong> Permit issuance within 1-2 business days after payment</li>
                </ul>
              </div>
            ),
          },
          {
            key: '2',
            label: 'What happens if revisions are needed?',
            children: (
              <div>
                <Text>You'll receive specific instructions about what needs to be updated. The process is straightforward:</Text>
                <ul style={{ marginBottom: 0, paddingLeft: 20, marginTop: 8 }}>
                  <li>You'll get an email notification with required changes</li>
                  <li>Log in to your dashboard to see detailed feedback</li>
                  <li>Update the requested sections and resubmit</li>
                  <li>Your application returns to the review queue</li>
                  <li>No additional fees for resubmission</li>
                </ul>
              </div>
            ),
          },
          {
            key: '3',
            label: 'My application was rejected. What should I do?',
            children: (
              <div>
                <Text>If your application was rejected, you have several options:</Text>
                <ul style={{ marginBottom: 0, paddingLeft: 20, marginTop: 8 }}>
                  <li><strong>File an appeal:</strong> If you believe the rejection was made in error, you can file an appeal within 30 days</li>
                  <li><strong>Submit a new application:</strong> You can start fresh with a new application addressing the issues</li>
                  <li><strong>Contact LGU:</strong> Reach out to the reviewing officer for clarification</li>
                  <li><strong>Review requirements:</strong> Ensure you meet all business permit requirements</li>
                  <li><strong>Common rejection reasons:</strong> Incomplete documents, incorrect information, non-compliance with zoning laws</li>
                </ul>
              </div>
            ),
          },
          {
            key: '4',
            label: 'How do I file an appeal for a rejected application?',
            children: (
              <div>
                <Text>The appeal process allows you to challenge a rejection decision:</Text>
                <ul style={{ marginBottom: 0, paddingLeft: 20, marginTop: 8 }}>
                  <li><strong>Timeline:</strong> File within 30 days of rejection date</li>
                  <li><strong>Types of appeals:</strong> Rejection appeal, wrong assessment, or other grounds</li>
                  <li><strong>Required information:</strong> Detailed explanation of why you believe the decision was incorrect</li>
                  <li><strong>Supporting documents:</strong> Include any evidence that supports your appeal</li>
                  <li><strong>Review process:</strong> Appeals are reviewed by a different officer or supervisor</li>
                  <li><strong>Possible outcomes:</strong> Appeal approved (application returned for review) or appeal rejected (final decision)</li>
                </ul>
              </div>
            ),
          },
          {
            key: '5',
            label: 'What does "Action Required" status mean?',
            children: (
              <div>
                <Text>"Action Required" means the LGU officer needs you to make corrections:</Text>
                <ul style={{ marginBottom: 0, paddingLeft: 20, marginTop: 8 }}>
                  <li><strong>Check your email:</strong> You'll receive detailed feedback about required changes</li>
                  <li><strong>Review issues:</strong> Look at the "Issues Identified" section in your application</li>
                  <li><strong>Make corrections:</strong> Update the specific fields or documents requested</li>
                  <li><strong>Resubmit quickly:</strong> Faster response means faster approval</li>
                  <li><strong>No penalty:</strong> Revisions are normal and don't affect your application negatively</li>
                </ul>
              </div>
            ),
          },
          {
            key: '6',
            label: 'Why was my document marked as "Not uploaded"?',
            children: (
              <div>
                <Text>This usually happens due to technical issues during upload:</Text>
                <ul style={{ marginBottom: 0, paddingLeft: 20, marginTop: 8 }}>
                  <li><strong>Upload interrupted:</strong> Internet connection lost during upload</li>
                  <li><strong>File too large:</strong> Document exceeds size limit (usually 5MB)</li>
                  <li><strong>Unsupported format:</strong> File format not accepted (use PDF, JPG, PNG)</li>
                  <li><strong>Browser issue:</strong> Try refreshing or using a different browser</li>
                  <li><strong>Solution:</strong> Re-upload the document in the required format</li>
                </ul>
              </div>
            ),
          },
          {
            key: '7',
            label: 'How can I contact the LGU officer reviewing my application?',
            children: (
              <div>
                <Text>Once your application is assigned to an officer, you have several options for contact:</Text>
                <ul style={{ marginBottom: 0, paddingLeft: 20, marginTop: 8 }}>
                  <li><strong>Email:</strong> Use the contact information shown in your application details</li>
                  <li><strong>Phone:</strong> Call the LGU office during business hours (8 AM - 5 PM, Mon-Fri)</li>
                  <li><strong>In-person:</strong> Visit the Business Permit Office at City Hall</li>
                  <li><strong>Online:</strong> Use the messaging feature in your application dashboard</li>
                </ul>
              </div>
            ),
          },
          {
            key: '8',
            label: 'What documents are required for my application?',
            children: (
              <div>
                <Text>Required documents vary by business type, but most applications need:</Text>
                <ul style={{ marginBottom: 0, paddingLeft: 20, marginTop: 8 }}>
                  <li><strong>All businesses:</strong> Valid government ID, Barangay Clearance, DTI/SEC/CDA Registration</li>
                  <li><strong>Rented spaces:</strong> Lease contract or proof of address</li>
                  <li><strong>Owned property:</strong> Land title or tax declaration</li>
                  <li><strong>Special permits:</strong> May require health, fire, or environmental clearances</li>
                </ul>
              </div>
            ),
          },
          {
            key: '9',
            label: 'What happens after my application is approved?',
            children: (
              <div>
                <Text>Congratulations! Here's what happens next:</Text>
                <ul style={{ marginBottom: 0, paddingLeft: 20, marginTop: 8 }}>
                  <li>You'll receive an approval notice via email</li>
                  <li>Payment instructions will be sent (online, bank, or in-person options)</li>
                  <li>Payment must be completed within 15 days of approval</li>
                  <li>Once paid, your business permit will be issued</li>
                  <li>Display your permit prominently at your business location</li>
                </ul>
              </div>
            ),
          },
          {
            key: '10',
            label: 'My application shows "Under Review" for a long time. Is this normal?',
            children: (
              <div>
                <Text>Review times can vary based on several factors:</Text>
                <ul style={{ marginBottom: 0, paddingLeft: 20, marginTop: 8 }}>
                  <li><strong>Normal timeframe:</strong> 3-5 business days is typical</li>
                  <li><strong>Peak periods:</strong> May take longer during renewal seasons</li>
                  <li><strong>Complex applications:</strong> Special businesses may require additional review</li>
                  <li><strong>Missing information:</strong> Delays if documents need verification</li>
                  <li><strong>When to follow up:</strong> Contact LGU after 7 business days if no update</li>
                </ul>
              </div>
            ),
          },
          {
            key: '11',
            label: 'Can I withdraw my application after submission?',
            children: (
              <div>
                <Text>Yes, you can withdraw your application under certain conditions:</Text>
                <ul style={{ marginBottom: 0, paddingLeft: 20, marginTop: 8 }}>
                  <li><strong>Before approval:</strong> You can withdraw anytime before final approval</li>
                  <li><strong>After approval:</strong> Withdrawal may require additional processing</li>
                  <li><strong>Refunds:</strong> Fees may be non-refundable depending on processing stage</li>
                  <li><strong>Process:</strong> Contact LGU office or use the withdrawal feature in your dashboard</li>
                  <li><strong>Re-application:</strong> You can submit a new application later if needed</li>
                </ul>
              </div>
            ),
          },
          {
            key: '12',
            label: 'What if I need to change my business information after submission?',
            children: (
              <div>
                <Text>Changes after submission require careful handling:</Text>
                <ul style={{ marginBottom: 0, paddingLeft: 20, marginTop: 8 }}>
                  <li><strong>Minor changes:</strong> Wait for the review process to request corrections</li>
                  <li><strong>Major changes:</strong> May require withdrawing and resubmitting</li>
                  <li><strong>Business details:</strong> Address, name, or type changes need new verification</li>
                  <li><strong>Contact LGU:</strong> Discuss significant changes with the reviewing officer</li>
                  <li><strong>Documentation:</strong> Be prepared to provide supporting documents for changes</li>
                </ul>
              </div>
            ),
          },
          {
            key: '13',
            label: 'Why was my application returned for additional information?',
            children: (
              <div>
                <Text>Applications are returned when clarification is needed:</Text>
                <ul style={{ marginBottom: 0, paddingLeft: 20, marginTop: 8 }}>
                  <li><strong>Unclear information:</strong> Details need better explanation</li>
                  <li><strong>Missing documents:</strong> Required uploads not provided</li>
                  <li><strong>Inconsistent data:</strong> Information doesn't match across sections</li>
                  <li><strong>Verification needed:</strong> Documents require additional validation</li>
                  <li><strong>Response time:</strong> Provide requested information promptly to avoid delays</li>
                </ul>
              </div>
            ),
          },
          {
            key: '14',
            label: 'What if I miss the payment deadline after approval?',
            children: (
              <div>
                <Text>Missing the payment deadline has consequences:</Text>
                <ul style={{ marginBottom: 0, paddingLeft: 20, marginTop: 8 }}>
                  <li><strong>15-day deadline:</strong> Payment required within 15 days of approval</li>
                  <li><strong>Grace period:</strong> Some LGUs offer a 3-day grace period</li>
                  <li><strong>After deadline:</strong> Approval may be revoked</li>
                  <li><strong>Re-application:</strong> You may need to start the process again</li>
                  <li><strong>Solution:</strong> Contact LGU immediately if you anticipate payment issues</li>
                </ul>
              </div>
            ),
          },
          {
            key: '15',
            label: 'How do I check the status of my appeal?',
            children: (
              <div>
                <Text>Appeal status tracking is available in your dashboard:</Text>
                <ul style={{ marginBottom: 0, paddingLeft: 20, marginTop: 8 }}>
                  <li><strong>Dashboard view:</strong> Check the "Appeal" section of your application</li>
                  <li><strong>Status updates:</strong> You'll receive email notifications for status changes</li>
                  <li><strong>Appeal stages:</strong> Submitted → Under Review → Decision</li>
                  <li><strong>Timeline:</strong> Appeals typically take 5-7 business days</li>
                  <li><strong>Contact:</strong> Follow up with LGU if no update after 10 business days</li>
                </ul>
              </div>
            ),
          },
        ]}
      />
    </div>
  )
}

function getPrimaryActionConfig({ status, onEdit, onOpenForm, business }) {
  const statusLower = (status || '').toLowerCase()
  if (statusLower === 'needs_revision' && onEdit) {
    return {
      label: 'Review & Fix Application',
      icon: <EditOutlined />,
      onClick: () => onEdit(business),
      type: 'primary',
    }
  }
  if (statusLower === 'resubmit' && onOpenForm) {
    return {
      label: 'View Submitted Revisions',
      icon: <EyeOutlined />,
      onClick: () => onOpenForm(business),
      type: 'default',
    }
  }
  if (statusLower === 'rejected' && typeof business?.onAppeal === 'function') {
    return {
      label: 'File Appeal',
      icon: <ExclamationCircleOutlined />,
      onClick: () => business.onAppeal(),
      type: 'primary',
    }
  }
  return null
}

function getSupportingTitle(status) {
  const statusLower = (status || '').toLowerCase()
  if (statusLower === 'needs_revision') return 'Issues to Fix'
  if (statusLower === 'resubmit') return 'Revision Summary'
  if (statusLower === 'rejected') return 'Decision Details'
  return 'Review Summary'
}

function getStatusInfo(status) {
  const statusLower = (status || '').toLowerCase()
  switch (statusLower) {
    case 'draft':
      return {
        color: 'default',
        label: 'Draft',
        message: 'Your application is saved as a draft. Complete and submit to proceed.',
        icon: <ClockCircleOutlined />,
      }
    case 'submitted':
      return {
        color: 'processing',
        label: 'Pending Review',
        message: 'Your application has been submitted and is waiting to be reviewed by our team.',
        icon: <ClockCircleOutlined />,
      }
    case 'under_review':
      return {
        color: 'processing',
        label: 'Under Review',
        message: 'Your application is currently being reviewed by our officers. This typically takes 3-5 business days.',
        icon: <SearchOutlined />,
      }
    case 'needs_revision':
      return {
        color: 'warning',
        label: 'Action Required',
        message: 'The LGU requested corrections to your application. Review the required changes, update the flagged details, and resubmit when ready.',
        icon: <ExclamationCircleOutlined />,
      }
    case 'resubmit':
      return {
        color: 'processing',
        label: 'Resubmitted',
        message: 'Your revised application has been resubmitted and is now waiting for LGU review. No action is needed from you right now.',
        icon: <ClockCircleOutlined />,
      }
    case 'rejected':
      return {
        color: 'error',
        label: 'Rejected',
        message: 'Unfortunately, your application has been rejected. Please review the reason below.',
        icon: <ExclamationCircleOutlined />,
      }
    default:
      return {
        color: 'default',
        label: status || 'Unknown',
        message: 'Application status is being processed.',
        icon: <ClockCircleOutlined />,
      }
  }
}

function formatDate(dateStr) {
  if (!dateStr) return 'N/A'
  try {
    return new Date(dateStr).toLocaleDateString('en-PH', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return dateStr
  }
}

// Document viewer component for owner side
function DocumentViewer({ url, label }) {
  if (!url || url.trim() === '') {
    return <Text type="secondary">Not uploaded</Text>
  }

  const resolvedUrl = resolveIpfsUrl(url)
  if (!resolvedUrl) {
    return <Text type="secondary">Not available</Text>
  }

  // Infer type from extension
  const urlPath = resolvedUrl.split('?')[0]
  const originalPath = (typeof url === 'string' ? url : '').split('?')[0]
  const isImage = urlPath.match(/\.(jpg|jpeg|png|gif|bmp|webp)$/i) || originalPath.match(/\.(jpg|jpeg|png|gif|bmp|webp)$/i)
  const isPdf = urlPath.toLowerCase().includes('.pdf') || originalPath.toLowerCase().includes('.pdf')

  if (isImage) {
    return (
      <Space direction="vertical" size={4}>
        <div
          role="button"
          tabIndex={0}
          onClick={() => window.open(resolvedUrl, '_blank')}
          onKeyDown={(e) => e.key === 'Enter' && window.open(resolvedUrl, '_blank')}
          style={{ cursor: 'pointer', display: 'inline-block' }}
        >
          <Image
            src={resolvedUrl}
            alt={label || 'Document'}
            width={120}
            height={120}
            style={{ objectFit: 'cover', borderRadius: 8, border: '1px solid #d9d9d9' }}
            preview={false}
          />
        </div>
        <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => window.open(resolvedUrl, '_blank')}>
          View document
        </Button>
      </Space>
    )
  }

  return (
    <Space>
      <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => window.open(resolvedUrl, '_blank')}>
        View document
      </Button>
      <Button type="link" size="small" icon={<DownloadOutlined />} href={resolvedUrl} download>
        Download
      </Button>
    </Space>
  )
}

// Helper to extract file URL from form value
function getFileUrlFromFormValue(value) {
  if (value == null) return ''
  if (typeof value === 'string' && value.trim() !== '') return value.trim()
  if (Array.isArray(value) && value.length > 0) {
    const first = value[0]
    if (first && typeof first === 'object') {
      // Try multiple possible property names for CID/URL
      const cid = first.cid || first.ipfsCid || first.response?.cid || first.response?.ipfsCid
      const url = first.url || first.response?.url
      if (url && typeof url === 'string') return url
      if (cid && typeof cid === 'string') return cid
    }
  }
  return ''
}

export default function PendingApplicationView({ business, onEdit, onSubmit, onDelete, onOpenForm, submitting }) {
  const { token } = theme.useToken()
  const { message } = App.useApp()
  const [appealOpen, setAppealOpen] = React.useState(false)
  const [appealSubmitting, setAppealSubmitting] = React.useState(false)
  const [appealLoading, setAppealLoading] = React.useState(false)
  const [latestAppeal, setLatestAppeal] = React.useState(null)
  const [formDefinition, setFormDefinition] = React.useState(null)
  const [appealForm] = Form.useForm()
  const status = business.applicationStatus || business.permitStatus || 'submitted'
  const statusLower = status.toLowerCase()
  const statusInfo = getStatusInfo(status)
  const isDraft = statusLower === 'draft'
  const isApproved = statusLower === 'approved'
  const isRejected = statusLower === 'rejected'
  const isNeedsRevision = statusLower === 'needs_revision'
  const isResubmitted = statusLower === 'resubmit'
  const needsRevision = isNeedsRevision || isResubmitted
  
  // Load form definition for proper field labels
  React.useEffect(() => {
    const loadFormDefinition = async () => {
      if (!business?.formType) return
      try {
        const { get } = await import('@/lib/http')
        const query = new URLSearchParams()
        query.set('type', business.formType)
        if (business?.category) query.set('businessType', business.category)
        if (business?.lguCode) query.set('lgu', business.lguCode)

        const url = `/api/forms/active?${query.toString()}`
        const res = await get(url)
        const definition = res?.definition || res
        if (definition?.sections) {
          setFormDefinition(definition)
        }
      } catch (err) {
        console.error('Failed to load form definition:', err)
      }
    }
    loadFormDefinition()
  }, [business?.formType, business?.category])
  
  const sections = formDefinition?.sections || business?.formDefinition?.sections || business?.sections || []
  const rejectedFieldItems = getRejectedFieldItems(business.fieldReviewDecisions, sections)
  const hasActionableRevisionContent = rejectedFieldItems.length > 0 || Boolean(business.reviewComments)
  const businessId = business?.businessId || business?._id
  const handleOpenAppeal = () => setAppealOpen(true)

  React.useEffect(() => {
    let mounted = true

    const loadAppealStatus = async () => {
      if (!isRejected || !businessId) {
        if (mounted) setLatestAppeal(null)
        return
      }

      setAppealLoading(true)
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
      } finally {
        if (mounted) setAppealLoading(false)
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
      appealForm.resetFields()
      setAppealOpen(false)
    } catch (err) {
      message.error(err?.message || 'Failed to submit appeal')
    } finally {
      setAppealSubmitting(false)
    }
  }

  const primaryAction = getPrimaryActionConfig({
    status,
    onEdit,
    onOpenForm,
    business: {
      ...business,
      onAppeal: isRejected ? handleOpenAppeal : undefined,
    },
  })

  const handleDeleteClick = () => {
    Modal.confirm({
      title: 'Delete application?',
      content: 'This will permanently remove this draft application. You can add a new business later if needed.',
      okText: 'Delete',
      okType: 'danger',
      cancelText: 'Cancel',
      onOk: () => onDelete?.(business),
    })
  }

  return (
    <>
    <div style={{ padding: 24 }}>
      {/* Two-column layout */}
      <div style={{ display: 'flex', gap: 24, marginBottom: 24 }}>
        {/* Left Column - Progress Timeline */}
        <div style={{ flex: '0 0 320px', minWidth: 280 }}>
          <Card title="Application Progress" size="small" style={{ marginBottom: 24 }}>
            <ApplicationProgressTimeline 
              business={business}
              status={status}
              statusLower={statusLower}
              latestAppeal={latestAppeal}
            />
          </Card>
        </div>

        {/* Right Column - Details */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Combined Application Details */}
          <Card title="Application Details" size="small" style={{ marginBottom: 24 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
              <div>
                <Text type="secondary" style={{ fontSize: 12 }}>Status</Text>
                <div><Text strong style={{ 
                  color: statusLower === 'approved' ? token.colorSuccess 
                         : statusLower === 'rejected' ? token.colorError
                         : statusLower === 'appeal_pending' ? token.colorWarning
                         : statusLower === 'needs_revision' ? token.colorWarning 
                         : token.colorInfo 
                }}>
                  {statusLower === 'submitted' ? 'Waiting for Assignment'
                   : statusLower === 'under_review' ? 'Under Review'
                   : statusLower === 'needs_revision' ? 'Revision Required'
                   : statusLower === 'approved' ? 'Approved'
                   : statusLower === 'rejected' ? 'Rejected'
                   : statusLower === 'appeal_pending' ? 'Appeal Pending'
                   : statusInfo.label}
                </Text></div>
              </div>
              <div>
                <Text type="secondary" style={{ fontSize: 12 }}>Submitted</Text>
                <div><Text strong>{formatDate(business.submittedAt)}</Text></div>
              </div>
              <div>
                <Text type="secondary" style={{ fontSize: 12 }}>Last Reviewed</Text>
                <div><Text strong>{business.reviewedAt ? formatDate(business.reviewedAt) : 'Not yet reviewed'}</Text></div>
              </div>
              <div>
                <Text type="secondary" style={{ fontSize: 12 }}>Business Type</Text>
                <div><Text strong>{business.registrationType === 'temporary' ? 'Temporary' : 'Regular'}</Text></div>
              </div>
              <div>
                <Text type="secondary" style={{ fontSize: 12 }}>Reference Number</Text>
                <div><Text strong>{business.applicationReferenceNumber || 'Pending'}</Text></div>
              </div>
              {business.reviewedBy && (
                  <div style={{ gridColumn: '1 / -1', paddingTop: 16, borderTop: '1px solid #f0f0f0' }}>
                    <Text type="secondary" style={{ fontSize: 12 }}>Reviewing Officer</Text>
                    <div><Text strong>{business.reviewedBy.name || business.reviewedBy.fullName || 'LGU Officer'}</Text></div>
                  </div>
                )}
            </div>
          </Card>

          {/* Decision Card - shows for rejected/needs_revision applications */}
          {(isRejected || isNeedsRevision) && (
            <Card title="Decision" size="small" style={{ marginBottom: 24 }}>
              <Space direction="vertical" size={12} style={{ width: '100%' }}>
                <div>
                  <Text type="secondary" style={{ fontSize: 12 }}>Result</Text>
                  <div><Text strong>{isRejected 
                    ? 'This application has been rejected.'
                    : 'This application requires changes.'}</Text></div>
                </div>
                {business.rejectionReason && (
                  <div>
                    <Text type="secondary" style={{ fontSize: 12 }}>Rejection reason</Text>
                    <div><Text strong>{REJECTION_REASON_OPTIONS.find(r => r.value === business.rejectionReason)?.label || business.rejectionReason}</Text></div>
                  </div>
                )}
                {business.reviewComments && (
                  <div>
                    <Text type="secondary" style={{ fontSize: 12 }}>Comments</Text>
                    <div><Text strong>{business.reviewComments}</Text></div>
                  </div>
                )}
                {business.reviewedAt && (
                  <div>
                    <Text type="secondary" style={{ fontSize: 12 }}>Decision date</Text>
                    <div><Text strong>{formatDate(business.reviewedAt)}</Text></div>
                  </div>
                )}
              </Space>
            </Card>
          )}

          {/* Appeal Card - shows for rejected applications */}
          {isRejected && (
            <Card title="Appeal" size="small" style={{ marginBottom: 24 }}>
              {business.appealExhausted || latestAppeal?.status === 'rejected' ? (
                <Space direction="vertical" size={12} style={{ width: '100%' }}>
                  <div>
                    <Text type="secondary" style={{ fontSize: 12 }}>Status</Text>
                    <div><Text strong style={{ color: token.colorError }}>Appeal Rejected</Text></div>
                  </div>
                  <div>
                    <Text type="secondary" style={{ fontSize: 12 }}>Result</Text>
                    <div><Text strong>No further appeals are allowed for this application.</Text></div>
                  </div>
                  {latestAppeal?.resolution && (
                    <div>
                      <Text type="secondary" style={{ fontSize: 12 }}>Resolution</Text>
                      <div><Text strong>{latestAppeal.resolution}</Text></div>
                    </div>
                  )}
                </Space>
              ) : latestAppeal ? (
                <Space direction="vertical" size={12} style={{ width: '100%' }}>
                  <div>
                    <Text type="secondary" style={{ fontSize: 12 }}>Status</Text>
                    <div><Text strong style={{ color: token.colorPrimary }}>{getAppealStatusLabel(latestAppeal.status)}</Text></div>
                  </div>
                  <div>
                    <Text type="secondary" style={{ fontSize: 12 }}>Type</Text>
                    <div><Text strong>
                      {latestAppeal.appealType === 'rejection_appeal' ? 'Appeal Rejection Decision' 
                        : latestAppeal.appealType === 'wrong_assessment' ? 'Wrong Assessment'
                        : latestAppeal.appealType || 'Other'}
                    </Text></div>
                  </div>
                  <div>
                    <Text type="secondary" style={{ fontSize: 12 }}>Description</Text>
                    <div><Text strong>{latestAppeal.description}</Text></div>
                  </div>
                  <div>
                    <Text type="secondary" style={{ fontSize: 12 }}>Submitted</Text>
                    <div><Text strong>{latestAppeal.createdAt ? formatDate(latestAppeal.createdAt) : 'N/A'}</Text></div>
                  </div>
                </Space>
              ) : (
                <Space direction="vertical" size={12} style={{ width: '100%' }}>
                  <div>
                    <Text>You can file an appeal if you believe this decision was made in error.</Text>
                    <div><Text type="secondary" style={{ fontSize: 12 }}>You have 30 days from the rejection date to file an appeal.</Text></div>
                  </div>
                  <Button 
                    type="primary"
                    onClick={handleOpenAppeal}
                    icon={<ExclamationCircleOutlined />}
                  >
                    File Appeal
                  </Button>
                </Space>
              )}
            </Card>
          )}

          {/* Issues Identified Card */}
          {(isNeedsRevision || isResubmitted || isRejected) && rejectedFieldItems.length > 0 ? (
            <Card title="Issues Identified" size="small" style={{ marginBottom: 24 }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
                {rejectedFieldItems.map((item) => (
                  <div key={item.fieldKey}>
                    <Text type="secondary" style={{ fontSize: 12 }}>{item.label}</Text>
                    <div><Text strong style={{ color: token.colorError }}>{item.reason}</Text></div>
                  </div>
                ))}
              </div>
              {business.reviewComments && (
                <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid #f0f0f0' }}>
                  <Text type="secondary" style={{ fontSize: 12 }}>Officer comments</Text>
                  <div><Text strong>{business.reviewComments}</Text></div>
                </div>
              )}
            </Card>
          ) : null}

          <Space direction="vertical" size={24} style={{ width: '100%' }}>
            {/* FAQ Section */}
            <FAQSection />
          </Space>
        </div>
      </div>

      {/* Action Buttons for Draft */}
      {isDraft && (
        <Card style={{ marginBottom: 24 }}>
          <Alert
            message="Complete Your Application"
            description="Your application is saved as a draft. Please review and complete the form, then submit it for review."
            type="info"
            showIcon
            style={{ marginBottom: 16 }}
          />
          <Space>
            {onEdit && (
              <Button 
                type="default" 
                icon={<EditOutlined />}
                onClick={() => onEdit(business)}
              >
                Edit Application
              </Button>
            )}
            {onSubmit && (
              <Button 
                type="primary" 
                icon={<SendOutlined />}
                onClick={() => onSubmit(business)}
                loading={submitting}
              >
                Submit Application
              </Button>
            )}
            {onDelete && (
              <Button 
                type="text" 
                danger 
                icon={<DeleteOutlined />}
                onClick={handleDeleteClick}
              >
                Delete Application
              </Button>
            )}
          </Space>
        </Card>
      )}

      <Modal
        title="File Appeal"
        open={appealOpen}
        onCancel={() => {
          if (!appealSubmitting) {
            setAppealOpen(false)
            appealForm.resetFields()
          }
        }}
        onOk={() => appealForm.submit()}
        okText="Submit Appeal"
        confirmLoading={appealSubmitting}
        destroyOnHidden
      >
        <Form form={appealForm} layout="vertical" onFinish={handleSubmitAppeal}>
          <Form.Item
            name="appealType"
            label="Appeal Type"
            rules={[{ required: true, message: 'Please select an appeal type' }]}
            initialValue="rejection_appeal"
          >
            <Select
              placeholder="Select appeal type"
              options={[
                { value: 'rejection_appeal', label: 'Appeal Rejection Decision' },
                { value: 'wrong_assessment', label: 'Wrong Assessment' },
                { value: 'other', label: 'Other' },
              ]}
            />
          </Form.Item>
          <Form.Item
            name="description"
            label="Appeal Details"
            rules={[{ required: true, message: 'Please provide appeal details' }]}
          >
            <Input.TextArea
              rows={4}
              placeholder="Describe why you are appealing this rejection..."
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
    </>
  )
}
