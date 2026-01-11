import { Routes, Route, Navigate, Outlet } from 'react-router-dom'
import Home from "@/pages/Home.jsx"
import Dashboard from "@/pages/Dashboard.jsx"
import { Login, SignUp, ForgotPassword, VerifyEmail, ProtectedRoute, PublicRoute } from "@/features/authentication"
import MfaSetup from "@/features/authentication/components/MfaSetup.jsx"
import AdminDashboard from "@/pages/AdminDashboard.jsx"
import AdminCreateRole from "@/pages/AdminCreateRole.jsx"
import AdminFullDashboard from "@/pages/AdminFullDashboard.jsx"
import AdminUsers from "@/pages/AdminUsers.jsx"
import { BusinessOwnerDashboard } from "@/features/business-owner"
import PermitApplicationPage from "@/features/business-owner/features/permits/pages/PermitApplicationPage.jsx"
import CessationPage from "@/features/business-owner/features/cessation/pages/CessationPage.jsx"
import PaymentsPage from "@/features/business-owner/features/payments/pages/PaymentsPage.jsx"
import AppealsPage from "@/features/business-owner/features/appeals/pages/AppealsPage.jsx"
import StaffDashboard from "@/pages/StaffDashboard.jsx"
import StaffOnboarding from "@/pages/StaffOnboarding.jsx"
import ProfileSettings from "@/pages/ProfileSettings.jsx"
import PlaceholderPage from "@/pages/PlaceholderPage.jsx"
import { useNavigationNotifications } from "@/features/authentication/hooks"

function App() {
  useNavigationNotifications()

  return (
    <Routes>
      <Route path="/" element={<PublicRoute><Home /></PublicRoute>} />
      <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
      <Route path="/forgot-password" element={<PublicRoute><ForgotPassword /></PublicRoute>} />
      <Route path="/sign-up" element={<PublicRoute><SignUp /></PublicRoute>} />
      <Route path="/verify-email" element={<VerifyEmail />} />
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
