import React from 'react'
import { Typography, Progress, Collapse } from 'antd'

const { Title, Text } = Typography

export default function ApplicationOverview({ visibleSections, sectionCompleteMap, token }) {
  const completedCount = visibleSections.filter((_, idx) => sectionCompleteMap[idx] === true).length
  const totalCount = visibleSections.length
  const percentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0

  return (
    <div>
      <Title level={5} style={{ marginBottom: 12 }}>Overview</Title>
      <div style={{ marginBottom: 16 }}>
        <Text type="secondary" style={{ fontSize: 12 }}>
          Fill out all required sections to submit your Business Permit application. Each section contains specific information needed for processing. You can save your progress at any time and return later to complete your application.
        </Text>
      </div>
      
      <div style={{ marginBottom: 16 }}>
        <Progress 
          percent={percentage} 
          format={() => `${completedCount} of ${totalCount} sections completed`}
          strokeColor={token.colorPrimary}
        />
      </div>

      <div style={{ marginTop: 32 }}>
        <Text type="secondary" style={{ fontSize: 12, fontWeight: 600, textTransform: 'uppercase', marginBottom: 16, display: 'block' }}>
          Frequently Asked Questions
        </Text>
        <Collapse
          items={[
            {
              key: '1',
              label: 'I already have an existing business permit. Do I need to apply again?',
              children: (
                <div>
                  <Text>If you're renewing an existing permit, use the renewal process instead. This application is for new business permits only.</Text>
                  <ul style={{ marginBottom: 0, paddingLeft: 20, marginTop: 8 }}>
                    <li><strong>Manual permit holders:</strong> You can transition to the online system for renewals and future transactions</li>
                    <li><strong>First-time online users:</strong> Create an account using your existing permit details to access renewal features</li>
                    <li><strong>Existing online users:</strong> Continue using the renewal process when your permit expires</li>
                    <li><strong>New businesses:</strong> Use this application for first-time business permits</li>
                  </ul>
                </div>
              ),
            },
            {
              key: '2',
              label: 'What if I need to make changes to my submitted application?',
              children: (
                <Text style={{ marginBottom: 0 }}>
                  You can edit your application until it's approved. If changes are requested during review, you'll receive notifications and can update the required sections directly from your dashboard.
                </Text>
              ),
            },
            {
              key: '3',
              label: 'Can I apply for multiple business types or locations?',
              children: (
                <Text style={{ marginBottom: 0 }}>
                  Yes, you can submit separate applications for each business type or location. Each application is processed independently and will have its own permit number.
                </Text>
              ),
            },
            {
              key: '4',
              label: 'What happens if my application is rejected?',
              children: (
                <Text style={{ marginBottom: 0 }}>
                  You'll receive specific reasons for rejection and can resubmit with corrections. There's no additional fee for resubmission within 30 days of the original rejection.
                </Text>
              ),
            },
            {
              key: '5',
              label: 'How do I pay fees after approval?',
              children: (
                <Text style={{ marginBottom: 0 }}>
                  Once approved, you'll receive payment instructions with multiple options: online payment, bank deposit, or in-person payment at City Hall. Payment must be completed within 15 days of approval.
                </Text>
              ),
            },
            {
              key: '6',
              label: 'What documents do I need for different business types?',
              children: (
                <div>
                  <Text>Requirements vary by business type:</Text>
                  <ul style={{ marginBottom: 0, paddingLeft: 20, marginTop: 8 }}>
                    <li><strong>All businesses:</strong> DTI/SEC, Barangay Clearance, valid IDs</li>
                    <li><strong>Retail/Service:</strong> Lease contract or title</li>
                    <li><strong>Food service:</strong> Health permit, sanitary permit</li>
                    <li><strong>Manufacturing:</strong> Environmental compliance, fire safety</li>
                    <li><strong>Educational:</strong> DepEd/CHED permits, fire safety</li>
                  </ul>
                </div>
              ),
            },
            {
              key: '7',
              label: 'How long does the application process take?',
              children: (
                <Text style={{ marginBottom: 0 }}>
                  Standard processing is 3-5 business days. Complex businesses may take 7-10 days. You'll receive updates at each stage of the review process.
                </Text>
              ),
            },
            {
              key: '8',
              label: 'Can I save my progress and return later?',
              children: (
                <Text style={{ marginBottom: 0 }}>
                  Yes! Use "Save as Draft" anytime. Your application is saved for 30 days. You'll receive reminder emails if you haven't completed your application.
                </Text>
              ),
            },
            {
              key: '9',
              label: 'What if I need to change my business address or type?',
              children: (
                <Text style={{ marginBottom: 0 }}>
                  For address changes, submit a location update request. For business type changes, you may need a new permit if the change affects regulatory requirements. Contact the Business Permit Office for specific guidance.
                </Text>
              ),
            },
            {
              key: '10',
              label: 'How do I close or transfer my business?',
              children: (
                <div>
                  <Text>Business closure or transfer requires formal processing:</Text>
                  <ul style={{ marginBottom: 0, paddingLeft: 20, marginTop: 8 }}>
                    <li><strong>Closure:</strong> Submit retirement notice and clear all outstanding fees</li>
                    <li><strong>Transfer:</strong> New owner must apply for permit transfer with proper documentation</li>
                    <li><strong>Requirements:</strong> Clearance from Treasurer, final inspection, tax clearance</li>
                  </ul>
                </div>
              ),
            },
            {
              key: '11',
              label: 'What if my permit has already expired?',
              children: (
                <Text style={{ marginBottom: 0 }}>
                  Expired permits require reapplication rather than renewal. You may need to pay penalties and undergo fresh inspection. Contact the Business Permit Office immediately to discuss your specific situation.
                </Text>
              ),
            },
            {
              key: '12',
              label: 'What happens after my permit is approved?',
              children: (
                <div>
                  <Text>Post-approval requirements include:</Text>
                  <ul style={{ marginBottom: 0, paddingLeft: 20, marginTop: 8 }}>
                    <li>Pay required fees within 15 days</li>
                    <li>Display permit prominently at business location</li>
                    <li>Prepare for routine compliance inspections</li>
                    <li>Renew annually before expiration</li>
                  </ul>
                </div>
              ),
            },
          ]}
        />
      </div>
    </div>
  )
}
