import { useMemo, useState } from 'react'
import { useAuthSession } from '@/features/authentication'
import { useLocation } from 'react-router-dom'
import {
  DashboardOutlined,
  FileTextOutlined,
  StopOutlined,
  AuditOutlined,
  UserOutlined,
  LogoutOutlined,
  TeamOutlined,
  SafetyCertificateOutlined,
  SolutionOutlined,
  BarChartOutlined,
  QuestionCircleOutlined,
  FormOutlined,
  DollarOutlined,
  EditOutlined,
  CheckCircleOutlined,
  AccountBookOutlined,
  SettingOutlined,
  ExperimentOutlined,
  EyeOutlined,
  ReloadOutlined,
  HistoryOutlined,
  StarOutlined,
} from '@ant-design/icons'

// Role keys used across the app: 'business_owner', 'admin', 'inspector', 'lgu_officer', 'lgu_manager', 'cso', 'user'
export default function useSidebar() {
  const { role, currentUser } = useAuthSession()
  const location = useLocation()

  const items = useMemo(() => {
    // Items are objects: { key, label, to?, type?, icon? }
    const staffOnboardingItems = [
      { key: 'onboarding', label: 'Account Setup', to: '/staff/onboarding', icon: <SafetyCertificateOutlined /> },
      { key: 'profile', label: 'Profile / Settings', to: '/settings-profile', icon: <UserOutlined /> },
      { key: 'logout', label: 'Logout', type: 'action', icon: <LogoutOutlined /> },
    ]

    const perRole = {
      business_owner: [], // Business owner routes use BusinessOwnerLayout (no sidebar)
      admin: [
        { key: 'dashboard', label: 'Dashboard', to: '/admin/dashboard', icon: <DashboardOutlined /> },
        { key: 'admin-users', label: 'User Management', to: '/admin/users', icon: <TeamOutlined /> },
        { key: 'admin-requests', label: 'Requests', to: '/admin/requests', icon: <CheckCircleOutlined /> },
        { key: 'content-management', label: 'Content Management', to: '/admin/content-management', icon: <FileTextOutlined /> },
        { key: 'forms', label: 'Forms', to: '/admin/forms', icon: <FormOutlined /> },
        { key: 'form-definitions', label: 'Form Definitions (old)', to: '/admin/form-definitions', icon: <FormOutlined /> },
        { key: 'fees', label: 'Fees', to: '/admin/fees', icon: <DollarOutlined /> },
        { key: 'fee-configuration', label: 'Fee Configuration (Old)', to: '/admin/fee-configuration', icon: <SettingOutlined /> },
        { key: 'finance', label: 'Finance', to: '/admin/finance', icon: <AccountBookOutlined /> },
        { key: 'security', label: 'Security', to: '/admin/security', icon: <SafetyCertificateOutlined /> },
        { key: 'lob-trainer', label: 'AI Training Data', to: '/admin/lob-trainer', icon: <ExperimentOutlined /> },
        { key: 'site-settings', label: 'Site Settings', to: '/admin/site-settings', icon: <SettingOutlined /> },
      ],
      staff: [
        { key: 'dashboard', label: 'Dashboard', to: '/staff', icon: <DashboardOutlined /> },
        { key: 'recovery', label: 'Request Recovery', to: '/staff/recovery-request', icon: <SafetyCertificateOutlined /> },
        { key: 'inspections', label: 'Violations / Inspections', to: '/staff/inspections', icon: <SolutionOutlined /> },
        { key: 'applications', label: 'Permit Applications (Review)', to: '/staff/applications', icon: <FileTextOutlined /> },
        { key: 'edit-requests', label: 'Edit Requests', to: '/staff/edit-requests', icon: <EditOutlined /> },
        { key: 'cessation', label: 'Cessation (Review)', to: '/staff/cessation', icon: <StopOutlined /> },
        { key: 'appeals', label: 'Appeals', to: '/staff/appeals', icon: <AuditOutlined /> },
        { key: 'reports', label: 'Reports / Analytics', to: '/staff/reports', icon: <BarChartOutlined /> },
        { key: 'support', label: 'Customer Support / Inquiry', to: '/staff/support', icon: <QuestionCircleOutlined /> },
        { key: 'profile', label: 'Profile / Settings', to: '/settings-profile', icon: <UserOutlined /> },
        { key: 'logout', label: 'Logout', type: 'action', icon: <LogoutOutlined /> },
      ],
      inspector: [
        { key: 'dashboard', label: 'Dashboard', to: '/staff', icon: <DashboardOutlined /> },
        { key: 'inspections', label: 'Violations / Inspections', to: '/staff/inspections', icon: <SolutionOutlined /> },
        { key: 'profile', label: 'Profile / Settings', to: '/settings-profile', icon: <UserOutlined /> },
        { key: 'logout', label: 'Logout', type: 'action', icon: <LogoutOutlined /> },
      ],
      lgu_officer: [
        { key: 'dashboard', label: 'Dashboard', to: '/staff', icon: <DashboardOutlined /> },
        { key: 'to-review', label: 'To Review', to: '/staff', icon: <EyeOutlined /> },
        { key: 'applications', label: 'Applications', to: '/staff/applications', icon: <FileTextOutlined /> },
        { key: 'appeals', label: 'Appeals', to: '/staff/appeals', icon: <AuditOutlined /> },
        { key: 'edit-requests', label: 'Edits', to: '/staff/edit-requests', icon: <EditOutlined /> },
        { key: 'renewals', label: 'Renewals', to: '/staff/renewals', icon: <ReloadOutlined /> },
        { key: 'cessation', label: 'Cessations', to: '/staff/cessation', icon: <StopOutlined /> },
        { key: 'inspections', label: 'Inspections', to: '/staff/inspections', icon: <SafetyCertificateOutlined /> },
        { key: 'help-requests', label: 'Help Requests', to: '/staff/help-requests', icon: <QuestionCircleOutlined /> },
        { key: 'drafts', label: 'My Drafts', to: '/staff/drafts', icon: <FormOutlined /> },
        { key: 'owners', label: 'Owners', to: '/staff/owners', icon: <UserOutlined /> },
        { key: 'ledger', label: 'Ledger', to: '/staff/ledger', icon: <DollarOutlined /> },
        { key: 'logs', label: 'Logs', to: '/staff/logs', icon: <HistoryOutlined /> },
        { key: 'bookmarks', label: 'Bookmarks', to: '/staff/bookmarks', icon: <StarOutlined /> },
        { key: 'profile', label: 'Settings', to: '/settings-profile', icon: <SettingOutlined /> },
      ],
      lgu_manager: [
        { key: 'dashboard', label: 'Dashboard', to: '/lgu-manager', icon: <DashboardOutlined /> },
        { key: 'reports', label: 'Reports / Analytics', to: '/lgu-manager/reports', icon: <BarChartOutlined /> },
        { key: 'permit-applications', label: 'Permit Applications (Overview)', to: '/lgu-manager/permit-applications', icon: <FileTextOutlined /> },
        { key: 'cessation', label: 'Cessation (Overview)', to: '/lgu-manager/cessation', icon: <StopOutlined /> },
        { key: 'violations-inspections', label: 'Violations / Inspections (Overview)', to: '/lgu-manager/violations-inspections', icon: <SolutionOutlined /> },
        { key: 'assign-inspection', label: 'Assign Inspection', to: '/lgu-manager/assign-inspection', icon: <SolutionOutlined /> },
        { key: 'appeals', label: 'Appeals (Overview)', to: '/lgu-manager/appeals', icon: <AuditOutlined /> },
        { key: 'profile', label: 'Profile / Settings', to: '/settings-profile', icon: <UserOutlined /> },
        { key: 'logout', label: 'Logout', type: 'action', icon: <LogoutOutlined /> },
      ],
      cso: [
        { key: 'dashboard', label: 'Dashboard', to: '/staff', icon: <DashboardOutlined /> },
        { key: 'support', label: 'Customer Support / Inquiry', to: '/staff/support', icon: <QuestionCircleOutlined /> },
        { key: 'profile', label: 'Profile / Settings', to: '/settings-profile', icon: <UserOutlined /> },
        { key: 'logout', label: 'Logout', type: 'action', icon: <LogoutOutlined /> },
      ],
      user: [
        { key: 'dashboard', label: 'Dashboard', to: '/dashboard', icon: <DashboardOutlined /> },
        { key: 'profile', label: 'Profile / Settings', to: '/settings-profile', icon: <UserOutlined /> },
        { key: 'logout', label: 'Logout', type: 'action', icon: <LogoutOutlined /> },
      ],
    }

    const roleKey = (role?.slug || role || 'user').toString().toLowerCase()
    const isStaffRole = ['staff', 'lgu_officer', 'lgu_manager', 'inspector', 'cso'].includes(roleKey)
    if (isStaffRole && (currentUser?.mustChangeCredentials || currentUser?.mustSetupMfa)) {
      return staffOnboardingItems
    }
    const result = perRole[roleKey] || perRole.user
    return Array.isArray(result) ? result : []
  }, [role, currentUser])

  const [selected, setSelected] = useState(items[0]?.key ?? 'dashboard')

  const onSelect = ({ key }) => setSelected(key)

  // Get page title and icon from current route
  const getPageInfo = useMemo(() => {
    const pathname = location.pathname
    // Find matching item by 'to' property — prefer exact match, then longest prefix match
    const exactMatch = items.find(item => item.to && pathname === item.to)
    if (exactMatch) {
      return { pageTitle: exactMatch.label, pageIcon: exactMatch.icon }
    }
    // Longest prefix match (sort by path length descending to find most specific)
    const prefixMatches = items
      .filter(item => item.to && item.to !== '/' && pathname.startsWith(item.to))
      .sort((a, b) => b.to.length - a.to.length)
    if (prefixMatches.length > 0) {
      return { pageTitle: prefixMatches[0].label, pageIcon: prefixMatches[0].icon }
    }
    return { pageTitle: null, pageIcon: null }
  }, [items, location.pathname])

  return { items, selected, onSelect, role, getPageInfo }
}
