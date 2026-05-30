import React from 'react'

/**
 * BorderBeam — an animated beam of light that travels smoothly along the border.
 * Inspired by Magic UI's BorderBeam component.
 * Uses the Alaminos logo palette: red (#CE1126), blue (#0038A8), yellow (#FCD116).
 *
 * Usage as a wrapper:
 *   <BorderBeam><Content /></BorderBeam>
 *
 * @param {React.ReactNode} children - Content to wrap
 * @param {number} duration - animation cycle in seconds (default 4)
 * @param {string} colorFrom - first color (default #CE1126 red)
 * @param {string} colorMid - middle color (default #0038A8 blue)
 * @param {string} colorTo - third color (default #FCD116 yellow)
 * @param {number} borderWidth - border thickness in px (default 2)
 * @param {number} borderRadius - corner radius in px (default 12)
 * @param {boolean} reverse - reverse animation direction (default false)
 * @param {object} style - extra container style
 */
export default function BorderBeam({
  children,
  duration = 4,
  colorFrom = '#CE1126',
  colorMid = '#0038A8',
  colorTo = '#FCD116',
  borderWidth = 2,
  borderRadius = 12,
  reverse = false,
  style,
}) {
  const id = React.useId().replace(/:/g, '')

  return (
    <div
      style={{
        position: 'relative',
        borderRadius,
        padding: borderWidth,
        ...style,
      }}
    >
      {/* Spinning gradient - clipped to border only via mask */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          borderRadius,
          overflow: 'hidden',
          pointerEvents: 'none',
          WebkitMask: `linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)`,
          WebkitMaskComposite: 'xor',
          maskComposite: 'exclude',
          padding: borderWidth,
        }}
      >
        <div
          style={{
            position: 'absolute',
            inset: '-50%',
            width: '200%',
            height: '200%',
            background: `conic-gradient(from 0deg, transparent 0%, ${colorFrom} 10%, transparent 20%, ${colorMid} 35%, transparent 45%, ${colorTo} 55%, transparent 65%)`,
            animation: `borderBeamSpin${id} ${duration}s linear infinite${reverse ? ' reverse' : ''}`,
          }}
        />
      </div>

      {/* Inner content */}
      <div
        style={{
          position: 'relative',
          borderRadius: borderRadius - borderWidth,
          background: 'var(--ant-color-bg-container, #fff)',
          zIndex: 1,
        }}
      >
        {children}
      </div>

      <style>{`
        @keyframes borderBeamSpin${id} {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}
