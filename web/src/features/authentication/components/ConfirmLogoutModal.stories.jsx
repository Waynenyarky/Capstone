import ConfirmLogoutModal from './ConfirmLogoutModal.jsx'

export default {
  title: 'Authentication/ConfirmLogoutModal',
  component: ConfirmLogoutModal,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
}

export const Default = {
  args: {
    open: true,
    onConfirm: () => {},
    onCancel: () => {},
  },
}

export const WithCustomContent = {
  args: {
    open: true,
    onConfirm: () => {},
    onCancel: () => {},
    title: 'Are you sure?',
    content: 'Your session will be terminated and you will need to log in again.',
  },
}

export const Loading = {
  args: {
    open: true,
    onConfirm: () => {},
    onCancel: () => {},
    confirmLoading: true,
  },
}
