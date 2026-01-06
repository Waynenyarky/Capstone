import { Routes, Route, Navigate } from 'react-router-dom'
import Home from "@/pages/Home.jsx"
import Dashboard from "@/pages/Dashboard.jsx"
import Login from "@/pages/Login.jsx"
import SignUp from "@/pages/SignUp.jsx"
import SignUpStatic from "@/pages/SignUpStatic.jsx"
import ForgotPassword from "@/pages/ForgotPassword.jsx"
import AdminLogin from "@/features/authentication/components/AdminLogin.jsx"
import MfaSetup from "@/features/authentication/components/MfaSetup.jsx"
import AdminDashboard from "@/pages/AdminDashboard.jsx"
import AdminCreateRole from "@/pages/AdminCreateRole.jsx"
import AdminFullDashboard from "@/pages/AdminFullDashboard.jsx"
import ProfileStatic from "@/pages/ProfileStatic.jsx"
import BusinessOwnerDashboard from "@/pages/BusinessOwnerDashboard.jsx"
import LGUOfficerDashboard from "@/pages/LGUOfficerDashboard.jsx"
import LGUManagerDashboard from "@/pages/LGUManagerDashboard.jsx"
import InspectorDashboard from "@/pages/InspectorDashboard.jsx"
import CSODashboard from "@/pages/CSODashboard.jsx"
import { RequireAdmin } from '@/features/authentication'

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
      <Route path="/profile-static" element={<ProfileStatic />} />
      <Route path="/business" element={<BusinessOwnerDashboard />} />
      <Route path="/lgu-officer" element={<LGUOfficerDashboard />} />
      <Route path="/lgu-manager" element={<LGUManagerDashboard />} />
      <Route path="/inspector" element={<InspectorDashboard />} />
      <Route path="/cso" element={<CSODashboard />} />
      <Route path="/sign-up-static" element={<SignUpStatic />} />
      <Route path="/sign-up" element={<SignUp />} />
    </Routes>
  )
}

export default App
