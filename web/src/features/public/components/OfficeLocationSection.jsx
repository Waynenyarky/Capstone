import { Typography, Grid, theme } from 'antd'
import { EnvironmentOutlined, PhoneOutlined, ClockCircleOutlined } from '@ant-design/icons'

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
      padding: screens.md ? '0 20px' : '0 16px',
    }}>
      <div
        style={{
          border: `1px solid ${token.colorBorderSecondary}`,
          borderRadius: token.borderRadiusLG,
          padding: screens.md ? '32px 36px' : '24px 20px',
          background: token.colorBgLayout,
        }}
      >
        <Title
          level={4}
          style={{
            marginTop: 0,
            marginBottom: screens.md ? 20 : 16,
            textAlign: 'left',
            fontSize: screens.md ? 20 : 18,
          }}
        >
          Office Location
        </Title>

        <div style={{
          display: 'grid',
          gridTemplateColumns: screens.md ? '1fr 1fr' : '1fr',
          gap: screens.md ? 40 : 32,
        }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: screens.md ? 20 : 16 }}>
            <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
              <EnvironmentOutlined style={{ 
                color: token.colorPrimary, 
                fontSize: screens.md ? '18px' : '16px',
                marginTop: 3,
                flexShrink: 0,
              }} />
              <div>
                <Text strong style={{ fontSize: screens.md ? '15px' : '14px', display: 'block', marginBottom: 6, color: token.colorText }}>
                  Alaminos Business Permit and Licensing Office (BPLO)
                </Text>
                <Paragraph style={{ 
                  marginBottom: 0, 
                  fontSize: screens.md ? '14px' : '13px',
                  color: token.colorTextSecondary,
                  lineHeight: 1.6,
                }}>
                  City Hall Complex, Lucap Road<br />
                  Alaminos City, Pangasinan 2404<br />
                  Philippines
                </Paragraph>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
              <PhoneOutlined style={{ 
                color: token.colorPrimary, 
                fontSize: screens.md ? '18px' : '16px',
                marginTop: 3,
                flexShrink: 0,
              }} />
              <div>
                <Text strong style={{ fontSize: screens.md ? '15px' : '14px', display: 'block', marginBottom: 6, color: token.colorText }}>
                  Contact Information
                </Text>
                <Paragraph style={{ 
                  marginBottom: 0, 
                  fontSize: screens.md ? '14px' : '13px',
                  color: token.colorTextSecondary,
                  lineHeight: 1.6,
                }}>
                  Phone: (075) 551-1234<br />
                  Email: bplo@alaminoscity.gov.ph
                </Paragraph>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
              <ClockCircleOutlined style={{ 
                color: token.colorPrimary, 
                fontSize: screens.md ? '18px' : '16px',
                marginTop: 3,
                flexShrink: 0,
              }} />
              <div>
                <Text strong style={{ fontSize: screens.md ? '15px' : '14px', display: 'block', marginBottom: 6, color: token.colorText }}>
                  Office Hours
                </Text>
                <Paragraph style={{ 
                  marginBottom: 0, 
                  fontSize: screens.md ? '14px' : '13px',
                  color: token.colorTextSecondary,
                  lineHeight: 1.6,
                }}>
                  Monday - Friday: 8:00 AM - 5:00 PM<br />
                  Saturday: 8:00 AM - 12:00 PM<br />
                  Sunday: Closed
                </Paragraph>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            <iframe
              title="Alaminos City Hall BPLO Location"
              src="https://maps.google.com/maps?q=Alaminos+City+Hall,+Pangasinan,+Philippines&t=&z=16&ie=UTF8&iwloc=&output=embed"
              width="100%"
              height={screens.md ? 300 : 240}
              style={{
                border: `1px solid ${token.colorBorder}`,
                borderRadius: token.borderRadiusLG,
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
