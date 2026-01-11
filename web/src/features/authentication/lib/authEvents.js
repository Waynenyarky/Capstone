let currentUser = null
let isLoggingOut = false
const listeners = new Set()

export function getCurrentUser() {
  return currentUser
}

export function getIsLoggingOut() {
  return isLoggingOut
}

export function setIsLoggingOut(value) {
  isLoggingOut = !!value
}

export function setCurrentUser(user) {
  currentUser = user || null
  // If we are setting a user (logging in), reset the logging out flag
  if (currentUser) {
    isLoggingOut = false
  }
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