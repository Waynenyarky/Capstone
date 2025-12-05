/**
 * Build user identification headers used by provider services.
 * @param {{ id?: string, email?: string }} user
 * @returns {{ 'x-user-id'?: string, 'x-user-email'?: string }}
 */
export function buildUserHeaders(user) {
  const id = String(user?.id || '').trim()
  const email = String(user?.email || '').trim()
  const headers = {}
  if (id) headers['x-user-id'] = id
  if (email) headers['x-user-email'] = email
  return headers
}

/**
 * Build an object map indexed by `id` for quick lookups.
 * @param {Array<{ id?: string }>} list
 * @returns {Record<string, any>}
 */
export function indexById(list) {
  const map = {}
  const arr = Array.isArray(list) ? list : []
  for (const item of arr) {
    if (item && item.id != null) {
      map[String(item.id)] = item
    }
  }
  return map
}