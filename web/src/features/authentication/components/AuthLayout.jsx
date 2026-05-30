import { useState, useEffect } from 'react'
import { Layout, Grid, theme } from 'antd'
import { useNavigate, useLocation } from 'react-router-dom'
import { useLottie } from 'lottie-react'
import { usePageSlide } from '@/shared/hooks/usePageSlide.js'

const { useBreakpoint } = Grid
const { useToken } = theme

/**
 * AuthLayout Component
 * Logo at top (home link), then form with fade-in transition.
 */
export default function AuthLayout({
  children,
  formMaxWidth = 300
}) {
  const { token } = useToken()
  const navigate = useNavigate()
  const location = useLocation()
  const pageSlide = usePageSlide()
  const screens = useBreakpoint()
  const isMobile = !screens.md
  const [animationData, setAnimationData] = useState(null)
  
  useEffect(() => {
    fetch('/LogoLottie.json')
      .then((res) => res.json())
      .then((data) => setAnimationData(data))
      .catch((err) => console.error('Failed to load logo animation:', err))
  }, [])
  
  const options = {
    animationData,
    loop: false,
    autoplay: false,
  }
  
  const { View, play, goToAndStop } = useLottie(options)
  
  const handleMouseEnter = () => {
    goToAndStop(0)
    play()
  }

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
        background: token.colorBgContainer,
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
            onMouseEnter={handleMouseEnter}
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
            <div style={{ width: isMobile ? 80 : 120, height: isMobile ? 80 : 120 }}>
              {View}
            </div>
          </button>
          <div
            key={location.pathname}
            style={{
              width: '100%',
              animation: 'fadeIn 0.3s ease-out'
            }}
          >
            {children}
          </div>
        </div>
      </main>
      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
      `}</style>
    </Layout>
  )
}
