/**
 * Fast deep comparison utility for objects
 * Handles primitives, arrays, and nested objects
 * More reliable than JSON.stringify for comparison
 */
export function deepEqual(a, b) {
  // Fast path for primitives and same reference
  if (a === b) return true
  
  // Handle null/undefined
  if (a == null || b == null) return a === b
  
  // Handle different types
  if (typeof a !== typeof b) return false
  
  // Handle arrays
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false
    for (let i = 0; i < a.length; i++) {
      if (!deepEqual(a[i], b[i])) return false
    }
    return true
  }
  
  // Handle objects
  if (typeof a === 'object' && typeof b === 'object') {
    const keysA = Object.keys(a)
    const keysB = Object.keys(b)
    
    if (keysA.length !== keysB.length) return false
    
    for (const key of keysA) {
      if (!keysB.includes(key)) return false
      if (!deepEqual(a[key], b[key])) return false
    }
    return true
  }
  
  // Handle other types (strings, numbers, booleans)
  return a === b
}

/**
 * Generate a simple hash for an object for comparison
 * This is faster than deepEqual for large objects and avoids storing full objects
 */
export function getObjectHash(obj) {
  if (obj == null) return 'null'
  if (typeof obj !== 'object') return String(obj)
  
  if (Array.isArray(obj)) {
    return obj.map(getObjectHash).join('|')
  }
  
  const keys = Object.keys(obj).sort()
  return keys.map(key => `${key}:${getObjectHash(obj[key])}`).join('|')
}
