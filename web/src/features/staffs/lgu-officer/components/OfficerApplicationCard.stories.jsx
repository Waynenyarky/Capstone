import OfficerApplicationCard from '../pages/applications/components/OfficerApplicationCard'

export default {
  title: 'LGU Officer/OfficerApplicationCard',
  component: OfficerApplicationCard,
  tags: ['autodocs'],
  argTypes: {
    isSelected: { control: 'boolean' },
    onClick: { action: 'clicked' },
  },
}

const mockApplication = {
  _id: 'app-1234567890',
  businessName: 'Sample Business Name',
  applicationReferenceNumber: 'APP-2024-001',
  status: 'submitted',
  applicationStatus: 'submitted',
  formType: 'unified_business_permit',
  formData: {
    businessName: 'Sample Business',
    generalPermitCategory: null,
  },
  createdAt: '2024-01-10T08:00:00Z',
  updatedAt: '2024-01-15T10:30:00Z',
  submittedAt: '2024-01-15T10:30:00Z',
  reviewedByName: 'John Doe',
}

export const Draft = {
  args: {
    item: {
      ...mockApplication,
      status: 'draft',
      applicationStatus: 'draft',
      applicationReferenceNumber: null,
      reviewedByName: null,
    },
    type: 'drafts',
    isSelected: false,
  },
}

export const DraftSelected = {
  args: {
    item: {
      ...mockApplication,
      status: 'draft',
      applicationStatus: 'draft',
      applicationReferenceNumber: null,
      reviewedByName: null,
    },
    type: 'drafts',
    isSelected: true,
  },
}

export const Submitted = {
  args: {
    item: {
      ...mockApplication,
      status: 'submitted',
      applicationStatus: 'submitted',
      reviewedByName: null,
    },
    type: 'applications',
    isSelected: false,
  },
}

export const UnderReview = {
  args: {
    item: {
      ...mockApplication,
      status: 'under_review',
      applicationStatus: 'under_review',
      reviewedByName: 'John Doe',
    },
    type: 'applications',
    isSelected: false,
  },
}

export const NeedsRevision = {
  args: {
    item: {
      ...mockApplication,
      status: 'needs_revision',
      applicationStatus: 'needs_revision',
      reviewedByName: 'John Doe',
    },
    type: 'applications',
    isSelected: false,
  },
}

export const Resubmitted = {
  args: {
    item: {
      ...mockApplication,
      status: 'resubmit',
      applicationStatus: 'resubmit',
      reviewedByName: 'John Doe',
    },
    type: 'applications',
    isSelected: false,
  },
}

export const Approved = {
  args: {
    item: {
      ...mockApplication,
      status: 'approved',
      applicationStatus: 'approved',
      reviewedByName: 'John Doe',
    },
    type: 'applications',
    isSelected: false,
  },
}

export const Rejected = {
  args: {
    item: {
      ...mockApplication,
      status: 'rejected',
      applicationStatus: 'rejected',
      reviewedByName: 'John Doe',
    },
    type: 'applications',
    isSelected: false,
  },
}

export const RegularPermit = {
  args: {
    item: {
      ...mockApplication,
      formType: 'unified_business_permit',
      formData: {
        businessName: 'Sample Business',
      },
    },
    type: 'applications',
    isSelected: false,
  },
}

export const CooperativePermit = {
  args: {
    item: {
      ...mockApplication,
      formType: 'general_permit',
      formData: {
        businessName: 'Cooperative Sample',
        generalPermitCategory: 'cooperative',
      },
    },
    type: 'applications',
    isSelected: false,
  },
}

export const ChainsawPermit = {
  args: {
    item: {
      ...mockApplication,
      formType: 'general_permit',
      formData: {
        businessName: 'Chainsaw Services',
        generalPermitCategory: 'chainsaw',
      },
    },
    type: 'applications',
    isSelected: false,
  },
}

export const BazaarVendor = {
  args: {
    item: {
      ...mockApplication,
      formType: 'general_permit',
      formData: {
        businessName: 'Festival Food Stall',
        generalPermitCategory: 'bazaar_festival_vendors',
      },
    },
    type: 'applications',
    isSelected: false,
  },
}

export const Appeal = {
  args: {
    item: {
      _id: 'appeal-123',
      businessName: 'Sample Business',
      status: 'submitted',
      appealType: 'Denial of permit',
      description: 'We believe our application was wrongly denied due to misunderstanding of our business nature.',
      reviewedByName: 'Jane Smith',
    },
    type: 'appeals',
    isSelected: false,
  },
}

export const EditRequest = {
  args: {
    item: {
      _id: 'edit-123',
      businessName: 'Sample Business',
      status: 'pending',
      fieldName: 'businessName',
      reviewedByName: 'Jane Smith',
    },
    type: 'editRequests',
    isSelected: false,
  },
}

export const Inspection = {
  args: {
    item: {
      _id: 'inspection-123',
      businessName: 'Sample Business',
      status: 'pending_assignment',
      inspectionType: 'Initial Inspection',
      scheduledDate: '2024-02-01T09:00:00Z',
      reviewedByName: null,
    },
    type: 'inspections',
    isSelected: false,
  },
}

export const Owner = {
  args: {
    item: {
      _id: 'owner-123',
      firstName: 'Juan',
      lastName: 'Dela Cruz',
      email: 'juan@example.com',
    },
    type: 'owners',
    isSelected: false,
  },
}

export const AllStatuses = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <OfficerApplicationCard item={{ ...mockApplication, status: 'draft', applicationStatus: 'draft', reviewedByName: null }} type="drafts" isSelected={false} onClick={() => {}} />
      <OfficerApplicationCard item={{ ...mockApplication, status: 'submitted', applicationStatus: 'submitted', reviewedByName: null }} type="applications" isSelected={false} onClick={() => {}} />
      <OfficerApplicationCard item={{ ...mockApplication, status: 'under_review', applicationStatus: 'under_review', reviewedByName: 'John Doe' }} type="applications" isSelected={false} onClick={() => {}} />
      <OfficerApplicationCard item={{ ...mockApplication, status: 'needs_revision', applicationStatus: 'needs_revision', reviewedByName: 'John Doe' }} type="applications" isSelected={false} onClick={() => {}} />
      <OfficerApplicationCard item={{ ...mockApplication, status: 'resubmit', applicationStatus: 'resubmit', reviewedByName: 'John Doe' }} type="applications" isSelected={false} onClick={() => {}} />
      <OfficerApplicationCard item={{ ...mockApplication, status: 'approved', applicationStatus: 'approved', reviewedByName: 'John Doe' }} type="applications" isSelected={false} onClick={() => {}} />
      <OfficerApplicationCard item={{ ...mockApplication, status: 'rejected', applicationStatus: 'rejected', reviewedByName: 'John Doe' }} type="applications" isSelected={false} onClick={() => {}} />
    </div>
  ),
}

export const AllPermitTypes = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <OfficerApplicationCard item={{ ...mockApplication, formType: 'unified_business_permit', formData: { businessName: 'Regular Business' } }} type="applications" isSelected={false} onClick={() => {}} />
      <OfficerApplicationCard item={{ ...mockApplication, formType: 'general_permit', formData: { businessName: 'Cooperative Inc', generalPermitCategory: 'cooperative' } }} type="applications" isSelected={false} onClick={() => {}} />
      <OfficerApplicationCard item={{ ...mockApplication, formType: 'general_permit', formData: { businessName: 'Chainsaw Services', generalPermitCategory: 'chainsaw' } }} type="applications" isSelected={false} onClick={() => {}} />
      <OfficerApplicationCard item={{ ...mockApplication, formType: 'general_permit', formData: { businessName: 'Festival Stall', generalPermitCategory: 'bazaar_festival_vendors' } }} type="applications" isSelected={false} onClick={() => {}} />
      <OfficerApplicationCard item={{ ...mockApplication, formType: 'general_permit', formData: { businessName: 'Street Vendor', generalPermitCategory: 'peddlers' } }} type="applications" isSelected={false} onClick={() => {}} />
      <OfficerApplicationCard item={{ ...mockApplication, formType: 'general_permit', formData: { businessName: 'Cemetery Plot', generalPermitCategory: 'cemetery_stallholders' } }} type="applications" isSelected={false} onClick={() => {}} />
      <OfficerApplicationCard item={{ ...mockApplication, formType: 'general_permit', formData: { businessName: 'Fish Farm', generalPermitCategory: 'fish_pond' } }} type="applications" isSelected={false} onClick={() => {}} />
    </div>
  ),
}
