import { useState } from 'react'
import { Typography, Grid, theme, Card } from 'antd'
import BlurFade from '@/shared/components/BlurFade.jsx'
import ScrambleText from '@/shared/components/ScrambleText.jsx'

const { Title, Text } = Typography
const { useBreakpoint } = Grid

export default function TransparencyDashboard({ publicStats }) {
  const { token } = theme.useToken()
  const screens = useBreakpoint()
  const [hoveredStat, setHoveredStat] = useState(null)

  const sampleValues = [
    248,
    1364,
    29,
  ]

  const statCards = [
    {
      label: 'Businesses registered this year',
      value: publicStats?.totalRegisteredThisYear ?? sampleValues[0],
    },
    {
      label: 'Applications processed this year',
      value: publicStats?.applicationsProcessedThisYear ?? sampleValues[1],
    },
    {
      label: 'Pending applications',
      value: publicStats?.pendingApplications ?? sampleValues[2],
    },
  ]

  return (
    <section
      style={{
        width: '100%',
        maxWidth: 1280,
        margin: '0 auto',
        padding: screens.md ? '0 24px 24px' : '0 12px 16px',
      }}
    >
      <BlurFade delay={0.05} duration={0.45}>
        <div
          style={{
            border: `1px solid ${token.colorBorderSecondary}`,
            borderRadius: token.borderRadiusLG,
            padding: screens.md ? '24px 28px' : '18px 14px',
            background: token.colorBgLayout,
            marginBottom: 16,
          }}
        >
          <div
            style={{
              display: 'flex',
              flexDirection: screens.md ? 'row' : 'column',
              alignItems: screens.md ? 'flex-end' : 'flex-start',
              justifyContent: 'space-between',
              gap: 12,
              marginBottom: 14,
            }}
          >
            <div style={{ flex: 1, textAlign: screens.md ? 'left' : 'center' }}>
              <Text
                style={{
                  display: 'block',
                  textTransform: 'uppercase',
                  letterSpacing: 2.2,
                  fontSize: 11,
                  color: token.colorTextSecondary,
                  marginBottom: 6,
                }}
              >
                Trusted public progress
              </Text>
              <Title
                level={4}
                style={{
                  marginTop: 0,
                  marginBottom: 8,
                  fontSize: screens.md ? 20 : 18,
                  lineHeight: 1.25,
                  color: token.colorTextHeading,
                  textAlign: screens.md ? 'left' : 'center',
                }}
              >
                See the momentum behind every business permit and approval.
              </Title>
            </div>

            <Text
              type="secondary"
              style={{
                maxWidth: screens.md ? 380 : '100%',
                fontSize: 13,
                lineHeight: 1.6,
                textAlign: screens.md ? 'left' : 'center',
                marginBottom: 0,
              }}
            >
              A quick, readable snapshot of the public service activity people care about most.
            </Text>
          </div>

          <div
            style={{
              display: 'flex',
              flexWrap: screens.md ? 'nowrap' : 'wrap',
              gap: 12,
              width: '100%',
              justifyContent: screens.md ? 'space-between' : 'center',
              alignItems: 'stretch',
              marginTop: 4,
              overflowX: screens.md ? 'auto' : 'visible',
              overflowY: 'hidden',
              paddingBottom: 4,
              boxSizing: 'border-box',
            }}
          >
            {statCards.map((item, index) => {
              const isHovered = hoveredStat === index
              return (
              <BlurFade key={item.label} delay={0.12 + index * 0.08} duration={0.35} fullHeight={false}>
                <Card
                  size="small"
                  variant="borderless"
                  onMouseEnter={() => setHoveredStat(index)}
                  onMouseLeave={() => setHoveredStat(null)}
                  onFocus={() => setHoveredStat(index)}
                  onBlur={() => setHoveredStat(null)}
                  style={{
                    flex: screens.md ? '1 1 0' : '1 1 100%',
                    minWidth: screens.md ? 0 : '100%',
                    width: '100%',
                    background: isHovered ? token.colorBgElevated : token.colorBgContainer,
                    borderRadius: token.borderRadiusLG,
                    border: isHovered ? `1px solid ${token.colorPrimaryBorder}` : '1px solid transparent',
                    boxShadow: isHovered
                      ? `0 0 0 1px ${token.colorPrimaryBorder}, 0 10px 24px rgba(0, 0, 0, 0.08)`
                      : 'none',
                    opacity: hoveredStat === null ? 1 : isHovered ? 1 : 0.72,
                    filter: isHovered ? 'brightness(1.03)' : 'brightness(0.96)',
                    transform: 'none',
                    transition: 'background-color 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease, opacity 0.2s ease, filter 0.2s ease',
                  }}
                  styles={{ body: { padding: screens.md ? '14px 14px 12px' : '12px' } }}
                >
                  <ScrambleText
                    text={item.value}
                    duration={900}
                    style={{
                      display: 'block',
                      fontSize: screens.md ? 32 : 28,
                      fontWeight: 700,
                      color: token.colorTextHeading,
                      lineHeight: 1.1,
                    }}
                  />
                  <Text
                    type="secondary"
                    style={{
                      display: 'block',
                      marginTop: 8,
                      fontSize: 13,
                      lineHeight: 1.5,
                    }}
                  >
                    {item.label}
                  </Text>
                </Card>
              </BlurFade>
              )
            })}
          </div>
        </div>
      </BlurFade>
    </section>
  )
}
