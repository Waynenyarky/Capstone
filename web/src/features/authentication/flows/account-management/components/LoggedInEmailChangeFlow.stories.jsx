import LoggedInEmailChangeFlow from './LoggedInEmailChangeFlow.jsx'

export default {
  title: 'Authentication/Account Management/LoggedInEmailChangeFlow',
  component: LoggedInEmailChangeFlow,
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
