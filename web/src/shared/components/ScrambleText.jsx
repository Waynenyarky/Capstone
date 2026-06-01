import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'

const DEFAULT_CHARSET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()-_=+[]{}<>?/|'

export default function ScrambleText({
  text,
  duration = 900,
  chars = DEFAULT_CHARSET,
  autoScramble = true,
  style = {},
  className = '',
}) {
  const [displayText, setDisplayText] = useState(String(text ?? ''))
  const intervalRef = useRef(null)

  const targetText = useMemo(() => String(text ?? ''), [text])

  const stopScramble = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }, [])

  const scramble = useCallback(() => {
    stopScramble()

    if (!targetText || targetText === '—') {
      setDisplayText(targetText)
      return
    }

    const steps = Math.max(8, Math.floor(duration / 60))
    let iteration = 0

    intervalRef.current = setInterval(() => {
      iteration += 1
      const progress = iteration / steps
      const revealCount = Math.min(targetText.length, Math.floor(progress * targetText.length))
      const next = targetText
        .split('')
        .map((char, index) => {
          // Only animate digits; leave other characters as-is
          if (!/\d/.test(char)) return char
          if (index < revealCount) return char
          return chars[Math.floor(Math.random() * chars.length)]
        })
        .join('')

      setDisplayText(next)

      if (iteration >= steps) {
        stopScramble()
        setDisplayText(targetText)
      }
    }, 60)
  }, [chars, duration, stopScramble, targetText])

  useEffect(() => {
    setDisplayText(targetText)
    if (!autoScramble) return

    const timer = setTimeout(() => scramble(), 120)
    return () => {
      clearTimeout(timer)
      stopScramble()
    }
  }, [autoScramble, duration, scramble, stopScramble, targetText])

  useEffect(() => () => stopScramble(), [stopScramble])

  return (
    <span
      className={className}
      onMouseEnter={scramble}
      onFocus={scramble}
      style={{
        display: 'inline-block',
        transition: 'opacity 0.2s ease',
        cursor: 'default',
        ...style,
      }}
    >
      {displayText}
    </span>
  )
}
