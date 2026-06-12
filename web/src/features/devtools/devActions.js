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

const fireRequestsmgmt = (payload) => {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new CustomEvent('devtools:requests', { detail: payload }))
}

const fireMaintenancemgmt = (payload) => {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new CustomEvent('devtools:maintenance', { detail: payload }))
}

const fireFormdefmgmt = (payload) => {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new CustomEvent('devtools:formdef', { detail: payload }))
}

const fireFeeconfigmgmt = (payload) => {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new CustomEvent('devtools:feeconfig', { detail: payload }))
}

const fireFinancemgmt = (payload) => {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new CustomEvent('devtools:finance', { detail: payload }))
}

const fireAudittampermgmt = (payload) => {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new CustomEvent('devtools:audittamper', { detail: payload }))
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
      id: 'login-prefill-officer',
      category: 'Authentication',
      label: 'Prefill LGU Officer Login',
      description: 'Fill LGU officer credentials into login form',
      run: () => fireLoginPrefill('officer'),
    })
    addAction({
      id: 'login-prefill-officer2',
      category: 'Authentication',
      label: 'Prefill LGU Officer 2 Login',
      description: 'Fill second LGU officer credentials into login form',
      run: () => fireLoginPrefill('officer2'),
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

  // Admin Dashboard
  if (pathname.startsWith('/admin/dashboard')) {
    addAction({
      id: 'dashboard-refresh',
      category: 'Dashboard',
      label: 'Refresh Dashboard',
      description: 'Trigger loadKpis + loadRecentActivity',
      run: () => window.dispatchEvent(new CustomEvent('admin-dashboard-refresh')),
    })
    addAction({
      id: 'dashboard-simulate-empty',
      category: 'Dashboard',
      label: 'Simulate Empty KPIs',
      description: 'Show message for no pending requests / zero tamper',
      run: () =>
        emitSimulated(emitEvent, notify, {
          type: 'info',
          title: 'Empty state',
          description: 'No pending requests. Zero open tamper incidents.',
          data: { source: 'devtools', area: 'dashboard' },
        }),
    })
    addAction({
      id: 'dashboard-simulate-error',
      category: 'Dashboard',
      label: 'Simulate API Error',
      description: 'Show failed to load dashboard stats notification',
      run: () =>
        emitSimulated(emitEvent, notify, {
          type: 'error',
          title: 'Failed to load dashboard stats',
          description: 'Network or server error (simulated).',
          data: { source: 'devtools', area: 'dashboard' },
        }),
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
      id: 'usermgmt-tab-logs',
      category: 'User Management',
      label: 'Switch to Logs Tab',
      description: 'Set active tab to Logs (audit log)',
      run: () => fireUsermgmt({ action: 'setTab', tab: 'logs' }),
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
    addAction({
      id: 'usermgmt-open-activate',
      category: 'User Management',
      label: 'Open Activate Account Modal',
      description: 'Open Activate modal for first staff (or mock)',
      run: () => fireUsermgmt({ action: 'openActivateModal', useFirstStaff: true }),
    })
    addAction({
      id: 'usermgmt-simulate-create-success',
      category: 'User Management',
      label: 'Simulate Create Success',
      description: 'Show staff account created notification',
      run: () =>
        emitSimulated(emitEvent, notify, {
          type: 'success',
          title: 'Staff account created',
          description: 'New staff account has been created (simulated).',
          data: { source: 'devtools', area: 'usermgmt' },
        }),
    })
    addAction({
      id: 'usermgmt-simulate-create-error',
      category: 'User Management',
      label: 'Simulate Create Error',
      description: 'Show email already in use error',
      run: () =>
        emitSimulated(emitEvent, notify, {
          type: 'error',
          title: 'Email already in use',
          description: 'A staff account with this email already exists (simulated).',
          data: { source: 'devtools', area: 'usermgmt' },
        }),
    })
    addAction({
      id: 'usermgmt-open-disable-invalid',
      category: 'User Management',
      label: 'Disable with Invalid Reason',
      description: 'Open Disable modal and prefill Others with 2 chars to trigger validation',
      run: () => fireUsermgmt({ action: 'openDisableModal', useFirstStaff: true, prefillInvalid: true }),
    })
  }

  // Admin Requests
  if (pathname.startsWith('/admin/requests')) {
    addAction({
      id: 'requests-refresh',
      category: 'Requests',
      label: 'Refresh Requests',
      description: 'Reload approval list (same as header button)',
      run: () => window.dispatchEvent(new CustomEvent('admin-requests-refresh')),
    })
    addAction({
      id: 'requests-filter-pending',
      category: 'Requests',
      label: 'Set Filter: Pending',
      description: 'Show only pending requests',
      run: () => fireRequestsmgmt({ action: 'setStatusFilter', status: 'pending' }),
    })
    addAction({
      id: 'requests-filter-all',
      category: 'Requests',
      label: 'Set Filter: All',
      description: 'Show all requests',
      run: () => fireRequestsmgmt({ action: 'setStatusFilter', status: 'all' }),
    })
    addAction({
      id: 'requests-select-first',
      category: 'Requests',
      label: 'Select First Request',
      description: 'Select first row and load detail panel',
      run: () => fireRequestsmgmt({ action: 'selectFirst' }),
    })
    addAction({
      id: 'requests-simulate-approve-success',
      category: 'Requests',
      label: 'Simulate Approve Success',
      description: 'Show request approved notification',
      run: () =>
        emitSimulated(emitEvent, notify, {
          type: 'success',
          title: 'Request approved',
          description: 'The approval request was approved (simulated).',
          data: { source: 'devtools', area: 'requests' },
        }),
    })
    addAction({
      id: 'requests-simulate-approve-error',
      category: 'Requests',
      label: 'Simulate Approve Error',
      description: 'Show failed to approve notification',
      run: () =>
        emitSimulated(emitEvent, notify, {
          type: 'error',
          title: 'Failed to approve request',
          description: 'Could not process approval (simulated).',
          data: { source: 'devtools', area: 'requests' },
        }),
    })
    addAction({
      id: 'requests-simulate-empty',
      category: 'Requests',
      label: 'Simulate Empty List',
      description: 'Show no pending requests message',
      run: () =>
        emitSimulated(emitEvent, notify, {
          type: 'info',
          title: 'No pending requests',
          description: 'There are no pending approval requests.',
          data: { source: 'devtools', area: 'requests' },
        }),
    })
  }

  // Admin Maintenance
  if (pathname.startsWith('/admin/maintenance')) {
    addAction({
      id: 'maintenance-open-request-enable',
      category: 'Maintenance',
      label: 'Open Request Modal (Enable)',
      description: 'Open request modal prefilled for enable maintenance',
      run: () => fireMaintenancemgmt({ action: 'openRequestModal', prefill: 'enable' }),
    })
    addAction({
      id: 'maintenance-open-request-invalid',
      category: 'Maintenance',
      label: 'Open Request Modal (Invalid)',
      description: 'Open modal with invalid prefill to trigger validation',
      run: () => fireMaintenancemgmt({ action: 'openRequestModal', prefill: 'invalid' }),
    })
    addAction({
      id: 'maintenance-tab-overview',
      category: 'Maintenance',
      label: 'Switch to Overview Tab',
      description: 'Set active tab to Overview',
      run: () => fireMaintenancemgmt({ action: 'setTab', tab: 'overview' }),
    })
    addAction({
      id: 'maintenance-tab-status',
      category: 'Maintenance',
      label: 'Switch to Status Tab',
      description: 'Set active tab to Status',
      run: () => fireMaintenancemgmt({ action: 'setTab', tab: 'status' }),
    })
    addAction({
      id: 'maintenance-tab-history',
      category: 'Maintenance',
      label: 'Switch to History Tab',
      description: 'Set active tab to History',
      run: () => fireMaintenancemgmt({ action: 'setTab', tab: 'history' }),
    })
    addAction({
      id: 'maintenance-select-first-pending',
      category: 'Maintenance',
      label: 'Select First Pending Approval',
      description: 'Switch to Status and select first pending request',
      run: () => fireMaintenancemgmt({ action: 'selectFirstPending' }),
    })
    addAction({
      id: 'maintenance-simulate-submitted',
      category: 'Maintenance',
      label: 'Simulate Request Submitted',
      description: 'Show maintenance request submitted notification',
      run: () =>
        emitSimulated(emitEvent, notify, {
          type: 'success',
          title: 'Maintenance request submitted for approval',
          description: 'Two admin approvals required (simulated).',
          data: { source: 'devtools', area: 'maintenance' },
        }),
    })
    addAction({
      id: 'maintenance-simulate-approved',
      category: 'Maintenance',
      label: 'Simulate Maintenance Approved',
      description: 'Show maintenance mode enabled notification',
      run: () =>
        emitSimulated(emitEvent, notify, {
          type: 'success',
          title: 'Maintenance mode enabled',
          description: 'System is now in maintenance mode (simulated).',
          data: { source: 'devtools', area: 'maintenance' },
        }),
    })
    addAction({
      id: 'maintenance-simulate-rejected',
      category: 'Maintenance',
      label: 'Simulate Request Denied',
      description: 'Show request denied notification',
      run: () =>
        emitSimulated(emitEvent, notify, {
          type: 'info',
          title: 'Request denied',
          description: 'Maintenance change was rejected (simulated).',
          data: { source: 'devtools', area: 'maintenance' },
        }),
    })
  }

  // Admin Form Definitions
  if (pathname.startsWith('/admin/form-definitions')) {
    addAction({
      id: 'formdef-nav-overview',
      category: 'Form Definitions',
      label: 'Switch Nav: Overview',
      description: 'Set nav to Overview',
      run: () => fireFormdefmgmt({ action: 'setNav', nav: '__overview__' }),
    })
    addAction({
      id: 'formdef-nav-logs',
      category: 'Form Definitions',
      label: 'Switch Nav: Logs',
      description: 'Set nav to History/Logs',
      run: () => fireFormdefmgmt({ action: 'setNav', nav: '__logs__' }),
    })
    addAction({
      id: 'formdef-nav-first-type',
      category: 'Form Definitions',
      label: 'Switch Nav: First Form Type',
      description: 'Set nav to first form type (e.g. permit)',
      run: () => fireFormdefmgmt({ action: 'setNav', nav: 'permit' }),
    })
    addAction({
      id: 'formdef-refresh',
      category: 'Form Definitions',
      label: 'Refresh Form Definitions',
      description: 'Trigger loadStats / list reload',
      run: () => fireFormdefmgmt({ action: 'refresh' }),
    })
    addAction({
      id: 'formdef-open-add-version',
      category: 'Form Definitions',
      label: 'Open Add Version Modal',
      description: 'Open Add Version when a group is selected',
      run: () => fireFormdefmgmt({ action: 'openAddVersion' }),
    })
    addAction({
      id: 'formdef-open-deactivate',
      category: 'Form Definitions',
      label: 'Open Deactivate Modal',
      description: 'Open Deactivate when group selected',
      run: () => fireFormdefmgmt({ action: 'openDeactivate' }),
    })
    addAction({
      id: 'formdef-open-drafts',
      category: 'Form Definitions',
      label: 'Open Drafts Modal',
      description: 'Open Drafts modal',
      run: () => fireFormdefmgmt({ action: 'openDrafts' }),
    })
    addAction({
      id: 'formdef-simulate-submit-success',
      category: 'Form Definitions',
      label: 'Simulate Submit for Approval Success',
      description: 'Show form version submitted notification',
      run: () =>
        emitSimulated(emitEvent, notify, {
          type: 'success',
          title: 'Form version submitted for approval',
          description: 'Version submitted (simulated).',
          data: { source: 'devtools', area: 'formdef' },
        }),
    })
    addAction({
      id: 'formdef-simulate-deactivate-success',
      category: 'Form Definitions',
      label: 'Simulate Deactivate Success',
      description: 'Show form group deactivated notification',
      run: () =>
        emitSimulated(emitEvent, notify, {
          type: 'success',
          title: 'Form group deactivated',
          description: 'Form group has been deactivated (simulated).',
          data: { source: 'devtools', area: 'formdef' },
        }),
    })
  }

  // Admin Fee Configuration
  if (pathname.startsWith('/admin/fee-configuration')) {
    addAction({
      id: 'feeconfig-tab-overview',
      category: 'Fee Configuration',
      label: 'Switch to Overview Tab',
      description: 'Set active tab to Overview',
      run: () => fireFeeconfigmgmt({ action: 'setTab', tab: 'overview' }),
    })
    addAction({
      id: 'feeconfig-tab-fee-by-lob',
      category: 'Fee Configuration',
      label: 'Switch to Fee by LOB Tab',
      description: 'Set active tab to Fee by Line of Business',
      run: () => fireFeeconfigmgmt({ action: 'setTab', tab: 'fee-by-lob' }),
    })
    addAction({
      id: 'feeconfig-tab-special',
      category: 'Fee Configuration',
      label: 'Switch to Special Fees Tab',
      description: 'Set active tab to Special fees',
      run: () => fireFeeconfigmgmt({ action: 'setTab', tab: 'special-fees' }),
    })
    addAction({
      id: 'feeconfig-tab-penalty',
      category: 'Fee Configuration',
      label: 'Switch to Penalty Tab',
      description: 'Set active tab to Penalty & Surcharge',
      run: () => fireFeeconfigmgmt({ action: 'setTab', tab: 'penalty' }),
    })
    addAction({
      id: 'feeconfig-tab-logs',
      category: 'Fee Configuration',
      label: 'Switch to History Tab',
      description: 'Set active tab to History',
      run: () => fireFeeconfigmgmt({ action: 'setTab', tab: 'logs' }),
    })
    addAction({
      id: 'feeconfig-select-first',
      category: 'Fee Configuration',
      label: 'Select First Fee Config',
      description: 'Select first config in list',
      run: () => fireFeeconfigmgmt({ action: 'selectFirst' }),
    })
    addAction({
      id: 'feeconfig-open-penalty-invalid',
      category: 'Fee Configuration',
      label: 'Open Penalty Form (Invalid Data)',
      description: 'Switch to Penalty and prefill invalid values for validation',
      run: () => fireFeeconfigmgmt({ action: 'openPenaltyInvalid' }),
    })
    addAction({
      id: 'feeconfig-open-add-lob',
      category: 'Fee Configuration',
      label: 'Open Add LOB Modal',
      description: 'Open modal to add line of business',
      run: () => fireFeeconfigmgmt({ action: 'openAddLob' }),
    })
    addAction({
      id: 'feeconfig-refresh',
      category: 'Fee Configuration',
      label: 'Refresh Fee Configs',
      description: 'Reload fee configuration list',
      run: () => fireFeeconfigmgmt({ action: 'refresh' }),
    })
    addAction({
      id: 'feeconfig-simulate-save-success',
      category: 'Fee Configuration',
      label: 'Simulate Save Success',
      description: 'Show fee configuration saved notification',
      run: () =>
        emitSimulated(emitEvent, notify, {
          type: 'success',
          title: 'Fee configuration saved',
          description: 'Changes saved (simulated).',
          data: { source: 'devtools', area: 'feeconfig' },
        }),
    })
    addAction({
      id: 'feeconfig-simulate-save-error',
      category: 'Fee Configuration',
      label: 'Simulate Save Error',
      description: 'Show failed to save notification',
      run: () =>
        emitSimulated(emitEvent, notify, {
          type: 'error',
          title: 'Failed to save',
          description: 'Could not save fee configuration (simulated).',
          data: { source: 'devtools', area: 'feeconfig' },
        }),
    })
    addAction({
      id: 'feeconfig-open-export-logs',
      category: 'Fee Configuration',
      label: 'Open Export Logs Modal',
      description: 'Open export logs dialog',
      run: () => fireFeeconfigmgmt({ action: 'openExportLogs' }),
    })
  }

  // Admin Finance
  if (pathname.startsWith('/admin/finance')) {
    addAction({
      id: 'finance-tab-overview',
      category: 'Finance',
      label: 'Switch to Overview Tab',
      run: () => fireFinancemgmt({ action: 'setTab', tab: 'overview' }),
    })
    addAction({
      id: 'finance-tab-transactions',
      category: 'Finance',
      label: 'Switch to Transactions Tab',
      run: () => fireFinancemgmt({ action: 'setTab', tab: 'transactions' }),
    })
    addAction({
      id: 'finance-tab-reports',
      category: 'Finance',
      label: 'Switch to Reports Tab',
      run: () => fireFinancemgmt({ action: 'setTab', tab: 'reports' }),
    })
    addAction({
      id: 'finance-refresh',
      category: 'Finance',
      label: 'Refresh Finance',
      run: () => fireFinancemgmt({ action: 'refresh' }),
    })
    addAction({
      id: 'finance-simulate-activity',
      category: 'Finance',
      label: 'Simulate Recent Activity Loaded',
      run: () =>
        emitSimulated(emitEvent, notify, {
          type: 'info',
          title: 'Recent activity loaded',
          description: 'Finance overview data loaded (simulated).',
          data: { source: 'devtools', area: 'finance' },
        }),
    })
    addAction({
      id: 'finance-simulate-empty',
      category: 'Finance',
      label: 'Simulate Empty Transactions',
      run: () =>
        emitSimulated(emitEvent, notify, {
          type: 'info',
          title: 'No transactions this period',
          description: 'No transactions to display (simulated).',
          data: { source: 'devtools', area: 'finance' },
        }),
    })
  }

  // Admin Security / Audit Tamper
  if (pathname.startsWith('/admin/security')) {
    addAction({
      id: 'audittamper-tab-overview',
      category: 'Security',
      label: 'Switch to Overview Tab',
      run: () => fireAudittampermgmt({ action: 'setTab', tab: 'overview' }),
    })
    addAction({
      id: 'audittamper-tab-incidents',
      category: 'Security',
      label: 'Switch to Incidents Tab',
      run: () => fireAudittampermgmt({ action: 'setTab', tab: 'incidents' }),
    })
    addAction({
      id: 'audittamper-tab-history',
      category: 'Security',
      label: 'Switch to History Tab',
      run: () => fireAudittampermgmt({ action: 'setTab', tab: 'history' }),
    })
    addAction({
      id: 'audittamper-filter-status-new',
      category: 'Security',
      label: 'Set Incidents Filter: Status = New',
      run: () => fireAudittampermgmt({ action: 'setIncidentFilter', status: 'new' }),
    })
    addAction({
      id: 'audittamper-filter-severity-high',
      category: 'Security',
      label: 'Set Incidents Filter: Severity = High',
      run: () => fireAudittampermgmt({ action: 'setIncidentFilter', severity: 'high' }),
    })
    addAction({
      id: 'audittamper-select-first',
      category: 'Security',
      label: 'Select First Incident',
      run: () => fireAudittampermgmt({ action: 'selectFirstIncident' }),
    })
    addAction({
      id: 'audittamper-simulate-ack-success',
      category: 'Security',
      label: 'Simulate Acknowledge Success',
      run: () =>
        emitSimulated(emitEvent, notify, {
          type: 'success',
          title: 'Incident acknowledged',
          description: 'Incident acknowledged (simulated).',
          data: { source: 'devtools', area: 'security' },
        }),
    })
    addAction({
      id: 'audittamper-simulate-ack-error',
      category: 'Security',
      label: 'Simulate Acknowledge Error',
      run: () =>
        emitSimulated(emitEvent, notify, {
          type: 'error',
          title: 'Failed to acknowledge',
          description: 'Could not acknowledge incident (simulated).',
          data: { source: 'devtools', area: 'security' },
        }),
    })
    addAction({
      id: 'audittamper-simulate-resolve',
      category: 'Security',
      label: 'Simulate Resolve Success',
      run: () =>
        emitSimulated(emitEvent, notify, {
          type: 'success',
          title: 'Incident resolved',
          description: 'Incident marked resolved (simulated).',
          data: { source: 'devtools', area: 'security' },
        }),
    })
    addAction({
      id: 'audittamper-refresh',
      category: 'Security',
      label: 'Refresh Security',
      run: () => fireAudittampermgmt({ action: 'refresh' }),
    })
    addAction({
      id: 'audittamper-open-export-logs',
      category: 'Security',
      label: 'Open Export Logs Modal',
      run: () => fireAudittampermgmt({ action: 'openExportLogs' }),
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
  if (pathname.startsWith('/admin/dashboard')) return 'Dashboard'
  if (pathname.startsWith('/admin/requests')) return 'Requests'
  if (pathname.startsWith('/admin/maintenance')) return 'Maintenance'
  if (pathname.startsWith('/admin/form-definitions')) return 'Form Definitions'
  if (pathname.startsWith('/admin/fee-configuration')) return 'Fee Configuration'
  if (pathname.startsWith('/admin/finance')) return 'Finance'
  if (pathname.startsWith('/admin/security')) return 'Security'
  if (pathname.startsWith('/admin')) return 'Admin'
  if (pathname.startsWith('/owner')) return 'Owner'
  if (pathname.startsWith('/staff')) return 'Staff'
  if (pathname === '/' || pathname === '/dashboard') return 'Home'
  return null
}
