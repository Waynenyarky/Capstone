import React, { useEffect, useRef } from 'react'

export default function BlurFade({
  children,
  delay = 0,
  duration = 0.4,
  direction = 'down',
  blur = '6px',
  className = '',
  fullHeight = true,
}) {
  const ref = useRef(null)

  useEffect(() => {
    const element = ref.current
    if (!element) return

    // Inject keyframes if not already present
    if (!document.getElementById('blur-fade-keyframes')) {
      const style = document.createElement('style')
      style.id = 'blur-fade-keyframes'
      style.textContent = `
        @keyframes blur-fade-in {
          from {
            opacity: 0;
            filter: blur(var(--blur));
            transform: translateY(var(--translate-y));
          }
          to {
            opacity: 1;
            filter: blur(0);
            transform: translateY(0);
          }
        }
      `
      document.head.appendChild(style)
    }

    // Set CSS variables for animation
    const translateMap = {
      up: '-20px',
      down: '20px',
      left: '-20px',
      right: '20px',
    }

    element.style.setProperty('--blur', blur)
    element.style.setProperty('--translate-y', translateMap[direction] || '20px')
    element.style.animation = `blur-fade-in ${duration}s ease-out ${delay}s forwards`
    element.style.opacity = '0'

    return () => {
      element.style.animation = ''
      element.style.opacity = ''
    }
  }, [delay, duration, direction, blur])

  return (
    <div ref={ref} className={className} style={{ height: fullHeight ? '100%' : 'auto', width: '100%' }}>
      {children}
    </div>
  )
}
