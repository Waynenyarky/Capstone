import { Routes, Route, Navigate, Outlet } from 'react-router-dom'
import { Home, TermsOfService, PrivacyPolicy } from "@/features/public"
import { Dashboard } from "@/features/user"
import { Login, SignUp, ForgotPassword, ProtectedRoute, PublicRoute, DeletionPendingScreen } from "@/features/authentication"
import MfaSetup from "@/features/authentication/components/MfaSetup.jsx"
import { AdminDashboard, AdminCreateRole, AdminFullDashboard, AdminUsers } from "@/features/admin"
import { BusinessOwnerDashboard } from "@/features/business-owner"
import PermitApplicationPage from "@/features/business-owner/features/permits/pages/PermitApplicationPage.jsx"
import CessationPage from "@/features/business-owner/features/cessation/pages/CessationPage.jsx"
import PaymentsPage from "@/features/business-owner/features/payments/pages/PaymentsPage.jsx"
import AppealsPage from "@/features/business-owner/features/appeals/pages/AppealsPage.jsx"
import NotificationsPage from "@/features/business-owner/features/notifications/pages/NotificationsPage.jsx"
import InspectionsPage from "@/features/business-owner/features/inspections/pages/InspectionsPage.jsx"
import { StaffDashboard, StaffOnboarding } from "@/features/staffs"
import { ProfileSettings } from "@/features/user"
import { PlaceholderPage } from "@/features/shared"
import { useNavigationNotifications } from "@/features/authentication/hooks"

function App() {
  useNavigationNotifications()

  return (
    <Routes>
      <Route path="/" element={<PublicRoute><Home /></PublicRoute>} />
      <Route path="/terms" element={<PublicRoute><TermsOfService /></PublicRoute>} />
      <Route path="/privacy" element={<PublicRoute><PrivacyPolicy /></PublicRoute>} />
      <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
      <Route path="/forgot-password" element={<PublicRoute><ForgotPassword /></PublicRoute>} />
      <Route path="/sign-up" element={<PublicRoute><SignUp /></PublicRoute>} />
      <Route path="/deletion-pending" element={<ProtectedRoute><DeletionPendingScreen /></ProtectedRoute>} />
      <Route path="/mfa/setup" element={<ProtectedRoute><MfaSetup /></ProtectedRoute>} />
      
      {/* Admin Routes */}
      <Route path="/admin" element={<ProtectedRoute allowedRoles={['admin']}><Outlet /></ProtectedRoute>}>
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<AdminDashboard />} />
        <Route path="create-role" element={<AdminCreateRole />} />
        <Route path="full" element={<AdminFullDashboard />} />
        <Route path="users" element={<AdminUsers />} />
      </Route>

      {/* Business Owner Routes */}
      <Route path="/owner" element={<ProtectedRoute allowedRoles={['business_owner']}><Outlet /></ProtectedRoute>}>
        <Route index element={<BusinessOwnerDashboard />} />
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
        <Route path="inspections" element={<PlaceholderPage title="Inspections" />} />
        <Route path="applications" element={<PlaceholderPage title="Applications Review" />} />
        <Route path="cessation" element={<PlaceholderPage title="Cessation Review" />} />
        <Route path="appeals" element={<PlaceholderPage title="Appeals Review" />} />
        <Route path="reports" element={<PlaceholderPage title="Reports & Analytics" />} />
        <Route path="support" element={<PlaceholderPage title="Customer Support" />} />
      </Route>

      {/* Generic/Public Routes */}
      <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/settings-profile" element={<ProtectedRoute><ProfileSettings /></ProtectedRoute>} />
      
      {/* Catch-all for 404 */}
      <Route path="*" element={<PlaceholderPage title="Page Not Found" />} />
    </Routes>
  )
}

export default App
