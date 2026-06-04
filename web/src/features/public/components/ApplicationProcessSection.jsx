import { useState } from 'react'
import { Typography, Card, Grid, theme, Tag } from 'antd'
import { ShopOutlined, FileTextOutlined, SafetyOutlined, BuildOutlined, EnvironmentOutlined, MedicineBoxOutlined, UnorderedListOutlined, ClockCircleOutlined } from '@ant-design/icons'

const { Title, Text } = Typography
const { useBreakpoint } = Grid

const APPLICATIONS = [
  {
    id: 'business-permit',
    title: 'Business Permit',
    description: 'Required for all new business establishments within the municipality. Submit the completed form along with DTI/SEC registration, barangay clearance, fire safety certificate, and other required documents for processing.',
    icon: ShopOutlined,
    processingSteps: 8,
    estimatedDays: 12,
  },
  {
    id: 'occupational-permit',
    title: 'Occupational Permit',
    description: 'Required for individuals working within the municipality. Must be secured annually with valid barangay clearance, police clearance, health certificate, and proof of employment.',
    icon: FileTextOutlined,
    processingSteps: 5,
    estimatedDays: 4,
  },
  {
    id: 'fire-safety',
    title: 'Fire Safety Inspection',
    description: 'Issued by the Bureau of Fire Protection. Required for all business permit applications. Includes on-site inspection of fire exits, extinguishers, alarms, and overall safety compliance.',
    icon: SafetyOutlined,
    processingSteps: 6,
    estimatedDays: 11,
  },
  {
    id: 'sanitary-permit',
    title: 'Sanitary Permit',
    description: 'Required for businesses handling food, beverages, or health-related services. Municipal Health Office validates hygiene standards, waste disposal, and food handling practices.',
    icon: MedicineBoxOutlined,
    processingSteps: 5,
    estimatedDays: 8,
  },
  {
    id: 'building-permit',
    title: 'Building Permit',
    description: 'Required before construction, renovation, or demolition of any structure. Requires architectural, structural, electrical, and plumbing plans signed by licensed professionals.',
    icon: BuildOutlined,
    processingSteps: 7,
    estimatedDays: 19,
  },
  {
    id: 'zoning-clearance',
    title: 'Zoning Clearance',
    description: 'Certifies that the business location complies with local zoning regulations. Municipal Planning Office verifies land use compatibility and issues clearance certificate.',
    icon: EnvironmentOutlined,
    processingSteps: 5,
    estimatedDays: 6,
  },
]

export default function ApplicationProcessSection() {
  const { token } = theme.useToken()
  const screens = useBreakpoint()
  const [hoveredCard, setHoveredCard] = useState(null)

  const horizontalPadding = screens.xl ? '192px' : screens.lg ? '128px' : screens.md ? '64px' : '24px'

  return (
    <section
      style={{
        width: '100%',
        padding: `80px 0`,
      }}
    >
      <div>
        <div style={{ marginBottom: 14, paddingLeft: horizontalPadding }}>
          <Title
            level={4}
            style={{
              marginTop: 0,
              marginBottom: 8,
              fontSize: screens.md ? 20 : 18,
              lineHeight: 1.25,
              color: token.colorTextHeading,
              textAlign: 'left',
            }}
          >
            Application Process
          </Title>
          <Text
            style={{
              display: 'block',
              marginTop: 0,
              marginBottom: 8,
              fontSize: screens.md ? 13 : 13,
              lineHeight: 1.25,
              color: token.colorTextSecondary,
              textAlign: 'left',
            }}
          >
            Explore the steps and requirements for each permit type.
          </Text>
        </div>

        <div style={{ position: 'relative' }}>
          <style>{`.app-process-scroll::-webkit-scrollbar { display: none; }`}</style>
          <div
            className="app-process-scroll"
            style={{
              display: 'flex',
              alignItems: 'stretch',
              gap: 16,
              overflowX: 'auto',
              scrollSnapType: 'x mandatory',
              scrollBehavior: 'smooth',
              paddingLeft: horizontalPadding,
              paddingRight: horizontalPadding,
              scrollPaddingLeft: horizontalPadding,
              scrollPaddingRight: horizontalPadding,
              paddingTop: 8,
              paddingBottom: 16,
              msOverflowStyle: 'none',
              scrollbarWidth: 'none',
            }}
          >
            {APPLICATIONS.map((app) => (
              <div
                key={app.id}
                style={{
                  flex: '0 0 auto',
                  width: screens.lg ? 'calc(60% - 6px)' : screens.md ? 'calc(80% - 3px)' : '95%',
                  minWidth: 360,
                  scrollSnapAlign: 'start',
                }}
              >
                <Card
                  size="small"
                  style={{
                    height: '100%',
                    minHeight: screens.lg ? 220 : 200,
                    border: screens.lg && hoveredCard === app.id
                      ? `1px solid ${token.colorPrimary}`
                      : `1px solid ${token.colorBorder}`,
                    borderRadius: token.borderRadiusLG,
                    background: token.colorBgContainer,
                    cursor: 'default',
                    transition: screens.lg ? 'border-color 0.2s, box-shadow 0.2s, transform 0.2s' : 'none',
                    boxShadow: screens.lg && hoveredCard === app.id ? token.boxShadowCard : 'none',
                    transform: screens.lg && hoveredCard === app.id ? 'scale(1.02)' : 'scale(1)',
                  }}
                  bodyStyle={{
                    padding: 0,
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'row',
                  }}
                  onMouseEnter={screens.lg ? () => setHoveredCard(app.id) : undefined}
                  onMouseLeave={screens.lg ? () => setHoveredCard(null) : undefined}
                >
                  <div
                    style={{
                      flex: '0 0 40%',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'flex-start',
                      justifyContent: 'flex-end',
                      padding: screens.lg ? '16px 20px' : '12px',
                      paddingTop: screens.lg ? 90 : 48,
                    }}
                  >
                    {app.icon && (
                      <app.icon
                        style={{
                          fontSize: screens.lg ? 24 : 20,
                          color: token.colorTextSecondary,
                          marginBottom: 8,
                        }}
                      />
                    )}
                    <Title level={5} style={{ margin: 0 }}>
                      {app.title}
                    </Title>
                    <div
                      style={{
                        maxHeight: screens.lg && hoveredCard === app.id ? 30 : 0,
                        overflow: 'hidden',
                        transition: screens.lg ? 'max-height 0.15s ease-out' : 'none',
                      }}
                    >
                      <Text
                        style={{
                          display: 'block',
                          marginTop: 8,
                          color: token.colorPrimary,
                          fontSize: 12,
                          fontWeight: 500,
                          opacity: screens.lg && hoveredCard === app.id ? 1 : 0,
                          transform: screens.lg && hoveredCard === app.id ? 'translateY(0)' : 'translateY(10px)',
                          transition: screens.lg ? 'opacity 0.15s ease-out, transform 0.15s ease-out' : 'none',
                        }}
                      >
                        View details →
                      </Text>
                    </div>
                  </div>
                  <div
                    style={{
                      flex: 1,
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'flex-end',
                      padding: screens.lg ? '24px' : '20px',
                      borderLeft: `1px solid ${token.colorBorderSecondary}`,
                    }}
                  >
                    <Text
                      style={{
                        display: 'block',
                        marginBottom: 16,
                        fontSize: screens.lg ? 14 : 13,
                        lineHeight: 1.5,
                        color: token.colorText,
                      }}
                    >
                      {app.description}
                    </Text>
                    <div
                      style={{
                        display: 'flex',
                        gap: 12,
                        flexWrap: 'wrap',
                        alignItems: 'center',
                      }}
                    >
                      <Tag
                        icon={<UnorderedListOutlined />}
                        style={{
                          margin: 0,
                          borderRadius: token.borderRadiusSM,
                          background: token.colorFillSecondary,
                          border: 'none',
                          fontSize: 12,
                        }}
                      >
                        {app.processingSteps} step{app.processingSteps !== 1 ? 's' : ''}
                      </Tag>
                      <Tag
                        icon={<ClockCircleOutlined />}
                        style={{
                          margin: 0,
                          borderRadius: token.borderRadiusSM,
                          background: token.colorFillSecondary,
                          border: 'none',
                          fontSize: 12,
                        }}
                      >
                        ~{app.estimatedDays} day{app.estimatedDays !== 1 ? 's' : ''}
                      </Tag>
                    </div>
                  </div>
                </Card>
              </div>
            ))}
          </div>

        </div>
      </div>
    </section>
  )
}
