import { Typography, Space, Button, Pagination, Tooltip } from 'antd'
import LottieSpinner from '@/shared/components/LottieSpinner.jsx'
import { PlusOutlined } from '@ant-design/icons'
import ApplicationCard from './ApplicationCard'
import BlurFade from '@/shared/components/BlurFade.jsx'
import { getStatusLabel, getBusinessDisplayName, getBusinessReferenceNumber, getBusinessId } from '../../utils/statusUtils'

const { Title } = Typography

const PAGE_SIZE = 10

function ApplicationsList({
  businesses,
  loading,
  selectedBusinessId,
  currentPage,
  onPageChange,
  onBusinessSelect,
  onAddBusiness,
  isSelectingType,
  draftLimitReached = false
}) {
  return (
    <BlurFade onViewport={true} delay={0.1} duration={0.5} direction="down" fullHeight={false}>
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 8 }}>
          <Title level={5} style={{ margin: 0 }}>My Applications</Title>
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
              {businesses.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE).map((business, index, array) => {
                const businessId = getBusinessId(business)
                const isSelected = businessId === selectedBusinessId
                const isLast = index === array.length - 1

                // Warn if both status fields exist with different values
                if (business.applicationStatus && business.permitStatus &&
                    business.applicationStatus !== business.permitStatus) {
                  console.warn(`[ApplicationsList] Status mismatch for ${businessId}: applicationStatus="${business.applicationStatus}" vs permitStatus="${business.permitStatus}"`)
                }

                return (
                  <ApplicationCard
                    key={businessId}
                    business={{
                      id: businessId,
                      name: getBusinessDisplayName(business),
                      referenceNumber: getBusinessReferenceNumber(business),
                      updatedAt: business.updatedAt,
                      createdAt: business.createdAt,
                      address: business.businessAddress?.full ||
                        [business.businessAddress?.streetAddress || business.businessAddress?.street, business.businessAddress?.barangayName, business.businessAddress?.cityName].filter(Boolean).join(', ') ||
                        'No address',
                      permitStatus: getStatusLabel(business.applicationStatus || business.permitStatus),
                      rawStatus: business.applicationStatus || business.permitStatus,
                      businessType: business.primaryLineOfBusiness || business.lineOfBusiness || business.formType || 'N/A',
                    }}
                    isSelected={isSelected}
                    onClick={() => onBusinessSelect(businessId)}
                    style={isLast ? { marginBottom: 8 } : undefined}
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

        <Tooltip title={draftLimitReached ? 'You can only have up to 2 draft, pending, or submitted applications at a time. Please complete or delete existing applications before creating a new one.' : ''}>
          <Button
            type="dashed"
            icon={<PlusOutlined />}
            style={{ width: '100%' }}
            onClick={onAddBusiness}
            disabled={isSelectingType || draftLimitReached}
          >
            Apply
          </Button>
        </Tooltip>
      </div>
    </BlurFade>
  )
}

export default ApplicationsList
