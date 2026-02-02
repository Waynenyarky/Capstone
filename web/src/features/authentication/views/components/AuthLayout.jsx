import React from 'react'
import { Layout, ConfigProvider, Grid, Typography } from 'antd'
import { useNavigate } from 'react-router-dom'

// Logo from public folder (web/public/BizClear.png)
const BizClearLogo = '/BizClear.png'

const { useBreakpoint } = Grid
const { Title } = Typography

/**
 * AuthLayout Component
 * Logo + "BizClear" at top (home link), then form.
 */
export default function AuthLayout({
  children,
  formMaxWidth = 440
}) {
  const navigate = useNavigate()
  const screens = useBreakpoint()
  const isMobile = !screens.md

  return (
    <Layout
      style={{
        minHeight: '100vh',
        background: '#fff',
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      <main
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'flex-start',
          padding: isMobile ? '60px 20px 40px' : '60px 24px 64px',
          overflowY: 'auto'
        }}
      >
        <div
          style={{
            width: '100%',
            maxWidth: formMaxWidth,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center'
          }}
        >
          <button
            type="button"
            onClick={() => navigate('/')}
            style={{
              padding: 0,
              border: 'none',
              background: 'none',
              cursor: 'pointer',
              borderRadius: 0,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: isMobile ? 8 : 12,
              marginBottom: isMobile ? 24 : 32,
            }}
            aria-label="Go to home"
          >
            <div
              style={{
                width: isMobile ? 170 : 250,
                overflow: 'hidden',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <img
                src={BizClearLogo}
                alt="BizClear"
                style={{ height: '100%', width: '100%', objectFit: 'cover', display: 'block' }}
              />
            </div>
            {/* <Title level={1} style={{ color: '#003a70',  lineHeight: 1, fontWeight: 800 }}>
              BizClear
            </Title> */}
          </button>
          {children}
        </div>
      </main>
    </Layout>
  )
}
