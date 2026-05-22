import { Typography, Grid, theme } from 'antd'
import { EnvironmentOutlined, PhoneOutlined, ClockCircleOutlined } from '@ant-design/icons'
import { BRAND_COLORS } from '@/shared/theme/ThemeProvider'

const { Title, Paragraph, Text } = Typography
const { useBreakpoint } = Grid

export default function OfficeLocationSection() {
  const screens = useBreakpoint()
  const { token } = theme.useToken()

  return (
    <section
      id="office-location-section"
      style={{
      width: '100%',
      maxWidth: 1280,
      margin: '0 auto',
    }}>
      <div
        style={{
          border: `1px solid ${token.colorBorderSecondary}`,
          borderRadius: token.borderRadiusLG,
          padding: screens.md ? '24px 28px' : '18px 14px',
          background: token.colorBgLayout,
        }}
      >
        <Title
          level={4}
          style={{
            marginTop: 0,
            marginBottom: 8,
            textAlign: 'left',
          }}
        >
          Office Location
        </Title>

        <div style={{
          display: 'grid',
          gridTemplateColumns: screens.md ? '1fr 1fr' : '1fr',
          gap: screens.md ? 32 : 24,
        }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
              <EnvironmentOutlined style={{ 
                color: token.colorTextSecondary, 
                fontSize: '16px',
                marginTop: 2,
                flexShrink: 0,
              }} />
              <div>
                <Text strong style={{ fontSize: '14px', display: 'block', marginBottom: 4, color: token.colorText }}>
                  Alaminos Business Permit and Licensing Office (BPLO)
                </Text>
                <Paragraph style={{ 
                  marginBottom: 0, 
                  fontSize: screens.md ? '14px' : '13px',
                  color: token.colorTextSecondary 
                }}>
                  City Hall Complex, Lucap Road<br />
                  Alaminos City, Pangasinan 2404<br />
                  Philippines
                </Paragraph>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
              <PhoneOutlined style={{ 
                color: token.colorTextSecondary, 
                fontSize: '16px',
                marginTop: 2,
                flexShrink: 0,
              }} />
              <div>
                <Text strong style={{ fontSize: '14px', display: 'block', marginBottom: 4, color: token.colorText }}>
                  Contact Information
                </Text>
                <Paragraph style={{ 
                  marginBottom: 0, 
                  fontSize: screens.md ? '14px' : '13px',
                  color: token.colorTextSecondary 
                }}>
                  Phone: (075) 551-1234<br />
                  Email: bplo@alaminoscity.gov.ph
                </Paragraph>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
              <ClockCircleOutlined style={{ 
                color: token.colorTextSecondary, 
                fontSize: '16px',
                marginTop: 2,
                flexShrink: 0,
              }} />
              <div>
                <Text strong style={{ fontSize: '14px', display: 'block', marginBottom: 4, color: token.colorText }}>
                  Office Hours
                </Text>
                <Paragraph style={{ 
                  marginBottom: 0, 
                  fontSize: screens.md ? '14px' : '13px',
                  color: token.colorTextSecondary 
                }}>
                  Monday - Friday: 8:00 AM - 5:00 PM<br />
                  Saturday: 8:00 AM - 12:00 PM<br />
                  Sunday: Closed
                </Paragraph>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <iframe
              title="Alaminos City Hall BPLO Location"
              src="https://maps.google.com/maps?q=Alaminos+City+Hall,+Pangasinan,+Philippines&t=&z=16&ie=UTF8&iwloc=&output=embed"
              width="100%"
              height={screens.md ? 280 : 220}
              style={{
                border: 'none',
                borderRadius: token.borderRadius,
                display: 'block',
              }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
        </div>
      </div>
    </section>
  )
}
