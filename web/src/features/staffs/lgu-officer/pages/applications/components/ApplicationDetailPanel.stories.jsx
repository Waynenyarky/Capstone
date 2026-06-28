import ApplicationDetailPanel from './ApplicationDetailPanel'

// Loading state placeholder - component controls loading internally
function LoadingPlaceholder({ message }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', padding: 24 }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 24, marginBottom: 8 }}>{message}</div>
        <div style={{ color: '#999' }}>(Component shows LottieSpinner in actual usage)</div>
      </div>
    </div>
  )
}

export default {
  title: 'LGU Officer/ApplicationDetailPanel',
  component: ApplicationDetailPanel,
  tags: ['autodocs'],
  argTypes: {
    onReviewComplete: { action: 'review complete' },
    onReview: { action: 'review' },
    onReviewStarted: { action: 'review started' },
    onSelectApplication: { action: 'application selected' },
    onBookmarkToggle: { action: 'bookmark toggled' },
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
  formDefinitionId: 'form-def-123',
  organizationType: 'retail',
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
  ownerName: 'Juan Dela Cruz',
  ownerIdentity: {
    fullName: 'Juan Dela Cruz',
    firstName: 'Juan',
    lastName: 'Dela Cruz',
    email: 'juan@example.com',
    phoneNumber: '09123456789',
  },
  businessRegistration: {
    ownerFullName: 'Juan Dela Cruz',
    emailAddress: 'juan@example.com',
    mobileNumber: '09123456789',
    primaryLineOfBusiness: 'Retail Trade',
    registrationType: 'regular',
  },
  businessOwner: {
    name: 'Juan Dela Cruz',
    firstName: 'Juan',
    lastName: 'Dela Cruz',
    email: 'juan@example.com',
    phoneNumber: '09123456789',
  },
  profile: {
    fullName: 'Juan Dela Cruz',
    firstName: 'Juan',
    lastName: 'Dela Cruz',
    email: 'juan@example.com',
    phoneNumber: '09123456789',
  },
  createdAt: '2024-01-10T08:00:00Z',
  updatedAt: '2024-01-15T10:30:00Z',
  submittedAt: '2024-01-15T10:30:00Z',
  reviewedAt: null,
  reviewedBy: null,
  reviewedByName: null,
  rejectionReason: null,
  reviewComments: null,
  documents: {},
  lguDocuments: {},
  hasActiveAppeal: false,
  appealExhausted: false,
  businessStatus: 'active',
  fieldReviewDecisions: {},
}

const mockOnReviewComplete = () => console.log('Review complete')
const mockOnReview = () => console.log('Review')
const mockOnReviewStarted = () => console.log('Review started')
const mockOnSelectApplication = () => console.log('Application selected')
const mockOnBookmarkToggle = () => console.log('Bookmark toggled')

export const Submitted = {
  args: {
    application: {
      ...mockApplication,
      status: 'submitted',
      applicationStatus: 'submitted',
      reviewedAt: null,
      reviewedByName: null,
    },
    onReviewComplete: mockOnReviewComplete,
    onReview: mockOnReview,
    onReviewStarted: mockOnReviewStarted,
    onSelectApplication: mockOnSelectApplication,
    onBookmarkToggle: mockOnBookmarkToggle,
  },
}

export const UnderReview = {
  args: {
    application: {
      ...mockApplication,
      status: 'under_review',
      applicationStatus: 'under_review',
      reviewedAt: '2024-01-16T14:00:00Z',
      reviewedBy: 'officer-123',
      reviewedByName: 'John Doe',
    },
    onReviewComplete: mockOnReviewComplete,
    onReview: mockOnReview,
    onReviewStarted: mockOnReviewStarted,
    onSelectApplication: mockOnSelectApplication,
    onBookmarkToggle: mockOnBookmarkToggle,
  },
}

export const NeedsRevision = {
  args: {
    application: {
      ...mockApplication,
      status: 'needs_revision',
      applicationStatus: 'needs_revision',
      reviewComments: 'Please update your business address to include a street number.',
      reviewedAt: '2024-01-16T14:00:00Z',
      reviewedBy: 'officer-123',
      reviewedByName: 'John Doe',
    },
    onReviewComplete: mockOnReviewComplete,
    onReview: mockOnReview,
    onReviewStarted: mockOnReviewStarted,
    onSelectApplication: mockOnSelectApplication,
    onBookmarkToggle: mockOnBookmarkToggle,
  },
}

export const Resubmitted = {
  args: {
    application: {
      ...mockApplication,
      status: 'resubmit',
      applicationStatus: 'resubmit',
    },
    onReviewComplete: mockOnReviewComplete,
    onReview: mockOnReview,
    onReviewStarted: mockOnReviewStarted,
    onSelectApplication: mockOnSelectApplication,
    onBookmarkToggle: mockOnBookmarkToggle,
  },
}

export const Approved = {
  args: {
    application: {
      ...mockApplication,
      status: 'approved',
      applicationStatus: 'approved',
      reviewComments: 'Application approved. All requirements met.',
      reviewedAt: '2024-01-16T14:00:00Z',
      reviewedBy: 'officer-123',
      reviewedByName: 'John Doe',
    },
    onReviewComplete: mockOnReviewComplete,
    onReview: mockOnReview,
    onReviewStarted: mockOnReviewStarted,
    onSelectApplication: mockOnSelectApplication,
    onBookmarkToggle: mockOnBookmarkToggle,
  },
}

export const Rejected = {
  args: {
    application: {
      ...mockApplication,
      status: 'rejected',
      applicationStatus: 'rejected',
      rejectionReason: 'Application rejected due to incomplete documentation.',
      reviewedAt: '2024-01-16T14:00:00Z',
      reviewedBy: 'officer-123',
      reviewedByName: 'John Doe',
    },
    onReviewComplete: mockOnReviewComplete,
    onReview: mockOnReview,
    onReviewStarted: mockOnReviewStarted,
    onSelectApplication: mockOnSelectApplication,
    onBookmarkToggle: mockOnBookmarkToggle,
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
      reviewedAt: '2024-01-16T14:00:00Z',
      reviewedBy: 'officer-123',
      reviewedByName: 'John Doe',
    },
    onReviewComplete: mockOnReviewComplete,
    onReview: mockOnReview,
    onReviewStarted: mockOnReviewStarted,
    onSelectApplication: mockOnSelectApplication,
    onBookmarkToggle: mockOnBookmarkToggle,
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
      reviewedAt: '2024-01-16T14:00:00Z',
      reviewedBy: 'officer-123',
      reviewedByName: 'John Doe',
    },
    onReviewComplete: mockOnReviewComplete,
    onReview: mockOnReview,
    onReviewStarted: mockOnReviewStarted,
    onSelectApplication: mockOnSelectApplication,
    onBookmarkToggle: mockOnBookmarkToggle,
  },
}

export const ClosedBusiness = {
  args: {
    application: {
      ...mockApplication,
      status: 'approved',
      applicationStatus: 'approved',
      businessStatus: 'closed',
      reviewedAt: '2024-01-16T14:00:00Z',
      reviewedBy: 'officer-123',
      reviewedByName: 'John Doe',
    },
    onReviewComplete: mockOnReviewComplete,
    onReview: mockOnReview,
    onReviewStarted: mockOnReviewStarted,
    onSelectApplication: mockOnSelectApplication,
    onBookmarkToggle: mockOnBookmarkToggle,
  },
}

export const Draft = {
  args: {
    application: {
      ...mockApplication,
      status: 'draft',
      applicationStatus: 'draft',
    },
    onReviewComplete: mockOnReviewComplete,
    onReview: mockOnReview,
    onReviewStarted: mockOnReviewStarted,
    onSelectApplication: mockOnSelectApplication,
    onBookmarkToggle: mockOnBookmarkToggle,
  },
}

export const Loading = {
  render: () => <LoadingPlaceholder message="Loading application details..." />,
}

export const StartingReview = {
  render: () => <LoadingPlaceholder message="Starting review..." />,
}

export const NoApplicationSelected = {
  args: {
    application: null,
    onReviewComplete: mockOnReviewComplete,
    onReview: mockOnReview,
    onReviewStarted: mockOnReviewStarted,
    onSelectApplication: mockOnSelectApplication,
    onBookmarkToggle: mockOnBookmarkToggle,
  },
}
