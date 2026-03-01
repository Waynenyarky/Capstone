// Admin root barrel — prefer importing from here for cross-feature components
// Sub-feature barrels
export * from './users/index.js'
export * from './components/index.js'

// Pages
export { default as AdminDashboard } from './pages/AdminDashboard'
export { default as AdminUsers } from './pages/AdminUsers'
export { default as AdminMaintenance } from './pages/AdminMaintenance'
export { default as AdminFormDefinitions } from './pages/AdminFormDefinitions'
export { default as AdminFormGroupDetail } from './pages/AdminFormGroupDetail'
export { default as AdminFormDefinitionEditor } from './pages/AdminFormDefinitionEditor'
export { default as AdminAuditTamper } from './pages/AdminAuditTamper'
export { default as AdminRequests } from './pages/AdminRequests'
export { default as AdminFinance } from './pages/AdminFinance'
export { default as AdminLobTrainer } from './pages/AdminLobTrainer'

// Notes:
// - Users expose their own barrels.
// - Prefer importing from '@/features/admin' or sub-barrels to avoid deep paths.
