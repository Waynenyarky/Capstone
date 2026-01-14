# Profile Edit Implementation - TODO List

## Phase 1: Security Foundations (Critical)

- [ ] **Session Invalidation**: Add tokenVersion field, JWT validation, increment on password change
- [ ] **Password Strength Validation**: Backend validation matching frontend rules (8+ chars, uppercase, lowercase, number, special char)
- [ ] **Password History**: Store last 5 password hashes, prevent reuse
- [ ] **Rate Limiting**: Apply to all new endpoints (verification, profile updates, password changes, ID uploads)
- [ ] **Account Lockout**: Track failed attempts, lock after 5 failures for 15 minutes
- [ ] **Input Sanitization**: Sanitize all user inputs (XSS prevention)
- [ ] **File Upload Validation**: Validate file type, size, content for ID uploads

## Phase 2: Core Features

- [ ] **Verification Service**: Unified OTP/MFA verification service with failure tracking
- [ ] **Business Owner Endpoints**: Email, password, name, ID, contact endpoints with verification
- [ ] **Staff Restrictions**: Middleware to restrict password/role/office/department for all 4 staff roles
- [ ] **Admin Approval Endpoints**: Admin profile edits with approval workflow
- [ ] **ID Upload System**: File upload endpoints with validation
- [ ] **MFA Re-enrollment**: Trigger re-enrollment on email/password changes

## Phase 3: User Experience

- [ ] **Email Change Grace Period**: 24-hour window to revert email changes
- [ ] **Confirmation Dialogs**: Frontend confirmations for critical actions
- [ ] **Better Error Messages**: Clear, actionable, secure error messages
- [ ] **Notification System**: Email notifications for critical changes and admin alerts

## Phase 4: Audit & Compliance

- [ ] **Audit History Endpoints**: User-facing audit history with export functionality
- [ ] **Enhanced Blockchain Logging**: All event types with async queue
- [ ] **Compliance Logging**: Track who views audit logs
- [ ] **Data Masking**: Mask sensitive data in audit logs

## Phase 5: Monitoring & Operations

- [x] **Structured Logging**: JSON format logs with correlation IDs
- [x] **Error Tracking**: Centralized error tracking and alerting
- [x] **Performance Monitoring**: Track API response times and database performance
- [x] **Security Monitoring**: Alert on suspicious activity

## Phase 6: Testing

- [x] **Unit Tests**: Field permissions, verification, password validation, lockout (covered in phase1-5 tests)
- [x] **Integration Tests**: End-to-end flows, role-based access, admin approvals (covered in phase6 tests)
- [x] **Security Tests**: SQL injection, XSS, CSRF, rate limiting, permission bypass (covered in phase6 tests)
- [x] **Performance Tests**: Load testing, stress testing (covered in phase6 tests)

## Phase 7: Documentation

- [ ] **API Documentation**: Swagger/OpenAPI specs
- [ ] **User Guides**: How-to guides for users and admins
- [ ] **Developer Docs**: Architecture, security, deployment guides

## Implementation Order Recommendation

1. **Week 1**: Security foundations (password validation, rate limiting, account lockout, input sanitization)
2. **Week 2**: Core verification service and Business Owner endpoints
3. **Week 3**: Staff restrictions and Admin approval workflows
4. **Week 4**: ID upload system and MFA re-enrollment
5. **Week 5**: User experience improvements (grace period, notifications, error handling)
6. **Week 6**: Audit history and enhanced blockchain logging
7. **Week 7**: Monitoring, logging, and testing
8. **Week 8**: Documentation and polish
