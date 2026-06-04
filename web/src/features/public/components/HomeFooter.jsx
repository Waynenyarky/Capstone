import { Layout, Typography, Space, Grid, theme } from 'antd'
import { Link } from 'react-router-dom'

const { Footer } = Layout
const { Text } = Typography
const { useBreakpoint } = Grid

const GOVERNMENT_LOGOS = [
  { src: '/government-logos/republic-of-philippines.png', alt: 'Republic of the Philippines' },
  { src: '/government-logos/bagong-pilipinas.png', alt: 'Bagong Pilipinas' },
  { src: '/government-logos/alaminos-city.png', alt: 'City of Alaminos' },
  { src: '/government-logos/pangasinan-province.png', alt: 'Province of Pangasinan' },
]

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

  const logoSize = screens.md ? 40 : 32

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
          {/* Government Logos - Bottom Left */}
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: screens.md ? 12 : 8,
            order: screens.xs ? 2 : 1,
          }}>
            {GOVERNMENT_LOGOS.map((logo) => (
              <img
                key={logo.alt}
                src={logo.src}
                alt={logo.alt}
                style={{
                  height: logoSize,
                  width: logoSize,
                  objectFit: 'contain',
                }}
              />
            ))}
          </div>

          {/* Links - Center */}
          <Space direction={screens.xs ? 'vertical' : 'horizontal'} size={screens.xs ? 'small' : 'middle'} style={{ 
            width: screens.xs ? '100%' : 'auto',
            order: screens.xs ? 1 : 2,
            flex: 1,
            justifyContent: screens.xs ? 'flex-start' : 'center',
          }}>
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
            <Link
              to="/manual"
              style={linkStyle}
              onMouseEnter={(e) => e.target.style.color = token.colorPrimary}
              onMouseLeave={(e) => e.target.style.color = token.colorTextSecondary}
            >
              BizClear Manual
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

          {/* Copyright - Right */}
          <Text style={{ 
            fontSize: '12px', 
            color: token.colorTextTertiary,
            order: screens.xs ? 3 : 3,
          }}>
            © 2026 BizClear. All Rights Reserved.
          </Text>
        </div>

      </div>
    </Footer>
  )
}

