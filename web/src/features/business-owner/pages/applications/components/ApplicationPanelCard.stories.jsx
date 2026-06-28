import ApplicationPanelCard from './ApplicationPanelCard'

export default {
  title: 'Business Owner/ApplicationCard',
  component: ApplicationPanelCard,
  tags: ['autodocs'],
  argTypes: {
    isSelected: { control: 'boolean' },
    onClick: { action: 'clicked' },
  },
}

const mockBusiness = {
  id: 'app-1234567890',
  name: 'Sample Business Name',
  referenceNumber: 'BP-2024-001',
  updatedAt: '2024-01-15T10:30:00Z',
  createdAt: '2024-01-10T08:00:00Z',
  permitStatus: 'Draft',
  formData: {
    section_1: { businessName: 'Sample Business' },
    section_2: { address: '123 Main St' },
  },
}

export const Draft = {
  args: {
    business: {
      ...mockBusiness,
      permitStatus: 'Draft',
      rawStatus: 'draft',
    },
    isSelected: false,
  },
}

export const DraftSelected = {
  args: {
    business: {
      ...mockBusiness,
      permitStatus: 'Draft',
      rawStatus: 'draft',
    },
    isSelected: true,
  },
}

export const Submitted = {
  args: {
    business: {
      ...mockBusiness,
      permitStatus: 'Pending Review',
      rawStatus: 'submitted',
    },
    isSelected: false,
  },
}

export const UnderReview = {
  args: {
    business: {
      ...mockBusiness,
      permitStatus: 'Under Review',
      rawStatus: 'under_review',
    },
    isSelected: false,
  },
}

export const NeedsRevision = {
  args: {
    business: {
      ...mockBusiness,
      permitStatus: 'Action Required',
      rawStatus: 'needs_revision',
    },
    isSelected: false,
  },
}

export const Resubmitted = {
  args: {
    business: {
      ...mockBusiness,
      permitStatus: 'Resubmitted',
      rawStatus: 'resubmit',
    },
    isSelected: false,
  },
}

export const Approved = {
  args: {
    business: {
      ...mockBusiness,
      permitStatus: 'Active',
      rawStatus: 'approved',
      referenceNumber: 'BP-2024-001',
    },
    isSelected: false,
  },
}

export const Rejected = {
  args: {
    business: {
      ...mockBusiness,
      permitStatus: 'Rejected',
      rawStatus: 'rejected',
    },
    isSelected: false,
  },
}

export const Expired = {
  args: {
    business: {
      ...mockBusiness,
      permitStatus: 'Expired',
      rawStatus: 'expired',
      referenceNumber: 'BP-2023-001',
    },
    isSelected: false,
  },
}

export const Suspended = {
  args: {
    business: {
      ...mockBusiness,
      permitStatus: 'Suspended',
      rawStatus: 'suspended',
      referenceNumber: 'BP-2024-001',
    },
    isSelected: false,
  },
}

export const AppealPending = {
  args: {
    business: {
      ...mockBusiness,
      permitStatus: 'Appeal Pending',
      rawStatus: 'appeal_pending',
    },
    isSelected: false,
  },
}

export const PendingRenewal = {
  args: {
    business: {
      ...mockBusiness,
      permitStatus: 'For Renewal',
      rawStatus: 'pending_renewal',
      referenceNumber: 'BP-2023-001',
    },
    isSelected: false,
  },
}

export const DraftWithProgress = {
  args: {
    business: {
      ...mockBusiness,
      permitStatus: 'Draft',
      formData: {
        section_1: { businessName: 'Sample Business' },
        section_2: { address: '123 Main St' },
        section_3: { contact: 'email@example.com' },
        section_4: {},
      },
    },
    isSelected: false,
  },
}

export const NoReferenceNumber = {
  args: {
    business: {
      ...mockBusiness,
      permitStatus: 'Draft',
      referenceNumber: null,
    },
    isSelected: false,
  },
}

export const AllStatuses = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <ApplicationPanelCard business={{ ...mockBusiness, permitStatus: 'Draft', rawStatus: 'draft' }} isSelected={false} onClick={() => {}} />
      <ApplicationPanelCard business={{ ...mockBusiness, permitStatus: 'Pending Review', rawStatus: 'submitted' }} isSelected={false} onClick={() => {}} />
      <ApplicationPanelCard business={{ ...mockBusiness, permitStatus: 'Under Review', rawStatus: 'under_review' }} isSelected={false} onClick={() => {}} />
      <ApplicationPanelCard business={{ ...mockBusiness, permitStatus: 'Action Required', rawStatus: 'needs_revision' }} isSelected={false} onClick={() => {}} />
      <ApplicationPanelCard business={{ ...mockBusiness, permitStatus: 'Resubmitted', rawStatus: 'resubmit' }} isSelected={false} onClick={() => {}} />
      <ApplicationPanelCard business={{ ...mockBusiness, permitStatus: 'Active', rawStatus: 'approved', referenceNumber: 'BP-2024-001' }} isSelected={false} onClick={() => {}} />
      <ApplicationPanelCard business={{ ...mockBusiness, permitStatus: 'Rejected', rawStatus: 'rejected' }} isSelected={false} onClick={() => {}} />
      <ApplicationPanelCard business={{ ...mockBusiness, permitStatus: 'Expired', rawStatus: 'expired' }} isSelected={false} onClick={() => {}} />
      <ApplicationPanelCard business={{ ...mockBusiness, permitStatus: 'Suspended', rawStatus: 'suspended' }} isSelected={false} onClick={() => {}} />
      <ApplicationPanelCard business={{ ...mockBusiness, permitStatus: 'Appeal Pending', rawStatus: 'appeal_pending' }} isSelected={false} onClick={() => {}} />
      <ApplicationPanelCard business={{ ...mockBusiness, permitStatus: 'For Renewal', rawStatus: 'pending_renewal' }} isSelected={false} onClick={() => {}} />
    </div>
  ),
}
