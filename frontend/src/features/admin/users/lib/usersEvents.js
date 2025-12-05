const signupListeners = new Set()

export function subscribeUserSignedUp(listener) {
  signupListeners.add(listener)
  return () => signupListeners.delete(listener)
}

export function notifyUserSignedUp(user) {
  for (const listener of signupListeners) {
    try {
      listener(user)
    } catch (err) {
      console.error('User signed up listener error:', err)
    }
  }
}