import TurnstileWidget from './TurnstileWidget.jsx'

export default {
  title: 'Authentication/TurnstileWidget',
  component: TurnstileWidget,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
}

export const Default = {
  args: {
    siteKey: 'test-site-key',
  },
}
