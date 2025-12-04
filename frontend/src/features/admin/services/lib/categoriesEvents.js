const createdListeners = new Set()
const updatedListeners = new Set()

export function subscribeCategoryCreated(listener) {
  createdListeners.add(listener)
  return () => createdListeners.delete(listener)
}

export function notifyCategoryCreated(category) {
  for (const listener of createdListeners) {
    try {
      listener(category)
    } catch (err) {
      // swallow listener errors to avoid breaking others
      console.error('Category created listener error:', err)
    }
  }
}

export function subscribeCategoryUpdated(listener) {
  updatedListeners.add(listener)
  return () => updatedListeners.delete(listener)
}

export function notifyCategoryUpdated(category) {
  for (const listener of updatedListeners) {
    try {
      listener(category)
    } catch (err) {
      console.error('Category updated listener error:', err)
    }
  }
}