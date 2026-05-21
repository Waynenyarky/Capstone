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
    fontSize: '13px',
    display: 'block',
    textDecoration: 'none',
    transition: 'color 0.3s',
  }

  return (
    <Footer style={{
      background: token.colorBgContainer,
      color: token.colorText,
      padding: screens.md ? '40px 48px 40px' : '40px 20px 30px',
    }}>
      <div style={{ margin: '0 auto' }}>
        <div style={{
          display: 'flex',
          flexDirection: screens.xs ? 'column' : 'row',
          justifyContent: 'space-between',
          alignItems: screens.xs ? 'flex-start' : 'center',
          gap: '16px'
        }}>
          <Space direction="horizontal">
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
            <a
              href="https://www.alaminoscity.gov.ph/index.html"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                ...linkStyle,
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
              onMouseEnter={(e) => e.target.style.color = token.colorPrimary}
              onMouseLeave={(e) => e.target.style.color = token.colorTextSecondary}
            >
              Official City Website
            </a>
          </Space>
          <Text style={{ fontSize: '12px', color: token.colorTextTertiary }}>
            © 2026 BizClear. All Rights Reserved.
          </Text>
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

