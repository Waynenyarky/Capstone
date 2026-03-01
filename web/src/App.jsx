import { lazy, Suspense } from 'react'
import { Routes, Route, Navigate, Outlet } from 'react-router-dom'
import { ProtectedRoute, PublicRoute } from "@/features/authentication"
import { useNavigationNotifications } from "@/features/authentication/hooks"

// Eager-load only the homepage (LCP) and auth shell - everything else is lazy
import Home from "@/features/public/pages/Home"
import { Login, SignUp, SignUpMfaSetup, ForgotPassword, DeletionPendingScreen } from "@/features/authentication"

// Lazy load routes - chunks load on navigation
const TermsOfService = lazy(() => import("@/features/public").then(m => ({ default: m.TermsOfService })))
const PrivacyPolicy = lazy(() => import("@/features/public").then(m => ({ default: m.PrivacyPolicy })))
const Maintenance = lazy(() => import("@/features/public").then(m => ({ default: m.Maintenance })))
const PasskeyMobileAuth = lazy(() => import("@/features/authentication/pages/PasskeyMobileAuth.jsx"))
const MfaSetup = lazy(() => import("@/features/authentication/components/MfaSetup.jsx"))
const Dashboard = lazy(() => import("@/features/user").then(m => ({ default: m.Dashboard })))
const ProfileSettings = lazy(() => import("@/features/user").then(m => ({ default: m.ProfileSettings })))
const NotificationHistoryPage = lazy(() => import("@/features/user/pages/NotificationHistoryPage.jsx"))
const AdminOnboarding = lazy(() => import("@/features/admin/pages/AdminOnboarding.jsx"))
const AdminDashboard = lazy(() => import("@/features/admin").then(m => ({ default: m.AdminDashboard })))
const AdminUsers = lazy(() => import("@/features/admin").then(m => ({ default: m.AdminUsers })))
const AdminMaintenance = lazy(() => import("@/features/admin").then(m => ({ default: m.AdminMaintenance })))
const AdminFormDefinitions = lazy(() => import("@/features/admin").then(m => ({ default: m.AdminFormDefinitions })))
const AdminFormGroupDetail = lazy(() => import("@/features/admin").then(m => ({ default: m.AdminFormGroupDetail })))
const AdminFormDefinitionEditor = lazy(() => import("@/features/admin").then(m => ({ default: m.AdminFormDefinitionEditor })))
const AdminAuditTamper = lazy(() => import("@/features/admin").then(m => ({ default: m.AdminAuditTamper })))
const AdminRequests = lazy(() => import("@/features/admin").then(m => ({ default: m.AdminRequests })))
const AdminFinance = lazy(() => import("@/features/admin").then(m => ({ default: m.AdminFinance })))
const AdminLobTrainer = lazy(() => import("@/features/admin").then(m => ({ default: m.AdminLobTrainer })))
const AdminAnnouncements = lazy(() => import("@/features/admin/pages/AdminAnnouncements.jsx"))
// Phase 2 admin pages
const AdminFeeConfiguration = lazy(() => import("@/features/admin/pages/AdminFeeConfiguration.jsx"))
const BusinessOwnerDashboard = lazy(() => import("@/features/business-owner").then(m => ({ default: m.BusinessOwnerDashboard })))
const StaffDashboard = lazy(() => import("@/features/staffs").then(m => ({ default: m.StaffDashboard })))
const StaffOnboarding = lazy(() => import("@/features/staffs").then(m => ({ default: m.StaffOnboarding })))
const PermitReviewPage = lazy(() => import("@/features/staffs/lgu-officer/pages/PermitReviewPage.jsx"))
const InspectionManagementPage = lazy(() => import("@/features/staffs/lgu-officer/pages/InspectionManagementPage.jsx"))
const CessationReviewPage = lazy(() => import("@/features/staffs/lgu-officer/pages/CessationReviewPage.jsx"))
const AppealsPage = lazy(() => import("@/features/staffs/lgu-officer/pages/StaffAppealsPage.jsx"))
const StaffReportsPage = lazy(() => import("@/features/staffs/lgu-officer/pages/StaffReportsPage.jsx"))
const PlaceholderPage = lazy(() => import("@/features/shared/pages/PlaceholderPage.jsx"))
const LGUManagerDashboard = lazy(() => import("@/features/lgu-manager").then(m => ({ default: m.LGUManagerDashboard })))
const ReportsAnalyticsPage = lazy(() => import("@/features/lgu-manager").then(m => ({ default: m.ReportsAnalyticsPage })))
const PermitApplicationsOverviewPage = lazy(() => import("@/features/lgu-manager").then(m => ({ default: m.PermitApplicationsOverviewPage })))
const CessationOverviewPage = lazy(() => import("@/features/lgu-manager").then(m => ({ default: m.CessationOverviewPage })))
const ViolationsInspectionsOverviewPage = lazy(() => import("@/features/lgu-manager").then(m => ({ default: m.ViolationsInspectionsOverviewPage })))
const AssignInspectionPage = lazy(() => import("@/features/lgu-manager").then(m => ({ default: m.AssignInspectionPage })))
const AppealsOverviewPage = lazy(() => import("@/features/lgu-manager").then(m => ({ default: m.AppealsOverviewPage })))

function PageFallback() {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '200px' }} aria-hidden="true">
      <span style={{ fontSize: '14px', color: '#999' }}>Loading…</span>
    </div>
  )
}

function App() {
  useNavigationNotifications()

  return (
    <Suspense fallback={<PageFallback />}>
    <Routes>
      <Route path="/" element={<PublicRoute><Home /></PublicRoute>} />
      <Route path="/terms" element={<PublicRoute><TermsOfService /></PublicRoute>} />
      <Route path="/privacy" element={<PublicRoute><PrivacyPolicy /></PublicRoute>} />
      <Route path="/maintenance" element={<PublicRoute><Maintenance /></PublicRoute>} />
      <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
      <Route path="/forgot-password" element={<PublicRoute><ForgotPassword /></PublicRoute>} />
      <Route path="/sign-up" element={<PublicRoute><SignUp /></PublicRoute>} />
      <Route path="/signup/mfa-setup" element={<SignUpMfaSetup />} />
      <Route path="/auth/passkey-mobile" element={<PublicRoute><PasskeyMobileAuth /></PublicRoute>} />
      <Route path="/deletion-pending" element={<ProtectedRoute><DeletionPendingScreen /></ProtectedRoute>} />
      <Route path="/account/security" element={<ProtectedRoute><MfaSetup /></ProtectedRoute>} />
      <Route path="/admin/onboarding" element={<ProtectedRoute allowedRoles={['admin']}><AdminOnboarding /></ProtectedRoute>} />
      
      {/* Admin Routes */}
      <Route path="/admin" element={<ProtectedRoute allowedRoles={['admin']}><Outlet /></ProtectedRoute>}>
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<AdminDashboard />} />
        <Route path="users" element={<AdminUsers />} />
        <Route path="requests" element={<AdminRequests />} />
        <Route path="maintenance" element={<AdminMaintenance />} />
        <Route path="form-definitions" element={<AdminFormDefinitions />} />
        <Route path="form-definitions/group/:groupId" element={<AdminFormGroupDetail />} />
        <Route path="form-definitions/:id" element={<AdminFormDefinitionEditor />} />
        <Route path="penalty-configuration" element={<Navigate to="/admin/fee-configuration?tab=penalty" replace />} />
        <Route path="fee-configuration" element={<AdminFeeConfiguration />} />
        <Route path="finance" element={<AdminFinance />} />
        <Route path="security" element={<AdminAuditTamper />} />
        <Route path="audit-tamper" element={<Navigate to="/admin/security" replace />} />
        <Route path="lob-trainer" element={<AdminLobTrainer />} />
        <Route path="announcements" element={<AdminAnnouncements />} />
      </Route>

      {/* Business Owner Routes */}
      <Route path="/owner" element={<ProtectedRoute allowedRoles={['business_owner']}><BusinessOwnerDashboard /></ProtectedRoute>} />
      <Route path="/owner/notifications" element={<Navigate to="/notifications" replace />} />
      
      {/* Staff Routes */}
      <Route path="/staff" element={<ProtectedRoute allowedRoles={['staff', 'lgu_officer', 'lgu_manager', 'inspector', 'cso']}><Outlet /></ProtectedRoute>}>
        <Route index element={<StaffDashboard />} />
        <Route path="onboarding" element={<StaffOnboarding />} />
        <Route path="applications" element={<PermitReviewPage />} />
        <Route path="inspections" element={<InspectionManagementPage />} />
        <Route path="cessation" element={<CessationReviewPage />} />
        <Route path="appeals" element={<AppealsPage />} />
        <Route path="reports" element={<StaffReportsPage />} />
        <Route path="support" element={<PlaceholderPage title="Customer Support" />} />
        <Route path="recovery-request" element={<PlaceholderPage title="Account Recovery Requests" />} />
      </Route>

      {/* LGU Manager Routes */}
      <Route path="/lgu-manager" element={<ProtectedRoute allowedRoles={['lgu_manager']}><Outlet /></ProtectedRoute>}>
        <Route index element={<LGUManagerDashboard />} />
        <Route path="reports" element={<ReportsAnalyticsPage />} />
        <Route path="permit-applications" element={<PermitApplicationsOverviewPage />} />
        <Route path="cessation" element={<CessationOverviewPage />} />
        <Route path="violations-inspections" element={<ViolationsInspectionsOverviewPage />} />
        <Route path="assign-inspection" element={<AssignInspectionPage />} />
        <Route path="appeals" element={<AppealsOverviewPage />} />
      </Route>

      {/* Generic/Public Routes */}
      <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/settings-profile" element={<ProtectedRoute><ProfileSettings /></ProtectedRoute>} />
      <Route path="/notifications" element={<ProtectedRoute><NotificationHistoryPage /></ProtectedRoute>} />
      
      {/* Catch-all for 404 */}
      <Route path="*" element={<PlaceholderPage title="Page Not Found" />} />
    </Routes>
    </Suspense>
  )
}

export default App
