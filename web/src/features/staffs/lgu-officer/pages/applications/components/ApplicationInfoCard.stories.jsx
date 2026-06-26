import ApplicationInfoCard from './ApplicationInfoCard'

export default {
  title: 'LGU Officer/ApplicationInfoCard',
  component: ApplicationInfoCard,
  tags: ['autodocs'],
  argTypes: {
    token: { control: 'text' },
    onShowAppRejectionModal: { action: 'app rejection modal shown' },
    onShowAppealRejectionModal: { action: 'appeal rejection modal shown' },
    onShowAppealLetterModal: { action: 'appeal letter modal shown' },
    onShowApprovalCommentModal: { action: 'approval comment modal shown' },
  },
}

const mockApplication = {
  _id: 'app-1234567890',
  applicationId: 'app-1234567890',
  businessId: 'biz-1234567890',
  businessName: 'Sample Business Name',
  applicationReferenceNumber: 'APP-2024-001',
  status: 'submitted',
  applicationStatus: 'submitted',
  formType: 'unified_business_permit',
  category: 'retail',
  formData: {
    businessName: 'Sample Business',
    businessAddress: {
      streetAddress: '123 Main Street',
      barangayName: 'Barangay 1',
      city: 'Sample City',
      province: 'Sample Province',
      postalCode: '1234',
    },
    businessPhone: '123-456-7890',
    tin: '123-456-789-000',
  },
  createdAt: '2024-01-10T08:00:00Z',
  updatedAt: '2024-01-15T10:30:00Z',
  submittedAt: '2024-01-15T10:30:00Z',
  reviewedAt: '2024-01-16T14:00:00Z',
  reviewedBy: 'officer-123',
  reviewedByName: 'John Doe',
  rejectionReason: null,
  reviewComments: null,
  documents: {},
  lguDocuments: {},
  hasActiveAppeal: false,
  appealExhausted: false,
}

const mockOnShowAppRejectionModal = () => console.log('Show application rejection modal')
const mockOnShowAppealRejectionModal = () => console.log('Show appeal rejection modal')
const mockOnShowAppealLetterModal = () => console.log('Show appeal letter modal')
const mockOnShowApprovalCommentModal = () => console.log('Show approval comment modal')

const mockOwnerIdentity = {
  ownerGovernmentId: 'mock-id-url',
  ownerGovernmentIdIpfsCid: 'mock-cid',
}

const mockBusinessReg = {
  primaryLineOfBusiness: 'Retail Trade',
  registrationType: 'regular',
}

const mockSections = [
  {
    label: 'Business Information',
    items: [
      { key: 'businessName', label: 'Business Name' },
      { key: 'businessAddress', label: 'Business Address' },
    ],
  },
]

const mockFieldReviewDecisions = {
  '0.businessName': {
    status: 'accepted',
    decidedBy: 'officer-123',
    decidedByName: 'John Doe',
    decidedAt: '2024-01-16T14:00:00Z',
  },
}

export const Submitted = {
  args: {
    application: {
      ...mockApplication,
      status: 'submitted',
      applicationStatus: 'submitted',
      reviewedAt: null,
      reviewedByName: null,
    },
    ownerName: 'Juan Dela Cruz',
    token: 'mock-token',
    ownerIdentity: mockOwnerIdentity,
    businessReg: mockBusinessReg,
    decidedCount: 0,
    allFieldKeys: ['0.businessName'],
    fieldReviewDecisions: {},
    sections: mockSections,
  },
}

export const UnderReview = {
  args: {
    application: {
      ...mockApplication,
      status: 'under_review',
      applicationStatus: 'under_review',
    },
    ownerName: 'Juan Dela Cruz',
    token: 'mock-token',
    ownerIdentity: mockOwnerIdentity,
    businessReg: mockBusinessReg,
    decidedCount: 1,
    allFieldKeys: ['0.businessName'],
    fieldReviewDecisions: mockFieldReviewDecisions,
    sections: mockSections,
  },
}

export const NeedsRevision = {
  args: {
    application: {
      ...mockApplication,
      status: 'needs_revision',
      applicationStatus: 'needs_revision',
      reviewComments: 'Please update your business address to include a street number.',
    },
    ownerName: 'Juan Dela Cruz',
    token: 'mock-token',
    ownerIdentity: mockOwnerIdentity,
    businessReg: mockBusinessReg,
    decidedCount: 1,
    allFieldKeys: ['0.businessName'],
    fieldReviewDecisions: {
      '0.businessName': {
        status: 'request_changes',
        requestOther: 'Missing street number',
        decidedBy: 'officer-123',
        decidedByName: 'John Doe',
        decidedAt: '2024-01-16T14:00:00Z',
      },
    },
    sections: mockSections,
  },
}

export const Resubmitted = {
  args: {
    application: {
      ...mockApplication,
      status: 'resubmit',
      applicationStatus: 'resubmit',
    },
    ownerName: 'Juan Dela Cruz',
    token: 'mock-token',
    ownerIdentity: mockOwnerIdentity,
    businessReg: mockBusinessReg,
    decidedCount: 0,
    allFieldKeys: ['0.businessName'],
    fieldReviewDecisions: {},
    sections: mockSections,
  },
}

export const Approved = {
  args: {
    application: {
      ...mockApplication,
      status: 'approved',
      applicationStatus: 'approved',
      reviewComments: 'Application approved. All requirements met.',
    },
    ownerName: 'Juan Dela Cruz',
    token: 'mock-token',
    ownerIdentity: mockOwnerIdentity,
    businessReg: mockBusinessReg,
    decidedCount: 1,
    allFieldKeys: ['0.businessName'],
    fieldReviewDecisions: mockFieldReviewDecisions,
    sections: mockSections,
    onShowApprovalCommentModal: mockOnShowApprovalCommentModal,
  },
}

export const ApprovedWithoutComment = {
  args: {
    application: {
      ...mockApplication,
      status: 'approved',
      applicationStatus: 'approved',
    },
    ownerName: 'Juan Dela Cruz',
    token: 'mock-token',
    ownerIdentity: mockOwnerIdentity,
    businessReg: mockBusinessReg,
    decidedCount: 1,
    allFieldKeys: ['0.businessName'],
    fieldReviewDecisions: mockFieldReviewDecisions,
    sections: mockSections,
  },
}

export const Rejected = {
  args: {
    application: {
      ...mockApplication,
      status: 'rejected',
      applicationStatus: 'rejected',
      rejectionReason: 'Application rejected due to incomplete documentation.',
    },
    ownerName: 'Juan Dela Cruz',
    token: 'mock-token',
    ownerIdentity: mockOwnerIdentity,
    businessReg: mockBusinessReg,
    decidedCount: 0,
    allFieldKeys: ['0.businessName'],
    fieldReviewDecisions: {},
    sections: mockSections,
    onShowAppRejectionModal: mockOnShowAppRejectionModal,
  },
}

export const AppealPending = {
  args: {
    application: {
      ...mockApplication,
      status: 'appeal_pending',
      applicationStatus: 'appeal_pending',
      rejectionReason: 'Application rejected due to incomplete documentation.',
      hasActiveAppeal: true,
      appealId: 'appeal-123',
    },
    latestAppeal: {
      _id: 'appeal-123',
      createdAt: '2024-01-20T10:00:00Z',
      description: 'I believe the rejection was made in error as all required documents were submitted.',
      evidence: [],
    },
    ownerName: 'Juan Dela Cruz',
    token: 'mock-token',
    ownerIdentity: mockOwnerIdentity,
    businessReg: mockBusinessReg,
    decidedCount: 0,
    allFieldKeys: ['0.businessName'],
    fieldReviewDecisions: {},
    sections: mockSections,
    onShowAppRejectionModal: mockOnShowAppRejectionModal,
    onShowAppealLetterModal: mockOnShowAppealLetterModal,
  },
}

export const AppealRejected = {
  args: {
    application: {
      ...mockApplication,
      status: 'appeal_rejected',
      applicationStatus: 'appeal_rejected',
      rejectionReason: 'Application rejected due to incomplete documentation.',
      hasActiveAppeal: false,
      appealExhausted: true,
      appealId: 'appeal-123',
    },
    latestAppeal: {
      _id: 'appeal-123',
      createdAt: '2024-01-20T10:00:00Z',
      description: 'I believe the rejection was made in error as all required documents were submitted.',
      resolution: 'After review, the appeal is rejected as the documentation was indeed incomplete. Please resubmit with complete documentation.',
      evidence: [],
    },
    ownerName: 'Juan Dela Cruz',
    token: 'mock-token',
    ownerIdentity: mockOwnerIdentity,
    businessReg: mockBusinessReg,
    decidedCount: 0,
    allFieldKeys: ['0.businessName'],
    fieldReviewDecisions: {},
    sections: mockSections,
    onShowAppRejectionModal: mockOnShowAppRejectionModal,
    onShowAppealRejectionModal: mockOnShowAppealRejectionModal,
    onShowAppealLetterModal: mockOnShowAppealLetterModal,
  },
}

export const AllStates = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, padding: 24 }}>
      <h3>Submitted</h3>
      <ApplicationInfoCard
        application={{ ...mockApplication, status: 'submitted', applicationStatus: 'submitted', reviewedAt: null, reviewedByName: null }}
        ownerName="Juan Dela Cruz"
        token="mock-token"
        ownerIdentity={mockOwnerIdentity}
        businessReg={mockBusinessReg}
        decidedCount={0}
        allFieldKeys={['0.businessName']}
        fieldReviewDecisions={{}}
        sections={mockSections}
      />
      
      <h3>Under Review</h3>
      <ApplicationInfoCard
        application={{ ...mockApplication, status: 'under_review', applicationStatus: 'under_review' }}
        ownerName="Juan Dela Cruz"
        token="mock-token"
        ownerIdentity={mockOwnerIdentity}
        businessReg={mockBusinessReg}
        decidedCount={1}
        allFieldKeys={['0.businessName']}
        fieldReviewDecisions={mockFieldReviewDecisions}
        sections={mockSections}
      />
      
      <h3>Needs Revision</h3>
      <ApplicationInfoCard
        application={{ ...mockApplication, status: 'needs_revision', applicationStatus: 'needs_revision', reviewComments: 'Please update your business address.' }}
        ownerName="Juan Dela Cruz"
        token="mock-token"
        ownerIdentity={mockOwnerIdentity}
        businessReg={mockBusinessReg}
        decidedCount={1}
        allFieldKeys={['0.businessName']}
        fieldReviewDecisions={{
          '0.businessName': {
            status: 'request_changes',
            requestOther: 'Missing street number',
            decidedBy: 'officer-123',
            decidedByName: 'John Doe',
            decidedAt: '2024-01-16T14:00:00Z',
          },
        }}
        sections={mockSections}
      />
      
      <h3>Resubmitted</h3>
      <ApplicationInfoCard
        application={{ ...mockApplication, status: 'resubmit', applicationStatus: 'resubmit' }}
        ownerName="Juan Dela Cruz"
        token="mock-token"
        ownerIdentity={mockOwnerIdentity}
        businessReg={mockBusinessReg}
        decidedCount={0}
        allFieldKeys={['0.businessName']}
        fieldReviewDecisions={{}}
        sections={mockSections}
      />
      
      <h3>Approved</h3>
      <ApplicationInfoCard
        application={{ ...mockApplication, status: 'approved', applicationStatus: 'approved', reviewComments: 'Application approved.' }}
        ownerName="Juan Dela Cruz"
        token="mock-token"
        ownerIdentity={mockOwnerIdentity}
        businessReg={mockBusinessReg}
        decidedCount={1}
        allFieldKeys={['0.businessName']}
        fieldReviewDecisions={mockFieldReviewDecisions}
        sections={mockSections}
        onShowApprovalCommentModal={mockOnShowApprovalCommentModal}
      />
      
      <h3>Rejected</h3>
      <ApplicationInfoCard
        application={{ ...mockApplication, status: 'rejected', applicationStatus: 'rejected', rejectionReason: 'Application rejected due to incomplete documentation.' }}
        ownerName="Juan Dela Cruz"
        token="mock-token"
        ownerIdentity={mockOwnerIdentity}
        businessReg={mockBusinessReg}
        decidedCount={0}
        allFieldKeys={['0.businessName']}
        fieldReviewDecisions={{}}
        sections={mockSections}
        onShowAppRejectionModal={mockOnShowAppRejectionModal}
      />

      <h3>Appeal Pending</h3>
      <ApplicationInfoCard
        application={{ ...mockApplication, status: 'appeal_pending', applicationStatus: 'appeal_pending', rejectionReason: 'Application rejected due to incomplete documentation.', hasActiveAppeal: true, appealId: 'appeal-123' }}
        latestAppeal={{
          _id: 'appeal-123',
          createdAt: '2024-01-20T10:00:00Z',
          description: 'I believe the rejection was made in error as all required documents were submitted.',
          evidence: [],
        }}
        ownerName="Juan Dela Cruz"
        token="mock-token"
        ownerIdentity={mockOwnerIdentity}
        businessReg={mockBusinessReg}
        decidedCount={0}
        allFieldKeys={['0.businessName']}
        fieldReviewDecisions={{}}
        sections={mockSections}
        onShowAppRejectionModal={mockOnShowAppRejectionModal}
        onShowAppealLetterModal={mockOnShowAppealLetterModal}
      />

      <h3>Appeal Rejected</h3>
      <ApplicationInfoCard
        application={{ ...mockApplication, status: 'appeal_rejected', applicationStatus: 'appeal_rejected', rejectionReason: 'Application rejected due to incomplete documentation.', hasActiveAppeal: false, appealExhausted: true, appealId: 'appeal-123' }}
        latestAppeal={{
          _id: 'appeal-123',
          createdAt: '2024-01-20T10:00:00Z',
          description: 'I believe the rejection was made in error as all required documents were submitted.',
          resolution: 'After review, the appeal is rejected as the documentation was indeed incomplete. Please resubmit with complete documentation.',
          evidence: [],
        }}
        ownerName="Juan Dela Cruz"
        token="mock-token"
        ownerIdentity={mockOwnerIdentity}
        businessReg={mockBusinessReg}
        decidedCount={0}
        allFieldKeys={['0.businessName']}
        fieldReviewDecisions={{}}
        sections={mockSections}
        onShowAppRejectionModal={mockOnShowAppRejectionModal}
        onShowAppealRejectionModal={mockOnShowAppealRejectionModal}
        onShowAppealLetterModal={mockOnShowAppealLetterModal}
      />
    </div>
  ),
}
