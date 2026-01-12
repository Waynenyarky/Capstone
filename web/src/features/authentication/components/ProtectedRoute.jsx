import React from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuthSession } from '@/features/authentication'
import { getIsLoggingOut } from '@/features/authentication/lib/authEvents.js'
import DeletionPendingScreen from './DeletionPendingScreen.jsx'

export default function ProtectedRoute({ children, allowedRoles = [] }) {
  const { currentUser, role, isLoading } = useAuthSession()
  const location = useLocation()

  const roleKey = String(role?.slug || role || '').toLowerCase()
  const allowed = allowedRoles.map((r) => String(r || '').toLowerCase())
  const isUnauthorized = !isLoading && currentUser && allowed.length > 0 && !allowed.includes(roleKey)

  if (isLoading) {
    // You might want a spinner here, but for now we'll just return null or a simple div
    return null 
  }

  // If not authenticated, redirect to login
  if (!currentUser || !currentUser.token) {
    // Check if we are in the process of logging out. 
    // If so, suppress the "Restricted Access" warning.
    const isLoggingOut = getIsLoggingOut()
    
    if (isLoggingOut) {
      return <Navigate to="/login" replace />
    }

    // Only show "Access Denied" if we were trying to access a specific page (location.pathname !== '/')
    // AND it wasn't a voluntary logout (state.isLoggingOut is not set)
    // For now, we'll just check if we have a specific 'from' location that isn't the root
    
    // Check if this redirect is happening due to a logout action
    // We can rely on location state if we pass it during logout, but logout usually clears session state.
    // A simpler heuristic: if the user was just on a protected page and session vanished, it's likely a logout or expiration.
    // BUT the user specifically asked: "only show if the user tries to change the endpoint to admin or staff and etc."
    
    // So, we should only attach the warning notification if the user is explicitly navigating to a restricted path
    // while not logged in.
    // If it's a "normal" logout, the app usually redirects to /login directly without going through ProtectedRoute,
    // OR ProtectedRoute re-renders when currentUser becomes null.
    
    // If the user manually navigates to /admin/dashboard while logged out -> Show warning.
    // If the user clicks "Logout" -> The app should navigate to /login WITHOUT this warning.
    
    // We can check if the current navigation action is a POP (browser back/forward) or PUSH/REPLACE.
    // But better yet, we can check if the current location is something "deep" that implies intent.
    
    // However, even on logout, the location might still be the protected page for a split second.
    // To distinguish, the logout function should probably navigate to /login manually.
    // If ProtectedRoute is catching a "session expired" or "unauthorized access" event, we want the message.
    // If it's a voluntary logout, we don't want the message.
    
    // The "Logout" button typically calls `logout()` then navigates to `/login`.
    // If `logout()` clears the session, `ProtectedRoute` might re-render before the navigation to `/login` completes?
    // Actually, `logout()` updates the state, causing a re-render. 
    // If the user is on `/dashboard` (protected) and clicks logout:
    // 1. `logout()` clears `currentUser`.
    // 2. `ProtectedRoute` re-renders. `currentUser` is null.
    // 3. `ProtectedRoute` sees we are at `/dashboard`.
    // 4. `ProtectedRoute` redirects to `/login` WITH the warning.
    
    // Solution: The Logout action should probably redirect to /login immediately, OR we need a way to signal "intentional logout".
    // Since we can't easily pass state into this re-render from the hook, we can check if the redirection is happening
    // because of a missing user.
    
    // User asked: "only show if the user tries to change the endpoint to admin or staff".
    // This implies we want the warning when *accessing* a route, not when *leaving* one.
    // But from the code's perspective, both look the same: "I am at /admin/dashboard and I have no user".
    
    // We can try to detect if we are "already" at the location (re-render) vs "arriving" at the location.
    // But React Router doesn't make that distinction easily in a functional component.
    
    // Alternative: We can check if `location.state?.isLoggingOut` is set? 
    // No, because `location` is the CURRENT location (e.g. /dashboard), not the destination.
    
    // If we assume the user is trying to access a restricted page, we show the warning.
    // To prevent it on logout, the logout function should navigate to `/login` *before* or *simultaneously* with clearing the session,
    // or we can suppress the warning if the current route is one we were already on? No.
    
    // Let's modify the notification logic to be less aggressive.
    // Or, we can only show the notification if the user is explicitly trying to access specific high-value routes
    // and we want to be sure it's not a logout.
    
    // Actually, the simplest fix for "Restricted Access on Logout" is to ensure the Logout button navigates to `/login` 
    // with a state that says "loggedOut: true", and then we handle that. 
    // BUT ProtectedRoute is wrapping the *protected* pages. When you logout, you are still "on" the protected page for a microsecond.
    
    // If we change the Logout logic to `navigate('/login')` *then* `logout()`, 
    // the user is moved to `/login` (public) first. Then `logout()` clears state. 
    // Since `/login` is not wrapped in `ProtectedRoute`, this logic won't run.
    
    // However, if the user asks to modify THIS file:
    // We can try to infer intent. 
    // But the most robust fix is likely in the `useLogoutForm` or wherever logout happens.
    // Wait, the user said "do it will only show if the user tries to change the endpoint to admin or staff".
    
    // If I am at `/dashboard` and I logout -> I shouldn't see "Restricted Access".
    // If I am at `/login` and I type `/admin/dashboard` -> I SHOULD see "Restricted Access".
    
    // Since I cannot distinguish these two cases easily here without extra global state (like "isLoggingOut"),
    // I will modify the `Navigate` to NOT include the notification by default, 
    // or make the notification specific to "Unauthorized" (role mismatch) rather than "Unauthenticated" (missing login).
    
    // However, "You must be logged in" is useful if I try to share a link.
    
    // Let's implement a check: 
    // If we rely on the `useLogoutForm` fix (navigate before logout), that's cleaner.
    // But I should also update this component to be smarter.
    
    // Let's update `useLogoutForm` first to navigate away. 
    // But the user specifically pointed to the "Restricted Access" message logic.
    
    // Let's assume for now we want to keep the message for deep links.
    // I will simply remove the notification here for now, as requested "only show if... change endpoint".
    // If I remove it here, it won't show on logout.
    // Does it show when typing the URL? No, it won't.
    
    // User wants: Show it ONLY if user tries to access restricted routes (admin/staff) specifically?
    // "only show if the user tries to change the endpoint to admin or staff and etc."
    
    // So if I access `/dashboard` (generic user), maybe no error?
    // But if I access `/admin/*` or `/staff/*` -> Error.
    
    const path = location.pathname.toLowerCase()
    const sensitiveRoutes = ['/admin', '/staff', '/owner']
    const isSensitive = sensitiveRoutes.some(r => path.startsWith(r))
    
    const notification = isSensitive ? {
      type: 'warning',
      message: 'Restricted Access',
      description: 'You must be logged in to view this page.'
    } : undefined

    return (
      <Navigate 
        to="/login" 
        replace 
        state={{ 
          from: location,
          notification
        }} 
      />
    )
  }

  const staffRoles = ['staff', 'lgu_manager', 'lgu_officer', 'inspector', 'cso']

  // Handle Deletion Pending State
  if (currentUser?.deletionPending) {
    if (location.pathname !== '/deletion-pending') {
      return <Navigate to="/deletion-pending" replace state={{ from: location }} />
    }
    return children
  }

  // Prevent access to Deletion Pending screen if not pending
  if (!currentUser?.deletionPending && location.pathname === '/deletion-pending') {
    // Try to restore the previous location if available
    if (location.state?.from?.pathname) {
      return <Navigate to={location.state.from.pathname} replace />
    }

    // Default to role-based dashboard
    let target = '/dashboard'
    if (roleKey === 'admin') target = '/admin/dashboard'
    else if (roleKey === 'business_owner') target = '/owner'
    else if (staffRoles.includes(roleKey)) target = '/staff'
    
    return <Navigate to={target} replace />
  }

  const needsOnboarding = staffRoles.includes(roleKey) && (currentUser?.mustChangeCredentials || currentUser?.mustSetupMfa)
  const onboardingAllowedPaths = ['/staff/onboarding', '/mfa/setup']
  if (needsOnboarding && !onboardingAllowedPaths.includes(location.pathname)) {
    return <Navigate to="/staff/onboarding" replace state={{ from: location }} />
  }

  // If roles are specified and user doesn't match
  if (isUnauthorized) {
    // Determine target dashboard based on role to avoid redirect loops or intermediate pages
    let target = '/dashboard' // fallback
    
    if (roleKey === 'admin') target = '/admin/dashboard'
    else if (roleKey === 'business_owner') target = '/owner'
    else if (staffRoles.includes(roleKey)) target = '/staff'

    return (
      <Navigate 
        to={target} 
        replace 
        state={{ 
          notification: {
            type: 'warning',
            message: 'Restricted Access',
            description: 'You do not have permission to view this page.'
          }
        }} 
      />
    )
  }

  return children
}
