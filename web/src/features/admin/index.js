// Admin root barrel — prefer importing from here for cross-feature components
// Workspace components
export { AdminWorkspaceGate } from './workspace/components/index.js'

// Sub-feature barrels
export * from './users/index.js'

// Notes:
// - Users expose their own barrels.
// - Prefer importing from '@/features/admin' or sub-barrels to avoid deep paths.
