import { Typography, Space, Button, Pagination } from 'antd'
import LottieSpinner from '@/shared/components/LottieSpinner.jsx'
import { PlusOutlined } from '@ant-design/icons'
import BusinessCard from '../BusinessCard'

const { Title } = Typography

const PAGE_SIZE = 10

function getStatusLabel(status) {
  const statusLower = (status || '').toLowerCase()
  if (statusLower === 'submitted') return 'Pending Review'
  if (statusLower === 'under_review') return 'Under Review'
  if (statusLower === 'pending_renewal') return 'For Renewal'
  if (statusLower === 'approved') return 'Active'
  if (statusLower === 'needs_revision') return 'Action Required'
  if (statusLower === 'resubmit') return 'Resubmitted'
  if (statusLower === 'rejected') return 'Rejected'
  if (statusLower === 'draft') return 'Draft'
  return status || 'Unknown'
}

function BusinessListPanel({ 
  businesses, 
  loading, 
  selectedBusinessId, 
  currentPage, 
  onPageChange, 
  onBusinessSelect, 
  onAddBusiness
}) {
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 8 }}>
        <Title level={5} style={{ margin: 0 }}>My Businesses</Title>
      </div>
      
      {loading ? (
        <div style={{ textAlign: 'center', padding: 24 }}>
          <LottieSpinner />
        </div>
      ) : businesses.length === 0 ? (
        <div></div>
      ) : (
        <>
          <Space direction="vertical" size="small" style={{ width: '100%' }}>
            {businesses.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE).map((business) => {
              const businessName = business.businessName || business.tradeName || business.formData?.businessName || business.formData?.['Business / trade name'] || business.formData?.registeredBusinessName || business.formData?.['Business Name'] || business.formData?.['Trade Name'] || business.formData?.tradeName || 'Unnamed Business'
              const referenceNumber = business.applicationReferenceNumber || business.registrationNumber || null
              const businessId = business.businessId || business._id
              const isSelected = businessId === selectedBusinessId
              
              return (
                <BusinessCard
                  key={businessId}
                  business={{
                    id: businessId,
                    name: businessName,
                    referenceNumber,
                    updatedAt: business.updatedAt,
                    address: business.businessAddress?.full ||
                      [business.businessAddress?.streetAddress || business.businessAddress?.street, business.businessAddress?.barangayName, business.businessAddress?.cityName].filter(Boolean).join(', ') ||
                      'No address',
                    permitStatus: getStatusLabel(business.applicationStatus || business.permitStatus),
                    businessType: business.primaryLineOfBusiness || business.lineOfBusiness || business.formType || 'N/A',
                  }}
                  isSelected={isSelected}
                  onClick={() => onBusinessSelect(businessId)}
                />
              )
            })}
          </Space>
          {businesses.length > PAGE_SIZE && (
            <div style={{ textAlign: 'center', marginTop: 8 }}>
              <Pagination 
                size="small" 
                current={currentPage} 
                pageSize={PAGE_SIZE} 
                total={businesses.length} 
                onChange={onPageChange} 
                showSizeChanger={false} 
              />
            </div>
          )}
        </>
      )}
      
      <Button 
        type="dashed" 
        icon={<PlusOutlined />} 
        style={{ width: '100%', marginTop: 12 }}
        onClick={onAddBusiness}
      >
        Add Business
      </Button>
    </div>
  )
}

export default BusinessListPanel
