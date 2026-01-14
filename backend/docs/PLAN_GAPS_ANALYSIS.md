# Plan Gaps Analysis - Account Recovery, Deletion & Session Management

## Missing Frontend Components & Areas

### 1. Staff Recovery Request UI
**Status:** Mentioned but not detailed
**Missing:**
- `web/src/features/staffs/components/RecoveryRequestForm.jsx` - Form for staff to request password recovery
- Integration with staff dashboard/navigation
- Success/error handling UI
- Status tracking (pending/admin review/completed)

### 2. Admin Recovery Management Interface
**Status:** Partially mentioned
**Missing:**
- `web/src/features/admin/components/RecoveryRequestsTable.jsx` - Table showing pending staff recovery requests
- `web/src/features/admin/components/IssueTemporaryCredentialsModal.jsx` - Modal for issuing temp credentials
- `web/src/features/admin/components/RecoveryRequestDetail.jsx` - Detail view for reviewing recovery requests
- Integration with `AdminUsers.jsx` page (add new tab or section)
- Admin verification workflow UI (identity, role, office check)
- Temporary credentials display/export functionality

### 3. Staff Temporary Credentials Login
**Status:** Not mentioned
**Missing:**
- `web/src/features/authentication/components/TemporaryCredentialsLogin.jsx` - Special login form for temp credentials
- Detection logic to show temp login option vs regular login
- Forced MFA re-enrollment flow after temp login
- Password change requirement after temp login

### 4. Account Deletion UI Enhancements
**Status:** Basic flow exists, needs enhancement
**Missing:**
- Legal acknowledgment checkbox component (reusable)
- Warning message display component with role-specific messages
- Undo deletion UI component (`web/src/features/user/components/UndoDeletionBanner.jsx`)
- Deletion countdown timer component
- Role-specific deletion flows (Business Owner vs Staff vs Admin)

### 5. Staff Deletion Request UI
**Status:** Not mentioned
**Missing:**
- `web/src/features/staffs/components/RequestDeletionForm.jsx` - Staff deletion request form
- Legal acknowledgment for staff
- Request status tracking component
- Integration with staff dashboard

### 6. Admin Deletion Approval Interface
**Status:** Mentioned but not detailed
**Missing:**
- `web/src/features/admin/components/DeletionRequestsTable.jsx` - Table of pending deletion requests
- `web/src/features/admin/components/DeletionRequestDetail.jsx` - Detail view with user info, office, tasks
- `web/src/features/admin/components/ApproveDeletionModal.jsx` - Approval/denial modal with reason
- `web/src/features/admin/components/HighPrivilegeTasksChecklist.jsx` - Checklist for admin deletion review
- Integration with AdminUsers page
- Admin-to-Admin deletion approval workflow UI

### 7. Session Management UI
**Status:** Not mentioned
**Missing:**
- `web/src/features/user/components/ActiveSessions.jsx` - Display active sessions with IP, device, last activity
- `web/src/features/user/components/SessionTimeoutWarning.jsx` - Warning modal before timeout
- `web/src/features/authentication/hooks/useSessionActivity.js` - Hook to track user activity
- `web/src/features/authentication/hooks/useSessionTimeout.js` - Hook to handle timeout logic
- Session invalidation UI (show when sessions are invalidated)
- "Invalidate All Sessions" button in security settings
- Activity indicator showing last activity timestamp

### 8. Suspicious Activity Alerts
**Status:** Not mentioned
**Missing:**
- `web/src/features/authentication/components/SuspiciousActivityAlert.jsx` - Alert banner for detected suspicious activity
- `web/src/features/user/components/AccountLockedBanner.jsx` - Banner when account is temporarily locked
- Integration with existing `LockoutBanner.jsx`
- Admin dashboard widget for security alerts
- Notification system integration for security events

### 9. Password Change Enhancements
**Status:** Basic form exists, needs enhancement
**Missing:**
- Password strength indicator component (real-time)
- Password history validation error display
- "Last 5 passwords cannot be reused" error message
- Session invalidation warning before password change
- MFA re-enrollment prompt after password change
- Password change success notification with next steps

### 10. Integration Points
**Status:** Not detailed
**Missing:**
- How recovery flows integrate with `ProfileSettings.jsx` page
- How admin interfaces integrate with `AdminUsers.jsx` page
- How session management integrates with existing auth flows
- Routing updates for new pages/components
- Navigation menu updates (admin, staff, user sections)

### 11. Error Handling & User Feedback
**Status:** Not mentioned
**Missing:**
- Error message components for recovery failures
- Loading states for all async operations
- Success notifications with clear next steps
- Form validation error displays
- Network error handling
- Rate limit error handling
- Account lockout error messages

### 12. Mobile App Implementation
**Status:** Not mentioned at all
**Missing:**
- Mobile app equivalents for all web components
- Mobile-specific UI/UX considerations
- Mobile session timeout handling
- Mobile recovery flows

### 13. Accessibility & Responsive Design
**Status:** Not mentioned
**Missing:**
- ARIA labels for all new components
- Keyboard navigation support
- Screen reader compatibility
- Mobile-responsive layouts
- Touch-friendly interactions

### 14. Testing Requirements
**Status:** Basic testing mentioned
**Missing:**
- Frontend unit tests for all new components
- Integration tests for UI flows
- E2E tests for critical paths
- Accessibility tests
- Responsive design tests

## Additional Backend Gaps

### 1. API Endpoints Missing Details
- Rate limiting configuration per endpoint
- Request/response schemas documentation
- Error response format standardization
- Pagination for list endpoints (recovery requests, deletion requests)

### 2. Email Templates
**Status:** Mentioned but not detailed
**Missing:**
- Template designs for all email types
- Email content for each role-specific scenario
- HTML email templates with branding

### 3. Background Jobs
**Status:** Not mentioned
**Missing:**
- Scheduled job to finalize account deletions after grace period
- Scheduled job to expire temporary credentials
- Scheduled job to clean up old sessions
- Scheduled job to send deletion reminders

### 4. Admin Dashboard API
**Status:** Not mentioned
**Missing:**
- Endpoint to get recovery request statistics
- Endpoint to get deletion request statistics
- Endpoint to get security event summary
- Endpoint to get active sessions count

## Recommended Additions to Plan

### Phase 5.5: Frontend Integration & Polish
- Integrate all new components with existing pages
- Add navigation menu items
- Implement error boundaries
- Add loading skeletons
- Implement optimistic UI updates where appropriate

### Phase 6.5: Mobile App Implementation
- Port all web components to mobile
- Implement mobile-specific flows
- Handle mobile session management

### Phase 7: Documentation & User Guides
- User-facing documentation for recovery flows
- Admin guide for managing recoveries/deletions
- Developer documentation for new APIs
- API documentation (Swagger/OpenAPI)

### Phase 8: Monitoring & Analytics
- Track recovery success rates
- Track deletion request patterns
- Monitor suspicious activity patterns
- Admin dashboard analytics
