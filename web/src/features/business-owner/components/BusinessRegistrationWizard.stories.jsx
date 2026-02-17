import React from 'react'
import BusinessRegistrationWizard from './BusinessRegistrationWizard'

export default {
  title: 'Business Owner / Complete Registration Wizard',
  component: BusinessRegistrationWizard,
  parameters: {
    seedAuth: true,
  },
}

export const Default = {
  render: () => <BusinessRegistrationWizard onComplete={() => console.log('Registration complete')} />,
  parameters: {
    seedAuth: true,
  },
}
