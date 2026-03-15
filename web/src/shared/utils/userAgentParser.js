/**
 * User Agent Parser Utility
 * Extracts meaningful browser and device information from User-Agent strings
 */

export function parseUserAgent(userAgent = '') {
  if (!userAgent || userAgent === 'unknown') {
    return {
      browser: 'Unknown Browser',
      os: 'Unknown OS',
      device: 'Unknown Device'
    }
  }

  const ua = userAgent.toLowerCase()
  
  // Detect browser - order matters! More specific patterns first
  let browser = 'Unknown Browser'
  
  // Safari detection (must come before Chrome since Chrome also includes "safari")
  if (ua.includes('safari/') && !ua.includes('chrome/') && !ua.includes('crios/') && !ua.includes('edg/')) {
    browser = 'Safari'
  }
  // Chrome detection (must come after Safari)
  else if (ua.includes('chrome/') && !ua.includes('edg/') && !ua.includes('crios/')) {
    browser = 'Chrome'
  }
  // Edge detection
  else if (ua.includes('edg/')) {
    browser = 'Edge'
  }
  // Firefox detection
  else if (ua.includes('firefox/') && !ua.includes('fxios/')) {
    browser = 'Firefox'
  }
  // Opera detection
  else if (ua.includes('opera/') || ua.includes('opr/')) {
    browser = 'Opera'
  }
  // iOS Chrome detection
  else if (ua.includes('crios/')) {
    browser = 'Chrome (iOS)'
  }
  // iOS Firefox detection
  else if (ua.includes('fxios/')) {
    browser = 'Firefox (iOS)'
  }

  // Detect OS
  let os = 'Unknown OS'
  if (ua.includes('mac os x')) {
    os = 'macOS'
  } else if (ua.includes('windows nt')) {
    if (ua.includes('windows nt 10')) os = 'Windows 10/11'
    else if (ua.includes('windows nt 6.3')) os = 'Windows 8.1'
    else if (ua.includes('windows nt 6.2')) os = 'Windows 8'
    else if (ua.includes('windows nt 6.1')) os = 'Windows 7'
    else os = 'Windows'
  } else if (ua.includes('iphone')) {
    os = 'iOS'
  } else if (ua.includes('ipad')) {
    os = 'iPadOS'
  } else if (ua.includes('android')) {
    os = 'Android'
  } else if (ua.includes('linux')) {
    os = 'Linux'
  }

  // Detect device type
  let device = 'Desktop'
  if (ua.includes('mobile') || ua.includes('iphone') || (ua.includes('android') && ua.includes('mobile'))) {
    device = 'Mobile'
  } else if (ua.includes('ipad') || ua.includes('tablet')) {
    device = 'Tablet'
  }

  return { browser, os, device }
}

export function formatUserAgentDisplay(userAgent = '') {
  const { browser, os, device } = parseUserAgent(userAgent)
  
  if (browser === 'Unknown Browser') {
    return userAgent || 'Unknown Device'
  }

  // Format: "Browser on OS (Device)"
  if (device === 'Desktop') {
    return `${browser} on ${os}`
  } else {
    return `${browser} on ${os} (${device})`
  }
}

export function getBrowserIcon(userAgent = '') {
  const { browser } = parseUserAgent(userAgent)
  
  switch (browser.toLowerCase()) {
    case 'chrome':
      return '🌐' // Chrome
    case 'firefox':
      return '🦊' // Firefox
    case 'safari':
      return '🧭' // Safari
    case 'edge':
      return '📘' // Edge
    case 'opera':
      return '🎭' // Opera
    case 'chrome (ios)':
      return '🌐' // Chrome iOS
    case 'firefox (ios)':
      return '🦊' // Firefox iOS
    default:
      return '💻' // Default computer
  }
}

// Debug function to help identify User-Agent patterns
export function debugUserAgent(userAgent = '') {
  const ua = userAgent.toLowerCase()
  return {
    original: userAgent,
    hasChrome: ua.includes('chrome/'),
    hasSafari: ua.includes('safari/'),
    hasFirefox: ua.includes('firefox/'),
    hasEdge: ua.includes('edg/'),
    hasOpera: ua.includes('opera/') || ua.includes('opr/'),
    hasMobile: ua.includes('mobile'),
    hasCriOS: ua.includes('crios/'),
    hasFxIOS: ua.includes('fxios/'),
    parsed: parseUserAgent(userAgent)
  }
}
