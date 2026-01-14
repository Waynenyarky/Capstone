# Plan Updates - Frontend & Integration Areas

## Summary
The original plan covers backend implementation well but needs significant expansion for frontend components, integration points, mobile app, and user experience polish.

## Phase 5: Frontend Implementation (EXPANDED)

### 5.1 Account Recovery UI (EXPANDED)

#### Business Owner Recovery
**Files to Modify:**
- `web/src/features/authentication/flows/PasswordResetFlow.jsx` - Enhance with suspicious activity warnings
- `web/src/features/authentication/components/ForgotPasswordForm.jsx` - Add IP tracking notice
- `web/src/features/authentication/components/ChangePasswordForm.jsx` - Add password strength indicator, history check

**New Components:**
- `web/src/features/authentication/components/RecoverySuspiciousActivityAlert.jsx` - Alert when suspicious activity detected
- `web/src/features/authentication/components/RecoveryLockoutBanner.jsx` - Show when account locked during recovery
- `web/src/features/authentication/components/PasswordStrengthIndicator.jsx` - Real-time password strength meter
- `web/src/features/authentication/components/MfaReenrollmentPrompt.jsx` - Prompt after password reset (already exists, enhance)

**Enhancements:**
- Show IP address of recovery request
- Display "Unusual location detected" warning
- Show countdown for account lockout
- Display recovery attempt history
- Success page with next steps (MFA re-enrollment)

#### Staff Recovery Request
**New Files:**
- `web/src/features/staffs/components/RecoveryRequestForm.jsx` - Form to request recovery from admin
- `web/src/features/staffs/components/RecoveryRequestStatus.jsx` - Status tracking component
- `web/src/features/staffs/components/TemporaryCredentialsLogin.jsx` - Special login for temp credentials
- `web/src/features/staffs/components/TempLoginMfaPrompt.jsx` - MFA setup prompt after temp login

**Integration:**
- Add "Request Password Recovery" button to Staff dashboard
- Add recovery request status to Staff profile settings
- Integrate with staff onboarding flow

#### Admin Recovery Management
**New Files:**
- `web/src/features/admin/components/RecoveryRequestsTable.jsx` - Table of pending requests
- `web/src/features/admin/components/RecoveryRequestDetail.jsx` - Detail view with user verification
- `web/src/features/admin/components/IssueTemporaryCredentialsModal.jsx` - Modal to issue credentials
- `web/src/features/admin/components/TemporaryCredentialsDisplay.jsx` - Display generated credentials
- `web/src/features/admin/components/RecoveryRequestFilters.jsx` - Filter by office, role, status

**Integration:**
- Add "Recovery Requests" tab to `AdminUsers.jsx`
- Add notification badge for pending requests
- Add quick actions (approve, deny, view details)
- Integrate with admin dashboard

### 5.2 Account Deletion UI (EXPANDED)

#### Business Owner Deletion
**Files to Modify:**
- `web/src/features/authentication/flows/DeleteAccountFlow.jsx` - Add legal acknowledgment step
- `web/src/features/authentication/components/ConfirmDeleteAccountForm.jsx` - Add checkbox, warning message
- `web/src/features/user/pages/ProfileSettings.jsx` - Enhance deletion section

**New Components:**
- `web/src/features/user/components/LegalAcknowledgmentCheckbox.jsx` - Reusable legal checkbox component
- `web/src/features/user/components/DeletionWarningMessage.jsx` - Role-specific warning messages
- `web/src/features/user/components/UndoDeletionBanner.jsx` - Banner to undo deletion
- `web/src/features/user/components/DeletionCountdown.jsx` - Countdown to scheduled deletion
- `web/src/features/user/components/DeletionScheduledInfo.jsx` - Info card showing deletion schedule

**Enhancements:**
- Multi-step deletion flow with confirmation
- Legal acknowledgment checkbox (required)
- Warning message display based on role
- Undo deletion button (within grace period)
- Email confirmation display

#### Staff Deletion Request
**New Files:**
- `web/src/features/staffs/components/RequestDeletionForm.jsx` - Staff deletion request form
- `web/src/features/staffs/components/DeletionRequestStatus.jsx` - Status tracking
- `web/src/features/staffs/components/DeletionRequestPending.jsx` - Pending state display

**Integration:**
- Add to Staff dashboard or profile settings
- Show pending request status
- Display admin response (if denied)

#### Admin Deletion Approval
**New Files:**
- `web/src/features/admin/components/DeletionRequestsTable.jsx` - Table of pending deletions
- `web/src/features/admin/components/DeletionRequestDetail.jsx` - Detail view with user info
- `web/src/features/admin/components/ApproveDeletionModal.jsx` - Approval/denial modal
- `web/src/features/admin/components/DenyDeletionModal.jsx` - Denial modal with reason
- `web/src/features/admin/components/HighPrivilegeTasksChecklist.jsx` - Checklist for admin review
- `web/src/features/admin/components/AdminDeletionApprovalFlow.jsx` - Admin-to-admin approval flow

**Integration:**
- Add "Deletion Requests" tab to `AdminUsers.jsx`
- Add notification badge for pending requests
- Add filters (role, office, status, date range)
- Add bulk actions (approve multiple, deny multiple)

### 5.3 Session Management UI (NEW SECTION)

**New Files:**
- `web/src/features/user/components/ActiveSessions.jsx` - Display all active sessions
- `web/src/features/user/components/SessionCard.jsx` - Individual session card
- `web/src/features/user/components/SessionTimeoutWarning.jsx` - Warning modal before timeout
- `web/src/features/user/components/InvalidateSessionsButton.jsx` - Button to invalidate all sessions
- `web/src/features/authentication/hooks/useSessionActivity.js` - Track user activity
- `web/src/features/authentication/hooks/useSessionTimeout.js` - Handle timeout logic
- `web/src/features/authentication/components/SessionActivityIndicator.jsx` - Show last activity time

**Features:**
- List all active sessions with:
  - IP address
  - Device/browser info
  - Last activity timestamp
  - Current session indicator
- Invalidate individual sessions
- Invalidate all sessions button
- Session timeout countdown (role-based: 1hr or 10min)
- Warning modal before timeout with "Stay Logged In" option
- Activity tracking (mouse movement, clicks, keyboard)

**Integration:**
- Add "Active Sessions" section to ProfileSettings
- Add session timeout warning to App layout
- Show session invalidation notifications

### 5.4 Suspicious Activity & Security Alerts (NEW SECTION)

**New Files:**
- `web/src/features/authentication/components/SuspiciousActivityAlert.jsx` - Alert banner
- `web/src/features/user/components/AccountLockedBanner.jsx` - Account locked banner
- `web/src/features/user/components/SecurityEventsTimeline.jsx` - Timeline of security events
- `web/src/features/admin/components/SecurityAlertsWidget.jsx` - Admin dashboard widget
- `web/src/features/admin/components/SecurityEventsTable.jsx` - Table of security events

**Features:**
- Alert when suspicious activity detected
- Account lockout notification with countdown
- Security events timeline
- Admin dashboard security alerts
- Email notification integration

**Integration:**
- Add to user dashboard/profile
- Add to admin dashboard
- Integrate with notification system

### 5.5 Password Change Enhancements (EXPANDED)

**Files to Modify:**
- `web/src/features/authentication/components/ChangePasswordForm.jsx` - Add strength indicator, history check
- `web/src/features/authentication/flows/LoggedInPasswordChangeFlow.jsx` - Add warnings

**New Components:**
- `web/src/features/authentication/components/PasswordStrengthIndicator.jsx` - Real-time strength meter
- `web/src/features/authentication/components/PasswordHistoryError.jsx` - Error for reused passwords
- `web/src/features/authentication/components/SessionInvalidationWarning.jsx` - Warning before change
- `web/src/features/authentication/components/PasswordChangeSuccess.jsx` - Success page with next steps

**Enhancements:**
- Real-time password strength indicator
- Password history validation (show error if reused)
- Session invalidation warning
- MFA re-enrollment prompt after change
- Success notification with clear next steps

### 5.6 Integration & Navigation (NEW SECTION)

**Files to Modify:**
- `web/src/features/user/pages/ProfileSettings.jsx` - Add recovery, deletion, session sections
- `web/src/features/admin/pages/AdminUsers.jsx` - Add recovery/deletion request tabs
- `web/src/features/authentication/components/AppSidebar.jsx` - Add navigation items
- `web/src/App.jsx` - Add routes for new pages

**New Routes:**
- `/profile/sessions` - Active sessions page
- `/profile/security` - Security settings page
- `/admin/recovery-requests` - Recovery requests page
- `/admin/deletion-requests` - Deletion requests page
- `/staff/recovery-request` - Staff recovery request page
- `/staff/deletion-request` - Staff deletion request page

**Navigation Updates:**
- Add "Security" section to user profile menu
- Add "Recovery Requests" to admin menu
- Add "Deletion Requests" to admin menu
- Add "Request Recovery" to staff menu

## Phase 6: Mobile App Implementation (NEW PHASE)

### 6.1 Mobile Recovery Flows
**Files to Create:**
- `mobile/app/lib/presentation/screens/recovery/staff_recovery_request_screen.dart`
- `mobile/app/lib/presentation/screens/recovery/temporary_credentials_login_screen.dart`
- `mobile/app/lib/presentation/screens/recovery/recovery_status_screen.dart`

### 6.2 Mobile Deletion Flows
**Files to Create:**
- `mobile/app/lib/presentation/screens/deletion/staff_deletion_request_screen.dart`
- `mobile/app/lib/presentation/screens/deletion/deletion_status_screen.dart`

### 6.3 Mobile Session Management
**Files to Modify:**
- `mobile/app/lib/presentation/widgets/session_timeout_manager.dart` - Enhance with backend sync
- `mobile/app/lib/presentation/screens/settings/sessions_screen.dart` - New screen

## Phase 7: Error Handling & User Experience (NEW PHASE)

### 7.1 Error Handling Components
**New Files:**
- `web/src/shared/components/ErrorBoundary.jsx` - Error boundary for recovery/deletion flows
- `web/src/shared/components/LoadingState.jsx` - Reusable loading component
- `web/src/shared/components/ErrorMessage.jsx` - Standardized error display
- `web/src/shared/components/NetworkError.jsx` - Network error handling

### 7.2 Form Validation
**Enhancements:**
- Client-side validation for all forms
- Real-time validation feedback
- Error message display
- Success state handling

### 7.3 Notifications & Feedback
**Enhancements:**
- Success notifications with clear next steps
- Error notifications with actionable messages
- Loading states for all async operations
- Optimistic UI updates where appropriate

## Phase 8: Testing (EXPANDED)

### 8.1 Frontend Unit Tests
**Files to Create:**
- `web/src/__tests__/features/staffs/recovery.test.jsx`
- `web/src/__tests__/features/admin/recovery-management.test.jsx`
- `web/src/__tests__/features/user/session-management.test.jsx`
- `web/src/__tests__/features/authentication/password-change.test.jsx`

### 8.2 Integration Tests
**Files to Create:**
- `web/src/__tests__/integration/recovery-flow.test.jsx`
- `web/src/__tests__/integration/deletion-flow.test.jsx`
- `web/src/__tests__/integration/session-timeout.test.jsx`

### 8.3 E2E Tests
**Files to Create:**
- `web/e2e/recovery-flows.spec.js`
- `web/e2e/deletion-flows.spec.js`
- `web/e2e/session-management.spec.js`

## Phase 9: Documentation (NEW PHASE)

### 9.1 User Documentation
- Recovery flow guide
- Deletion process guide
- Session management guide
- Security best practices

### 9.2 Admin Documentation
- Managing recovery requests
- Approving deletion requests
- Security monitoring guide

### 9.3 Developer Documentation
- API documentation (Swagger/OpenAPI)
- Component documentation
- Integration guide
