import React, { useEffect, useRef, useState } from 'react'
import { Typography, Grid, theme, Card } from 'antd'
import BlurFade from '@/shared/components/BlurFade.jsx'
import ScrambleText from '@/shared/components/ScrambleText.jsx'

const { Title, Text } = Typography
const { useBreakpoint } = Grid

export default function TransparencyDashboard({ publicStats }) {
  const { token } = theme.useToken()
  const screens = useBreakpoint()
  const [inView, setInView] = useState(false)
  const ref = useRef(null)

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

  useEffect(() => {
    const el = ref.current
    if (!el || typeof IntersectionObserver === 'undefined') return
    const obs = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          setInView(true)
          obs.unobserve(el)
        }
      })
    }, { root: null, rootMargin: '0px 0px -20% 0px' })
    obs.observe(el)
    return () => obs.disconnect()
  }, [])

  return (
    <section
      ref={ref}
      style={{
        width: '100%',
        maxWidth: 1280,
        margin: '0 auto',
        padding: screens.md ? '0 24px 24px' : '0 12px 16px',
      }}
    >
      <BlurFade delay={0.05} duration={0.45} onViewport={true}>
        <div
          style={{
            border: `1px solid ${token.colorBorderSecondary}`,
            borderRadius: token.borderRadiusLG,
            padding: screens.md ? '24px 28px' : '18px 14px',
            background: token.colorBgContainer,
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
                Trusted public progress
              </Title>
              <Text
                style={{
                  display: 'block',
                  marginTop: 0,
                  marginBottom: 8,
                  fontSize: screens.md ? 13 : 13,
                  lineHeight: 1.25,
                  color: token.colorTextSecondary,
                  textAlign: screens.md ? 'left' : 'center',
                }}
              >
                See the momentum behind every business permit and approval.
              </Text>
            </div>
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
            {statCards.map((item, index) => (
              <BlurFade key={item.label} delay={0.12 + index * 0.08} duration={0.35} fullHeight={false}>
                <Card
                  size="small"
                  variant="borderless"
                  style={{
                    flex: screens.md ? '1 1 0' : '1 1 100%',
                    minWidth: screens.md ? 0 : '100%',
                    width: '100%',
                    background: token.colorBgContainer,
                    borderRadius: token.borderRadiusLG,
                    border: '1px solid transparent',
                    boxShadow: 'none',
                    opacity: 1,
                    filter: 'none',
                    transform: 'none',
                    transition: 'none',
                  }}
                  styles={{ body: { padding: screens.md ? '14px 14px 12px' : '12px' } }}
                >
                  <ScrambleText
                    text={String(item.value)}
                    duration={900}
                    chars={'0123456789'}
                    autoScramble={inView}
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
            ))}
          </div>
        </div>
      </BlurFade>
    </section>
  )
}
