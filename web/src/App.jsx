import { Routes, Route, Navigate, Outlet } from 'react-router-dom'
import { Home, TermsOfService, PrivacyPolicy, Maintenance } from "@/features/public"
import { Dashboard } from "@/features/user"
import { Login, SignUp, ForgotPassword, ProtectedRoute, PublicRoute, DeletionPendingScreen } from "@/features/authentication"
import PasskeyMobileAuth from "@/features/authentication/views/pages/PasskeyMobileAuth.jsx"
import MfaSetup from "@/features/authentication/views/components/MfaSetup.jsx"
import { AdminDashboard, AdminCreateRole, AdminFullDashboard, AdminUsers, AdminMaintenance } from "@/features/admin"
import { BusinessOwnerDashboard } from "@/features/business-owner"
import PermitApplicationPage from "@/features/business-owner/features/permits/pages/PermitApplicationPage.jsx"
import CessationPage from "@/features/business-owner/features/cessation/pages/CessationPage.jsx"
import PaymentsPage from "@/features/business-owner/features/payments/pages/PaymentsPage.jsx"
import AppealsPage from "@/features/business-owner/features/appeals/pages/AppealsPage.jsx"
import NotificationsPage from "@/features/business-owner/features/notifications/pages/NotificationsPage.jsx"
import NotificationHistoryPage from "@/features/user/pages/NotificationHistoryPage.jsx"
import InspectionsPage from "@/features/business-owner/features/inspections/pages/InspectionsPage.jsx"
import BusinessRegistrationPage from "@/features/business-owner/features/business-registration/pages/BusinessRegistrationPage.jsx"
import BusinessRenewalPage from "@/features/business-owner/features/business-renewal/pages/BusinessRenewalPage.jsx"
import { StaffDashboard, StaffOnboarding, StaffRecoveryRequest } from "@/features/staffs"
import PermitReviewPage from "@/features/staffs/lgu-officer/pages/PermitReviewPage.jsx"
import { ProfileSettings } from "@/features/user"
import { PlaceholderPage } from "@/features/shared"
import { useNavigationNotifications } from "@/features/authentication/hooks"
import { LGUManagerDashboard, ReportsAnalyticsPage, PermitApplicationsOverviewPage, CessationOverviewPage, ViolationsInspectionsOverviewPage, AppealsOverviewPage } from "@/features/lgu-manager"

function App() {
  useNavigationNotifications()

  return (
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
        <Route path="create-role" element={<AdminCreateRole />} />
        <Route path="full" element={<AdminFullDashboard />} />
        <Route path="users" element={<AdminUsers />} />
        <Route path="maintenance" element={<AdminMaintenance />} />
      </Route>

      {/* Business Owner Routes */}
      <Route path="/owner" element={<ProtectedRoute allowedRoles={['business_owner']}><Outlet /></ProtectedRoute>}>
        <Route index element={<BusinessOwnerDashboard />} />
        <Route path="business-registration" element={<BusinessRegistrationPage />} />
        <Route path="business-renewal" element={<BusinessRenewalPage />} />
        <Route path="permits" element={<PermitApplicationPage />} />
        <Route path="cessation" element={<CessationPage />} />
        <Route path="payments" element={<PaymentsPage />} />
        <Route path="appeals" element={<AppealsPage />} />
        <Route path="notifications" element={<NotificationsPage />} />
        <Route path="inspections" element={<InspectionsPage />} />
      </Route>
      
      {/* Staff Routes */}
      <Route path="/staff" element={<ProtectedRoute allowedRoles={['staff', 'lgu_officer', 'lgu_manager', 'inspector', 'cso']}><Outlet /></ProtectedRoute>}>
        <Route index element={<StaffDashboard />} />
        <Route path="onboarding" element={<StaffOnboarding />} />
        <Route path="recovery-request" element={<StaffRecoveryRequest />} />
        <Route path="inspections" element={<PlaceholderPage title="Inspections" />} />
        <Route path="applications" element={<PermitReviewPage />} />
        <Route path="cessation" element={<PlaceholderPage title="Cessation Review" />} />
        <Route path="appeals" element={<PlaceholderPage title="Appeals Review" />} />
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
        <Route path="appeals" element={<AppealsOverviewPage />} />
      </Route>

      {/* Generic/Public Routes */}
      <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/settings-profile" element={<ProtectedRoute><ProfileSettings /></ProtectedRoute>} />
      <Route path="/notifications" element={<ProtectedRoute><NotificationHistoryPage /></ProtectedRoute>} />
      
      {/* Catch-all for 404 */}
      <Route path="*" element={<PlaceholderPage title="Page Not Found" />} />
    </Routes>
  )
}

export default App
