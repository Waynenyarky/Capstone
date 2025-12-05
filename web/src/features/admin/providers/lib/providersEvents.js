const statusChangedListeners = new Set()

export function subscribeProviderStatusChanged(listener) {
  statusChangedListeners.add(listener)
  return () => statusChangedListeners.delete(listener)
}

export function notifyProviderStatusChanged(provider) {
  for (const listener of statusChangedListeners) {
    try {
      listener(provider)
    } catch (err) {
      // swallow listener errors to avoid breaking others
      console.error('Provider status changed listener error:', err)
    }
  }
}