import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import { App } from 'antd'
import { useLocation, useNavigate } from 'react-router-dom'
import { getDevActions } from './devActions'

const DevToolsContext = createContext({
  enabled: false,
  pathname: '/',
  actions: [],
  events: [],
  emitEvent: () => {},
  notify: () => {},
})

export function DevToolsProvider({ children }) {
  const location = useLocation()
  const navigate = useNavigate()
  const { notification, message } = App.useApp()

  const enabled =
    typeof window !== 'undefined' &&
    (import.meta.env.DEV === true ||
      import.meta.env.MODE !== 'production' ||
      window.localStorage.getItem('ENABLE_DEVTOOLS') === 'true')

  const [events, setEvents] = useState([])

  const emitEvent = useCallback((event) => {
    if (!enabled) return
    const withMeta = {
      id: event?.id || crypto.randomUUID?.() || `${Date.now()}-${Math.random()}`,
      ts: event?.ts || Date.now(),
      type: event?.type || 'info',
      title: event?.title || 'Dev Event',
      description: event?.description || '',
      data: event?.data,
    }
    setEvents((prev) => [withMeta, ...prev].slice(0, 25))
    // eslint-disable-next-line no-console
    console.log('[DevTools event]', withMeta)
  }, [enabled])

  const notify = useCallback(
    ({ type = 'info', title = 'Dev Tools', description = '' } = {}) => {
      if (!enabled) return
      const fn = notification?.[type] || notification?.info
      fn?.({
        message: title,
        description,
        placement: 'bottomRight',
      })
      if (type === 'success') message?.success?.(title)
    },
    [enabled, notification, message],
  )

  const actions = useMemo(
    () =>
      enabled
        ? getDevActions({
            pathname: location.pathname,
            navigate,
            notify,
            emitEvent,
          })
        : [],
    [enabled, location.pathname, navigate, notify, emitEvent],
  )

  const value = useMemo(
    () => ({
      enabled,
      pathname: location.pathname,
      actions,
      events,
      emitEvent,
      notify,
    }),
    [enabled, location.pathname, actions, events, emitEvent, notify],
  )

  return <DevToolsContext.Provider value={value}>{children}</DevToolsContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useDevTools() {
  const ctx = useContext(DevToolsContext)
  if (!ctx) {
    throw new Error('useDevTools must be used inside DevToolsProvider')
  }
  return ctx
}
