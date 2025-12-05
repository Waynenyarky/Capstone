// Admin Services barrel — prefer importing from here.
// Components
export { default as CreateCategoryForm } from './components/CreateCategoryForm.jsx'
export { default as EditCategoryForm } from './components/EditCategoryForm.jsx'
export { default as CategoryTable } from './components/CategoryTable.jsx'

export { default as CreateServiceForm } from './components/CreateServiceForm.jsx'
export { default as EditServiceForm } from './components/EditServiceForm.jsx'
export { default as ServiceTable } from './components/ServiceTable.jsx'

// Modals
export { default as ConfirmCreateServiceModal } from './components/ConfirmCreateServiceModal.jsx'
export { default as ConfirmEditServiceModal } from './components/ConfirmEditServiceModal.jsx'
export { default as ConfirmCreateCategoryModal } from './components/ConfirmCreateCategoryModal.jsx'
export { default as ConfirmEditCategoryModal } from './components/ConfirmEditCategoryModal.jsx'

// Hooks
export { useCategoryForm } from './hooks/useCategoryForm.js'
export { useEditCategoryForm } from './hooks/useEditCategoryForm.js'
export { useCategoryTable } from './hooks/useCategoryTable.js'

export { useServiceForm } from './hooks/useServiceForm.js'
export { useEditServiceForm } from './hooks/useEditServiceForm.js'
export { useServiceTable } from './hooks/useServiceTable.js'

export { useConfirmCreateCategory } from './hooks/useConfirmCreateCategory.js'
export { useConfirmEditCategory } from './hooks/useConfirmEditCategory.js'
export { useConfirmCreateServiceModal } from './hooks/useConfirmCreateServiceModal.js'
export { useConfirmEditServiceModal } from './hooks/useConfirmEditServiceModal.js'

// Constants
export * from './constants/serviceStatus.js'
export * from './constants/categoryStatus.js'

// Validations
export * from './validations/serviceRules.js'
export * from './validations/pricingRules.js'
export * from './validations/categoryRules.js'