const createdListeners = new Set()
const updatedListeners = new Set()

export function subscribeServiceCreated(listener) {
  createdListeners.add(listener)
  return () => createdListeners.delete(listener)
}

export function notifyServiceCreated(service) {
  for (const listener of createdListeners) {
    try {
      listener(service)
    } catch (err) {
      // swallow listener errors to avoid breaking others
      console.error('Service created listener error:', err)
    }
  }
}

export function subscribeServiceUpdated(listener) {
  updatedListeners.add(listener)
  return () => updatedListeners.delete(listener)
}

export function notifyServiceUpdated(service) {
  for (const listener of updatedListeners) {
    try {
      listener(service)
    } catch (err) {
      console.error('Service updated listener error:', err)
    }
  }
}