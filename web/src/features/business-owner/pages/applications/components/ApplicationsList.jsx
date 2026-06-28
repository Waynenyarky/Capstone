import { Typography, Button, Tooltip, Collapse, theme, Skeleton, Tag } from 'antd'
import { PlusOutlined } from '@ant-design/icons'
import ApplicationPanelCard from './ApplicationPanelCard'
import BlurFade from '@/shared/components/BlurFade.jsx'
import { getStatusLabel, getBusinessDisplayName, getBusinessReferenceNumber, getBusinessId } from '../utils/statusUtils'

const { Title } = Typography
const { Panel } = Collapse

function ApplicationsList({
  businesses,
  loading,
  selectedBusinessId,
  onBusinessSelect,
  onAddBusiness,
  isSelectingType,
  draftLimitReached = false
}) {
  const { token } = theme.useToken()

  const collapseItems = [
    {
      key: 'applications',
      label: (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
          <span>My Applications</span>
          <Tag>{businesses.length}</Tag>
        </div>
      ),
      children: (
        <>
          <div style={{ width: '100%' }}>
            {businesses.map((business, _index) => {
              const businessId = getBusinessId(business)
              const isSelected = businessId === selectedBusinessId

              // Warn if both status fields exist with different values
              if (business.applicationStatus && business.permitStatus &&
                  business.applicationStatus !== business.permitStatus) {
                console.warn(`[ApplicationsList] Status mismatch for ${businessId}: applicationStatus="${business.applicationStatus}" vs permitStatus="${business.permitStatus}"`)
              }

              return (
                <div key={businessId} style={{ marginBottom: 8 }}>
                  <ApplicationPanelCard
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
                  />
                </div>
              )
            })}
          </div>
          <Tooltip title={draftLimitReached ? 'You can only have up to 2 draft, pending, or submitted applications at a time. Please complete or delete existing applications before creating a new one.' : ''}>
            <Button
              type="dashed"
              icon={<PlusOutlined />}
              style={{ width: '100%', marginTop: 8 }}
              onClick={onAddBusiness}
              disabled={isSelectingType || draftLimitReached}
            >
              Apply
            </Button>
          </Tooltip>
        </>
      ),
    }
  ]

  return (
    <BlurFade onViewport={true} delay={0.1} duration={0.5} direction="down" fullHeight={false}>
      <div>
        {loading ? (
          <div style={{ width: '100%' }}>
            {[...Array(5)].map((_, i) => (
              <div key={i} style={{ marginBottom: 8 }}>
                <div style={{ 
                  padding: '16px', 
                  border: `1px solid ${token.colorBorderSecondary}`, 
                  borderRadius: '8px',
                  backgroundColor: token.colorBgContainer
                }}>
                  {/* Title */}
                  <Skeleton.Input active style={{ width: '60%', marginBottom: 12 }} />
                  {/* Meta info */}
                  <Skeleton.Input active size="small" style={{ width: '40%', marginBottom: 8 }} />
                  <Skeleton.Input active size="small" style={{ width: '50%', marginBottom: 12 }} />
                  {/* Tags */}
                  <div style={{ display: 'flex', gap: 8 }}>
                    <Skeleton.Button active size="small" style={{ width: 60 }} />
                    <Skeleton.Button active size="small" style={{ width: 70 }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : businesses.length === 0 ? (
          // No applications - show standalone Apply button
          <Tooltip title={draftLimitReached ? 'You can only have up to 2 draft, pending, or submitted applications at a time. Please complete or delete existing applications before creating a new one.' : ''}>
            <Button
              icon={<PlusOutlined />}
              style={{ width: '100%' }}
              onClick={onAddBusiness}
              disabled={isSelectingType || draftLimitReached}
            >
              Apply
            </Button>
          </Tooltip>
        ) : (
          // Has applications - show collapse with list and Apply button inside
          <>
            <Collapse
              items={collapseItems}
              defaultActiveKey={['applications']}
              style={{
                background: token.colorBgContainer,
              }}
              styles={{
                body: { padding: 0, marginTop: -8 },
                header: { padding: '8px 16px' }
              }}
            />
          </>
        )}
      </div>
    </BlurFade>
  )
}

export default ApplicationsList
