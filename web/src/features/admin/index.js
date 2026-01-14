// Admin root barrel — prefer importing from here for cross-feature components
// Workspace components
export { AdminWorkspaceGate } from './workspace/components/index.js'

// Sub-feature barrels
export * from './users/index.js'
export * from './components/index.js'

// Pages
export { default as AdminDashboard } from './pages/AdminDashboard'
export { default as AdminCreateRole } from './pages/AdminCreateRole'
export { default as AdminFullDashboard } from './pages/AdminFullDashboard'
export { default as AdminUsers } from './pages/AdminUsers'
export { default as AdminMaintenance } from './pages/AdminMaintenance.jsx'

// Notes:
// - Users expose their own barrels.
// - Prefer importing from '@/features/admin' or sub-barrels to avoid deep paths.
