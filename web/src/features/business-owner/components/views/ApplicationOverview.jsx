import { useState } from 'react'
import { Typography, Card, Grid, Divider, Modal, Drawer } from 'antd'
import { 
  FormOutlined,
  BookOutlined,
  CustomerServiceOutlined
} from '@ant-design/icons'
import DynamicFaqSection from '@/shared/components/DynamicFaqSection'
import DynamicPageContent from '@/shared/components/DynamicPageContent'

const { Title, Text } = Typography
const { useBreakpoint } = Grid

export default function ApplicationOverview({ visibleSections, sectionCompleteMap, token }) {
  const screens = useBreakpoint()
  const [hoveredCard, setHoveredCard] = useState(null)
  const [manualVisible, setManualVisible] = useState(false)

  const completedCount = visibleSections.filter((_, idx) => sectionCompleteMap[idx] === true).length
  const totalCount = visibleSections.length
  const percentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0

  const overviewCards = [
    {
      key: 'how-it-works',
      icon: <FormOutlined />,
      title: 'How This Works',
      content: [
        'Select a section below to start filling out your details',
        'Complete all required sections to proceed',
        'Once all sections are completed, you\'ll be able to review and submit your application',
        'Check out the FAQ section if you need more information'
      ],
      spanRows: true
    },
    {
      key: 'manual',
      icon: <BookOutlined />,
      title: 'BizClear Manual',
      isButton: true,
      onClick: () => setManualVisible(true)
    },
    {
      key: 'help',
      icon: <CustomerServiceOutlined />,
      title: 'Need More Help?',
      isButton: true,
      onClick: () => window.location.href = '/help'
    }
  ]

  return (
    <div>
      <Title level={5} style={{ marginBottom: 4 }}>Overview</Title>
      
      <div style={{ marginBottom: 16 }}>
        <Text  style={{ display: 'block', marginBottom: 12 }}>
          You&apos;re about to apply for a Business Permit. This form is divided into sections you can complete at your own pace.
        </Text>

        <Divider style={{ margin: '0 0 16px 0' }} />

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: screens.md ? 'repeat(2, 1fr)' : '1fr',
            gridTemplateRows: screens.md ? 'repeat(2, auto)' : 'auto',
            gap: 12,
          }}
        >
          {overviewCards.map((card) => (
            <Card
              key={card.key}
              size="small"
              style={{
                border: screens.md && hoveredCard === card.key && card.isButton ? `1px solid ${token.colorPrimary}` : `1px solid ${token.colorBorder}`,
                borderRadius: token.borderRadiusLG,
                background: token.colorBgContainer,
                cursor: card.isButton ? 'pointer' : 'default',
                transition: screens.md ? 'border-color 0.2s, box-shadow 0.2s, transform 0.2s' : 'none',
                boxShadow: screens.md && hoveredCard === card.key && card.isButton ? token.boxShadowCard : 'none',
                transform: screens.md && hoveredCard === card.key && card.isButton ? 'scale(1.02)' : 'scale(1)',
                gridRow: card.spanRows ? 'span 2' : 'auto',
              }}
              onMouseEnter={screens.md && card.isButton ? () => setHoveredCard(card.key) : undefined}
              onMouseLeave={screens.md && card.isButton ? () => setHoveredCard(null) : undefined}
              bodyStyle={{
                padding: screens.md ? '16px 20px' : '12px',
                paddingTop: screens.md ? 90 : 48,
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'flex-end',
                alignItems: 'flex-start',
              }}
              onClick={card.isButton ? card.onClick : undefined}
            >
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                <div
                  style={{
                    color: token.colorTextSecondary,
                    fontSize: screens.md ? 24 : 20,
                    marginBottom: 8,
                  }}
                >
                  {card.icon}
                </div>
                <Title level={5} style={{ margin: 0 }}>
                  {card.title}
                </Title>
                {card.isProgress ? (
                  <div style={{ marginTop: 8, display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                    <Progress
                      type="dashboard"
                      percent={percentage}
                      gapDegree={50}
                      gapPlacement="bottom"
                      size={140}
                      strokeColor={token.colorPrimary}
                    />
                  </div>
                ) : card.isButton ? (
                  <>
                    <Text type="secondary" style={{ marginTop: 4 }}>
                      {card.key === 'help' ? 'Request help from our officers!' : 'Read policies and guidelines.'}
                    </Text>
                    <div
                      style={{
                        maxHeight: screens.md && hoveredCard === card.key ? 30 : 0,
                        overflow: 'hidden',
                        transition: screens.md ? 'max-height 0.15s ease-out' : 'none',
                      }}
                    >
                      <Text
                        style={{
                          display: 'block',
                          marginTop: 8,
                          color: token.colorPrimary,
                          fontSize: 12,
                          fontWeight: 500,
                          opacity: screens.md && hoveredCard === card.key ? 1 : 0,
                          transform: screens.md && hoveredCard === card.key ? 'translateY(0)' : 'translateY(10px)',
                          transition: screens.md ? 'opacity 0.15s ease-out, transform 0.15s ease-out' : 'none',
                        }}
                      >
                        {card.key === 'help' ? 'Get help →' : 'Open manual →'}
                      </Text>
                    </div>
                  </>
                ) : (
                  <ul style={{ 
                    paddingLeft: 20, 
                    margin: 0, 
                    marginTop: 4,
                    color: token.colorTextSecondary 
                  }}>
                    {card.content.map((item, idx) => (
                      <li key={idx} style={{ marginBottom: idx < card.content.length - 1 ? 4 : 0 }}>
                        {item}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </Card>
          ))}
        </div>
        <Divider style={{ margin: '16px 0' }} />
      </div>

      <div style={{ marginTop: 24 }}>
        <Title level={5} style={{ marginBottom: 12 }}>Frequently Asked Questions</Title>
        <DynamicFaqSection slotId="business-owner-application-faq" hideWrapper hideHeader />
      </div>

      {screens.md ? (
        <Modal
          title="BizClear Manual"
          open={manualVisible}
          onCancel={() => setManualVisible(false)}
          footer={null}
          width={800}
          style={{ top: 20 }}
        >
          <DynamicPageContent slotId="bizclear-manual" embedded compact />
        </Modal>
      ) : (
        <Drawer
          title="BizClear Manual"
          open={manualVisible}
          onClose={() => setManualVisible(false)}
          placement="right"
          height="100%"
          style={{ height: '100%' }}
        >
          <DynamicPageContent slotId="bizclear-manual" embedded compact />
        </Drawer>
      )}
    </div>
  )
}
