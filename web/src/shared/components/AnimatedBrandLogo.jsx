import { useState, useEffect } from 'react'
import { Typography, theme } from 'antd'
import { useLottie } from 'lottie-react'

const { Title } = Typography

export default function AnimatedBrandLogo({
  size = 32,
  showBrandName = true,
  onClick,
}) {
  const { token } = theme.useToken()
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

  const handleClick = () => {
    onClick?.()
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      onClick?.()
    }
  }

  return (
    <div
      role="button"
      tabIndex={0}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        cursor: onClick ? 'pointer' : 'default',
      }}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      onMouseEnter={handleMouseEnter}
    >
      <div
        style={{
          width: size,
          height: size,
          flexShrink: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'visible',
        }}
      >
        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {View}
        </div>
      </div>
      {showBrandName && (
        <Title
          level={4}
          style={{
            margin: 0,
            lineHeight: 1.2,
            color: token.colorText,
            fontSize: size >= 40 ? '20px' : '18px',
          }}
        >
          {import.meta.env.VITE_APP_BRAND_NAME || 'BizClear'}
        </Title>
      )}
    </div>
  )
}
