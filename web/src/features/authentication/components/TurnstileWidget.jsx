/**
 * Cloudflare Turnstile widget (IAS-2: Rate + CAPTCHA).
 * Renders when VITE_TURNSTILE_SITE_KEY is set; exposes getToken() and reset() for form submit.
 */
import React, { useEffect, useRef, useImperativeHandle, forwardRef } from 'react'

const SCRIPT_URL = 'https://challenges.cloudflare.com/turnstile/v0/api.js'

function loadScript() {
  if (typeof window === 'undefined' || window.turnstile) return Promise.resolve()
  return new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[src="${SCRIPT_URL}"]`)
    if (existing) {
      if (window.turnstile) resolve()
      else existing.addEventListener('load', () => resolve())
      return
    }
    const script = document.createElement('script')
    script.src = SCRIPT_URL
    script.async = true
    script.onload = () => resolve()
    script.onerror = () => reject(new Error('Turnstile script failed to load'))
    document.head.appendChild(script)
  })
}

const TurnstileWidget = forwardRef(function TurnstileWidget({ siteKey }, ref) {
  const containerRef = useRef(null)
  const widgetIdRef = useRef(null)

  useImperativeHandle(ref, () => ({
    getToken() {
      if (typeof window !== 'undefined' && window.turnstile && widgetIdRef.current != null) {
        return window.turnstile.getResponse(widgetIdRef.current) || ''
      }
      return ''
    },
    reset() {
      if (typeof window !== 'undefined' && window.turnstile && widgetIdRef.current != null) {
        window.turnstile.reset(widgetIdRef.current)
      }
    },
  }), [])

  useEffect(() => {
    if (!siteKey || !containerRef.current) return
    let mounted = true
    loadScript()
      .then(() => {
        if (!mounted || !containerRef.current || !window.turnstile) return
        try {
          const id = window.turnstile.render(containerRef.current, {
            sitekey: siteKey,
            size: 'normal',
            theme: 'light',
            appearance: 'always',
          })
          widgetIdRef.current = id
        } catch (err) {
          console.warn('Turnstile render error:', err)
        }
      })
      .catch((err) => console.warn('Turnstile load error:', err))
    return () => {
      mounted = false
      if (widgetIdRef.current != null && window.turnstile && window.turnstile.remove) {
        try {
          window.turnstile.remove(widgetIdRef.current)
        } catch (_) {}
        widgetIdRef.current = null
      }
    }
  }, [siteKey])

  if (!siteKey) return null
  return (
    <div
      ref={containerRef}
      className="turnstile-widget"
      aria-label="Verification"
      style={{ width: '100%', maxWidth: '100%' }}
    />
  )
})

export default TurnstileWidget
