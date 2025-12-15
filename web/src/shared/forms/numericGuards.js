export function preventNonNumericKeyDown(e) {
  const allowed = [
    'Backspace', 'Tab', 'Enter', 'Escape',
    'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown',
    'Delete', 'Home', 'End'
  ]
  if (allowed.includes(e.key)) return
  if (e.ctrlKey || e.metaKey) return
  if (!/^[0-9]$/.test(e.key)) {
    e.preventDefault()
  }
}

// Sanitize pasted content, allowing only digits. Inserts cleaned text at the current selection.
export function sanitizeNumericPaste(e) {
  const raw = e?.clipboardData?.getData('text') ?? ''
  const cleaned = String(raw).replace(/\D+/g, '')
  if (e && typeof e.preventDefault === 'function') e.preventDefault()
  const el = e?.target || (e?.currentTarget && e.currentTarget.querySelector ? e.currentTarget.querySelector('input, textarea') : null)
  if (!el) return
  const value = el.value ?? ''
  const start = typeof el.selectionStart === 'number' ? el.selectionStart : value.length
  const end = typeof el.selectionEnd === 'number' ? el.selectionEnd : start
  const next = value.slice(0, start) + cleaned + value.slice(end)
  el.value = next
  try {
    const evt = new Event('input', { bubbles: true })
    el.dispatchEvent(evt)
  } catch {
    void 0
  }
}

// Ensure the field contains only digits after any input (covers IME/programmatic changes)
export function sanitizeNumericInput(e) {
  const el = e?.target || (e?.currentTarget && e.currentTarget.querySelector ? e.currentTarget.querySelector('input, textarea') : null)
  if (!el || typeof el.value === 'undefined') {
    // Some components (e.g., AntD InputNumber) may fire non-DOM or value-only events.
    // In those cases we skip sanitizing here and rely on parser/precision and key/paste guards.
    return
  }
  const prev = String(el.value ?? '')
  const next = prev.replace(/\D+/g, '')
  if (next !== prev) {
    el.value = next
    // Trigger change so Form state stays in sync
    try {
      const evt = new Event('input', { bubbles: true })
      el.dispatchEvent(evt)
    } catch {
      void 0
    }
  }
}

// Sanitize pasted content specifically for phone fields: only digits and max length 11.
export function sanitizePhonePaste(e) {
  const raw = e?.clipboardData?.getData('text') ?? ''
  const cleanedAll = String(raw).replace(/\D+/g, '')
  if (e && typeof e.preventDefault === 'function') e.preventDefault()
  const el = e?.target || (e?.currentTarget && e.currentTarget.querySelector ? e.currentTarget.querySelector('input, textarea') : null)
  if (!el) return
  const value = el.value ?? ''
  const start = typeof el.selectionStart === 'number' ? el.selectionStart : value.length
  const end = typeof el.selectionEnd === 'number' ? el.selectionEnd : start
  const remaining = Math.max(0, 11 - (value.length - (end - start)))
  const cleaned = cleanedAll.slice(0, remaining)
  const next = value.slice(0, start) + cleaned + value.slice(end)
  el.value = next.slice(0, 11)
  try {
    const evt = new Event('input', { bubbles: true })
    el.dispatchEvent(evt)
  } catch {
    void 0
  }
}

// Ensure the phone field contains only digits and is trimmed to max length 11 after input
export function sanitizePhoneInput(e) {
  const el = e?.target || (e?.currentTarget && e.currentTarget.querySelector ? e.currentTarget.querySelector('input, textarea') : null)
  if (!el || typeof el.value === 'undefined') return
  const prev = String(el.value ?? '')
  const next = prev.replace(/\D+/g, '').slice(0, 11)
  if (next !== prev) {
    el.value = next
    try {
      const evt = new Event('input', { bubbles: true })
      el.dispatchEvent(evt)
    } catch {
      void 0
    }
  }
}