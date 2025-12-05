import { App } from 'antd'

// Hook to show a confirmation modal before logging out
// Usage: const { confirmLogout } = useConfirmLogout(); confirmLogout(onConfirm, options?)
export function useConfirmLogout() {
  const { modal } = App.useApp()

  const confirmLogout = (onConfirm, options = {}) => {
    const {
      title = 'Confirm Logout',
      content = 'Are you sure you want to log out?',
      okText = 'Log out',
      cancelText = 'Cancel',
    } = options || {}

    if (!modal?.confirm) {
      // Fallback: directly confirm
      if (typeof onConfirm === 'function') onConfirm()
      return
    }

    modal.confirm({
      title,
      content,
      okText,
      cancelText,
      onOk: async () => {
        try {
          if (typeof onConfirm === 'function') await onConfirm()
        } catch (err) { void err }
      },
    })
  }

  return { confirmLogout }
}