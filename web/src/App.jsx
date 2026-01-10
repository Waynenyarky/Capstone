import { Routes, Route, Navigate, Outlet, useLocation } from 'react-router-dom'
import { useEffect } from 'react'
import { App as AntdApp } from 'antd'
import { LockOutlined } from '@ant-design/icons'
import Home from "@/pages/Home.jsx"
import Dashboard from "@/pages/Dashboard.jsx"
import { Login, SignUp, ForgotPassword, VerifyEmail, ProtectedRoute, PublicRoute } from "@/features/authentication"
import MfaSetup from "@/features/authentication/components/MfaSetup.jsx"
import AdminDashboard from "@/pages/AdminDashboard.jsx"
import AdminCreateRole from "@/pages/AdminCreateRole.jsx"
import AdminFullDashboard from "@/pages/AdminFullDashboard.jsx"
import { BusinessOwnerDashboard } from "@/features/business-owner"
import StaffDashboard from "@/pages/StaffDashboard.jsx"
import ProfileSettings from "@/pages/ProfileSettings.jsx"
import PlaceholderPage from "@/pages/PlaceholderPage.jsx"

function App() {
  const location = useLocation()
  const { notification, modal } = AntdApp.useApp()

  useEffect(() => {
    if (location.state?.notification) {
      const { type = 'info', message, description } = location.state.notification
      
      // If it's an access warning (login required or forbidden), show it as a professional top-center alert
      const isSecurityWarning = ['Access Denied', 'Restricted Access', '403 Forbidden'].includes(message) && type === 'warning'
      
      if (isSecurityWarning) {
        // Map internal message codes to display titles if needed
        let title = message
        if (message === 'Access Denied') title = 'Restricted Access'

        notification.error({ // Use 'error' type for red styling automatically
          message: <span style={{ fontSize: '16px', fontWeight: 600, color: '#1f1f1f' }}>{title}</span>,
          description: <span style={{ fontSize: '14px', color: '#666' }}>{description}</span>,
          placement: 'top',
          top: 24, // Add spacing from top of screen
          duration: 5,
          icon: <LockOutlined style={{ color: '#ff4d4f', fontSize: '22px' }} />,
          style: { 
            width: 400, 
            margin: '0 auto',
            borderRadius: '8px', // Softer corners
            border: '1px solid #ffccc7', // Subtle red border
            backgroundColor: '#fff1f0', // Very light red background (Standard Enterprise Error/Alert)
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.12)',
          },
          closeIcon: false, // Cleaner look without close button (auto-dismiss)
          key: `access-denied-${Date.now()}`,
        })
      } else {
        // Otherwise, use the standard notification toast
        notification[type]({
          message,
          description,
          placement: 'topRight',
          duration: 4.5,
          key: `nav-notification-${Date.now()}`,
        })
      }
      
      // Clear the notification from state to prevent it from showing again on refresh
      // We use window.history to manipulate the state without triggering a re-render/navigation loop
      const state = { ...window.history.state }
      if (state.usr) {
        delete state.usr.notification
        window.history.replaceState(state, '')
      }
    }
  }, [location, notification])

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
        <Route path="users" element={<PlaceholderPage title="User Management" />} />
      </Route>

      {/* Business Owner Routes */}
      <Route path="/owner" element={<ProtectedRoute allowedRoles={['business_owner']}><Outlet /></ProtectedRoute>}>
        <Route index element={<BusinessOwnerDashboard />} />
        <Route path="permits" element={<PlaceholderPage title="Permit Applications" />} />
        <Route path="cessation" element={<PlaceholderPage title="Cessation" />} />
        <Route path="payments" element={<PlaceholderPage title="Payments" />} />
        <Route path="appeals" element={<PlaceholderPage title="Appeals" />} />
      </Route>
      
      {/* Staff Routes */}
      <Route path="/staff" element={<ProtectedRoute allowedRoles={['staff', 'lgu_officer', 'lgu_manager', 'inspector', 'cso']}><Outlet /></ProtectedRoute>}>
        <Route index element={<StaffDashboard />} />
        <Route path="inspections" element={<PlaceholderPage title="Inspections" />} />
        <Route path="applications" element={<PlaceholderPage title="Applications Review" />} />
        <Route path="cessation" element={<PlaceholderPage title="Cessation Review" />} />
        <Route path="appeals" element={<PlaceholderPage title="Appeals Review" />} />
        <Route path="reports" element={<PlaceholderPage title="Reports & Analytics" />} />
        <Route path="support" element={<PlaceholderPage title="Customer Support" />} />
      </Route>

      {/* Generic/Public Routes */}
      <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/profile-static" element={<ProtectedRoute><ProfileSettings /></ProtectedRoute>} />
      
      {/* Catch-all for 404 */}
      <Route path="*" element={<PlaceholderPage title="Page Not Found" />} />
    </Routes>
  )
}

export default App
