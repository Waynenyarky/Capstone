const fireLoginPrefill = (preset) => {
  if (typeof window === 'undefined') return
  window.dispatchEvent(
    new CustomEvent('devtools:login-prefill', {
      detail: { preset },
    }),
  )
}

const fireUsermgmt = (payload) => {
  if (typeof window === 'undefined') return
  window.dispatchEvent(
    new CustomEvent('devtools:usermgmt', {
      detail: payload,
    }),
  )
}

const emitSimulated = (emitEvent, notify, { type = 'info', title, description, data }) => {
  emitEvent({ type, title, description, data })
  notify({ type: type === 'error' ? 'error' : type, title, description })
}

export function getDevActions({ pathname, navigate, emitEvent, notify }) {
  const actions = []

  const addAction = (action) => actions.push(action)

  const go = (path) => () => navigate(path)

  // Global navigation shortcuts
  addAction({
    id: 'nav-admin-dashboard',
    category: 'Navigation',
    label: 'Go to Admin Dashboard',
    description: 'Jump to admin overview',
    run: go('/admin/dashboard'),
  })
  addAction({
    id: 'nav-owner-dashboard',
    category: 'Navigation',
    label: 'Go to Business Owner',
    description: 'Jump to business owner workspace',
    run: go('/owner'),
  })
  addAction({
    id: 'nav-staff-dashboard',
    category: 'Navigation',
    label: 'Go to Staff',
    description: 'Jump to staff workspace',
    run: go('/staff'),
  })

  // Authentication page helpers
  if (pathname.startsWith('/login')) {
    addAction({
      id: 'login-prefill-admin',
      category: 'Authentication',
      label: 'Prefill Admin Login',
      description: 'Fill admin credentials into login form',
      run: () => fireLoginPrefill('admin'),
    })
    addAction({
      id: 'login-prefill-manager',
      category: 'Authentication',
      label: 'Prefill LGU Manager Login',
      description: 'Fill LGU manager credentials into login form',
      run: () => fireLoginPrefill('manager'),
    })
    addAction({
      id: 'login-prefill-owner',
      category: 'Authentication',
      label: 'Prefill Business Owner Login',
      description: 'Fill business owner credentials into login form',
      run: () => fireLoginPrefill('business'),
    })
  }

  // Admin-specific actions
  if (pathname.startsWith('/admin')) {
    addAction({
      id: 'admin-simulate-alert',
      category: 'Admin',
      label: 'Simulate Security Alert',
      description: 'Send a critical alert (SOC-style) to validate UI',
      run: () =>
        emitSimulated(emitEvent, notify, {
          type: 'warning',
          title: 'Simulated alert: anomalous login spike',
          description: '5 failed MFA attempts from geo-variance IPs in last 2 minutes.',
          data: { source: 'devtools', severity: 'high', area: 'auth' },
        }),
    })
    addAction({
      id: 'admin-simulate-log',
      category: 'Admin',
      label: 'Add Audit Log Entry',
      description: 'Append a fake audit log entry for testing',
      run: () =>
        emitSimulated(emitEvent, notify, {
          type: 'info',
          title: 'Audit: deletion request finalized',
          description: 'User #9482 deletion request auto-finalized (dev seed).',
          data: { source: 'devtools', severity: 'medium', area: 'deletion' },
        }),
    })
    addAction({
      id: 'admin-goto-maintenance',
      category: 'Admin',
      label: 'Open Maintenance View',
      description: 'Navigate to maintenance mode screen',
      run: go('/admin/maintenance'),
    })
    addAction({
      id: 'admin-goto-users',
      category: 'Admin',
      label: 'Open Admin Users',
      description: 'Navigate to admin user management',
      run: go('/admin/users'),
    })
  }

  // User Management page dev actions
  if (pathname.startsWith('/admin/users')) {
    addAction({
      id: 'usermgmt-tab-overview',
      category: 'User Management',
      label: 'Switch to Overview Tab',
      description: 'Set active tab to Overview',
      run: () => fireUsermgmt({ action: 'setTab', tab: 'overview' }),
    })
    addAction({
      id: 'usermgmt-tab-staff',
      category: 'User Management',
      label: 'Switch to Staff Accounts Tab',
      description: 'Set active tab to Staff Accounts',
      run: () => fireUsermgmt({ action: 'setTab', tab: 'staff' }),
    })
    addAction({
      id: 'usermgmt-tab-office-role',
      category: 'User Management',
      label: 'Switch to Staff by Office & Role Tab',
      description: 'Set active tab to Staff by Office & Role',
      run: () => fireUsermgmt({ action: 'setTab', tab: 'office-role' }),
    })
    addAction({
      id: 'usermgmt-tab-admins',
      category: 'User Management',
      label: 'Switch to Admins Tab',
      description: 'Set active tab to Admins',
      run: () => fireUsermgmt({ action: 'setTab', tab: 'admins' }),
    })
    addAction({
      id: 'usermgmt-tab-business',
      category: 'User Management',
      label: 'Switch to Business Owners Tab',
      description: 'Set active tab to Business Owners',
      run: () => fireUsermgmt({ action: 'setTab', tab: 'business' }),
    })
    addAction({
      id: 'usermgmt-open-create',
      category: 'User Management',
      label: 'Open Create Staff Modal',
      description: 'Open the Create Staff Account modal',
      run: () => fireUsermgmt({ action: 'openCreateModal' }),
    })
    addAction({
      id: 'usermgmt-open-create-invalid',
      category: 'User Management',
      label: 'Create Staff with Invalid Data',
      description: 'Open Create modal and prefill invalid values to trigger validation',
      run: () => fireUsermgmt({ action: 'openCreateModal', prefillInvalid: true }),
    })
    addAction({
      id: 'usermgmt-open-edit',
      category: 'User Management',
      label: 'Open Edit Staff Modal',
      description: 'Open Edit modal for first staff (or mock)',
      run: () => fireUsermgmt({ action: 'openEditModal', useFirstStaff: true }),
    })
    addAction({
      id: 'usermgmt-open-edit-invalid',
      category: 'User Management',
      label: 'Edit Staff with Invalid Data',
      description: 'Open Edit modal and prefill invalid values to trigger validation',
      run: () => fireUsermgmt({ action: 'openEditModal', useFirstStaff: true, prefillInvalid: true }),
    })
    addAction({
      id: 'usermgmt-open-reset',
      category: 'User Management',
      label: 'Open Reset Password Modal',
      description: 'Open Reset Password modal for first staff (or mock)',
      run: () => fireUsermgmt({ action: 'openResetModal', useFirstStaff: true }),
    })
    addAction({
      id: 'usermgmt-open-disable',
      category: 'User Management',
      label: 'Open Disable Account Modal',
      description: 'Open Disable modal for first staff (or mock). Submit without reason to test validation.',
      run: () => fireUsermgmt({ action: 'openDisableModal', useFirstStaff: true }),
    })
    addAction({
      id: 'usermgmt-open-user-detail',
      category: 'User Management',
      label: 'Open Business Owner Detail',
      description: 'Switch to Business Owners tab and open first user detail panel',
      run: () => fireUsermgmt({ action: 'openUserDetail', useFirstUser: true }),
    })
    addAction({
      id: 'usermgmt-open-admin-edit',
      category: 'User Management',
      label: 'Open Admin Edit Modal',
      description: 'Switch to Admins tab and open Edit modal for first admin',
      run: () => fireUsermgmt({ action: 'openAdminEdit', useFirstAdmin: true }),
    })
  }

  // Business owner flows
  if (pathname.startsWith('/owner')) {
    addAction({
      id: 'owner-simulate-notification',
      category: 'Owner',
      label: 'Simulate Permit Update',
      description: 'Trigger a fake permit status change notification',
      run: () =>
        emitSimulated(emitEvent, notify, {
          type: 'success',
          title: 'Permit updated',
          description: 'Permit APP-10294 progressed to “For Inspection”.',
          data: { source: 'devtools', area: 'permits' },
        }),
    })
    addAction({
      id: 'owner-simulate-payment',
      category: 'Owner',
      label: 'Simulate Payment Received',
      description: 'Record a sample payment event',
      run: () =>
        emitSimulated(emitEvent, notify, {
          type: 'info',
          title: 'Payment received',
          description: '₱5,000 payment posted for renewal APP-20311.',
          data: { source: 'devtools', area: 'payments' },
        }),
    })
  }

  // Staff flows
  if (pathname.startsWith('/staff')) {
    addAction({
      id: 'staff-simulate-recovery',
      category: 'Staff',
      label: 'Simulate Recovery Request',
      description: 'Add a fake account recovery request',
      run: () =>
        emitSimulated(emitEvent, notify, {
          type: 'info',
          title: 'New recovery request',
          description: 'Recovery request #R-4412 created for officer.jane@city.gov.',
          data: { source: 'devtools', area: 'recovery' },
        }),
    })
    addAction({
      id: 'staff-simulate-inspection',
      category: 'Staff',
      label: 'Simulate Inspection Task',
      description: 'Generate a mock inspection assignment',
      run: () =>
        emitSimulated(emitEvent, notify, {
          type: 'warning',
          title: 'Inspection assigned',
          description: 'Inspection #INSP-7782 assigned to you for APP-8821 (24h SLA).',
          data: { source: 'devtools', area: 'inspections' },
        }),
    })
  }

  // Public / dashboard actions
  if (pathname === '/' || pathname === '/dashboard') {
    addAction({
      id: 'dashboard-simulate-alert',
      category: 'Home',
      label: 'Simulate Banner Alert',
      description: 'Show a fake downtime banner notification',
      run: () =>
        emitSimulated(emitEvent, notify, {
          type: 'warning',
          title: 'Planned maintenance tonight',
          description: 'Sandbox services will restart at 11:30 PM for 5 minutes.',
          data: { source: 'devtools', area: 'maintenance' },
        }),
    })
  }

  // Catch-all action to test wiring
  addAction({
    id: 'devtools-ping',
    category: 'Utilities',
    label: 'Ping DevTools',
    description: 'Verify dev tool wiring is live',
    run: () =>
      emitSimulated(emitEvent, notify, {
        type: 'success',
        title: 'DevTools active',
        description: `Actions loaded for ${pathname}`,
        data: { source: 'devtools', area: 'ping' },
      }),
  })

  return actions
}

/** Category that represents the current page context (for FAB section ordering) */
export function getPrimaryCategory(pathname) {
  if (pathname.startsWith('/login')) return 'Authentication'
  if (pathname.startsWith('/admin/users')) return 'User Management'
  if (pathname.startsWith('/admin')) return 'Admin'
  if (pathname.startsWith('/owner')) return 'Owner'
  if (pathname.startsWith('/staff')) return 'Staff'
  if (pathname === '/' || pathname === '/dashboard') return 'Home'
  return null
}
