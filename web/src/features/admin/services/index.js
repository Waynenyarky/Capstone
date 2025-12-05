// Admin Services barrel — prefer importing from here.
// Components
// Category-related components removed: CreateCategoryForm, EditCategoryForm, CategoryTable

export { default as CreateServiceForm } from './components/CreateServiceForm.jsx'
export { default as EditServiceForm } from './components/EditServiceForm.jsx'
export { default as ServiceTable } from './components/ServiceTable.jsx'

// Modals
export { default as ConfirmCreateServiceModal } from './components/ConfirmCreateServiceModal.jsx'
export { default as ConfirmEditServiceModal } from './components/ConfirmEditServiceModal.jsx'
// ConfirmCreateCategoryModal removed; hook now uses Ant Design Modal.confirm
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