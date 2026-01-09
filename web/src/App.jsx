import { Routes, Route, Navigate } from 'react-router-dom'
import Home from "@/pages/Home.jsx"
import Dashboard from "@/pages/Dashboard.jsx"
import { Login, SignUp, SignUpStatic, ForgotPassword, RequireAdmin, VerifyEmail } from "@/features/authentication"
import AdminLogin from "@/features/authentication/components/AdminLogin.jsx"
import MfaSetup from "@/features/authentication/components/MfaSetup.jsx"
import AdminDashboard from "@/pages/AdminDashboard.jsx"
import AdminCreateRole from "@/pages/AdminCreateRole.jsx"
import AdminFullDashboard from "@/pages/AdminFullDashboard.jsx"
import { BusinessOwnerDashboard } from "@/features/business-owner"
import LGUOfficerDashboard from "@/pages/LGUOfficerDashboard.jsx"
import LGUManagerDashboard from "@/pages/LGUManagerDashboard.jsx"
import InspectorDashboard from "@/pages/InspectorDashboard.jsx"
import CSODashboard from "@/pages/CSODashboard.jsx"
import ProfileStatic from '@/features/authentication/components/ProfileStatic.jsx'
import ProfileSettings from "@/pages/ProfileSettings.jsx"
import PlaceholderPage from "@/pages/PlaceholderPage.jsx"

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/login" element={<Login />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/admin/login" element={<AdminLogin />} />
      <Route path="/mfa/setup" element={<MfaSetup />} />
      <Route path="/admin/dashboard" element={<RequireAdmin><AdminDashboard /></RequireAdmin>} />
      <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
      <Route path="/admin/create-role" element={<RequireAdmin><AdminCreateRole /></RequireAdmin>} />
      <Route path="/admin/full" element={<RequireAdmin><AdminFullDashboard /></RequireAdmin>} />
      
      {/* Business Owner Routes */}
      <Route path="/business" element={<BusinessOwnerDashboard />} />
      <Route path="/permit-applications" element={<PlaceholderPage title="Permit Applications" />} />
      <Route path="/cessation" element={<PlaceholderPage title="Cessation" />} />
      <Route path="/payments" element={<PlaceholderPage title="Payments" />} />
      <Route path="/appeals" element={<PlaceholderPage title="Appeals" />} />
      
      {/* LGU & Inspector Routes */}
      <Route path="/lgu-officer" element={<LGUOfficerDashboard />} />
      <Route path="/lgu-manager" element={<LGUManagerDashboard />} />
      <Route path="/inspector" element={<InspectorDashboard />} />
      <Route path="/inspections" element={<PlaceholderPage title="Inspections" />} />
      <Route path="/applications" element={<PlaceholderPage title="Applications Review" />} />
      <Route path="/reports" element={<PlaceholderPage title="Reports & Analytics" />} />
      <Route path="/support" element={<PlaceholderPage title="Customer Support" />} />

      <Route path="/cso" element={<CSODashboard />} />
      <Route path="/sign-up-static" element={<SignUpStatic />} />
      <Route path="/sign-up" element={<SignUp />} />
      <Route path="/verify-email" element={<VerifyEmail />} />
      <Route path="/profile-static" element={<ProfileSettings />} />
      
      {/* Catch-all for 404 */}
      <Route path="*" element={<PlaceholderPage title="Page Not Found" />} />
    </Routes>
  )
}

export default App
