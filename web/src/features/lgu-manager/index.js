// LGU Manager feature barrel
// Clean Architecture with MVC pattern

// Pages
export { default as LGUManagerDashboard } from './views/pages/LGUManagerDashboard'
export { default as ReportsAnalyticsPage } from './views/pages/ReportsAnalyticsPage'
export { default as PermitApplicationsOverviewPage } from './views/pages/PermitApplicationsOverviewPage'
export { default as CessationOverviewPage } from './views/pages/CessationOverviewPage'
export { default as ViolationsInspectionsOverviewPage } from './views/pages/ViolationsInspectionsOverviewPage'
export { default as AssignInspectionPage } from './views/pages/AssignInspectionPage'
export { default as AppealsOverviewPage } from './views/pages/AppealsOverviewPage'

// Components
export * from './presentation/components'

// Hooks (Controllers)
export * from './presentation/hooks'

// Services (Infrastructure)
export * from './infrastructure/services'
