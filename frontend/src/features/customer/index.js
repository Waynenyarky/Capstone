// Customer public API barrel — prefer importing from here.
// Components
export { default as EditCustomerProfileForm } from './components/EditCustomerProfileForm.jsx'
export { default as CustomerWorkspaceGate } from './components/CustomerWorkspaceGate.jsx'
export { default as BookAppointmentForm } from './appointments/components/BookAppointmentForm.jsx'
export { default as AvailableServicesTable } from './appointments/components/AvailableServicesTable.jsx'

// Hooks
export { useEditCustomerProfileForm } from './hooks/useEditCustomerProfileForm.js'
export { useAppointmentForm } from './appointments/hooks/useAppointmentForm.js'

// Validations
export { appointmentRules } from './appointments/validations/appointmentRules.js'

// Note: Services are internal to the feature. Use
// '@/features/customer/services' for internal imports to avoid cycles.