export function authHeaders(currentUser, role, baseHeaders = {}) {
  const headers = { ...baseHeaders }
  if (currentUser?.id) headers['x-user-id'] = currentUser.id
  if (currentUser?.email) headers['x-user-email'] = currentUser.email
  if (role) headers['x-user-role'] = role
  return headers
}