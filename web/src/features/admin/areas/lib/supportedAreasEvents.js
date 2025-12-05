const areasUpdatedListeners = new Set()

export function subscribeSupportedAreasUpdated(listener) {
  areasUpdatedListeners.add(listener)
  return () => areasUpdatedListeners.delete(listener)
}

export function notifySupportedAreasUpdated(areas) {
  for (const listener of areasUpdatedListeners) {
    try {
      listener(areas)
    } catch (err) {
      console.error('Supported areas listener error:', err)
    }
  }
}