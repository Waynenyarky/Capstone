import { Layout, Typography, Space, Grid, theme, Divider } from 'antd'
import { Link } from 'react-router-dom'

const { Footer } = Layout
const { Text, Paragraph } = Typography
const { useBreakpoint } = Grid

export default function HomeFooter() {
  const screens = useBreakpoint()
  const { token } = theme.useToken()

  const linkStyle = {
    color: token.colorTextSecondary,
    fontSize: screens.md ? '13px' : '12px',
    display: 'block',
    textDecoration: 'none',
    transition: 'color 0.3s',
  }

  return (
    <Footer style={{
      background: token.colorBgContainer,
      color: token.colorText,
      padding: screens.md ? '40px 48px 40px' : '32px 20px 32px',
    }}>
      <div style={{ margin: '0 auto', maxWidth: '1280px' }}>
        <div style={{
          display: 'flex',
          flexDirection: screens.md ? 'row' : 'column',
          justifyContent: 'space-between',
          alignItems: screens.md ? 'flex-start' : 'flex-start',
          gap: screens.md ? '24px' : '20px',
          marginBottom: screens.md ? '24px' : '20px',
        }}>
          <div style={{ flex: 1 }}>
            <Space direction="vertical" size={screens.md ? 'small' : 8}>
              <Link
                to="/terms"
                style={linkStyle}
                onMouseEnter={(e) => e.target.style.color = token.colorPrimary}
                onMouseLeave={(e) => e.target.style.color = token.colorTextSecondary}
              >
                Terms of Service
              </Link>
              <Link
                to="/privacy"
                style={linkStyle}
                onMouseEnter={(e) => e.target.style.color = token.colorPrimary}
                onMouseLeave={(e) => e.target.style.color = token.colorTextSecondary}
              >
                Privacy Policy
              </Link>
              <a
                href="https://www.alaminoscity.gov.ph/citizens-charter"
                target="_blank"
                rel="noopener noreferrer"
                style={linkStyle}
                onMouseEnter={(e) => e.target.style.color = token.colorPrimary}
                onMouseLeave={(e) => e.target.style.color = token.colorTextSecondary}
              >
                Alaminos Citizen&apos;s Charter
              </a>
            </Space>
          </div>
          <div style={{ flex: 1 }}>
            <Text style={{ fontSize: screens.md ? '13px' : '12px', color: token.colorTextSecondary, display: 'block', marginBottom: 8 }}>
              © 2026 BizClear. All Rights Reserved.
            </Text>
          </div>
        </div>

        <Divider style={{ margin: screens.md ? '16px 0' : '12px 0', borderColor: token.colorBorderSecondary }} />

        <div style={{
          background: token.colorBgLayout,
          padding: screens.md ? '16px' : '12px',
          borderRadius: token.borderRadius,
          border: `1px solid ${token.colorBorderSecondary}`,
        }}>
          <Paragraph
            style={{
              fontSize: screens.md ? '12px' : '11px',
              color: token.colorTextSecondary,
              marginBottom: 0,
              lineHeight: 1.5,
              textAlign: screens.md ? 'left' : 'left',
            }}
          >
            <Text strong style={{ color: token.colorText }}>Anti-Red Tape Compliance Notice:</Text> This platform complies with Republic Act No. 11032 (Ease of Doing Business Act) and the Anti-Red Tape Act. We are committed to providing efficient, transparent, and citizen-friendly services. For complaints or feedback regarding service delivery, please contact the BPLO office or visit the City Hall.
          </Paragraph>
        </div>
      </div>
    </Footer>
  )
}
