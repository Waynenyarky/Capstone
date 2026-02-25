import { Typography, Grid, theme } from 'antd'
import { BRAND_COLORS } from '@/shared/theme/ThemeProvider'

const { Title } = Typography
const { useBreakpoint } = Grid

export default function HeroSection() {
  const screens = useBreakpoint()
  const { token } = theme.useToken()

  const fontSize = screens.md ? '56px' : '36px'

  return (
    <div style={{ 
      background: token.colorBgContainer,
      padding: screens.md ? '0 50px' : '0 24px',
      textAlign: 'center',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flex: 1,
    }}>
      <div style={{ maxWidth: '800px' }}>
        <Title level={1} style={{ 
          marginBottom: '8px', 
          fontSize,
          fontWeight: 700,
          lineHeight: 0.8,
        }}>
          <span style={{ color: BRAND_COLORS.blue }}>Business </span>
          <span style={{ color: BRAND_COLORS.red }}>Permit </span>
          <span style={{ color: BRAND_COLORS.yellow }}>Processing</span>
        </Title>
        <Title level={2} style={{ 
          margin: 0, 
          fontSize: screens.md ? '40px' : '28px',
          fontWeight: 700,
          color: token.colorText,
        }}>
          Made Simpler.
        </Title>
      </div>
    </div>
  )
}
