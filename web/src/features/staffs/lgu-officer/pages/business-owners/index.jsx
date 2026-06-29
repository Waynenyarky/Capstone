import { useState, useCallback, useMemo } from 'react'
import { PlusOutlined } from '@ant-design/icons'
import BusinessOwnerDetailPanel from './components/BusinessOwnerDetailPanel'
import RegisterBusinessOwnerModal from './components/RegisterBusinessOwnerModal'
import ListPanel from '@/shared/components/ListPanel'
import PanelCard from '@/shared/components/PanelCard'
import ResponsiveSplitLayout from '@/shared/components/ResponsiveSplitLayout'
import dayjs from 'dayjs'

const OWNER_STATUS_FILTER_OPTIONS = [
  { label: 'All', value: 'all' },
  { label: 'Active', value: 'active' },
  { label: 'Inactive', value: 'inactive' },
  { label: 'Pending Deletion', value: 'pending_deletion' },
]

export default function OfficerBusinessOwners() {
  const [selectedItem, setSelectedItem] = useState(null)
  const [activeFilters, setActiveFilters] = useState({ status: 'all' })
  const [registerModalOpen, setRegisterModalOpen] = useState(false)

  // Mock data - TODO: Replace with actual data fetch
  const businessOwners = useMemo(() => [
    {
      _id: '1',
      userId: 'user1',
      firstName: 'Juan',
      lastName: 'Dela Cruz',
      middleName: 'A',
      suffix: '',
      fullName: 'Juan Dela Cruz',
      email: 'juan.delacruz@example.com',
      phoneNumber: '+63 912 345 6789',
      sex: 'male',
      dateOfBirth: '1985-05-15',
      maritalStatus: 'married',
      address: {
        street: '123 Main St',
        barangay: 'Barangay 123',
        city: 'Manila',
        province: 'Metro Manila',
        zipCode: '1000',
      },
      placeOfBirth: 'Manila',
      nationality: 'Filipino',
      highestEducationalAttainment: 'college',
      fatherName: 'Jose Dela Cruz',
      motherName: 'Maria Santos',
      distinctiveMark: '',
      isActive: true,
      isEmailVerified: true,
      mfaEnabled: true,
      pisCompleted: true,
      deletionPending: false,
      createdAt: '2024-01-15T08:00:00Z',
      lastLoginAt: '2024-06-28T10:30:00Z',
      businessCount: 3,
      applications: [
        {
          _id: 'app1',
          applicationReferenceNumber: 'BP-2024-0001',
          businessName: 'Juan\'s Sari-Sari Store',
          status: 'approved',
          submittedAt: '2024-01-20T10:00:00Z',
        },
        {
          _id: 'app2',
          applicationReferenceNumber: 'BP-2024-0005',
          businessName: 'Dela Cruz Trading',
          status: 'under_review',
          submittedAt: '2024-03-15T09:30:00Z',
        },
      ],
    },
    {
      _id: '2',
      userId: 'user2',
      firstName: 'Maria',
      lastName: 'Santos',
      middleName: '',
      suffix: '',
      fullName: 'Maria Santos',
      email: 'maria.santos@example.com',
      phoneNumber: '+63 917 234 5678',
      sex: 'female',
      dateOfBirth: '1990-08-20',
      maritalStatus: 'single',
      address: {
        street: '456 Oak Ave',
        barangay: 'Barangay 456',
        city: 'Quezon City',
        province: 'Metro Manila',
        zipCode: '1100',
      },
      placeOfBirth: 'Quezon City',
      nationality: 'Filipino',
      highestEducationalAttainment: 'college_graduate',
      fatherName: 'Pedro Santos',
      motherName: 'Ana Reyes',
      distinctiveMark: '',
      isActive: true,
      isEmailVerified: true,
      mfaEnabled: false,
      pisCompleted: true,
      deletionPending: false,
      createdAt: '2024-02-20T14:30:00Z',
      lastLoginAt: '2024-06-27T16:45:00Z',
      businessCount: 1,
      applications: [
        {
          _id: 'app3',
          applicationReferenceNumber: 'BP-2024-0010',
          businessName: 'Santos Bakery',
          status: 'approved',
          submittedAt: '2024-02-10T11:00:00Z',
        },
      ],
    },
    {
      _id: '3',
      userId: 'user3',
      firstName: 'Pedro',
      lastName: 'Reyes',
      middleName: 'B',
      suffix: 'Jr',
      fullName: 'Pedro Reyes Jr',
      email: 'pedro.reyes@example.com',
      phoneNumber: '+63 918 345 6789',
      sex: 'male',
      dateOfBirth: '1988-12-10',
      maritalStatus: 'married',
      address: {
        street: '789 Pine Rd',
        barangay: 'Barangay 789',
        city: 'Makati',
        province: 'Metro Manila',
        zipCode: '1200',
      },
      placeOfBirth: 'Makati',
      nationality: 'Filipino',
      highestEducationalAttainment: 'postgraduate',
      fatherName: 'Carlos Reyes',
      motherName: 'Elena Garcia',
      distinctiveMark: '',
      isActive: false,
      isEmailVerified: true,
      mfaEnabled: false,
      pisCompleted: true,
      deletionPending: false,
      createdAt: '2024-03-10T09:15:00Z',
      lastLoginAt: '2024-05-15T11:20:00Z',
      businessCount: 2,
      applications: [
        {
          _id: 'app4',
          applicationReferenceNumber: 'BP-2024-0015',
          businessName: 'Reyes Hardware',
          status: 'submitted',
          submittedAt: '2024-04-05T14:00:00Z',
        },
      ],
    },
    {
      _id: '4',
      userId: 'user4',
      firstName: 'Ana',
      lastName: 'Garcia',
      middleName: 'C',
      suffix: '',
      fullName: 'Ana Garcia',
      email: 'ana.garcia@example.com',
      phoneNumber: '+63 919 456 7890',
      sex: 'female',
      dateOfBirth: '1995-03-25',
      maritalStatus: 'single',
      address: {
        street: '321 Elm St',
        barangay: 'Barangay 321',
        city: 'Pasig',
        province: 'Metro Manila',
        zipCode: '1600',
      },
      placeOfBirth: 'Pasig',
      nationality: 'Filipino',
      highestEducationalAttainment: 'college',
      fatherName: 'Roberto Garcia',
      motherName: 'Luisa Martinez',
      distinctiveMark: '',
      isActive: true,
      isEmailVerified: false,
      mfaEnabled: false,
      pisCompleted: false,
      deletionPending: true,
      createdAt: '2024-04-05T16:00:00Z',
      lastLoginAt: '2024-06-20T09:00:00Z',
      businessCount: 1,
      applications: [],
    },
  ], [])
  const loading = false

  const getItemId = useCallback((item) => {
    return item._id || item.userId || item.id
  }, [])

  const handleSelectBusinessOwner = useCallback((owner) => {
    setSelectedItem({ ...owner, _itemType: 'business-owners', _itemId: getItemId(owner) })
  }, [getItemId])

  const handleDrawerClose = useCallback(() => {
    setSelectedItem(null)
  }, [])

  const filteredList = useMemo(() => {
    const list = [...businessOwners]

    const filtered = list.filter(owner => {
      // Status filter
      if (activeFilters.status && activeFilters.status !== 'all') {
        if (activeFilters.status === 'active' && (!owner.isActive || owner.deletionPending)) return false
        if (activeFilters.status === 'inactive' && owner.isActive) return false
        if (activeFilters.status === 'pending_deletion' && !owner.deletionPending) return false
      }

      return true
    })

    return filtered.sort((a, b) => {
      const da = new Date(a.createdAt || 0).getTime()
      const db = new Date(b.createdAt || 0).getTime()
      return db - da
    })
  }, [businessOwners, activeFilters])

  const renderCard = (owner, currentSelectedId, onSelect) => {
    const ownerId = getItemId(owner)
    const createdDate = owner.createdAt ? dayjs(owner.createdAt).format('MMMM D, YYYY') : null
    const lastLoginDate = owner.lastLoginAt ? dayjs(owner.lastLoginAt).format('MMMM D, YYYY') : null

    // Determine account status for primary tag
    let statusLabel = 'Active'
    let statusColor = 'green'
    if (owner.deletionPending) {
      statusLabel = 'Pending Deletion'
      statusColor = 'orange'
    } else if (!owner.isActive) {
      statusLabel = 'Inactive'
      statusColor = 'red'
    }

    const tags = [
      { label: statusLabel, color: statusColor },
    ]
    if (owner.email) {
      tags.push({ label: owner.email, color: 'default' })
    }
    if (owner.businessCount !== undefined) {
      tags.push({ label: `${owner.businessCount} business${owner.businessCount !== 1 ? 'es' : ''}`, color: 'default' })
    }
    const applicationCount = owner.applications?.length || 0
    if (applicationCount > 0) {
      tags.push({ label: `${applicationCount} application${applicationCount !== 1 ? 's' : ''}`, color: 'default' })
    }

    const metaInfo = []
    if (createdDate) {
      metaInfo.push({ label: 'Registered on', value: createdDate })
    }
    if (lastLoginDate) {
      metaInfo.push({ label: 'Last logged in', value: lastLoginDate })
    }

    return (
      <PanelCard
        key={ownerId}
        item={owner}
        selected={currentSelectedId === ownerId}
        onClick={() => onSelect(owner)}
        title={owner.fullName || owner.name || 'Unnamed Owner'}
        description=""
        metaInfo={metaInfo}
        tags={tags}
      />
    )
  }

  const listContent = (
    <ListPanel
      items={filteredList}
      isLoading={loading}
      selectedId={selectedItem?._itemId}
      onSelectItem={handleSelectBusinessOwner}
      renderCard={renderCard}
      searchPlaceholder="Search business owners..."
      filterConfig={[
        {
          key: 'status',
          label: 'Status',
          type: 'select',
          options: OWNER_STATUS_FILTER_OPTIONS,
          value: activeFilters.status === 'all' ? null : activeFilters.status,
        },
      ]}
      onFilterChange={(key, value) => setActiveFilters(prev => ({ ...prev, [key]: value === null ? 'all' : value }))}
      onClearFilters={() => setActiveFilters({ status: 'all' })}
      onRefresh={() => {}}
      showRefresh={true}
      customFilter={true}
      primaryButton={{
        label: 'Register',
        icon: <PlusOutlined />,
        onClick: () => setRegisterModalOpen(true),
      }}
    />
  )

  const detailContent = selectedItem ? (
    <BusinessOwnerDetailPanel
      businessOwner={selectedItem}
      onReviewComplete={() => {}}
    />
  ) : null

  return (
    <>
      <ResponsiveSplitLayout
        listContent={listContent}
        detailContent={detailContent}
        drawerTitle="Business Owner details"
        onDrawerClose={handleDrawerClose}
        mobileDrawerPlacement="bottom"
      />
      <RegisterBusinessOwnerModal
        open={registerModalOpen}
        onClose={() => setRegisterModalOpen(false)}
      />
    </>
  )
}
