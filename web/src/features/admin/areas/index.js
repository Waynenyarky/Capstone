// Admin Areas barrel — prefer importing from here.
// Components
export { default as AddSupportedAreasForm } from './components/AddSupportedAreasForm.jsx'
export { default as SupportedAreasTable } from './components/SupportedAreasTable.jsx'
export { default as EditSupportedAreaForm } from './components/EditSupportedAreaForm.jsx'

// Hooks
export { useAddSupportedAreas } from './hooks/useAddSupportedAreas.js'
export { useEditSupportedAreaForm } from './hooks/useEditSupportedAreaForm.js'
export { useProvincesOptions } from './hooks/useProvincesOptions.js'
export { useCitiesOptions } from './hooks/useCitiesOptions.js'
export { default as useConfirmAreasSave } from './hooks/useConfirmAreasSave.js'