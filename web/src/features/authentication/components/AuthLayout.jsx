import React from 'react'
import { Layout, Grid } from 'antd'
import { useNavigate } from 'react-router-dom'
import BizClearLogo from '@/shared/components/BizClearLogo.jsx'
import { usePageSlide } from '@/shared/hooks/usePageSlide.js'

const { useBreakpoint } = Grid

/**
 * AuthLayout Component
 * Logo at top (home link), then form.
 */
export default function AuthLayout({
  children,
  formMaxWidth = 440
}) {
  const navigate = useNavigate()
  const pageSlide = usePageSlide()
  const screens = useBreakpoint()
  const isMobile = !screens.md

  const handleGoHome = () => {
    if (pageSlide) {
      pageSlide.exit('/')
    } else {
      navigate('/')
    }
  }

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
            onClick={handleGoHome}
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
              marginBottom: isMobile ? 24 : 48,
            }}
            aria-label="Go to home"
          >
            <BizClearLogo width={isMobile ? 80 : 120} />
          </button>
          {children}
        </div>
      </main>
    </Layout>
  )
}
