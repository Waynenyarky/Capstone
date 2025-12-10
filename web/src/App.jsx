import { Routes, Route, Navigate } from 'react-router-dom'
import Home from "@/pages/Home.jsx"
import Dashboard from "@/pages/Dashboard.jsx"
import Login from "@/pages/Login.jsx"
import SignUp from "@/pages/SignUp.jsx"
import ForgotPassword from "@/pages/ForgotPassword.jsx"
import AdminLogin from "@/pages/AdminLogin.jsx"
import AdminDashboard from "@/pages/AdminDashboard.jsx"
import { RequireAdmin } from '@/features/authentication'

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/login" element={<Login />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/admin/login" element={<AdminLogin />} />
      <Route path="/admin/dashboard" element={<RequireAdmin><AdminDashboard /></RequireAdmin>} />
      <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
      <Route path="/sign-up" element={<SignUp />} />
    </Routes>
  )
}

export default App
