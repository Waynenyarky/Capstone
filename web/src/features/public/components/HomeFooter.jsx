import { Layout, Typography, Space, Grid, theme } from 'antd'
import { Link } from 'react-router-dom'

const { Footer } = Layout
const { Text } = Typography
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
          gap: screens.xs ? '24px' : '16px'
        }}>
          <Space direction={screens.xs ? 'vertical' : 'horizontal'} size={screens.xs ? 'small' : 'middle'} style={{ width: screens.xs ? '100%' : 'auto' }}>
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
              href="https://alaminoscity.gov.ph/public-service/city-services/City%20Government%20of%20Alaminos,%20Pangasinan%20Citizen's%20Charter.pdf"
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

      </div>
    </Footer>
  )
}

