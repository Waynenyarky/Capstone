// Admin root barrel — prefer importing from here for cross-feature components
// Workspace components
export { AdminWorkspaceGate } from './workspace/components/index.js'

// Sub-feature barrels
export * from './users/index.js'
export * from './views/components/index.js'

// Pages
export { default as AdminDashboard } from './views/pages/AdminDashboard'
export { default as AdminCreateRole } from './views/pages/AdminCreateRole'
export { default as AdminFullDashboard } from './views/pages/AdminFullDashboard'
export { default as AdminUsers } from './views/pages/AdminUsers'
export { default as AdminMaintenance } from './views/pages/AdminMaintenance'
export { default as AdminLGUs } from './views/pages/AdminLGUs'
export { default as AdminFormDefinitions } from './views/pages/AdminFormDefinitions'
export { default as AdminFormGroupDetail } from './views/pages/AdminFormGroupDetail'
export { default as AdminFormDefinitionEditor } from './views/pages/AdminFormDefinitionEditor'

// Notes:
// - Users expose their own barrels.
// - Prefer importing from '@/features/admin' or sub-barrels to avoid deep paths.
