import { describe, it, expect } from 'vitest'

import * as customer from '@/features/customer'

describe('Customer feature public API', () => {
  it('exposes expected components and hooks', () => {
    const expected = [
      // Components / Organisms
      'EditCustomerProfileForm',
      'CustomerWorkspaceGate',
      'BookAppointmentForm',
      // Hooks
      'useEditCustomerProfileForm',
      'useAppointmentForm',
      // Validations
      'appointmentRules',
    ]
    expect(Object.keys(customer)).toEqual(expect.arrayContaining(expected))
  })

  it('appointmentRules is an array', () => {
    expect(Array.isArray(customer.appointmentRules)).toBe(true)
  })
})