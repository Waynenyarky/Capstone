import React from 'react'
import { Modal, Descriptions, Tag, Typography, Divider } from 'antd'

export default function ProviderApplicationReviewModal({ open, onCancel, onOk, confirmLoading, values }) {
  const v = values || {}

  const ownerReview = [
    ['First Name', 'firstName'],
    ['Last Name', 'lastName'],
    ['Email', 'email'],
    ['Phone Number', 'phoneNumber'],
  ]

  const businessReview = [
    ['Business Name', 'businessName'],
    ['Business Type', 'businessType'],
    ['Years in Business', 'yearsInBusiness'],
    ['Street Address', 'streetAddress'],
    ['Province', 'province'],
    ['City', 'city'],
    ['Zip Code', 'zipCode'],
    ['Business Phone', 'businessPhone'],
    ['Business Email', 'businessEmail'],
    ['Business Description', 'businessDescription'],
  ]

  return (
    <Modal open={open} title="Review Application" onCancel={onCancel} onOk={onOk} okText="Confirm Submission" confirmLoading={confirmLoading} width={800}>
      {values ? (
        <>
          <Typography.Paragraph>
            Please review your application details below. You can go back to make changes if needed.
          </Typography.Paragraph>

          <Descriptions column={1} variant="outlined" size="small" title="Owner Information">
            {ownerReview.map(([label, key]) => (
              <Descriptions.Item key={key} label={label}>{v[key] || '—'}</Descriptions.Item>
            ))}
          </Descriptions>

          <Divider />

          <Descriptions column={1} variant="outlined" size="small" title="Business Information">
            {businessReview.map(([label, key]) => (
              <Descriptions.Item key={key} label={label}>{v[key] ?? '—'}</Descriptions.Item>
            ))}
            <Descriptions.Item label="Service Categories">
              {(Array.isArray(v.servicesCategories) && v.servicesCategories.length > 0)
                ? v.servicesCategories.map((c) => (<Tag key={`cat-${String(c)}`}>{String(c)}</Tag>))
                : '—'}
            </Descriptions.Item>
            <Descriptions.Item label="Service Areas">
              {(Array.isArray(v.serviceAreas) && v.serviceAreas.length > 0)
                ? v.serviceAreas.map((a) => (<Tag key={`area-${String(a)}`}>{String(a)}</Tag>))
                : '—'}
            </Descriptions.Item>
            <Descriptions.Item label="Social Media Links">
              {(Array.isArray(v.socialLinks) && v.socialLinks.length > 0)
                ? v.socialLinks.map((l) => (<Tag key={`sml-${String(l)}`}>{String(l)}</Tag>))
                : '—'}
            </Descriptions.Item>
            <Descriptions.Item label="Has Insurance">{v.hasInsurance ? 'Yes' : 'No'}</Descriptions.Item>
            <Descriptions.Item label="Has Licenses">{v.hasLicenses ? 'Yes' : 'No'}</Descriptions.Item>
            <Descriptions.Item label="Background Check Consent">{v.consentsToBackgroundCheck ? 'Yes' : 'No'}</Descriptions.Item>
            <Descriptions.Item label="Operating Mode">{v.isSolo !== false ? 'Solo' : 'Team'}</Descriptions.Item>
          </Descriptions>

          <Divider />

          <Descriptions column={1} variant="outlined" size="small" title="Team Members">
            {(Array.isArray(v.teamMembers) && v.teamMembers.length > 0)
              ? v.teamMembers.map((m, idx) => (
                  <Descriptions.Item key={`tm-${idx}`} label={`Member ${idx + 1}`}>
                    {[m.firstName, m.lastName].filter(Boolean).join(' ') || '—'}
                    {` | Email: ${m.email || '—'} | Phone: ${m.phone || '—'}`}
                  </Descriptions.Item>
                ))
              : <Descriptions.Item label="Members">—</Descriptions.Item>
            }
          </Descriptions>

          <Divider />
          <Typography.Text type="secondary">
            By confirming, you submit the application for review.
          </Typography.Text>
        </>
      ) : null}
    </Modal>
  )
}