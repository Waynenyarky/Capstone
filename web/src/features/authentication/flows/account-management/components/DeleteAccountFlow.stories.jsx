import DeleteAccountFlow from './DeleteAccountFlow.jsx'

export default {
  title: 'Authentication/Account Management/DeleteAccountFlow',
  component: DeleteAccountFlow,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
}

export const Default = {
  args: {
    onBackToStart: () => {},
  },
}
