import LoggedInPasswordChangeFlow from './LoggedInPasswordChangeFlow.jsx'

export default {
  title: 'Authentication/Account Management/LoggedInPasswordChangeFlow',
  component: LoggedInPasswordChangeFlow,
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
