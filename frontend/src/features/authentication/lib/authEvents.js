let currentUser = null
const listeners = new Set()

export function getCurrentUser() {
  return currentUser
}

export function setCurrentUser(user) {
  currentUser = user || null
  listeners.forEach((l) => {
    try { l(currentUser) } catch (err) { void err }
  })
}

export function subscribeAuth(listener) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}