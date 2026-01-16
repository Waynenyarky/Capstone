import { useCallback, useMemo } from 'react'

const EMAIL_KEY = 'auth__rememberedEmails'
const MAX_ACCOUNTS = 10
const STORAGE_VERSION = 1

// Simple Base64 encoding/decoding for email obfuscation
function encodeEmail(email) {
  try {
    return btoa(String(email || '').toLowerCase().trim())
  } catch {
    return ''
  }
}

function decodeEmail(encoded) {
  try {
    return atob(String(encoded || ''))
  } catch {
    return ''
  }
}

// Read and migrate from old single email format if exists
function readAndMigrate() {
  try {
    // Check for new format first
    const newData = localStorage.getItem(EMAIL_KEY)
    if (newData) {
      const parsed = JSON.parse(newData)
      if (parsed && parsed.v === STORAGE_VERSION && Array.isArray(parsed.emails)) {
        return parsed.emails.map(item => ({
          email: decodeEmail(item.e),
          lastLogin: item.t || 0,
        })).filter(item => item.email)
      }
    }

    // Migrate from old single email format
    const oldEmail = localStorage.getItem('auth__rememberedEmail')
    if (oldEmail) {
      const email = String(oldEmail).trim()
      if (email) {
        // Convert to new format
        const newFormat = {
          v: STORAGE_VERSION,
          emails: [{
            e: encodeEmail(email),
            t: Date.now(),
          }]
        }
        localStorage.setItem(EMAIL_KEY, JSON.stringify(newFormat))
        localStorage.removeItem('auth__rememberedEmail') // Remove old format
        return [{ email, lastLogin: Date.now() }]
      }
    }
  } catch (err) {
    console.warn('Failed to read remembered emails:', err)
  }
  return []
}

// Save emails to storage
function saveEmails(emails) {
  try {
    const data = {
      v: STORAGE_VERSION,
      emails: emails.map(item => ({
        e: encodeEmail(item.email),
        t: item.lastLogin || Date.now(),
      }))
    }
    localStorage.setItem(EMAIL_KEY, JSON.stringify(data))
  } catch (err) {
    console.warn('Failed to save remembered emails:', err)
  }
}

export function useRememberedEmail() {
  const rememberedEmails = useMemo(() => {
    return readAndMigrate()
  }, [])

  const initialEmail = useMemo(() => {
    // Return most recent email for backward compatibility
    if (rememberedEmails && rememberedEmails.length > 0) {
      // Sort by lastLogin descending and return first
      const sorted = [...rememberedEmails].sort((a, b) => (b.lastLogin || 0) - (a.lastLogin || 0))
      return sorted[0].email || ''
    }
    return ''
  }, [rememberedEmails])

  const getRememberedEmails = useCallback(() => {
    const emails = readAndMigrate()
    // Sort by most recent first
    return emails.sort((a, b) => (b.lastLogin || 0) - (a.lastLogin || 0)).map(item => item.email)
  }, [])

  const getAllRememberedEmailsWithDetails = useCallback(() => {
    const emails = readAndMigrate()
    // Sort by most recent first
    return emails.sort((a, b) => (b.lastLogin || 0) - (a.lastLogin || 0))
  }, [])

  const rememberEmail = useCallback((email) => {
    if (!email || !String(email).trim()) return

    const emailLower = String(email).toLowerCase().trim()
    const now = Date.now()
    
    try {
      const existing = readAndMigrate()
      
      // Remove existing entry if present (will re-add with new timestamp)
      const filtered = existing.filter(item => 
        String(item.email).toLowerCase().trim() !== emailLower
      )
      
      // Add new entry at the beginning
      const updated = [
        { email: emailLower, lastLogin: now },
        ...filtered
      ].slice(0, MAX_ACCOUNTS) // Limit to MAX_ACCOUNTS
      
      saveEmails(updated)
    } catch (err) {
      console.warn('Failed to remember email:', err)
    }
  }, [])

  const clearRememberedEmail = useCallback((emailToRemove) => {
    try {
      if (emailToRemove) {
        // Remove specific email
        const emailLower = String(emailToRemove).toLowerCase().trim()
        const existing = readAndMigrate()
        const filtered = existing.filter(item => 
          String(item.email).toLowerCase().trim() !== emailLower
        )
        saveEmails(filtered)
      } else {
        // Clear all emails
        localStorage.removeItem(EMAIL_KEY)
      }
    } catch (err) {
      console.warn('Failed to clear remembered email:', err)
    }
  }, [])

  const hasRememberedEmail = useCallback((email) => {
    if (!email) return false
    const emailLower = String(email).toLowerCase().trim()
    const emails = readAndMigrate()
    return emails.some(item => String(item.email).toLowerCase().trim() === emailLower)
  }, [])

  return { 
    initialEmail, 
    rememberEmail, 
    clearRememberedEmail,
    getRememberedEmails,
    getAllRememberedEmailsWithDetails,
    hasRememberedEmail,
  }
}