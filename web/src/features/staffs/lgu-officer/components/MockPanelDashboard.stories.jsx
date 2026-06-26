import MockPanelDashboard from './MockPanelDashboard'

const mockApplications = [
  {
    _id: 'app-1',
    applicationId: 'app-1',
    businessId: 'biz-1',
    businessName: 'Sari-Sari Store ni Aling Nena',
    applicationReferenceNumber: 'APP-2024-001',
    status: 'submitted',
    applicationStatus: 'submitted',
    formType: 'unified_business_permit',
    formData: { businessName: 'Sari-Sari Store ni Aling Nena' },
    createdAt: '2024-01-15T08:00:00Z',
    submittedAt: '2024-01-15T08:00:00Z',
    reviewedBy: null,
    reviewedByName: null,
  },
  {
    _id: 'app-2',
    applicationId: 'app-2',
    businessId: 'biz-2',
    businessName: 'Carinderia ni Mang Jose',
    applicationReferenceNumber: 'APP-2024-002',
    status: 'under_review',
    applicationStatus: 'under_review',
    formType: 'unified_business_permit',
    formData: { businessName: 'Carinderia ni Mang Jose' },
    createdAt: '2024-01-16T09:00:00Z',
    submittedAt: '2024-01-16T09:00:00Z',
    reviewedBy: 'officer-1',
    reviewedByName: 'Officer Cruz',
  },
  {
    _id: 'app-3',
    applicationId: 'app-3',
    businessId: 'biz-3',
    businessName: 'Hardware Store Depot',
    applicationReferenceNumber: 'APP-2024-003',
    status: 'approved',
    applicationStatus: 'approved',
    formType: 'unified_business_permit',
    formData: { businessName: 'Hardware Store Depot' },
    createdAt: '2024-01-17T10:00:00Z',
    submittedAt: '2024-01-17T10:00:00Z',
    reviewedBy: 'officer-1',
    reviewedByName: 'Officer Santos',
  },
  {
    _id: 'app-4',
    applicationId: 'app-4',
    businessId: 'biz-4',
    businessName: 'Cooperative Market',
    applicationReferenceNumber: 'APP-2024-004',
    status: 'needs_revision',
    applicationStatus: 'needs_revision',
    formType: 'general_permit',
    formData: { 
      businessName: 'Cooperative Market',
      generalPermitCategory: 'cooperative',
    },
    createdAt: '2024-01-18T11:00:00Z',
    submittedAt: '2024-01-18T11:00:00Z',
    reviewedBy: 'officer-2',
    reviewedByName: 'Officer Reyes',
  },
  {
    _id: 'app-5',
    applicationId: 'app-5',
    businessId: 'biz-5',
    businessName: 'Food Stall Vendor',
    applicationReferenceNumber: 'APP-2024-005',
    status: 'rejected',
    applicationStatus: 'rejected',
    formType: 'general_permit',
    formData: { 
      businessName: 'Food Stall Vendor',
      generalPermitCategory: 'bazaar_festival_vendors',
    },
    createdAt: '2024-01-19T12:00:00Z',
    submittedAt: '2024-01-19T12:00:00Z',
    reviewedBy: 'officer-1',
    reviewedByName: 'Officer Cruz',
  },
]

const manyApplications = Array.from({ length: 50 }, (_, i) => ({
  _id: `app-${i + 1}`,
  applicationId: `app-${i + 1}`,
  businessId: `biz-${i + 1}`,
  businessName: `Business ${i + 1}`,
  applicationReferenceNumber: `APP-2024-${String(i + 1).padStart(3, '0')}`,
  status: ['submitted', 'under_review', 'approved', 'rejected', 'needs_revision'][i % 5],
  applicationStatus: ['submitted', 'under_review', 'approved', 'rejected', 'needs_revision'][i % 5],
  formType: i % 3 === 0 ? 'general_permit' : 'unified_business_permit',
  formData: { 
    businessName: `Business ${i + 1}`,
    generalPermitCategory: i % 3 === 0 ? 'cooperative' : undefined,
  },
  createdAt: `2024-01-${(i % 30) + 1}T08:00:00Z`,
  submittedAt: `2024-01-${(i % 30) + 1}T08:00:00Z`,
  reviewedBy: i % 2 === 0 ? 'officer-1' : null,
  reviewedByName: i % 2 === 0 ? 'Officer Cruz' : null,
}))

export default {
  title: 'LGU Officer/Panel Components Dashboard',
  component: MockPanelDashboard,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
  },
}

export const Default = {
  render: () => (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '16px 24px', background: '#fff', borderBottom: '1px solid #f0f0f0' }}>
        <h2 style={{ margin: 0 }}>Panel Components Dashboard - Default</h2>
      </div>
      <div style={{ flex: 1, overflow: 'hidden' }}>
        <MockPanelDashboard />
      </div>
    </div>
  ),
}

export const Loading = {
  render: () => (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '16px 24px', background: '#fff', borderBottom: '1px solid #f0f0f0' }}>
        <h2 style={{ margin: 0 }}>Panel Components Dashboard - Loading</h2>
      </div>
      <div style={{ flex: 1, overflow: 'hidden' }}>
        <MockPanelDashboard isLoading={true} />
      </div>
    </div>
  ),
}

export const Empty = {
  render: () => (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '16px 24px', background: '#fff', borderBottom: '1px solid #f0f0f0' }}>
        <h2 style={{ margin: 0 }}>Panel Components Dashboard - Empty</h2>
      </div>
      <div style={{ flex: 1, overflow: 'hidden' }}>
        <MockPanelDashboard items={[]} />
      </div>
    </div>
  ),
}

export const ManyItems = {
  render: () => (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '16px 24px', background: '#fff', borderBottom: '1px solid #f0f0f0' }}>
        <h2 style={{ margin: 0 }}>Panel Components Dashboard - Many Items (50)</h2>
      </div>
      <div style={{ flex: 1, overflow: 'hidden' }}>
        <MockPanelDashboard items={manyApplications} />
      </div>
    </div>
  ),
}

export const DetailPanelLoading = {
  render: () => (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '16px 24px', background: '#fff', borderBottom: '1px solid #f0f0f0' }}>
        <h2 style={{ margin: 0 }}>Panel Components Dashboard - Detail Panel Loading</h2>
      </div>
      <div style={{ flex: 1, overflow: 'hidden' }}>
        <MockPanelDashboard 
          items={mockApplications} 
          _forceDetailLoading={true}
          _forceSelectedItem={mockApplications[0]}
        />
      </div>
    </div>
  ),
}
