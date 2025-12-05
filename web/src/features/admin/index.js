// Admin root barrel — prefer importing from here for cross-feature components
// Workspace components
export { AdminWorkspaceGate } from './workspace/components/index.js'

// Sub-feature barrels
export * from './services/index.js'
export * from './providers/index.js'
export * from './users/index.js'
export * from './areas/index.js'

// Notes:
// - Services, Providers, Users, Areas each expose their own barrels.
// - Prefer importing from '@/features/admin' or sub-barrels to avoid deep paths.