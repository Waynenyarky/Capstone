/**
 * @param {object} currentUser
 * @param {string} role
 * @param {object} baseHeaders - optional; may include stepUpToken (will be sent as X-Step-Up-Token)
 */
export function authHeaders(currentUser, role, baseHeaders = {}) {
  const { stepUpToken, ...rest } = baseHeaders
  const headers = { ...rest }
  if (currentUser?.id) headers['x-user-id'] = currentUser.id
  if (currentUser?.email) headers['x-user-email'] = currentUser.email
  if (role) headers['x-user-role'] = role
  if (stepUpToken) headers['X-Step-Up-Token'] = stepUpToken
  return headers
}