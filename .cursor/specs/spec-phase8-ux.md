# Phase 8: UI/UX Polish & Cross-Cutting Concerns

## Overview
Conduct a full form audit across all web pages, fix button/label/layout/spacing/validation consistency, improve error handling, add loading states, verify responsive design, and ensure the notification system works end-to-end.

## Prerequisites
All previous phases complete.

## Reference
See `docs/ux-general-tab-critique.md` for the original UX critique.

---

## 8-1. Form Consistency Audit

### Audit every form in the application for:

| Check | Standard |
|---|---|
| **Primary action button** | Ant Design `Button` with `type="primary"`, blue color, right-aligned |
| **Cancel/Back button** | `Button` with `type="default"`, left of primary, or `type="link"` if navigating back |
| **Destructive actions** | `Button` with `danger` prop, always with `Popconfirm` or `Modal.confirm` |
| **Button text** | Verb phrases: "Submit Application", "Save Changes", "Delete Business" — NOT just "Submit" or "OK" |
| **Form labels** | Sentence case, no colon suffix, consistent font size |
| **Required indicator** | Red asterisk via Ant Design's `rules: [{ required: true }]` |
| **Validation messages** | Descriptive: "Please enter your email address" not "Required" |
| **Field spacing** | Ant Design default `marginBottom: 24px` on `Form.Item` |
| **Section headers** | `Typography.Title level={4}` for sections within forms |
| **Help text** | `Form.Item tooltip` or `extra` prop, not inline text blocks |

### Forms to audit:

#### Authentication Forms
| Form | File | Status |
|---|---|---|
| Login | `web/src/features/authentication/components/LoginForm.jsx` | Audit |
| Sign Up | `web/src/features/authentication/components/UserSignUpForm.jsx` | Audit |
| Forgot Password | `web/src/features/authentication/components/ForgotPasswordForm.jsx` | Audit |
| Change Password | `web/src/features/authentication/components/ChangePasswordForm.jsx` | Audit |
| Change Email | `web/src/features/authentication/components/ChangeEmailForm.jsx` | Audit |
| MFA Setup | `web/src/features/authentication/components/MfaSetup.jsx` | Audit |
| Delete Account | `web/src/features/authentication/components/ConfirmDeleteAccountForm.jsx` | Audit |

#### Business Owner Forms
| Form | File | Status |
|---|---|---|
| Add Business | `web/src/features/business-owner/components/AddBusinessForm.jsx` | Audit |
| Dynamic Form | `web/src/features/business-owner/components/DynamicFormRenderer.jsx` | Audit |
| Retirement Modal | New in Phase 2 | Verify |
| Edit Request Drawer | New in Phase 2 | Verify |
| Appeal Drawer | New in Phase 2 | Verify |
| Renewal Drawer | New in Phase 2 | Verify |

#### Admin Forms
| Form | File | Status |
|---|---|---|
| Fee Configuration | `web/src/features/admin/pages/feeConfiguration/` | Audit |
| Form Definition Editor | `web/src/features/admin/pages/AdminFormDefinitionEditor.jsx` | Audit |
| User Management Modals | `web/src/features/admin/pages/users/` (Create/Edit/Reset/Disable) | Audit |
| Announcements Modal | New in Phase 4 | Verify |
| Maintenance Modal | `web/src/features/admin/pages/maintenance/RequestMaintenanceModal.jsx` | Audit |

#### Staff Forms
| Form | File | Status |
|---|---|---|
| Application Review | `web/src/features/staffs/lgu-officer/components/ApplicationDetailPanel.jsx` | Audit |
| Walk-In Flow | New in Phase 1 | Verify |
| Inspection Assign | `InspectionManagementPage.jsx` modal | Audit |
| Cessation Review | `CessationReviewPage.jsx` | Audit |
| Appeals Review | `StaffAppealsPage.jsx` | Audit |

---

## 8-2. Page Header Consistency

Every page should have a consistent header using `LayoutPageHeader`:

```jsx
<LayoutPageHeader
  title="Page Title"
  subtitle="Optional description"
  extra={<Button type="primary">Action</Button>}
/>
```

### Pages to check:
- All admin pages
- All staff pages
- All LGU manager pages
- Business owner dashboard (uses its own layout)

### Standard:
| Element | Rule |
|---|---|
| Title | `Typography.Title level={3}` |
| Subtitle | `Typography.Text type="secondary"` |
| Action buttons | Right-aligned, max 2-3 |
| Breadcrumb | Optional, use for deep pages (e.g., form definition editor) |

---

## 8-3. Loading States

Every page and component that fetches data must have:

1. **Initial load**: Skeleton or Spin indicator (Ant Design `Skeleton` or `Spin`)
2. **Action loading**: Button loading state (`loading` prop on Button)
3. **Refresh**: Subtle indicator (not full-page spinner)

### Pages to verify:
- [ ] AdminDashboard — KPI cards show skeleton during load
- [ ] BusinessOwnerDashboard — business list shows skeleton
- [ ] PermitReviewPage — table shows skeleton
- [ ] All LGU Manager pages — tables show skeleton
- [ ] Finance tabs — cards and tables show skeleton
- [ ] NotificationHistoryPage — list shows skeleton
- [ ] ApprovedBusinessView — each tab shows skeleton for its data

### Button loading states:
- Submit buttons show `loading={true}` during API call
- Prevent double-click with `disabled` during loading
- Restore on success or error

---

## 8-4. Error Handling

### Global error boundary:
Verify `ErrorBoundary` component exists and wraps the app in `App.jsx` or `main.jsx`.

### API error handling pattern:
Every API call should:
1. Show error via Ant Design `message.error()` or `notification.error()`
2. Log to console for debugging
3. NOT show raw error messages to users — sanitize backend error codes to user-friendly text

### Error message mapping:
```javascript
const ERROR_MESSAGES = {
  'captcha_failed': 'Please complete the security check',
  'weak_password': 'Password does not meet strength requirements',
  'open_violations': 'Cannot proceed — there are unresolved violations',
  'step_up_required': 'Additional verification required',
  'not_found': 'The requested resource was not found',
  'forbidden': 'You do not have permission for this action',
  // ... add for all error codes
}
```

---

## 8-5. Responsive Design

### Breakpoints (Ant Design standard):
| Breakpoint | Width | Behavior |
|---|---|---|
| xs | < 576px | Stack everything vertically |
| sm | ≥ 576px | Small tablets |
| md | ≥ 768px | Tablets |
| lg | ≥ 992px | Small desktops |
| xl | ≥ 1200px | Full desktop |

### Key pages to verify responsive:
- [ ] Login/Signup — should look good on mobile
- [ ] Business Owner Dashboard — left panel collapses to drawer on mobile
- [ ] Admin Dashboard — KPI cards stack on mobile
- [ ] PermitReviewPage — table scrolls horizontally on mobile
- [ ] Finance tabs — cards stack, tables scroll
- [ ] Notification page — collapses to single column

### Mobile sidebar behavior:
- On screens < 768px: sidebar collapses to a hamburger menu
- Drawer opens from left on tap
- Verify `Sidebar.jsx` handles this correctly

---

## 8-6. Empty States

Every list/table page should show a meaningful empty state:

```jsx
<Empty
  image={Empty.PRESENTED_IMAGE_SIMPLE}
  description="No businesses registered yet"
>
  <Button type="primary" onClick={onAdd}>Add Your First Business</Button>
</Empty>
```

### Pages to verify:
- [ ] Business list (no businesses)
- [ ] Application list (no applications)
- [ ] Inspection list (no inspections)
- [ ] Violation list (no violations)
- [ ] Payment history (no payments)
- [ ] Notification list (no notifications)
- [ ] Appeal list (no appeals)

---

## 8-7. Notification Badge Verification

### Header/Sidebar notification indicator:
- Shows unread count from `GET /api/notifications/unread-count`
- Updates in real-time via SSE
- Clicking opens notification page or dropdown
- Badge disappears when all are read

### Verify for each role:
- [ ] Admin — notification indicator visible
- [ ] Business Owner — notification indicator visible
- [ ] LGU Officer — notification indicator visible
- [ ] LGU Manager — notification indicator visible
- [ ] Inspector — notification indicator visible

---

## 8-8. Accessibility Basics

| Check | Standard |
|---|---|
| Color contrast | WCAG AA (4.5:1 for text, 3:1 for large text) |
| Focus indicators | Visible focus ring on all interactive elements |
| Alt text | All images have descriptive alt text |
| Form labels | Every input has a `<label>` or `aria-label` |
| Keyboard navigation | Tab order is logical, no keyboard traps |
| Screen reader | Status changes announce via `aria-live` |

---

## Edge Cases
- Forms with dynamic fields (DynamicFormRenderer) need special attention for validation consistency
- Ant Design theme customization may override default spacing
- SSE notification badge must handle reconnection without showing stale counts
- Responsive testing should include actual device testing, not just browser resize

## Acceptance Criteria
1. All forms follow the consistent button/label/validation standard
2. Every page has proper loading states
3. No raw error messages shown to users
4. All pages responsive down to 576px width
5. All list pages have meaningful empty states
6. Notification badge works for all roles in real-time
7. Keyboard navigation works on all forms
8. Visual audit passes: no orphaned headers, misaligned buttons, or inconsistent spacing

## Rollback Plan
UX changes are incremental. Each form fix can be reverted independently. Use git stash or feature branch for the audit.
