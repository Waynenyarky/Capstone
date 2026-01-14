const fireLoginPrefill = (preset) => {
  if (typeof window === 'undefined') return
  window.dispatchEvent(
    new CustomEvent('devtools:login-prefill', {
      detail: { preset },
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
