import { lazy, Suspense } from 'react'
import { Routes, Route, Navigate, Outlet } from 'react-router-dom'
import { ProtectedRoute, PublicRoute } from "@/features/authentication"
import { useNavigationNotifications } from "@/features/authentication/hooks"

// Eager-load only the homepage (LCP) and auth shell - everything else is lazy
import Home from "@/features/public/pages/Home"
import { Login, SignUp, ForgotPassword, DeletionPendingScreen } from "@/features/authentication"

// Lazy load routes - chunks load on navigation
const TermsOfService = lazy(() => import("@/features/public").then(m => ({ default: m.TermsOfService })))
const PrivacyPolicy = lazy(() => import("@/features/public").then(m => ({ default: m.PrivacyPolicy })))
const Maintenance = lazy(() => import("@/features/public").then(m => ({ default: m.Maintenance })))
const PasskeyMobileAuth = lazy(() => import("@/features/authentication/pages/PasskeyMobileAuth.jsx"))
const MfaSetup = lazy(() => import("@/features/authentication/components/MfaSetup.jsx"))
const Dashboard = lazy(() => import("@/features/user").then(m => ({ default: m.Dashboard })))
const ProfileSettings = lazy(() => import("@/features/user").then(m => ({ default: m.ProfileSettings })))
const NotificationHistoryPage = lazy(() => import("@/features/user/pages/NotificationHistoryPage.jsx"))
const AdminDashboard = lazy(() => import("@/features/admin").then(m => ({ default: m.AdminDashboard })))
const AdminUsers = lazy(() => import("@/features/admin").then(m => ({ default: m.AdminUsers })))
const AdminMaintenance = lazy(() => import("@/features/admin").then(m => ({ default: m.AdminMaintenance })))
const AdminFormDefinitions = lazy(() => import("@/features/admin").then(m => ({ default: m.AdminFormDefinitions })))
const AdminFormGroupDetail = lazy(() => import("@/features/admin").then(m => ({ default: m.AdminFormGroupDetail })))
const AdminFormDefinitionEditor = lazy(() => import("@/features/admin").then(m => ({ default: m.AdminFormDefinitionEditor })))
const AdminAuditTamper = lazy(() => import("@/features/admin").then(m => ({ default: m.AdminAuditTamper })))
const AdminRequests = lazy(() => import("@/features/admin").then(m => ({ default: m.AdminRequests })))
const AdminFinance = lazy(() => import("@/features/admin").then(m => ({ default: m.AdminFinance })))
// Phase 2 admin pages
const AdminFeeConfiguration = lazy(() => import("@/features/admin/pages/AdminFeeConfiguration.jsx"))
const BusinessOwnerDashboard = lazy(() => import("@/features/business-owner").then(m => ({ default: m.BusinessOwnerDashboard })))
const PermitApplicationPage = lazy(() => import("@/features/business-owner/features/permits/pages/PermitApplicationPage.jsx"))
const CessationPage = lazy(() => import("@/features/business-owner/features/cessation/pages/CessationPage.jsx"))
const PaymentsPage = lazy(() => import("@/features/business-owner/features/payments/pages/PaymentsPage.jsx"))
const AppealsPage = lazy(() => import("@/features/business-owner/features/appeals/pages/AppealsPage.jsx"))
const NotificationsPage = lazy(() => import("@/features/business-owner/features/notifications/pages/NotificationsPage.jsx"))
const InspectionsPage = lazy(() => import("@/features/business-owner/features/inspections/pages/InspectionsPage.jsx"))
const BusinessRegistrationPage = lazy(() => import("@/features/business-owner/features/business-registration/pages/BusinessRegistrationPage.jsx"))
const BusinessRenewalPage = lazy(() => import("@/features/business-owner/features/business-renewal/pages/BusinessRenewalPage.jsx"))
const MyBusinessesPage = lazy(() => import("@/features/business-owner/features/businesses/pages/MyBusinessesPage.jsx"))
// Phase 2 owner pages
const RetirementApplicationPage = lazy(() => import("@/features/business-owner/features/retirement/pages/RetirementApplicationPage.jsx"))
const GeneralPermitPage = lazy(() => import("@/features/business-owner/features/general-permits/pages/GeneralPermitPage.jsx"))
const OccupationalPermitPage = lazy(() => import("@/features/business-owner/features/occupational-permits/pages/OccupationalPermitPage.jsx"))
const OwnerAppealsPage = lazy(() => import("@/features/business-owner/features/appeals/pages/OwnerAppealsPage.jsx"))
const EditRequestPage = lazy(() => import("@/features/business-owner/features/edit-requests/pages/EditRequestPage.jsx"))
const StaffDashboard = lazy(() => import("@/features/staffs").then(m => ({ default: m.StaffDashboard })))
const StaffOnboarding = lazy(() => import("@/features/staffs").then(m => ({ default: m.StaffOnboarding })))
const StaffRecoveryRequest = lazy(() => import("@/features/staffs").then(m => ({ default: m.StaffRecoveryRequest })))
const PermitReviewPage = lazy(() => import("@/features/staffs/lgu-officer/pages/PermitReviewPage.jsx"))
// Phase 2 staff pages
const WalkInApplicationPage = lazy(() => import("@/features/staffs/lgu-officer/pages/WalkInApplicationPage.jsx"))
const InspectionManagementPage = lazy(() => import("@/features/staffs/lgu-officer/pages/InspectionManagementPage.jsx"))
const CessationReviewPage = lazy(() => import("@/features/staffs/lgu-officer/pages/CessationReviewPage.jsx"))
const StaffAppealsPage = lazy(() => import("@/features/staffs/lgu-officer/pages/StaffAppealsPage.jsx"))
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
      <Route path="/auth/passkey-mobile" element={<PublicRoute><PasskeyMobileAuth /></PublicRoute>} />
      <Route path="/deletion-pending" element={<ProtectedRoute><DeletionPendingScreen /></ProtectedRoute>} />
      <Route path="/mfa/setup" element={<ProtectedRoute><MfaSetup /></ProtectedRoute>} />
      
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
      </Route>

      {/* Business Owner Routes */}
      <Route path="/owner" element={<ProtectedRoute allowedRoles={['business_owner']}><Outlet /></ProtectedRoute>}>
        <Route index element={<BusinessOwnerDashboard />} />
        <Route path="businesses" element={<MyBusinessesPage />} />
        <Route path="business-registration" element={<BusinessRegistrationPage />} />
        <Route path="business-renewal" element={<BusinessRenewalPage />} />
        <Route path="permits" element={<Navigate to="/owner/businesses?tab=permits" replace />} />
        <Route path="cessation" element={<Navigate to="/owner/businesses?tab=cessation" replace />} />
        <Route path="payments" element={<PaymentsPage />} />
        <Route path="notifications" element={<NotificationsPage />} />
        <Route path="inspections" element={<InspectionsPage />} />
        <Route path="retirement" element={<RetirementApplicationPage />} />
        <Route path="general-permits" element={<GeneralPermitPage />} />
        <Route path="occupational-permits" element={<OccupationalPermitPage />} />
        <Route path="my-appeals" element={<OwnerAppealsPage />} />
        <Route path="edit-requests" element={<EditRequestPage />} />
      </Route>
      
      {/* Staff Routes */}
      <Route path="/staff" element={<ProtectedRoute allowedRoles={['staff', 'lgu_officer', 'lgu_manager', 'inspector', 'cso']}><Outlet /></ProtectedRoute>}>
        <Route index element={<StaffDashboard />} />
        <Route path="onboarding" element={<StaffOnboarding />} />
        <Route path="recovery-request" element={<StaffRecoveryRequest />} />
        <Route path="inspections" element={<InspectionManagementPage />} />
        <Route path="applications" element={<PermitReviewPage />} />
        <Route path="walk-in" element={<WalkInApplicationPage />} />
        <Route path="cessation" element={<CessationReviewPage />} />
        <Route path="appeals" element={<StaffAppealsPage />} />
        <Route path="reports" element={<PlaceholderPage title="Reports & Analytics" />} />
        <Route path="support" element={<PlaceholderPage title="Customer Support" />} />
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
