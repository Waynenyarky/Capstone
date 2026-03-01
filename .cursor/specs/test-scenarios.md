# BizClear — Comprehensive Test Scenarios

> **Generated:** 2026-03-01
> **Scope:** Web app, Mobile app (Flutter/Inspector), Backend (4 services)
> **Format:** Each scenario has an ID, description, expected behavior, and error/edge-case variants.

---

## Table of Contents

1. [Authentication — Public (Web)](#1-authentication--public-web)
2. [Authentication — MFA & Passkeys (Web)](#2-authentication--mfa--passkeys-web)
3. [Password Recovery (Web)](#3-password-recovery-web)
4. [Business Owner Flows (Web)](#4-business-owner-flows-web)
5. [Staff / LGU Officer Flows (Web)](#5-staff--lgu-officer-flows-web)
6. [Inspector Flows (Mobile — Flutter)](#6-inspector-flows-mobile--flutter)
7. [LGU Manager Flows (Web)](#7-lgu-manager-flows-web)
8. [Admin Flows (Web)](#8-admin-flows-web)
9. [Common User Flows — All Roles (Web)](#9-common-user-flows--all-roles-web)
10. [Session & Security (Web + Mobile)](#10-session--security-web--mobile)
11. [Notifications (Web + Mobile)](#11-notifications-web--mobile)
12. [Cross-Cutting / UI (Web)](#12-cross-cutting--ui-web)
13. [Mobile Web Views — Per-Page Testing](#13-mobile-web-views--per-page-testing-web-at--768px)
14. [API Error & Edge Cases (Backend)](#14-api-error--edge-cases-backend)
15. [End-to-End Cross-Role Workflows](#15-end-to-end-cross-role-workflows)
16. [Cron Jobs & Scheduled Tasks](#16-cron-jobs--scheduled-tasks)
17. [Infrastructure — IPFS, Blockchain & SSE](#17-infrastructure--ipfs-blockchain--sse)
18. [Dual-Approval Workflows](#18-dual-approval-workflows)
19. [Fee & Penalty Calculation](#19-fee--penalty-calculation)
20. [File Upload, Scanning & Export](#20-file-upload-scanning--export)
21. [Pagination, Search & URL Parameters](#21-pagination-search--url-parameters)
22. [Accessibility & Browser Compatibility](#22-accessibility--browser-compatibility)
23. [Multi-Tab & Concurrency](#23-multi-tab--concurrency)
24. [DevTools & Dev-Only Features](#24-devtools--dev-only-features)
25. [Link Existing Account](#25-link-existing-account)
26. [Renewal Full Lifecycle](#26-renewal-full-lifecycle)
27. [Walk-In Full Lifecycle](#27-walk-in-full-lifecycle)
28. [Email Delivery](#28-email-delivery)
29. [Security Hardening (OWASP-Aligned)](#29-security-hardening-owasp-aligned)
30. [Philippine Address (PSGC) Integration](#30-philippine-address-psgc-integration)
31. [AI Recommendation Service (Detailed)](#31-ai-recommendation-service-detailed)
32. [Input Validation & Boundary Values](#32-input-validation--boundary-values)
33. [Sorting & Filtering on Tables](#33-sorting--filtering-on-tables)
34. [Health Monitoring (Admin)](#34-health-monitoring-admin)
35. [Maintenance Mode (Detailed)](#35-maintenance-mode-detailed)
36. [Announcements Visibility](#36-announcements-visibility)
37. [Logout & Session Cleanup](#37-logout--session-cleanup)
38. [Mobile Hardware Interactions (Flutter)](#38-mobile-hardware-interactions-flutter-app)
39. [Error Message Consistency](#39-error-message-consistency)

---

## Legend

| Symbol | Meaning |
|--------|---------|
| ✅ | Happy path (expected success) |
| ❌ | Error/failure scenario |
| ⚠️ | Edge case or boundary condition |
| 🔄 | State transition / multi-step flow |
| 📱 | Mobile-specific |
| 🖥️ | Web-specific |

---

## 1. Authentication — Public (Web)

### 1.1 Sign Up

| ID | Scenario | Steps | Expected Behavior |
|----|----------|-------|-------------------|
| AUTH-SU-01 ✅ | Successful sign-up | 1. Navigate to `/sign-up` 2. Fill valid first name, last name, email, phone, password 3. Submit | OTP sent to email, redirected to verification form |
| AUTH-SU-02 ❌ | Sign up with existing email | 1. Navigate to `/sign-up` 2. Enter email already in DB 3. Submit | Error: "Email already registered" or similar |
| AUTH-SU-03 ❌ | Sign up with weak password | 1. Navigate to `/sign-up` 2. Enter password < 8 chars, no special chars 3. Submit | Password strength indicator shows weak; form validation prevents submit |
| AUTH-SU-04 ❌ | Sign up with invalid email format | 1. Enter "notanemail" in email field 2. Submit | Client-side validation error on email field |
| AUTH-SU-05 ❌ | Sign up with empty required fields | 1. Leave all fields blank 2. Click submit | Each required field shows validation error |
| AUTH-SU-06 ❌ | Sign up with invalid phone format | 1. Enter non-numeric or too-short phone 2. Submit | Validation error on phone number |
| AUTH-SU-07 ⚠️ | Sign up with XSS in name fields | 1. Enter `<script>alert('xss')</script>` in first name 2. Submit | Input sanitized or rejected; no script execution |
| AUTH-SU-08 ⚠️ | Sign up with SQL injection attempt | 1. Enter `'; DROP TABLE users; --` in email 2. Submit | Request rejected; no database impact |
| AUTH-SU-09 🔄 | Sign up → verify OTP → complete | 1. Complete sign-up form 2. Receive OTP 3. Enter correct OTP | Account created, redirected to MFA setup or login |
| AUTH-SU-10 ❌ | Sign up → enter wrong OTP | 1. Complete sign-up 2. Enter incorrect OTP | Error: "Invalid verification code" |
| AUTH-SU-11 ❌ | Sign up → OTP expired | 1. Complete sign-up 2. Wait for OTP to expire 3. Enter OTP | Error: "Code expired" with resend option |
| AUTH-SU-12 🔄 | Sign up → resend OTP | 1. Complete sign-up 2. Click "Resend code" | New OTP sent; cooldown timer appears |
| AUTH-SU-13 ⚠️ | Sign up → spam resend OTP | 1. Click "Resend" rapidly multiple times | Rate limit: button disabled during cooldown, backend returns 429 |
| AUTH-SU-14 ⚠️ | Password with maximum length | 1. Enter 128+ character password | Either accepted or truncated with clear feedback |
| AUTH-SU-15 ⚠️ | Sign up with unicode/emoji in name | 1. Enter "José 🎉" as first name | Accepted or clearly rejected; no crash |

### 1.2 Login

| ID | Scenario | Steps | Expected Behavior |
|----|----------|-------|-------------------|
| AUTH-LI-01 ✅ | Successful login (no MFA) | 1. Navigate to `/login` 2. Enter valid email + password 3. Submit | OTP sent for verification → verify → redirect to role dashboard |
| AUTH-LI-02 ❌ | Login with wrong password | 1. Enter valid email + wrong password 2. Submit | Error: "Invalid credentials" (no info leakage about which field is wrong) |
| AUTH-LI-03 ❌ | Login with non-existent email | 1. Enter unregistered email 2. Submit | Same error as wrong password (prevents enumeration) |
| AUTH-LI-04 ❌ | Login with empty fields | 1. Leave email/password blank 2. Submit | Validation errors on required fields |
| AUTH-LI-05 ⚠️ | Login → account locked after N failures | 1. Enter wrong password 5+ times | Account temporarily locked; lockout banner displayed |
| AUTH-LI-06 ✅ | Login with "Remember me" | 1. Check "Remember me" 2. Login successfully 3. Close browser 4. Reopen | Session persists (longer TTL or cookie) |
| AUTH-LI-07 🔄 | Login → OTP verification → success | 1. Login 2. Enter correct OTP | Redirected to role dashboard |
| AUTH-LI-08 ❌ | Login → wrong OTP | 1. Login 2. Enter incorrect OTP | Error: "Invalid code" |
| AUTH-LI-09 🔄 | Login → resend OTP | 1. Login 2. Click "Resend" | New OTP sent, cooldown timer |
| AUTH-LI-10 ✅ | Login → redirect by role (admin) | 1. Login as admin | Redirected to `/admin/dashboard` |
| AUTH-LI-11 ✅ | Login → redirect by role (business_owner) | 1. Login as business owner | Redirected to `/owner` |
| AUTH-LI-12 ✅ | Login → redirect by role (staff/lgu_officer) | 1. Login as staff | Redirected to `/staff` |
| AUTH-LI-13 ✅ | Login → redirect by role (lgu_manager) | 1. Login as LGU manager | Redirected to `/lgu-manager` |
| AUTH-LI-14 ⚠️ | Login during maintenance mode (non-admin) | 1. Admin enables maintenance 2. Non-admin tries to login | Redirected to `/maintenance` page |
| AUTH-LI-15 ✅ | Login during maintenance mode (admin) | 1. Admin enables maintenance 2. Admin logs in | Allowed through; can access admin panel |
| AUTH-LI-16 ⚠️ | Login with CAPTCHA (Turnstile) | 1. Navigate to login 2. CAPTCHA widget loads 3. Complete CAPTCHA 4. Submit | CAPTCHA token sent with request; login proceeds |
| AUTH-LI-17 ❌ | Login without completing CAPTCHA | 1. Block CAPTCHA 2. Submit form | Error: CAPTCHA required |
| AUTH-LI-18 ⚠️ | Logged-in user visits `/login` | 1. Already logged in 2. Navigate to `/login` | Redirected to role dashboard (PublicRoute guard) |

### 1.3 Google OAuth Login

| ID | Scenario | Steps | Expected Behavior |
|----|----------|-------|-------------------|
| AUTH-GO-01 ✅ | Google login success | 1. Click "Sign in with Google" 2. Complete Google auth | Account linked/created, redirected to dashboard |
| AUTH-GO-02 ❌ | Google login → popup blocked | 1. Browser blocks popup | Error message: "Please allow popups" |
| AUTH-GO-03 ⚠️ | Google login → email already exists (password account) | 1. Google auth with email that has password account | Prompted to link accounts or error with guidance |

---

## 2. Authentication — MFA & Passkeys (Web)

### 2.1 MFA (TOTP) Setup

| ID | Scenario | Steps | Expected Behavior |
|----|----------|-------|-------------------|
| MFA-SU-01 ✅ | Setup TOTP from profile | 1. Go to `/settings-profile` → Security tab 2. Click "Set up authenticator" 3. Scan QR code 4. Enter TOTP code | MFA enabled; success message |
| MFA-SU-02 ❌ | Enter wrong TOTP during setup | 1. Start MFA setup 2. Enter incorrect TOTP code | Error: "Invalid code" |
| MFA-SU-03 ⚠️ | Setup MFA → QR code display | 1. Start MFA setup | QR code and manual key both displayed |
| MFA-SU-04 🔄 | Sign-up → mandatory MFA setup | 1. Complete sign-up 2. Redirected to `/signup/mfa-setup` 3. Complete TOTP setup | MFA enabled; redirected to dashboard |
| MFA-SU-05 ⚠️ | Skip MFA setup (if allowed) | 1. On MFA setup page 2. Try to navigate away | Either blocked (mandatory) or warned |

### 2.2 MFA Login

| ID | Scenario | Steps | Expected Behavior |
|----|----------|-------|-------------------|
| MFA-LI-01 ✅ | Login with TOTP | 1. Login 2. Prompted for TOTP 3. Enter correct TOTP | Login complete |
| MFA-LI-02 ❌ | Login with wrong TOTP | 1. Login 2. Enter wrong TOTP | Error: "Invalid authenticator code" |
| MFA-LI-03 ⚠️ | Login with expired TOTP (time-window edge) | 1. Enter TOTP at exact 30s boundary | May accept current or previous window |

### 2.3 MFA Disable

| ID | Scenario | Steps | Expected Behavior |
|----|----------|-------|-------------------|
| MFA-DI-01 🔄 | Disable MFA | 1. Go to Security settings 2. Click "Disable MFA" 3. Confirm with code | MFA disabled; notification sent |
| MFA-DI-02 ❌ | Disable MFA with wrong code | 1. Start disable 2. Enter wrong code | Error: "Invalid code" |
| MFA-DI-03 🔄 | Request disable → undo disable | 1. Request MFA disable 2. Before grace period ends, click "Undo" | MFA remains enabled |

### 2.4 Passkeys (WebAuthn)

| ID | Scenario | Steps | Expected Behavior |
|----|----------|-------|-------------------|
| PK-01 ✅ | Register passkey | 1. Go to Security settings 2. Click "Add passkey" 3. Complete biometric/security key prompt | Passkey registered; listed in passkey list |
| PK-02 ✅ | Login with passkey | 1. On login page 2. Click "Sign in with passkey" 3. Complete biometric prompt | Login success; redirected to dashboard |
| PK-03 ❌ | Passkey registration cancelled | 1. Start passkey registration 2. Cancel biometric prompt | Error handled gracefully; can retry |
| PK-04 ❌ | Login with passkey → user cancels prompt | 1. Click "Sign in with passkey" 2. Cancel biometric | Returns to login form; no crash |
| PK-05 🔄 | Cross-device passkey auth | 1. Navigate to `/auth/passkey-mobile` 2. Scan QR on phone 3. Complete auth on phone | Login on desktop completes |
| PK-06 ⚠️ | Delete passkey | 1. Go to Security settings 2. Remove a passkey | Passkey removed; if last passkey, warned about fallback |
| PK-07 ⚠️ | Register passkey on unsupported browser | 1. Use old browser without WebAuthn | Passkey option hidden or error message |

---

## 3. Password Recovery (Web)

| ID | Scenario | Steps | Expected Behavior |
|----|----------|-------|-------------------|
| PW-01 ✅ | Forgot password → reset success | 1. Navigate to `/forgot-password` 2. Enter email 3. Receive code 4. Enter code 5. Set new password | Password updated; can login with new password |
| PW-02 ❌ | Forgot password → wrong email | 1. Enter non-existent email | Generic message: "If account exists, code was sent" (no enumeration) |
| PW-03 ❌ | Forgot password → wrong code | 1. Enter incorrect reset code | Error: "Invalid or expired code" |
| PW-04 ❌ | Forgot password → weak new password | 1. Enter valid code 2. Enter weak password | Password strength validation error |
| PW-05 ⚠️ | Forgot password → rate limit | 1. Request reset codes rapidly | Rate limited after N attempts |
| PW-06 ❌ | Forgot password → expired code | 1. Wait for code to expire 2. Enter code | Error: "Code expired" |
| PW-07 ⚠️ | Forgot password for staff account | 1. Staff enters email in forgot password | Alert: "Staff accounts must contact admin" or similar |
| PW-08 🔄 | Forgot password → resend code | 1. Click "Resend code" | New code sent; cooldown timer |

---

## 4. Business Owner Flows (Web)

### 4.1 Dashboard

| ID | Scenario | Steps | Expected Behavior |
|----|----------|-------|-------------------|
| BO-DA-01 ✅ | Load dashboard | 1. Login as business owner 2. Navigate to `/owner` | Dashboard loads with business list, stats, notifications |
| BO-DA-02 ✅ | View business list | 1. On dashboard | All registered businesses displayed as cards |
| BO-DA-03 ✅ | Select business → detail panel | 1. Click on a business card | Detail panel slides open with business info, status, actions |
| BO-DA-04 ⚠️ | Dashboard with no businesses | 1. Login as new business owner with 0 businesses | Empty state: "No businesses yet" with "Add Business" CTA |
| BO-DA-05 ⚠️ | Dashboard with many businesses | 1. Owner with 20+ businesses | Pagination or scrollable list; no performance degradation |

### 4.2 Add Business (Registration)

| ID | Scenario | Steps | Expected Behavior |
|----|----------|-------|-------------------|
| BO-AB-01 ✅ | Add business — full flow | 1. Click "Add Business" 2. Fill business info (name, type, address, LOB) 3. Upload documents 4. Submit | Application submitted; status "pending" |
| BO-AB-02 ✅ | Dynamic form rendering | 1. Select form type 2. Dynamic fields render based on FormDefinition | All required fields appear per definition |
| BO-AB-03 ❌ | Submit with missing required fields | 1. Leave required fields blank 2. Submit | Validation errors highlight missing fields |
| BO-AB-04 ❌ | Upload invalid document type | 1. Try uploading .exe file | Error: "Invalid file type" |
| BO-AB-05 ❌ | Upload oversized document | 1. Try uploading file > size limit | Error: "File too large" |
| BO-AB-06 ⚠️ | Upload document → IPFS storage | 1. Upload valid document | Document stored to IPFS; CID returned and saved |
| BO-AB-07 ⚠️ | AI LOB recommendation | 1. Enter business description 2. Click "Get Recommendation" | AI suggests line of business; user can accept or override |
| BO-AB-08 ❌ | AI LOB recommendation → service down | 1. AI service unavailable 2. Click "Get Recommendation" | Graceful fallback: manual selection still works |
| BO-AB-09 ⚠️ | Add business with special characters in name | 1. Enter "José's Café & Bar" | Accepted; displayed correctly |
| BO-AB-10 🔄 | Add business → fee preview | 1. After selecting LOB 2. View fee estimate | Fee preview calculated correctly based on FeeConfiguration |
| BO-AB-11 ⚠️ | Add business wizard — navigate back | 1. Reach step 3 2. Click "Back" | Returns to step 2; data preserved |
| BO-AB-12 ⚠️ | Add business wizard — browser refresh mid-flow | 1. On step 2 2. Refresh browser | Either data lost (with warning) or persisted via local storage |

### 4.3 Business Profile & PIS

| ID | Scenario | Steps | Expected Behavior |
|----|----------|-------|-------------------|
| BO-PR-01 ✅ | View business profile | 1. Select business 2. View profile section | Business details, address, LOB displayed |
| BO-PR-02 🔄 | Update PIS (Personal Information Sheet) | 1. Edit PIS fields 2. Save | Profile updated; audit log created |
| BO-PR-03 ❌ | PIS update with invalid data | 1. Enter invalid phone 2. Save | Validation error |
| BO-PR-04 ✅ | Upload owner ID | 1. Go to profile 2. Upload valid ID document | ID uploaded and stored |
| BO-PR-05 ⚠️ | Upload owner ID → wrong format | 1. Upload non-image file | Error: "Please upload an image" |

### 4.4 Permits

| ID | Scenario | Steps | Expected Behavior |
|----|----------|-------|-------------------|
| BO-PM-01 ✅ | View general permits list | 1. Navigate to permits section | List of general permits with status |
| BO-PM-02 ✅ | Apply for general permit | 1. Click "Apply" 2. Fill form 3. Submit | Application submitted; status "pending" |
| BO-PM-03 ✅ | View occupational permits | 1. Navigate to occupational permits | List of occupational permits |
| BO-PM-04 ⚠️ | Apply for permit → form validation | 1. Leave required permit fields blank | Validation errors shown |
| BO-PM-05 ⚠️ | View approved permit details | 1. Click on approved permit | Full details shown: permit number, validity, conditions |
| BO-PM-06 ⚠️ | Download permit requirements PDF | 1. Click "Download Requirements" | PDF generated and downloaded |

### 4.5 Business Renewal

| ID | Scenario | Steps | Expected Behavior |
|----|----------|-------|-------------------|
| BO-RN-01 ✅ | Initiate renewal | 1. Select renewable business 2. Click "Renew" 3. Review and update info 4. Submit | Renewal application submitted |
| BO-RN-02 ⚠️ | Renewal alert on dashboard | 1. Business approaching renewal deadline | Alert/badge shown on dashboard |
| BO-RN-03 ❌ | Renew business not eligible | 1. Try renewing business that's not yet eligible | Error or disabled "Renew" button with explanation |

### 4.6 Retirement / Cessation

| ID | Scenario | Steps | Expected Behavior |
|----|----------|-------|-------------------|
| BO-RT-01 ✅ | Request business retirement | 1. Select business 2. Click "Retire/Cease" 3. Fill cessation form 4. Submit | Retirement request submitted for review |
| BO-RT-02 ❌ | Retire business with pending obligations | 1. Business has unpaid fees 2. Try to retire | Warning: "Clear outstanding obligations first" |
| BO-RT-03 ⚠️ | Retirement confirmation flow | 1. Submit retirement 2. Verify with OTP/code | Retirement confirmed |
| BO-RT-04 ⚠️ | View retirement request status | 1. After submitting 2. View in dashboard | Status visible: "Pending review" / "Approved" / "Rejected" |

### 4.7 Appeals

| ID | Scenario | Steps | Expected Behavior |
|----|----------|-------|-------------------|
| BO-AP-01 ✅ | Submit appeal | 1. Navigate to appeals 2. Click "New Appeal" 3. Select decision to appeal 4. Provide justification 5. Upload documents 6. Submit | Appeal submitted; status "pending" |
| BO-AP-02 ❌ | Submit appeal without justification | 1. Leave justification blank 2. Submit | Validation: "Justification required" |
| BO-AP-03 ✅ | View appeal status | 1. Navigate to appeals list | All appeals with current status visible |
| BO-AP-04 ⚠️ | Appeal rejected → view reason | 1. View rejected appeal | Rejection reason displayed |
| BO-AP-05 ⚠️ | Appeal with large file upload | 1. Upload 10MB+ supporting document | Either accepted within limit or clear size error |

### 4.8 Edit Requests

| ID | Scenario | Steps | Expected Behavior |
|----|----------|-------|-------------------|
| BO-ER-01 ✅ | Submit edit request | 1. Click "Request Edit" 2. Specify fields to change 3. Provide new values 4. Submit | Edit request created; status "pending" |
| BO-ER-02 ❌ | Edit request with no changes | 1. Submit edit request with identical values | Error: "No changes detected" |
| BO-ER-03 ✅ | View edit request status | 1. View edit requests list | All requests with status |

### 4.9 Payments

| ID | Scenario | Steps | Expected Behavior |
|----|----------|-------|-------------------|
| BO-PY-01 ✅ | View pending payments | 1. Navigate to payments | List of pending payments with amounts |
| BO-PY-02 ✅ | Initiate payment | 1. Select payment 2. Click "Pay" 3. Complete payment flow | Payment recorded; receipt generated |
| BO-PY-03 ✅ | View payment history | 1. Navigate to payment history | Past payments listed with dates, amounts |
| BO-PY-04 ❌ | Cancel pending payment | 1. Select pending payment 2. Click "Cancel" | Payment cancelled; confirmation message |
| BO-PY-05 ⚠️ | Payment with penalty (late) | 1. Payment past due date | Penalty amount added to total; penalty breakdown shown |
| BO-PY-06 ⚠️ | Double payment attempt | 1. Try to pay same payment twice | Second attempt blocked: "Already paid" |

### 4.10 Violations & Inspections (Owner View)

| ID | Scenario | Steps | Expected Behavior |
|----|----------|-------|-------------------|
| BO-VI-01 ✅ | View violations list | 1. Navigate to violations | All violations with status, severity |
| BO-VI-02 ✅ | View open violations | 1. Filter for open violations | Only open violations shown |
| BO-VI-03 ✅ | Acknowledge violation | 1. Select violation 2. Click "Acknowledge" | Violation acknowledged; status updated |
| BO-VI-04 ✅ | View inspection schedule | 1. Navigate to inspections | Upcoming inspections with dates, location |
| BO-VI-05 ✅ | View inspection results | 1. Click on completed inspection | Findings, checklist results, violations (if any) |
| BO-VI-06 ⚠️ | View violation summary | 1. Check violation summary | Aggregated counts by severity/status |

### 4.11 Post Requirements

| ID | Scenario | Steps | Expected Behavior |
|----|----------|-------|-------------------|
| BO-PR-10 ✅ | View post requirements | 1. Navigate to requirements section | List of required documents/actions |
| BO-PR-11 🔄 | Upload post requirement document | 1. Select requirement 2. Upload document 3. Submit | Requirement marked "submitted" |
| BO-PR-12 ⚠️ | Post requirement overdue | 1. Requirement past due date | Warning indicator; possible penalty |
| BO-PR-13 ⚠️ | Extend post requirement due date | 1. Request extension | Extension submitted for approval |

---

## 5. Staff / LGU Officer Flows (Web)

### 5.1 Onboarding

| ID | Scenario | Steps | Expected Behavior |
|----|----------|-------|-------------------|
| ST-ON-01 🔄 | First login → onboarding redirect | 1. Login with temporary credentials | Redirected to `/staff/onboarding` |
| ST-ON-02 🔄 | Change temporary credentials | 1. On onboarding page 2. Set new password 3. Setup MFA | Credentials updated; MFA enabled; redirected to dashboard |
| ST-ON-03 ❌ | Onboarding → weak password | 1. Enter weak new password | Password strength error; cannot proceed |
| ST-ON-04 ❌ | Onboarding → skip MFA | 1. Try to skip MFA setup | Blocked; MFA is mandatory for staff |

### 5.2 Dashboard

| ID | Scenario | Steps | Expected Behavior |
|----|----------|-------|-------------------|
| ST-DA-01 ✅ | Load staff dashboard | 1. Login as staff 2. View `/staff` | KPIs, quick actions, recent activity loaded |
| ST-DA-02 ⚠️ | Dashboard with no pending items | 1. All applications processed | Clean state; no pending counts |

### 5.3 Permit Application Review

| ID | Scenario | Steps | Expected Behavior |
|----|----------|-------|-------------------|
| ST-PA-01 ✅ | View pending applications list | 1. Navigate to `/staff/applications` | List of pending applications |
| ST-PA-02 ✅ | Filter applications | 1. Use status/type/date filters | List updates to match filters |
| ST-PA-03 ✅ | Search applications | 1. Type search query | Results filtered by search term |
| ST-PA-04 ✅ | Open application detail panel | 1. Click on application | Detail panel opens with full application info |
| ST-PA-05 ✅ | View business information section | 1. In detail panel, open "Business Info" | Business name, address, LOB, documents |
| ST-PA-06 ✅ | View owner information section | 1. Open "Owner Info" in detail panel | Owner PIS, contact, ID documents |
| ST-PA-07 ✅ | View uploaded documents | 1. Open "Documents" section | All documents listed; can preview/download |
| ST-PA-08 🔄 | Start review | 1. Click "Start Review" on application | Application locked to reviewer; status "under_review" |
| ST-PA-09 🔄 | Approve application | 1. Review all sections 2. Click "Approve" 3. Confirm | Status → "approved"; notification sent to owner |
| ST-PA-10 🔄 | Reject application | 1. Review 2. Click "Reject" 3. Provide reason 4. Confirm | Status → "rejected"; reason sent to owner |
| ST-PA-11 🔄 | Request changes | 1. Click "Request Changes" 2. Specify fields/reasons | Status → "changes_requested"; owner notified |
| ST-PA-12 ❌ | Approve without reviewing required sections | 1. Try to approve without opening all sections | Warning or block: "Complete review first" |
| ST-PA-13 ❌ | Reject without providing reason | 1. Click "Reject" 2. Leave reason blank | Validation: "Rejection reason required" |
| ST-PA-14 ⚠️ | Concurrent review (two officers same app) | 1. Officer A starts review 2. Officer B tries to review | Officer B blocked: "Application under review by another officer" |
| ST-PA-15 ⚠️ | Bookmark application | 1. Click bookmark icon | Application saved to bookmarks |
| ST-PA-16 🔄 | Field-level decisions | 1. Mark individual fields as approved/flagged | Field decisions saved; aggregate shown in summary |
| ST-PA-17 ⚠️ | Update form data (officer correction) | 1. Edit form data in detail panel 2. Save | Data updated; audit log created |

### 5.4 Walk-In Application

| ID | Scenario | Steps | Expected Behavior |
|----|----------|-------|-------------------|
| ST-WI-01 ✅ | Create walk-in application | 1. Navigate to walk-in 2. Search for owner by PIS 3. Fill application 4. Submit | Application created on behalf of owner |
| ST-WI-02 ❌ | Walk-in → owner not found | 1. Search for non-existent PIS | "No owner found" with option to create |
| ST-WI-03 🔄 | Walk-in → compute fees | 1. After filling application 2. Click "Compute Fees" | Fee breakdown displayed |
| ST-WI-04 ❌ | Walk-in → missing required fields | 1. Leave fields blank 2. Submit | Validation errors |

### 5.5 Cessation Review

| ID | Scenario | Steps | Expected Behavior |
|----|----------|-------|-------------------|
| ST-CE-01 ✅ | View cessation requests | 1. Navigate to `/staff/cessation` | List of retirement/cessation requests |
| ST-CE-02 🔄 | Approve cessation | 1. Select request 2. Review 3. Approve | Cessation approved; business status updated |
| ST-CE-03 🔄 | Reject cessation | 1. Select 2. Reject with reason | Cessation rejected; owner notified |
| ST-CE-04 ⚠️ | Verify cessation with inspection | 1. Request physical verification | Inspection scheduled before final approval |

### 5.6 Inspections Management

| ID | Scenario | Steps | Expected Behavior |
|----|----------|-------|-------------------|
| ST-IN-01 ✅ | View inspections list | 1. Navigate to `/staff/inspections` | All inspections with status, date, inspector |
| ST-IN-02 ✅ | View inspection details | 1. Click on inspection | Full details: checklist, findings, violations |
| ST-IN-03 ⚠️ | Filter inspections by status | 1. Apply status filter | List filtered |

### 5.7 Appeals Review

| ID | Scenario | Steps | Expected Behavior |
|----|----------|-------|-------------------|
| ST-AP-01 ✅ | View appeals list | 1. Navigate to `/staff/appeals` | List of appeals with status |
| ST-AP-02 🔄 | Review and decide appeal | 1. Open appeal 2. Review justification 3. Approve or reject | Appeal status updated; owner notified |
| ST-AP-03 ❌ | Decide appeal without reason | 1. Try to reject without reason | Validation error |

### 5.8 Staff Reports

| ID | Scenario | Steps | Expected Behavior |
|----|----------|-------|-------------------|
| ST-RP-01 ✅ | View staff reports page | 1. Navigate to `/staff/reports` | Reports page loads with available report types |
| ST-RP-02 ⚠️ | Generate report | 1. Select report type 2. Set date range 3. Generate | Report data displayed/downloadable |

### 5.9 Account Recovery

| ID | Scenario | Steps | Expected Behavior |
|----|----------|-------|-------------------|
| ST-RC-01 🔄 | Submit recovery request | 1. Staff can't login 2. Navigate to recovery 3. Submit request | Recovery request created for admin review |
| ST-RC-02 ⚠️ | View recovery request status | 1. After submission 2. Check status | Current status displayed |
| ST-RC-03 🔄 | Login with temporary credentials | 1. Admin issues temp credentials 2. Staff logs in | Redirected to onboarding to set permanent credentials |

---

## 6. Inspector Flows (Mobile — Flutter)

### 6.1 Login

| ID | Scenario | Steps | Expected Behavior |
|----|----------|-------|-------------------|
| 📱 INS-LI-01 ✅ | Login as inspector | 1. Open app 2. Enter email + password 3. Submit | Login success → dashboard |
| 📱 INS-LI-02 ❌ | Login with wrong credentials | 1. Enter wrong password | Error: "Invalid credentials" |
| 📱 INS-LI-03 🔄 | Login → MFA prompt | 1. Login 2. TOTP/OTP required 3. Enter code | Login complete |
| 📱 INS-LI-04 ❌ | Non-inspector tries to login | 1. Business owner tries mobile login | Error: "This app is for inspectors only" |
| 📱 INS-LI-05 ⚠️ | Login → onboarding (first time) | 1. First login with temp credentials | Redirected to onboarding: change password + setup MFA |
| 📱 INS-LI-06 ✅ | Google Sign-In | 1. Tap "Sign in with Google" 2. Complete flow | Login success if inspector role |
| 📱 INS-LI-07 ⚠️ | Session persistence | 1. Login 2. Close app 3. Reopen | Auto-login if session valid |
| 📱 INS-LI-08 ⚠️ | Session expired → auto logout | 1. Session expires while app in background | Redirected to login on next interaction |

### 6.2 Dashboard

| ID | Scenario | Steps | Expected Behavior |
|----|----------|-------|-------------------|
| 📱 INS-DA-01 ✅ | View inspector dashboard | 1. After login | Count cards (assigned, completed, pending), quick action grid |
| 📱 INS-DA-02 ⚠️ | Dashboard with no inspections | 1. No assigned inspections | Empty state with appropriate message |
| 📱 INS-DA-03 ⚠️ | Pull to refresh dashboard | 1. Pull down on dashboard | Data refreshes |

### 6.3 Assigned Inspections

| ID | Scenario | Steps | Expected Behavior |
|----|----------|-------|-------------------|
| 📱 INS-AI-01 ✅ | View assigned inspections list | 1. Navigate to "Assigned Inspections" | List of inspections with business name, date, status |
| 📱 INS-AI-02 ✅ | Open inspection detail | 1. Tap on inspection | Detail screen: business info, checklist, location |
| 📱 INS-AI-03 ⚠️ | Filter/search inspections | 1. Use filter/search | List filtered |
| 📱 INS-AI-04 ⚠️ | Pagination | 1. Scroll past first page | More inspections loaded |

### 6.4 Inspection Workflow

| ID | Scenario | Steps | Expected Behavior |
|----|----------|-------|-------------------|
| 📱 INS-WF-01 🔄 | Start inspection | 1. Open inspection 2. Tap "Start Inspection" | Inspection status → "in_progress"; GPS captured |
| 📱 INS-WF-02 🔄 | Complete checklist | 1. Go through checklist items 2. Mark each pass/fail | Checklist saved |
| 📱 INS-WF-03 🔄 | GPS mismatch handling | 1. Inspector location ≠ business location | Prompted for reason; can enter text explanation |
| 📱 INS-WF-04 🔄 | Add violation | 1. During inspection 2. Tap "Add Violation" 3. Select from catalog 4. Add details | Violation recorded |
| 📱 INS-WF-05 🔄 | Upload evidence (photo) | 1. Tap "Upload Evidence" 2. Take photo or select from gallery | Photo uploaded and attached to inspection |
| 📱 INS-WF-06 🔄 | Submit inspection | 1. Complete all items 2. Tap "Submit" | Inspection submitted; status → "completed" |
| 📱 INS-WF-07 ❌ | Submit with incomplete checklist | 1. Leave checklist items unchecked 2. Try to submit | Warning: "Complete all checklist items" |
| 📱 INS-WF-08 ⚠️ | Upload large evidence file | 1. Upload high-res photo | Either compressed or size error with guidance |
| 📱 INS-WF-09 ⚠️ | Inspection with no GPS | 1. Location services disabled | Warning; can proceed with reason |
| 📱 INS-WF-10 🔄 | Add signature to inspection | 1. Draw/input signature | Signature captured and attached |

### 6.5 Offline Mode

| ID | Scenario | Steps | Expected Behavior |
|----|----------|-------|-------------------|
| 📱 INS-OF-01 ⚠️ | View cached inspections offline | 1. Go offline 2. Open inspections | Cached inspections available from SQLite |
| 📱 INS-OF-02 🔄 | Complete inspection offline | 1. Go offline 2. Complete checklist 3. Submit | Saved locally; synced when back online |
| 📱 INS-OF-03 ⚠️ | Sync pending inspections | 1. Come back online | Pending inspections synced to server |
| 📱 INS-OF-04 ⚠️ | Conflict resolution | 1. Edit inspection offline 2. Another user edits same 3. Come online | Conflict detected and handled (last-write-wins or merge) |

### 6.6 Schedule

| ID | Scenario | Steps | Expected Behavior |
|----|----------|-------|-------------------|
| 📱 INS-SC-01 ✅ | View schedule calendar | 1. Navigate to "My Schedule" | Calendar view with inspection dates marked |
| 📱 INS-SC-02 ✅ | Select date → view inspections | 1. Tap on a date | Inspections for that date listed below calendar |
| 📱 INS-SC-03 ⚠️ | Schedule with no inspections today | 1. Select date with no inspections | Empty state: "No inspections scheduled" |

### 6.7 Violations (Inspector View)

| ID | Scenario | Steps | Expected Behavior |
|----|----------|-------|-------------------|
| 📱 INS-VL-01 ✅ | View violations list | 1. Navigate to "Violations" | All recorded violations listed |
| 📱 INS-VL-02 ✅ | View violations catalog | 1. During inspection 2. Open violations catalog | Predefined violations with descriptions |
| 📱 INS-VL-03 ✅ | View ordinances | 1. Open legal references | Local ordinances listed for reference |

### 6.8 Notifications (Mobile)

| ID | Scenario | Steps | Expected Behavior |
|----|----------|-------|-------------------|
| 📱 INS-NT-01 ✅ | View notifications list | 1. Navigate to "Notifications" | Notifications listed with timestamps |
| 📱 INS-NT-02 ⚠️ | Empty notifications | 1. No notifications | "No notifications yet" message |

### 6.9 Profile (Mobile)

| ID | Scenario | Steps | Expected Behavior |
|----|----------|-------|-------------------|
| 📱 INS-PF-01 ✅ | View profile | 1. Navigate to "Profile" | Name, email, phone, avatar displayed |
| 📱 INS-PF-02 🔄 | Edit profile | 1. Tap "Edit Profile" 2. Change name/phone 3. Save | Profile updated |
| 📱 INS-PF-03 ❌ | Edit profile → invalid data | 1. Clear name field 2. Save | Validation error |
| 📱 INS-PF-04 🔄 | Upload avatar | 1. Tap avatar 2. Select photo | Avatar uploaded and displayed |
| 📱 INS-PF-05 🔄 | Change password | 1. Tap "Change Password" 2. Enter current + new 3. Verify with OTP | Password updated |
| 📱 INS-PF-06 ❌ | Change password → wrong current password | 1. Enter wrong current password | Error: "Current password is incorrect" |
| 📱 INS-PF-07 🔄 | Change email | 1. Tap "Change Email" 2. Verify current 3. Enter new email 4. Verify new | Email updated |
| 📱 INS-PF-08 ⚠️ | MFA settings | 1. Go to MFA settings | Enable/disable TOTP from mobile |
| 📱 INS-PF-09 ✅ | View active sessions | 1. Tap "Active Sessions" | All active sessions listed |
| 📱 INS-PF-10 🔄 | Invalidate session | 1. Select other session 2. Tap "Invalidate" | Session terminated |
| 📱 INS-PF-11 🔄 | Invalidate all sessions | 1. Tap "Invalidate All" | All other sessions terminated |

### 6.10 Session Timeout (Mobile)

| ID | Scenario | Steps | Expected Behavior |
|----|----------|-------|-------------------|
| 📱 INS-ST-01 ⚠️ | Idle timeout | 1. Leave app idle | "Session Paused" dialog with 60s countdown |
| 📱 INS-ST-02 ⚠️ | Dismiss idle timeout | 1. Session paused dialog appears 2. Tap to dismiss | Session continues |
| 📱 INS-ST-03 🔄 | Idle timeout → auto logout | 1. Don't dismiss within 60s | Logged out; redirected to login |

### 6.11 Delete Account (Mobile)

| ID | Scenario | Steps | Expected Behavior |
|----|----------|-------|-------------------|
| 📱 INS-DEL-01 🔄 | Request account deletion | 1. Go to profile 2. Request deletion 3. Verify | Deletion scheduled |
| 📱 INS-DEL-02 🔄 | Cancel scheduled deletion | 1. On deletion pending page 2. Cancel | Deletion cancelled; account restored |
| 📱 INS-DEL-03 ⚠️ | Deletion grace period | 1. After scheduling 2. Wait for grace period | Account marked pending; can still cancel |

---

## 7. LGU Manager Flows (Web)

### 7.1 Dashboard

| ID | Scenario | Steps | Expected Behavior |
|----|----------|-------|-------------------|
| LM-DA-01 ✅ | Load LGU Manager dashboard | 1. Login as LGU manager 2. Navigate to `/lgu-manager` | Dashboard with permit/violation/inspection/appeal metrics |
| LM-DA-02 ⚠️ | Dashboard analytics load | 1. View analytics section | Charts/graphs render with real data |
| LM-DA-03 ⚠️ | Dashboard with no data | 1. Fresh system with no records | Graceful empty states |

### 7.2 Reports & Analytics

| ID | Scenario | Steps | Expected Behavior |
|----|----------|-------|-------------------|
| LM-RP-01 ✅ | View reports page | 1. Navigate to `/lgu-manager/reports` | Reports page with filter options |
| LM-RP-02 🔄 | Generate report | 1. Select report type 2. Set date range 3. Click "Generate" | Report generated; downloadable |
| LM-RP-03 ⚠️ | Export report | 1. Click "Export" | Report exported (CSV/PDF) |
| LM-RP-04 ❌ | Generate report → invalid date range | 1. Set end date before start date | Error: "Invalid date range" |
| LM-RP-05 ⚠️ | View trend analytics | 1. Open trends tab | Line/bar charts showing trends over time |

### 7.3 Permit Applications Overview

| ID | Scenario | Steps | Expected Behavior |
|----|----------|-------|-------------------|
| LM-PO-01 ✅ | View permit applications overview | 1. Navigate to `/lgu-manager/permit-applications` | Summary stats, list of applications |
| LM-PO-02 ⚠️ | Filter by status | 1. Apply status filter | Filtered list |
| LM-PO-03 ⚠️ | View application details | 1. Click on application | Detail view (read-only for manager) |

### 7.4 Cessation Overview

| ID | Scenario | Steps | Expected Behavior |
|----|----------|-------|-------------------|
| LM-CO-01 ✅ | View cessation overview | 1. Navigate to `/lgu-manager/cessation` | Cessation statistics and list |
| LM-CO-02 ⚠️ | View cessation details | 1. Click on cessation request | Details displayed |

### 7.5 Violations & Inspections Overview

| ID | Scenario | Steps | Expected Behavior |
|----|----------|-------|-------------------|
| LM-VIO-01 ✅ | View violations/inspections | 1. Navigate to `/lgu-manager/violations-inspections` | Compliance metrics, violation/inspection lists |
| LM-VIO-02 ⚠️ | Filter by date range | 1. Set date filter | Data filtered |

### 7.6 Assign Inspection

| ID | Scenario | Steps | Expected Behavior |
|----|----------|-------|-------------------|
| LM-ASI-01 ✅ | View unassigned inspections | 1. Navigate to `/lgu-manager/assign-inspection` | List of unassigned inspections |
| LM-ASI-02 ✅ | View available inspectors | 1. On assign page | Inspector list with availability |
| LM-ASI-03 🔄 | Assign inspection to inspector | 1. Select inspection 2. Select inspector 3. Confirm | Inspection assigned; inspector notified |
| LM-ASI-04 ❌ | Assign to unavailable inspector | 1. Select inspector at capacity | Warning or block |

### 7.7 Appeals Overview

| ID | Scenario | Steps | Expected Behavior |
|----|----------|-------|-------------------|
| LM-AP-01 ✅ | View appeals overview | 1. Navigate to `/lgu-manager/appeals` | Appeals statistics, SLA metrics |
| LM-AP-02 ⚠️ | View appeal details | 1. Click on appeal | Details displayed |

---

## 8. Admin Flows (Web)

### 8.1 Onboarding

| ID | Scenario | Steps | Expected Behavior |
|----|----------|-------|-------------------|
| AD-ON-01 🔄 | Admin first login → onboarding | 1. First admin login | Redirected to `/admin/onboarding`; must change password + setup MFA |
| AD-ON-02 ❌ | Onboarding → weak password | 1. Enter weak password | Validation error |
| AD-ON-03 ❌ | Onboarding → skip MFA | 1. Try to skip | Blocked; MFA mandatory |

### 8.2 Dashboard

| ID | Scenario | Steps | Expected Behavior |
|----|----------|-------|-------------------|
| AD-DA-01 ✅ | Load admin dashboard | 1. Login as admin 2. View `/admin/dashboard` | KPIs, maintenance status, activity log, security summary |
| AD-DA-02 ⚠️ | Dashboard with real-time data | 1. View dashboard | Data reflects current system state |
| AD-DA-03 ⚠️ | Dashboard tamper/security summary | 1. View security section | Tamper incident counts, recent alerts |

### 8.3 User Management

| ID | Scenario | Steps | Expected Behavior |
|----|----------|-------|-------------------|
| AD-UM-01 ✅ | View users list | 1. Navigate to `/admin/users` | All users listed with roles |
| AD-UM-02 ✅ | Filter users by office/role | 1. Apply filters | List filtered |
| AD-UM-03 ✅ | View user details | 1. Click on user | Detail panel with full info |
| AD-UM-04 🔄 | Create staff account | 1. Click "Create Staff" 2. Fill details (name, email, role, office) 3. Submit (requires step-up auth) | Staff account created with temporary credentials |
| AD-UM-05 ❌ | Create staff → duplicate email | 1. Use existing email | Error: "Email already exists" |
| AD-UM-06 🔄 | Disable account | 1. Select user 2. Click "Disable" 3. Confirm (step-up) | Account disabled; user cannot login |
| AD-UM-07 🔄 | Re-enable account | 1. Select disabled user 2. Click "Enable" | Account re-enabled |
| AD-UM-08 🔄 | Reset user password | 1. Select user 2. Click "Reset Password" (step-up) | Temporary password generated |
| AD-UM-09 🔄 | Edit staff details | 1. Select staff 2. Click "Edit" 3. Update role/office | Staff details updated |
| AD-UM-10 ⚠️ | View user activity logs | 1. Open user detail 2. View activity | Audit history for that user |
| AD-UM-11 🔄 | Create admin account | 1. Click "Create Admin" 2. Fill details (step-up) | Admin account created |
| AD-UM-12 ⚠️ | Admin self-disable prevention | 1. Admin tries to disable own account | Blocked: "Cannot disable your own account" |

### 8.4 Office & Role Management

| ID | Scenario | Steps | Expected Behavior |
|----|----------|-------|-------------------|
| AD-OR-01 ✅ | View offices list | 1. In user management, view offices | All offices listed |
| AD-OR-02 🔄 | Create office (step-up) | 1. Click "Create Office" 2. Fill name 3. Confirm | Office created |
| AD-OR-03 🔄 | Update office | 1. Edit office name | Office updated |
| AD-OR-04 🔄 | Delete office | 1. Delete office (no assigned staff) | Office deleted |
| AD-OR-05 ❌ | Delete office with staff | 1. Try to delete office with assigned staff | Error: "Office has assigned staff" |
| AD-OR-06 ✅ | View staff roles | 1. View roles list | All custom roles listed |
| AD-OR-07 🔄 | Create/update/delete staff role | 1. Manage roles (step-up) | Role CRUD operations work |

### 8.5 Admin Step-Up Authentication

| ID | Scenario | Steps | Expected Behavior |
|----|----------|-------|-------------------|
| AD-SU-01 🔄 | Step-up for sensitive action | 1. Attempt sensitive action (create staff, maintenance, etc.) 2. Step-up modal appears 3. Enter MFA code | Action proceeds after verification |
| AD-SU-02 ❌ | Step-up → wrong code | 1. Enter wrong MFA code in step-up | Error: "Invalid code"; action blocked |
| AD-SU-03 ⚠️ | Step-up → session caching | 1. Complete step-up 2. Perform another sensitive action quickly | May not re-prompt if within grace period |

### 8.6 Requests Management

| ID | Scenario | Steps | Expected Behavior |
|----|----------|-------|-------------------|
| AD-RQ-01 ✅ | View pending requests | 1. Navigate to `/admin/requests` | All pending requests listed |
| AD-RQ-02 🔄 | Approve request | 1. Select request 2. Approve | Request approved; action executed |
| AD-RQ-03 🔄 | Reject request | 1. Select request 2. Reject with reason | Request rejected; requester notified |

### 8.7 Form Definitions

| ID | Scenario | Steps | Expected Behavior |
|----|----------|-------|-------------------|
| AD-FD-01 ✅ | View form groups | 1. Navigate to `/admin/form-definitions` | Form groups listed |
| AD-FD-02 🔄 | Create form group | 1. Click "Create Group" 2. Fill name, description 3. Submit | Group created |
| AD-FD-03 ✅ | View form group detail | 1. Click on group | Group details with associated forms |
| AD-FD-04 🔄 | Create form definition (version) | 1. In group 2. Click "Add Version" 3. Fill details | New version created |
| AD-FD-05 🔄 | Edit form in form editor | 1. Open form editor 2. Add/edit/remove/reorder fields 3. Save | Form definition saved |
| AD-FD-06 ✅ | Preview form | 1. Click "Preview" | Form rendered as business owner would see it |
| AD-FD-07 🔄 | Submit form for approval | 1. Click "Submit for Approval" | Status → "pending_approval" |
| AD-FD-08 🔄 | Set form as active | 1. Approved form 2. Set as active version | This version now served to business owners |
| AD-FD-09 🔄 | Deactivate form group | 1. Click "Deactivate" | Group deactivated; forms no longer served |
| AD-FD-10 🔄 | Reactivate form group | 1. Click "Reactivate" | Group reactivated |
| AD-FD-11 🔄 | Archive form | 1. Click "Archive" | Form archived |
| AD-FD-12 🔄 | Duplicate form | 1. Click "Duplicate" | New copy created |
| AD-FD-13 ⚠️ | Form editor → add complex field types | 1. Add dropdown, checkbox, file upload, conditional fields | All field types render correctly |
| AD-FD-14 ❌ | Save form with validation errors | 1. Leave required metadata blank | Validation error |
| AD-FD-15 ⚠️ | View form audit log | 1. Open audit log tab | All changes to forms logged |

### 8.8 Fee Configuration

| ID | Scenario | Steps | Expected Behavior |
|----|----------|-------|-------------------|
| AD-FE-01 ✅ | View fee configuration | 1. Navigate to `/admin/fee-configuration` | Fee configs by LOB, special fees, penalties |
| AD-FE-02 🔄 | Create fee config | 1. Click "Add Fee" 2. Select LOB, set amounts 3. Save (step-up) | Fee config created |
| AD-FE-03 🔄 | Update fee config | 1. Edit existing fee 2. Change amounts 3. Save | Fee updated; audit logged |
| AD-FE-04 🔄 | Deactivate fee config | 1. Delete/deactivate fee | Fee deactivated |
| AD-FE-05 ✅ | View penalty configuration | 1. Switch to penalty tab | Penalty rates, late fees displayed |
| AD-FE-06 🔄 | Update penalty config | 1. Edit penalty rates 2. Save (step-up) | Penalty updated |
| AD-FE-07 🔄 | Reset penalty to defaults | 1. Click "Reset to Defaults" | Penalties reset |
| AD-FE-08 ⚠️ | View fee configuration logs | 1. Open logs tab | All fee changes logged with timestamps |
| AD-FE-09 ⚠️ | Special fees tab | 1. View special fees | Special fees displayed and configurable |

### 8.9 Finance

| ID | Scenario | Steps | Expected Behavior |
|----|----------|-------|-------------------|
| AD-FI-01 ✅ | View finance overview | 1. Navigate to `/admin/finance` | Revenue overview, collection stats |
| AD-FI-02 ✅ | View transactions | 1. Switch to transactions tab | Transaction list with filters |
| AD-FI-03 🔄 | Generate financial report | 1. Switch to reports tab 2. Set parameters 3. Generate | Report generated |
| AD-FI-04 ⚠️ | Export financial data | 1. Click "Export" | Data exported (CSV/PDF) |

### 8.10 Security (Audit & Tamper)

| ID | Scenario | Steps | Expected Behavior |
|----|----------|-------|-------------------|
| AD-SC-01 ✅ | View security page | 1. Navigate to `/admin/security` | Audit overview, tamper incidents, history |
| AD-SC-02 ✅ | View tamper incidents | 1. Switch to incidents tab | All tamper incidents listed |
| AD-SC-03 ⚠️ | View incident details | 1. Click on incident | Full details: what was tampered, when, severity |
| AD-SC-04 🔄 | Acknowledge tamper incident (step-up) | 1. Select incident 2. Click "Acknowledge" 3. Step-up auth | Incident acknowledged; documented |
| AD-SC-05 ⚠️ | View tamper stats | 1. View overview | Counts by severity, trend |
| AD-SC-06 ⚠️ | Export audit logs | 1. Click "Export Logs" | Logs exported |
| AD-SC-07 ✅ | View security history | 1. Switch to history tab | Security event timeline |
| AD-SC-08 ⚠️ | Verify audit log integrity (blockchain) | 1. Select audit log 2. Click "Verify" | Blockchain verification result displayed |

### 8.11 Maintenance Mode

| ID | Scenario | Steps | Expected Behavior |
|----|----------|-------|-------------------|
| AD-MT-01 ✅ | View maintenance status | 1. Navigate to `/admin/maintenance` | Current maintenance status, history |
| AD-MT-02 🔄 | Enable maintenance mode (step-up) | 1. Click "Request Maintenance" 2. Set details 3. Submit with step-up | Maintenance mode enabled; non-admin users see maintenance page |
| AD-MT-03 🔄 | Disable maintenance mode | 1. End maintenance | System returns to normal; users can access again |
| AD-MT-04 ⚠️ | Schedule maintenance | 1. Set future date for maintenance | Scheduled; auto-enables at scheduled time |
| AD-MT-05 ⚠️ | View maintenance history | 1. View history tab | Past maintenance windows listed |

### 8.12 LOB Trainer (AI Admin)

| ID | Scenario | Steps | Expected Behavior |
|----|----------|-------|-------------------|
| AD-AI-01 ✅ | View LOB trainer page | 1. Navigate to `/admin/lob-trainer` | Training examples, stats, model info |
| AD-AI-02 🔄 | Add training example | 1. Click "Add Example" 2. Enter business description + LOB label 3. Save | Example added to training data |
| AD-AI-03 🔄 | Edit training example | 1. Select example 2. Edit 3. Save | Example updated |
| AD-AI-04 🔄 | Delete training example | 1. Select 2. Delete | Example removed |
| AD-AI-05 🔄 | Train model | 1. Click "Train Model" | Model retrained with current data; metrics displayed |
| AD-AI-06 ✅ | View model stats | 1. View stats tab | Accuracy, precision, recall, F1 |
| AD-AI-07 🔄 | Import/Export examples | 1. Import JSON or Export | Data imported/exported |
| AD-AI-08 ⚠️ | Evaluate model | 1. Click "Evaluate" | Evaluation metrics on test set |

### 8.13 Announcements

| ID | Scenario | Steps | Expected Behavior |
|----|----------|-------|-------------------|
| AD-AN-01 ✅ | View announcements | 1. View announcements section | All announcements listed |
| AD-AN-02 🔄 | Create announcement | 1. Click "Create" 2. Fill title, content 3. Save | Announcement published |
| AD-AN-03 🔄 | Edit announcement | 1. Select 2. Edit 3. Save | Announcement updated |
| AD-AN-04 🔄 | Delete announcement | 1. Select 2. Delete | Announcement removed |

### 8.14 Admin LGU Management

| ID | Scenario | Steps | Expected Behavior |
|----|----------|-------|-------------------|
| AD-LG-01 ✅ | View LGUs | 1. View LGU list | All LGUs listed |
| AD-LG-02 🔄 | Create LGU (step-up) | 1. Click "Create" 2. Fill details | LGU created |
| AD-LG-03 🔄 | Update LGU | 1. Edit LGU details | LGU updated |
| AD-LG-04 🔄 | Delete LGU | 1. Delete LGU | LGU deactivated |
| AD-LG-05 ❌ | Delete LGU with assigned businesses | 1. Try to delete LGU with active businesses | Error or warning |

### 8.15 Admin Recovery Requests

| ID | Scenario | Steps | Expected Behavior |
|----|----------|-------|-------------------|
| AD-RC-01 ✅ | View recovery requests | 1. View recovery requests | Pending requests listed |
| AD-RC-02 🔄 | Issue temporary credentials | 1. Select request 2. Click "Issue Temp Credentials" | Temp credentials generated; staff notified |
| AD-RC-03 🔄 | Deny recovery request | 1. Select 2. Deny with reason | Request denied |

### 8.16 Admin Staff Deletion

| ID | Scenario | Steps | Expected Behavior |
|----|----------|-------|-------------------|
| AD-SD-01 ✅ | View staff deletion requests | 1. View deletion requests | Pending requests listed |
| AD-SD-02 🔄 | Approve staff deletion | 1. Select 2. Approve | Staff account scheduled for deletion |
| AD-SD-03 ⚠️ | Admin self-deletion request | 1. Admin requests own deletion | Special flow: requires another admin to approve |

---

## 9. Common User Flows — All Roles (Web)

### 9.1 Profile Settings

| ID | Scenario | Steps | Expected Behavior |
|----|----------|-------|-------------------|
| CM-PS-01 ✅ | View profile settings | 1. Navigate to `/settings-profile` | Profile page with tabs: General, Account, Security, Theme |
| CM-PS-02 🔄 | Edit profile (name, phone) | 1. Go to General tab 2. Edit fields 3. Save | Profile updated |
| CM-PS-03 ❌ | Edit profile → invalid data | 1. Clear required field 2. Save | Validation error |
| CM-PS-04 🔄 | Upload avatar | 1. Click avatar 2. Upload image | Avatar updated |
| CM-PS-05 ❌ | Upload avatar → invalid file | 1. Upload non-image file | Error: "Please upload an image" |
| CM-PS-06 ❌ | Upload avatar → oversized | 1. Upload very large image | Error or auto-resize |
| CM-PS-07 🔄 | Delete avatar | 1. Click "Remove avatar" | Avatar removed; default shown |

### 9.2 Change Email

| ID | Scenario | Steps | Expected Behavior |
|----|----------|-------|-------------------|
| CM-CE-01 🔄 | Change email — full flow | 1. Go to Account tab 2. Click "Change Email" 3. Verify current email (OTP) 4. Enter new email 5. Verify new email (OTP) | Email updated; both old and new verified |
| CM-CE-02 ❌ | Change to already-used email | 1. Enter email that belongs to another user | Error: "Email already in use" |
| CM-CE-03 ❌ | Change email → wrong OTP | 1. Enter wrong verification code | Error: "Invalid code" |
| CM-CE-04 ⚠️ | Email change grace period | 1. After change, grace period active | Can revert within grace period |
| CM-CE-05 🔄 | Revert email change | 1. During grace period 2. Click "Revert" | Email reverted to previous |

### 9.3 Change Password (Authenticated)

| ID | Scenario | Steps | Expected Behavior |
|----|----------|-------|-------------------|
| CM-CP-01 🔄 | Change password — full flow | 1. Go to Security tab 2. Click "Change Password" 3. Enter current password 4. Enter new password 5. Verify with OTP | Password updated |
| CM-CP-02 ❌ | Change password → wrong current | 1. Enter wrong current password | Error: "Current password is incorrect" |
| CM-CP-03 ❌ | Change password → same as current | 1. Enter same password as current | Error: "New password must be different" |
| CM-CP-04 ❌ | Change password → weak new password | 1. Enter weak new password | Password strength error |
| CM-CP-05 ⚠️ | Change password → password history check | 1. Enter recently used password | May be blocked if password history enforced |

### 9.4 Account Deletion

| ID | Scenario | Steps | Expected Behavior |
|----|----------|-------|-------------------|
| CM-AD-01 🔄 | Request account deletion | 1. Go to Account settings 2. Click "Delete Account" 3. Verify password 4. Receive code 5. Confirm | Deletion scheduled; grace period starts |
| CM-AD-02 ⚠️ | Deletion pending → login | 1. Login with deletion pending | Redirected to `/deletion-pending` page |
| CM-AD-03 🔄 | Cancel deletion during grace period | 1. On deletion-pending page 2. Click "Cancel Deletion" | Deletion cancelled; account restored |
| CM-AD-04 ❌ | Delete account → wrong password | 1. Enter wrong password | Error: "Incorrect password" |
| CM-AD-05 ⚠️ | Deletion countdown display | 1. On deletion-pending page | Days/hours remaining until permanent deletion |
| CM-AD-06 ❌ | Delete account → wrong verification code | 1. Enter wrong code | Error: "Invalid code" |

### 9.5 Theme Settings

| ID | Scenario | Steps | Expected Behavior |
|----|----------|-------|-------------------|
| CM-TH-01 ✅ | Switch theme (light/dark) | 1. Go to Theme tab 2. Select theme | Theme changes; persisted |
| CM-TH-02 ⚠️ | Theme persistence | 1. Change theme 2. Logout 3. Login | Theme preference retained |
| CM-TH-03 ⚠️ | System theme detection | 1. Set to "System" | Follows OS dark/light mode |

---

## 10. Session & Security (Web + Mobile)

| ID | Scenario | Steps | Expected Behavior |
|----|----------|-------|-------------------|
| SS-01 ✅ | View active sessions | 1. Go to Security settings | All active sessions listed (device, IP, last active) |
| SS-02 🔄 | Invalidate specific session | 1. Click "Invalidate" on a session | That session terminated; device logged out |
| SS-03 🔄 | Invalidate all sessions | 1. Click "Invalidate All" | All other sessions terminated (current preserved) |
| SS-04 ⚠️ | Session timeout → auto logout | 1. Be idle past timeout | Automatic logout; redirected to login |
| SS-05 ⚠️ | Session activity reporting | 1. Use app normally | Last activity timestamp updated |
| SS-06 ⚠️ | CSRF protection | 1. Attempt cross-origin form submission | Request blocked by CSRF middleware |
| SS-07 ⚠️ | JWT expired → auto-refresh or logout | 1. JWT expires during session | Either token refreshed or user logged out gracefully |
| SS-08 ❌ | Access protected route without auth | 1. Clear token 2. Navigate to `/admin/dashboard` | Redirected to `/login` |
| SS-09 ❌ | Access wrong role route | 1. Business owner tries `/admin/dashboard` | Redirected to own dashboard with warning |
| SS-10 ⚠️ | Concurrent login detection | 1. Login on two browsers | Both sessions active; visible in sessions list |
| SS-11 ❌ | Tampered JWT | 1. Modify JWT payload | Request rejected; 401 Unauthorized |
| SS-12 ⚠️ | Password expiry enforcement | 1. Password older than policy allows | Prompted to change password |
| SS-13 ⚠️ | CORS enforcement | 1. Request from unauthorized origin | Request blocked |
| SS-14 ⚠️ | Rate limiting on auth endpoints | 1. Send 100+ login requests | Rate limited; 429 response |

---

## 11. Notifications (Web + Mobile)

| ID | Scenario | Steps | Expected Behavior |
|----|----------|-------|-------------------|
| NT-01 ✅ | View notification history | 1. Navigate to `/notifications` | All notifications listed chronologically |
| NT-02 ✅ | Unread notification badge | 1. New notification arrives | Badge count incremented in sidebar/header |
| NT-03 🔄 | Mark notification as read | 1. Click on notification | Notification marked read; badge decremented |
| NT-04 🔄 | Mark all notifications as read | 1. Click "Mark all read" | All notifications marked read; badge cleared |
| NT-05 🔄 | Delete notification | 1. Delete a notification | Notification removed from list |
| NT-06 🔄 | Delete all notifications | 1. Click "Delete all" | All notifications cleared |
| NT-07 ⚠️ | Real-time notifications (SSE) | 1. Another user takes action affecting you | Notification appears in real-time without refresh |
| NT-08 ⚠️ | Notification when application approved | 1. Staff approves business owner's application | Owner receives notification |
| NT-09 ⚠️ | Notification when application rejected | 1. Staff rejects application | Owner receives notification with reason |
| NT-10 ⚠️ | Notification when changes requested | 1. Staff requests changes | Owner notified with details |
| NT-11 ⚠️ | Notification for inspection scheduled | 1. Inspection assigned | Inspector + owner notified |
| NT-12 ⚠️ | Notification for violation issued | 1. Inspector issues violation | Owner notified |
| NT-13 ⚠️ | Notification for payment due | 1. Payment deadline approaching | Owner notified (cron) |
| NT-14 ⚠️ | Notification for post-requirement due | 1. Post-requirement deadline approaching | Owner notified (cron) |
| NT-15 ⚠️ | Notification for maintenance mode | 1. Admin enables maintenance | Users notified |
| NT-16 ⚠️ | Notification for account actions | 1. Password changed, email changed, etc. | User receives security notification |
| NT-17 ⚠️ | Empty notifications state | 1. No notifications | "No notifications" message |
| NT-18 ⚠️ | Notification with link | 1. Click notification | Navigates to relevant page |

---

## 12. Cross-Cutting / UI (Web)

### 12.1 Responsive Design

| ID | Scenario | Steps | Expected Behavior |
|----|----------|-------|-------------------|
| UI-RD-01 ⚠️ | Desktop layout (1920px) | 1. View on wide screen | Sidebar, content, panels all visible |
| UI-RD-02 ⚠️ | Tablet layout (768px) | 1. Resize to tablet | Sidebar collapses; content adapts |
| UI-RD-03 ⚠️ | Mobile layout (375px) | 1. Resize to mobile | Full-width; hamburger menu; single column |
| UI-RD-04 ⚠️ | Sidebar navigation | 1. Click sidebar items | Routes change; active item highlighted |
| UI-RD-05 ⚠️ | Mobile sidebar toggle | 1. On mobile 2. Click hamburger | Sidebar slides in/out |

### 12.2 Error Handling

| ID | Scenario | Steps | Expected Behavior |
|----|----------|-------|-------------------|
| UI-EH-01 ⚠️ | 404 page | 1. Navigate to `/nonexistent-route` | 404 page displayed with navigation options |
| UI-EH-02 ⚠️ | Error boundary (component crash) | 1. Component throws error | Error boundary catches; fallback UI shown |
| UI-EH-03 ⚠️ | API error → user feedback | 1. API returns 500 | Toast/alert: "Something went wrong" |
| UI-EH-04 ⚠️ | Network error (offline) | 1. Disconnect internet 2. Try action | Error: "No internet connection" or retry option |
| UI-EH-05 ⚠️ | API timeout | 1. Slow API response | Loading indicator; timeout error after threshold |
| UI-EH-06 ⚠️ | Validation error display | 1. Submit invalid form | Errors shown inline next to fields + summary |
| UI-EH-07 ⚠️ | Multiple validation errors | 1. Submit form with many errors | All errors displayed; scrolls to first error |

### 12.3 Loading States

| ID | Scenario | Steps | Expected Behavior |
|----|----------|-------|-------------------|
| UI-LS-01 ⚠️ | Page load skeleton | 1. Navigate to data-heavy page | Skeleton loaders shown while data loads |
| UI-LS-02 ⚠️ | Button loading state | 1. Click submit button | Button shows spinner; disabled during request |
| UI-LS-03 ⚠️ | Prevent double-submit | 1. Click submit rapidly | Only one request sent; button disabled |
| UI-LS-04 ⚠️ | Table loading | 1. Load table with many rows | Loading indicator; then data renders |

### 12.4 Navigation

| ID | Scenario | Steps | Expected Behavior |
|----|----------|-------|-------------------|
| UI-NV-01 ⚠️ | Browser back/forward | 1. Navigate through pages 2. Click back | Previous page restored correctly |
| UI-NV-02 ⚠️ | Direct URL access | 1. Paste URL directly in browser | Page loads correctly (if authenticated) |
| UI-NV-03 ⚠️ | Redirect after login | 1. Try to access protected page while logged out 2. Login | Redirected to originally requested page |
| UI-NV-04 ⚠️ | Logout → redirect to login | 1. Click logout | Redirected to `/login` |

---

## 13. Mobile Web Views — Per-Page Testing (Web at < 768px)

> The web app uses `Grid.useBreakpoint()` with `isMobile = !screens.md` (< 768px).
> Many pages render completely different components for mobile vs desktop.
> This section tests every page in the web app at mobile viewport width.

### 13.1 Sidebar & Navigation (Mobile)

| ID | Scenario | Steps | Expected Behavior |
|----|----------|-------|-------------------|
| MW-NAV-01 ✅ | Hamburger menu visible | 1. Resize to < 768px | Fixed hamburger button (top-left) visible; Sider hidden |
| MW-NAV-02 ✅ | Open mobile drawer | 1. Tap hamburger | Drawer slides in from left (260px) with full navigation |
| MW-NAV-03 ✅ | Navigate via drawer → auto-close | 1. Open drawer 2. Tap nav item | Drawer closes; page navigates |
| MW-NAV-04 ⚠️ | Drawer overlay click to close | 1. Open drawer 2. Tap outside drawer | Drawer closes |
| MW-NAV-05 ⚠️ | Role-specific nav items in drawer | 1. Login as each role 2. Open drawer | Only role-appropriate items shown |

### 13.2 Public Pages (Mobile)

| ID | Scenario | Steps | Expected Behavior |
|----|----------|-------|-------------------|
| MW-PUB-01 ✅ | Home page — mobile layout | 1. View `/` at mobile width | HeroSection: smaller font, adjusted padding; Header: compact logo, responsive nav |
| MW-PUB-02 ✅ | Home header — mobile | 1. View header | Logo resized for `screens.sm`; button text may truncate |
| MW-PUB-03 ✅ | Home footer — mobile | 1. View footer | Flex direction switches to column; padding adjusted |
| MW-PUB-04 ⚠️ | Terms of Service — mobile | 1. View `/terms` | ⚠️ NO mobile-specific handling — verify content still readable |
| MW-PUB-05 ⚠️ | Privacy Policy — mobile | 1. View `/privacy` | ⚠️ NO mobile-specific handling — verify content still readable |
| MW-PUB-06 ✅ | Maintenance page — mobile | 1. View `/maintenance` | Adjusted font sizes, padding for `screens.md` |

### 13.3 Authentication Pages (Mobile)

| ID | Scenario | Steps | Expected Behavior |
|----|----------|-------|-------------------|
| MW-AUTH-01 ✅ | Login form — mobile | 1. View `/login` at mobile width | Reduced spacing, smaller fonts, full-width inputs |
| MW-AUTH-02 ✅ | Sign up form — mobile | 1. View `/sign-up` | Same responsive treatment as login |
| MW-AUTH-03 ✅ | Forgot password — mobile | 1. View `/forgot-password` | Full-width layout, adjusted padding |
| MW-AUTH-04 ✅ | OTP verification forms — mobile | 1. Verification screens after login/signup | Code input centered, appropriate sizing |
| MW-AUTH-05 ✅ | TOTP verification — mobile | 1. TOTP prompt at mobile width | Input and instructions fit screen |
| MW-AUTH-06 ✅ | AuthLayout — mobile | 1. Any auth page | Padding, logo size, gap all adjusted for mobile |
| MW-AUTH-07 ✅ | Change password form — mobile | 1. In-app password change | Responsive layout |
| MW-AUTH-08 ✅ | Deletion pending screen — mobile | 1. View `/deletion-pending` | `screens.sm` / `isMobile` adjustments applied |
| MW-AUTH-09 ✅ | Passkey registration guide — mobile | 1. Register passkey | Modal width adjusted (`isMobile` prop) |
| MW-AUTH-10 ✅ | MFA setup page — mobile | 1. View `/signup/mfa-setup` | QR code and input fit mobile screen |

### 13.4 Business Owner Pages (Mobile)

| ID | Scenario | Steps | Expected Behavior |
|----|----------|-------|-------------------|
| MW-BO-01 ⚠️ | Dashboard — mobile | 1. View `/owner` at mobile width | ⚠️ NO mobile-specific handling — verify cards stack, no horizontal overflow |
| MW-BO-02 ✅ | Add business form — mobile | 1. Open add business | Two-panel layout collapses to single column; `isMobile` grid adjustments |
| MW-BO-03 ✅ | Dynamic form renderer — mobile | 1. Fill permit application form | `colSpan` adjusted via `isMobile` prop |
| MW-BO-04 ⚠️ | Business cards — mobile | 1. View business list | ⚠️ NO mobile handling on BusinessCard — verify no overflow |
| MW-BO-05 ⚠️ | Pending application view — mobile | 1. View pending business | ⚠️ NO mobile handling — verify readability |
| MW-BO-06 ⚠️ | Approved business view — mobile | 1. View approved business | ⚠️ NO mobile handling — verify readability |
| MW-BO-07 ✅ | Business owner layout header — mobile | 1. View header area | Logo size adjusted for `screens.sm` |
| MW-BO-08 ⚠️ | AI LOB recommendation — mobile | 1. Use AI recommendation feature | ⚠️ NO mobile handling — verify usability |
| MW-BO-09 ⚠️ | Fee preview — mobile | 1. View fee breakdown | Verify table/breakdown doesn't overflow |
| MW-BO-10 ⚠️ | Document upload — mobile | 1. Upload documents on mobile browser | File picker works; preview fits screen |

### 13.5 Staff / LGU Officer Pages (Mobile)

| ID | Scenario | Steps | Expected Behavior |
|----|----------|-------|-------------------|
| MW-ST-01 ✅ | Permit review page — mobile | 1. View `/staff/applications` | Walk-in uses Drawer on mobile; list adapts |
| MW-ST-02 ✅ | LGU officer dashboard — mobile | 1. View `/staff` as lgu_officer | Grid switches from 3-col to 1-col (`screens.md`) |
| MW-ST-03 ⚠️ | Application detail panel — mobile | 1. Open application detail (1426 lines) | ⚠️ NO mobile handling in this component — verify tabs don't overflow (CSS handles tab scroll) |
| MW-ST-04 ✅ | Permit application detail modal — mobile | 1. Open full detail modal | Width becomes `95%` (vs `1400px` desktop) |
| MW-ST-05 ✅ | Appeals page — mobile | 1. View `/staff/appeals` | Padding, modal width adjusted |
| MW-ST-06 ✅ | Cessation review — mobile | 1. View `/staff/cessation` | Padding, modal width adjusted |
| MW-ST-07 ✅ | Inspection management — mobile | 1. View `/staff/inspections` | Drawer width adjusted |
| MW-ST-08 ✅ | Reports page — mobile | 1. View `/staff/reports` | Grid columns: 4 → 2 (`screens.md`) |
| MW-ST-09 ✅ | LGU officer layout — mobile | 1. Any officer page | `isMobile` padding applied |
| MW-ST-10 ⚠️ | Walk-in form — mobile | 1. Create walk-in at mobile width | Drawer-based on mobile (from PermitReviewPage) |
| MW-ST-11 ⚠️ | Staff onboarding — mobile | 1. View `/staff/onboarding` | Verify form fits mobile screen |

### 13.6 Inspector / CSO Dashboards (Mobile Web)

| ID | Scenario | Steps | Expected Behavior |
|----|----------|-------|-------------------|
| MW-INS-01 ⚠️ | Inspector dashboard — mobile web | 1. View inspector dashboard at mobile width | Uses `Col xs={24} sm={12} md={8}` — Ant Design grid only; verify stacking |
| MW-INS-02 ⚠️ | CSO dashboard — mobile web | 1. View CSO dashboard | ⚠️ NO mobile handling verified — check usability |
| MW-INS-03 ⚠️ | Staff recovery request — mobile | 1. View recovery request page | ⚠️ NO mobile handling verified — check form layout |

### 13.7 LGU Manager Pages (Mobile)

| ID | Scenario | Steps | Expected Behavior |
|----|----------|-------|-------------------|
| MW-LM-01 ⚠️ | LGU Manager dashboard — mobile | 1. View `/lgu-manager` | ⚠️ NO mobile handling — verify metrics cards stack |
| MW-LM-02 ⚠️ | Reports & analytics — mobile | 1. View `/lgu-manager/reports` | ⚠️ NO mobile handling — charts may overflow |
| MW-LM-03 ⚠️ | Permit applications overview — mobile | 1. View `/lgu-manager/permit-applications` | ⚠️ NO mobile handling — verify table readability |
| MW-LM-04 ⚠️ | Cessation overview — mobile | 1. View `/lgu-manager/cessation` | ⚠️ NO mobile handling — verify layout |
| MW-LM-05 ⚠️ | Violations/inspections overview — mobile | 1. View `/lgu-manager/violations-inspections` | ⚠️ NO mobile handling — verify layout |
| MW-LM-06 ⚠️ | Assign inspection — mobile | 1. View `/lgu-manager/assign-inspection` | ⚠️ NO mobile handling — verify two-panel layout |
| MW-LM-07 ⚠️ | Appeals overview — mobile | 1. View `/lgu-manager/appeals` | ⚠️ NO mobile handling — verify layout |
| MW-LM-08 ✅ | LGU manager layout — mobile | 1. Any manager page | `isMobile` padding from layout wrapper |

### 13.8 Admin Pages (Mobile)

| ID | Scenario | Steps | Expected Behavior |
|----|----------|-------|-------------------|
| MW-AD-01 ✅ | Form definitions — mobile | 1. View `/admin/form-definitions` | Full `FormDefinitionsMobileView` rendered |
| MW-AD-02 ✅ | Maintenance page — mobile | 1. View `/admin/maintenance` | Full `MaintenanceMobileView` rendered |
| MW-AD-03 ✅ | Requests page — mobile | 1. View `/admin/requests` | Full `RequestsMobileView` rendered |
| MW-AD-04 ✅ | Finance — mobile | 1. View `/admin/finance` | `FinanceMobileView` rendered |
| MW-AD-05 ✅ | Security (audit/tamper) — mobile | 1. View `/admin/security` | `AuditTamperMobileView` rendered |
| MW-AD-06 ✅ | User management — mobile | 1. View `/admin/users` | `isMobile` passed to `UserManagementContent`; cards instead of tables |
| MW-AD-07 ✅ | Fee configuration — mobile | 1. View `/admin/fee-configuration` | `FeeConfigurationMobileView` rendered |
| MW-AD-08 ⚠️ | Admin dashboard — mobile | 1. View `/admin/dashboard` | ⚠️ NO mobile handling — verify KPI cards and activity log fit |
| MW-AD-09 ⚠️ | Admin onboarding — mobile | 1. View `/admin/onboarding` | ⚠️ NO mobile handling — verify wizard layout |
| MW-AD-10 ⚠️ | Penalty config — mobile | 1. View penalty tab | ⚠️ NO mobile handling — verify form layout |
| MW-AD-11 ⚠️ | General permit config — mobile | 1. View general permit config | ⚠️ NO mobile handling — verify layout |
| MW-AD-12 ⚠️ | LOB trainer — mobile | 1. View `/admin/lob-trainer` | Padding/width adjusted but no dedicated mobile view — verify tables scroll |
| MW-AD-13 ✅ | Form editor — mobile | 1. Edit form definition | `isMobile` prop adjusts field layout |
| MW-AD-14 ✅ | Form preview — mobile | 1. Preview form | ColSpan, padding adjusted via `isMobile` |
| MW-AD-15 ✅ | Modals (Drafts, AddVersion) — mobile | 1. Open modals | Width set to `95%` on mobile |
| MW-AD-16 ✅ | Staff/admin accounts tabs — mobile | 1. View users tabs | Card layout instead of table on mobile |
| MW-AD-17 ✅ | Info modals — mobile | 1. Open FormDefinitionsInfoModal, UserManagementInfoModal | `isMobile` prop adjusts layout |
| MW-AD-18 ✅ | Fee config logs tab — mobile | 1. View fee config logs | Card layout on mobile |
| MW-AD-19 ✅ | Security history tab — mobile | 1. View history tab | Card layout on mobile |
| MW-AD-20 ✅ | Tamper incidents tab — mobile | 1. View incidents | Card layout on mobile |

### 13.9 Common/User Pages (Mobile)

| ID | Scenario | Steps | Expected Behavior |
|----|----------|-------|-------------------|
| MW-CM-01 ✅ | Profile settings — mobile | 1. View `/settings-profile` | Two-panel layout collapses; `isMobile` adjustments |
| MW-CM-02 ✅ | Edit profile form — mobile | 1. Edit profile | Two-panel → single column |
| MW-CM-03 ✅ | Account tab — mobile | 1. View Account tab | `isMobile` conditional layout |
| MW-CM-04 ✅ | Security tab — mobile | 1. View Security tab | `isMobile` conditional layout |
| MW-CM-05 ✅ | Theme tab — mobile | 1. View Theme tab | `screens.xs` padding adjustments |
| MW-CM-06 ✅ | Notifications tab — mobile | 1. View Notifications preferences | `screens.xs` padding |
| MW-CM-07 ✅ | Notification history — mobile | 1. View `/notifications` | Two-panel → single list; list width adjusted |
| MW-CM-08 ✅ | Dashboard (user) — mobile | 1. View `/dashboard` | Padding adjusted |
| MW-CM-09 ✅ | Layout page header — mobile | 1. Any page with header | Font size, actions adjusted via `isMobile` |

### 13.10 Mobile View Gaps Summary

These pages have **NO mobile-specific handling** and need verification:

| Page | Risk Level | Concern |
|------|-----------|---------|
| AdminDashboard | Medium | KPI cards, activity log may overflow |
| AdminOnboarding | Low | Wizard may be too wide |
| AdminPenaltyConfig | Low | Form may not stack |
| AdminGeneralPermitConfig | Low | Form may not stack |
| BusinessOwnerDashboard | **High** | Main BO page; cards/detail panel may overflow |
| BusinessCard | Medium | Card layout may not adapt |
| PendingApplicationView | Medium | Content may overflow |
| ApprovedBusinessView | Medium | Content may overflow |
| AiLobRecommendation | Low | May not fit well |
| ApplicationDetailPanel (1426 lines) | **High** | Largest component; only CSS tab scroll; no layout changes |
| LGUManagerDashboard | **High** | Main LM page; no responsive logic |
| All LGU Manager sub-pages (7 pages) | **High** | Charts, tables, two-panel layouts with no mobile handling |
| InspectorDashboard (web) | Low | Ant grid only |
| CSODashboard | Low | Minimal content |
| StaffRecoveryRequest | Low | Simple form |
| TermsOfService | Low | Static content |
| PrivacyPolicy | Low | Static content |
| Home page (content) | Low | Header/footer handled but page body not |

---

## 14. API Error & Edge Cases (Backend)

### 13.1 Authentication API

| ID | Scenario | Expected Backend Behavior |
|----|----------|--------------------------|
| API-AU-01 ❌ | Missing Authorization header | 401 Unauthorized: `{ ok: false, error: { code: 'UNAUTHORIZED' } }` |
| API-AU-02 ❌ | Expired JWT | 401 Unauthorized |
| API-AU-03 ❌ | Invalid JWT signature | 401 Unauthorized |
| API-AU-04 ❌ | Insufficient role | 403 Forbidden |
| API-AU-05 ❌ | CSRF token mismatch | 403 Forbidden |
| API-AU-06 ❌ | Rate limit exceeded | 429 Too Many Requests |
| API-AU-07 ❌ | Invalid request body (Joi validation) | 400 Bad Request with validation details |
| API-AU-08 ⚠️ | Large request body (>25MB) | 413 Payload Too Large |
| API-AU-09 ⚠️ | Malformed JSON body | 400 Bad Request |

### 13.2 Business API

| ID | Scenario | Expected Backend Behavior |
|----|----------|--------------------------|
| API-BU-01 ❌ | Access other user's business | 403 Forbidden |
| API-BU-02 ❌ | Update non-existent business | 404 Not Found |
| API-BU-03 ❌ | Delete business with active applications | Error with explanation |
| API-BU-04 ⚠️ | Concurrent business update | Last write wins or conflict error |
| API-BU-05 ⚠️ | IPFS upload failure | Graceful degradation; stored locally as fallback |
| API-BU-06 ❌ | Fee calculation with missing config | Fallback or clear error |

### 13.3 Admin API

| ID | Scenario | Expected Backend Behavior |
|----|----------|--------------------------|
| API-AD-01 ❌ | Non-admin accesses admin endpoint | 403 Forbidden |
| API-AD-02 ❌ | Step-up required but not provided | 403 with step-up prompt |
| API-AD-03 ❌ | Create duplicate form definition | Error: "Name already exists" |
| API-AD-04 ⚠️ | Form definition with circular conditions | Validated and rejected |
| API-AD-05 ⚠️ | Maintenance mode edge — in-flight requests | Existing requests complete; new ones blocked |

### 13.4 Audit/Blockchain API

| ID | Scenario | Expected Backend Behavior |
|----|----------|--------------------------|
| API-AUD-01 ⚠️ | Audit log → blockchain anchor | Audit log queued → anchored to blockchain |
| API-AUD-02 ⚠️ | Blockchain service down | Queued for retry; system continues operating |
| API-AUD-03 ⚠️ | Verify audit log against blockchain | Returns verification result (match/mismatch) |
| API-AUD-04 ⚠️ | Tamper detected in audit log | Tamper incident created; admin notified |
| API-AUD-05 ⚠️ | Forensic analysis request | Returns detailed analysis with blockchain proof |

### 13.5 Cross-Service Communication

| ID | Scenario | Expected Backend Behavior |
|----|----------|--------------------------|
| API-CS-01 ⚠️ | Internal key authentication | X-Internal-Key validated for cross-service calls |
| API-CS-02 ❌ | Invalid internal key | 401 Unauthorized |
| API-CS-03 ⚠️ | Notification push (cross-service) | auth-service receives and stores notification |
| API-CS-04 ⚠️ | Service health check cascade | Each `/api/health` returns DB + dependency status |

---

## 15. End-to-End Cross-Role Workflows

> These test the full lifecycle of an action across multiple user roles and services.

### 15.1 Business Registration → Approval Lifecycle

| ID | Scenario | Steps | Expected Behavior |
|----|----------|-------|-------------------|
| E2E-REG-01 ✅ | Full registration → review → approval | 1. BO signs up 2. BO adds business 3. BO fills form + uploads docs 4. BO submits 5. Staff sees in pending list 6. Staff starts review 7. Staff approves | Business status: `draft` → `submitted` → `under_review` → `approved`; BO notified at each step |
| E2E-REG-02 🔄 | Registration → rejection → revision → re-approval | 1. BO submits 2. Staff rejects with reason 3. BO receives notification 4. BO revises and resubmits 5. Staff re-reviews 6. Staff approves | Status: `submitted` → `under_review` → `needs_revision` → `submitted` → `under_review` → `approved` |
| E2E-REG-03 🔄 | Registration → request changes → BO updates | 1. Staff requests changes on specific fields 2. BO sees notification 3. BO updates flagged fields 4. BO resubmits | Status transitions correctly; staff sees updated data |
| E2E-REG-04 ❌ | Invalid state transition attempt | 1. Try to approve an already-approved application | Backend rejects with state conflict error |
| E2E-REG-05 ⚠️ | BO views application status throughout | 1. At each stage, BO views dashboard | Status label and detail panel reflect current state |

### 15.2 Inspection Lifecycle

| ID | Scenario | Steps | Expected Behavior |
|----|----------|-------|-------------------|
| E2E-INS-01 ✅ | Assign → conduct → complete | 1. LGU Manager assigns inspection to inspector 2. Inspector receives notification (mobile) 3. Inspector starts inspection 4. Inspector completes checklist 5. Inspector submits 6. BO sees results | Full flow across 3 roles |
| E2E-INS-02 🔄 | Inspection with violation → BO acknowledges | 1. Inspector issues violation during inspection 2. BO receives violation notification 3. BO acknowledges violation | Violation visible to BO; acknowledgment recorded |
| E2E-INS-03 ⚠️ | Inspection → staff views results | 1. After inspector submits 2. Staff views inspection in management page | Results visible with checklist, findings, violations |

### 15.3 Appeal Lifecycle

| ID | Scenario | Steps | Expected Behavior |
|----|----------|-------|-------------------|
| E2E-APL-01 ✅ | BO appeals → staff reviews → approved | 1. BO submits appeal 2. Staff sees in appeals list 3. Staff approves | Appeal status updated; BO notified |
| E2E-APL-02 🔄 | BO appeals → rejected | 1. BO submits 2. Staff rejects with reason | BO sees rejection reason |

### 15.4 Payment Lifecycle

| ID | Scenario | Steps | Expected Behavior |
|----|----------|-------|-------------------|
| E2E-PAY-01 ✅ | Fees computed → BO pays | 1. After approval, fees calculated 2. BO views pending payment 3. BO initiates payment 4. Payment confirmed | Payment recorded; audit logged |
| E2E-PAY-02 ⚠️ | Late payment → penalty applied | 1. BO pays after deadline 2. View payment | Surcharge + interest automatically added |

### 15.5 Post-Requirement Lifecycle

| ID | Scenario | Steps | Expected Behavior |
|----|----------|-------|-------------------|
| E2E-POST-01 🔄 | Create → submit → verify | 1. Officer creates post-requirement 2. BO uploads document 3. Officer verifies | Status: `pending` → `submitted` → `verified` |
| E2E-POST-02 🔄 | Post-requirement → overdue → extend → submit | 1. Cron marks overdue 2. Officer extends due date 3. BO submits | Status: `pending` → `overdue` → `pending` → `submitted` |
| E2E-POST-03 ❌ | BO submits for wrong post-requirement | 1. Try submitting to someone else's requirement | 403 Forbidden |

### 15.6 Staff Account Lifecycle

| ID | Scenario | Steps | Expected Behavior |
|----|----------|-------|-------------------|
| E2E-STF-01 🔄 | Admin creates staff → staff onboards → staff works | 1. Admin creates staff (step-up) 2. Staff receives temp credentials 3. Staff logs in 4. Staff completes onboarding 5. Staff reviews applications | Full staff lifecycle |
| E2E-STF-02 🔄 | Staff recovery → admin issues temp creds → staff re-onboards | 1. Staff submits recovery request 2. Admin approves with temp credentials 3. Staff logs in with temp creds 4. Staff changes password + MFA | Recovery lifecycle |
| E2E-STF-03 ❌ | Staff tries admin action | 1. Staff navigates to admin URL | Redirected to own dashboard; 403 on API |

### 15.7 Admin Deletion Lifecycle

| ID | Scenario | Steps | Expected Behavior |
|----|----------|-------|-------------------|
| E2E-DEL-01 🔄 | Staff requests deletion → admin approves | 1. Staff requests deletion 2. Admin views request 3. Admin approves | Staff account scheduled for deletion |
| E2E-DEL-02 🔄 | Admin requests own deletion → other admin approves | 1. Admin A requests 2. Admin B approves | Admin A account scheduled for deletion |

---

## 16. Cron Jobs & Scheduled Tasks

> The system has 12+ cron jobs across 4 services. These must be tested for correctness.

### 16.1 Auth-Service Crons

| ID | Scenario | Steps | Expected Behavior |
|----|----------|-------|-------------------|
| CRON-AU-01 ⚠️ | Finalize account deletions (hourly) | 1. Schedule deletion 2. Wait past grace period 3. Cron runs | Account permanently deleted |
| CRON-AU-02 ⚠️ | Cleanup expired sessions/tokens (3am) | 1. Let sessions expire 2. Cron runs | Expired data cleaned up |
| CRON-AU-03 ⚠️ | MFA disable check (every 5 min) | 1. Request MFA disable 2. Wait for grace period 3. Cron runs | MFA disabled after grace period |

### 16.2 Admin-Service Crons

| ID | Scenario | Steps | Expected Behavior |
|----|----------|-------|-------------------|
| CRON-AD-01 ⚠️ | Finalize account deletions (2am) | 1. Admin approves staff deletion 2. Cron runs | Account finalized |
| CRON-AD-02 ⚠️ | Send deletion reminders (9am) | 1. Deletion scheduled 2. Cron runs | Reminder email/notification sent |
| CRON-AD-03 ⚠️ | Notify tamper incidents (every 10 min) | 1. Tamper detected 2. Cron runs | Admins notified of unacknowledged incidents |

### 16.3 Audit-Service Crons

| ID | Scenario | Steps | Expected Behavior |
|----|----------|-------|-------------------|
| CRON-AUD-01 ⚠️ | Verify audit integrity (hourly) | 1. Audit logs exist 2. Cron runs | Hashes verified against blockchain; tamper incident if mismatch |
| CRON-AUD-02 ⚠️ | Retry failed blockchain anchors (every 30 min) | 1. Anchor fails 2. Cron runs | Failed anchors retried and resolved |
| CRON-AUD-03 ❌ | Integrity check finds tampered log | 1. Manually modify audit log hash 2. Cron runs | Tamper incident created; admin notified |

### 16.4 Business-Service Crons

| ID | Scenario | Steps | Expected Behavior |
|----|----------|-------|-------------------|
| CRON-BU-01 ⚠️ | Renewal auto-flag (Jan 1) | 1. Active businesses exist 2. Cron runs on Jan 1 | Renewal drafts created for eligible businesses |
| CRON-BU-02 ⚠️ | Monthly interest calculation (1st of month) | 1. Overdue renewals exist 2. Cron runs | Surcharge + interest applied |
| CRON-BU-03 ⚠️ | Abandoned detection (1st of month) | 1. Draft businesses inactive for threshold 2. Cron runs | Flagged as abandoned |
| CRON-BU-04 ⚠️ | Post-requirement overdue (hourly) | 1. Post-requirements past due date 2. Cron runs | Status changed to `overdue` |
| CRON-BU-05 ⚠️ | Notification reminders (9am) | 1. Upcoming due dates 2. Cron runs | Owners notified of approaching deadlines |
| CRON-BU-06 ❌ | Cron runs but DB is unavailable | 1. Simulate DB connection failure during cron | Error logged; no crash; retries on next cycle |
| CRON-BU-07 ❌ | Cron double-execution prevention | 1. Two instances run simultaneously | Only one processes; no duplicate records |

---

## 17. Infrastructure — IPFS, Blockchain & SSE

### 17.1 IPFS

| ID | Scenario | Steps | Expected Behavior |
|----|----------|-------|-------------------|
| INFRA-IPFS-01 ✅ | Upload document to IPFS | 1. BO uploads business document | File stored; CID returned and saved to DB |
| INFRA-IPFS-02 ✅ | Retrieve document from IPFS | 1. Staff opens application documents | Documents fetched via IPFS gateway using CID |
| INFRA-IPFS-03 ❌ | IPFS upload failure (node down) | 1. IPFS service unavailable 2. Try uploading | Fallback storage or clear error message |
| INFRA-IPFS-04 ❌ | IPFS gateway timeout on retrieval | 1. Gateway slow 2. Open document | Loading indicator; timeout error with retry option |
| INFRA-IPFS-05 ⚠️ | IPFS CID resolution for avatars | 1. User uploads avatar 2. Avatar stored with CID | Avatar displayed via IPFS gateway URL |
| INFRA-IPFS-06 ⚠️ | Pinata fallback | 1. Local IPFS fails 2. Pinata configured | Fallback to Pinata/Infura for upload/retrieval |
| INFRA-IPFS-07 ⚠️ | IPFS dependency status in maintenance page | 1. Admin views maintenance overview | IPFS health status shown correctly |

### 17.2 Blockchain (Ganache/Truffle)

| ID | Scenario | Steps | Expected Behavior |
|----|----------|-------|-------------------|
| INFRA-BC-01 ✅ | Audit log anchored to blockchain | 1. Action creates audit log 2. Queue processes | Hash stored on-chain; `blockchainTxHash` populated |
| INFRA-BC-02 ⚠️ | Verify audit log against blockchain | 1. Navigate to audit log 2. Click "Verify" | Blockchain hash compared; match/mismatch reported |
| INFRA-BC-03 ❌ | Blockchain service down | 1. Ganache not running 2. Action creates audit log | Log saved locally; queued for blockchain; no user-facing error |
| INFRA-BC-04 ⚠️ | Blockchain queue backlog | 1. Many audit events at once | Queue processes in order; no data loss |
| INFRA-BC-05 ❌ | Blockchain anchor retry after failure | 1. First anchor fails 2. Retry cron runs | Successfully anchored on retry |
| INFRA-BC-06 ⚠️ | Critical event logged to blockchain | 1. Security event (tamper, admin approval) | `logCriticalEvent` or `logAdminApproval` called |
| INFRA-BC-07 ⚠️ | User registered in blockchain | 1. New user signs up | `registerUser` called on UserRegistry contract |
| INFRA-BC-08 ⚠️ | Document CID stored on blockchain | 1. Avatar uploaded to IPFS 2. CID stored | DocumentStorage contract records CID |
| INFRA-BC-09 ⚠️ | Forensic analysis endpoint | 1. Call `/api/audit/forensic/:auditLogId` | Detailed analysis with blockchain proof returned |
| INFRA-BC-10 ❌ | Tampered audit log detected by integrity check | 1. Modify log hash 2. Integrity cron runs | Tamper incident created; contained |

### 17.3 SSE (Server-Sent Events)

| ID | Scenario | Steps | Expected Behavior |
|----|----------|-------|-------------------|
| INFRA-SSE-01 ✅ | Establish SSE connection | 1. Login 2. Get stream token 3. Connect to `/api/notifications/stream` | EventSource connected; keepalive pings received |
| INFRA-SSE-02 ⚠️ | Receive real-time notification | 1. Another user takes action 2. Cross-service notification pushed | Notification appears in real-time; badge updates |
| INFRA-SSE-03 ❌ | SSE connection drops → reconnect | 1. Network blip 2. Connection lost | Auto-reconnect with backoff; no duplicate notifications |
| INFRA-SSE-04 ❌ | SSE token expired | 1. Token expires during connection | Connection closed; new token requested; reconnect |
| INFRA-SSE-05 ⚠️ | SSE keepalive | 1. Connection idle | Keepalive pings prevent timeout (from `notificationStreamRegistry`) |
| INFRA-SSE-06 ❌ | SSE with invalid token | 1. Use expired/invalid token | Connection rejected |
| INFRA-SSE-07 ⚠️ | Multiple tabs → multiple SSE connections | 1. Open app in 3 tabs | Each tab gets its own stream; all receive notifications |
| INFRA-SSE-08 ⚠️ | Logout → SSE cleanup | 1. Logout | SSE connection closed; registry entry removed |

---

## 18. Dual-Approval Workflows

| ID | Scenario | Steps | Expected Behavior |
|----|----------|-------|-------------------|
| DUAL-01 ✅ | Create approval request | 1. Admin initiates sensitive change 2. Approval request created | Status `pending`; other admins notified |
| DUAL-02 ✅ | Two admins approve → change applied | 1. Admin A creates request 2. Admin B approves 3. Admin C approves | `requiredApprovals: 2` met; change auto-applied; blockchain logged |
| DUAL-03 ✅ | Two admins reject → request rejected | 1. Admin B rejects 2. Admin C rejects | Status → `rejected`; requester notified |
| DUAL-04 ✅ | Mixed votes (1 approve + 1 reject) → pending | 1. Admin B approves 2. Admin C rejects | Still `pending` (need 2 of same) |
| DUAL-05 ❌ | Admin votes on own request | 1. Admin A creates request 2. Admin A tries to approve | Blocked: "Cannot vote on your own request" |
| DUAL-06 ❌ | Admin votes twice | 1. Admin B approves 2. Admin B tries to approve again | Blocked: "Already voted" |
| DUAL-07 ❌ | Non-admin tries to vote | 1. Staff accesses approval endpoint | 403 Forbidden |
| DUAL-08 ⚠️ | Approval with comment | 1. Admin votes with comment | Comment stored and visible |
| DUAL-09 ⚠️ | Expired approval | 1. No one votes within time limit | Status → `expired` |
| DUAL-10 ⚠️ | Applied change logged to blockchain | 1. Approval completes | `logAdminApproval` called on-chain |
| DUAL-11 ⚠️ | Approval types | 1. Test each type: `email_change`, `password_change`, `personal_info_change`, `account_status_change`, `role_change`, `maintenance_mode` | Each type flows through correctly |
| DUAL-12 ⚠️ | Form definition publish requires approval | 1. Submit form for approval 2. Two admins approve | Form becomes active |
| DUAL-13 🔄 | Maintenance mode dual-approval | 1. Admin requests maintenance 2. Two approvals | Maintenance mode activated |
| DUAL-14 ❌ | Approval with only 1 admin in system | 1. Only 1 admin exists 2. Try sensitive action | Should handle gracefully (either allow or explain) |

---

## 19. Fee & Penalty Calculation

| ID | Scenario | Steps | Expected Behavior |
|----|----------|-------|-------------------|
| FEE-01 ✅ | Basic fee calculation by LOB | 1. Select a line of business 2. View fee preview | Mayor's permit + business tax + sanitary + fire safety + environmental fees computed |
| FEE-02 ✅ | Tiered/bracket business tax | 1. Business with gross receipts in bracket range | Tax calculated per configured rate/tier/fixed |
| FEE-03 ✅ | Sanitary fee by floor area | 1. Business with specific floor area | Correct bracket applied |
| FEE-04 ✅ | Fire safety fee (15% of BPLO, min P500) | 1. Compute fees | Fire safety = max(15% of regulatory, P500) |
| FEE-05 ⚠️ | Fee config not found for LOB | 1. LOB with no fee config | Warning returned; fallback or zero |
| FEE-06 ⚠️ | Multiple business activities | 1. Business with 3+ LOBs | Fees computed per activity and summed |
| FEE-07 ⚠️ | Zero gross receipts | 1. New business with no receipts | Minimum fees or fixed amounts applied |
| FEE-08 ⚠️ | Very large gross receipts | 1. Business with P100M+ receipts | Correct bracket; no overflow |
| FEE-09 ❌ | Penalty — on time (before Jan 20) | 1. Submit renewal Jan 15 | Zero penalty |
| FEE-10 ⚠️ | Penalty — late (after Jan 20) | 1. Submit renewal Feb 15 | Surcharge (25%) + interest (2% × 1 month) |
| FEE-11 ⚠️ | Penalty — very late (6 months) | 1. Submit renewal Jul 15 | Surcharge (25%) + interest (2% × 6 months) |
| FEE-12 ⚠️ | Penalty boundary (Jan 20 at 11:59 PM) | 1. Submit at exact deadline | No penalty (inclusive) |
| FEE-13 ⚠️ | Monthly interest compounding | 1. Each month after deadline | Interest accumulates per month |
| FEE-14 ❌ | Fee calculation with missing config field | 1. FeeConfiguration missing a bracket | Graceful error or warning |
| FEE-15 ❌ | Negative gross receipts | 1. Enter negative value | Validation error |
| FEE-16 ⚠️ | Walk-in fee computation | 1. Officer creates walk-in 2. Computes fees | Same calculation as online; breakdown returned |

---

## 20. File Upload, Scanning & Export

### 20.1 Upload & Scanning

| ID | Scenario | Steps | Expected Behavior |
|----|----------|-------|-------------------|
| FILE-UP-01 ✅ | Upload valid business document | 1. Upload PDF < size limit | File accepted; stored to IPFS |
| FILE-UP-02 ✅ | Upload avatar image | 1. Upload JPEG/PNG | Image validated; stored; displayed |
| FILE-UP-03 ❌ | Upload file with malware (ClamAV) | 1. ClamAV configured 2. Upload infected file | File rejected: "Malware detected" |
| FILE-UP-04 ❌ | Upload with invalid magic bytes | 1. Rename .exe to .pdf 2. Upload | `validateMagicBytes` rejects: "Invalid file type" |
| FILE-UP-05 ❌ | Upload above size limit | 1. Upload file > max | Error: "File too large" |
| FILE-UP-06 ⚠️ | Upload when ClamAV not configured | 1. No `CLAMAV_HOST` set 2. Upload | File accepted without scan (graceful degradation) |
| FILE-UP-07 ⚠️ | Inspection evidence upload (mobile) | 1. Inspector uploads photo via Flutter | File scanned (if configured); attached to inspection |

### 20.2 Export & Download

| ID | Scenario | Steps | Expected Behavior |
|----|----------|-------|-------------------|
| FILE-EX-01 ✅ | Export audit logs as CSV | 1. Admin clicks "Export" in audit section | CSV file downloaded with audit data |
| FILE-EX-02 ✅ | Export LOB training examples | 1. Admin exports from LOB trainer | CSV/JSON downloaded |
| FILE-EX-03 ⚠️ | Export large dataset | 1. Export with thousands of records | Download completes; no timeout |
| FILE-EX-04 ⚠️ | Download form template PDF | 1. View form with downloadable template 2. Click download | PDF downloaded (sworn-statement, affidavit, etc.) |
| FILE-EX-05 ⚠️ | Download requirements checklist PDF | 1. BO clicks "Download Requirements" | PDF generated by pdfkit and downloaded |
| FILE-EX-06 ❌ | Export with no data | 1. Export when no records match filters | Empty file or "No data to export" message |
| FILE-EX-07 ✅ | Admin export logs modal — different log types | 1. Open ExportLogsModal 2. Select: user mgmt, security, forms, fee config | Each export type generates correct CSV |
| FILE-EX-08 ⚠️ | LGU Manager generate report | 1. Select report type 2. Generate | Report generated (PDF or data) |
| FILE-EX-09 ⚠️ | Admin payment report export | 1. Generate payment report | Report with summary and detail |
| FILE-EX-10 ❌ | Export with invalid date range | 1. Set end before start 2. Export | Error: "Invalid date range" |

---

## 21. Pagination, Search & URL Parameters

### 21.1 Pagination

| ID | Scenario | Steps | Expected Behavior |
|----|----------|-------|-------------------|
| PAG-01 ✅ | Standard pagination | 1. View list with 50+ items 2. Navigate pages | Correct items per page; page controls work |
| PAG-02 ⚠️ | First page / last page boundaries | 1. On page 1, click "Previous" | Disabled or no action |
| PAG-03 ⚠️ | Page beyond max | 1. URL hack: `?page=9999` | Empty results or redirect to last page |
| PAG-04 ❌ | Invalid page param | 1. URL: `?page=-1` or `?page=abc` | Defaults to page 1 |
| PAG-05 ❌ | Invalid limit param | 1. URL: `?limit=0` or `?limit=10000` | Clamped to valid range |
| PAG-06 ⚠️ | Empty results page | 1. Filter produces 0 results | "No results found" message |
| PAG-07 ⚠️ | `hasMore` indicator | 1. On last page | `hasMore: false` in response; "Next" disabled |

### 21.2 Search

| ID | Scenario | Steps | Expected Behavior |
|----|----------|-------|-------------------|
| PAG-08 ✅ | Search users (admin) | 1. Type in search box | Results filter in real-time or on submit |
| PAG-09 ✅ | Search applications (staff) | 1. Type business name or ID | Matching applications shown |
| PAG-10 ⚠️ | Search with no results | 1. Search for "zzzznonexistent" | "No results" message |
| PAG-11 ❌ | Search with special characters | 1. Search for `<script>` or `%00` | Sanitized; no injection |

### 21.3 URL Parameters & Deep Links

| ID | Scenario | Steps | Expected Behavior |
|----|----------|-------|-------------------|
| URL-01 ⚠️ | Tab state persisted in URL | 1. Switch tabs on admin pages 2. Copy URL 3. Paste in new tab | Same tab active (via `useSearchParams`) |
| URL-02 ⚠️ | Incident ID in URL | 1. Open tamper incident via URL with `?incidentId=xxx` | Correct incident opened in detail panel |
| URL-03 ❌ | URL with someone else's resource ID (IDOR) | 1. Change `:id` in URL to another user's resource | 403 Forbidden or 404 Not Found |

---

## 22. Accessibility & Browser Compatibility

### 22.1 Accessibility

| ID | Scenario | Steps | Expected Behavior |
|----|----------|-------|-------------------|
| A11Y-01 ⚠️ | Keyboard navigation — login form | 1. Tab through login form | Focus order: email → password → submit; visible focus ring |
| A11Y-02 ⚠️ | Keyboard navigation — sidebar | 1. Tab to sidebar items 2. Enter to navigate | All items reachable; Enter activates |
| A11Y-03 ⚠️ | Screen reader — form labels | 1. Use VoiceOver/NVDA on forms | All inputs have associated labels |
| A11Y-04 ⚠️ | Screen reader — error messages | 1. Submit invalid form | Errors announced by screen reader (aria-live or role="alert") |
| A11Y-05 ⚠️ | ARIA labels on icon buttons | 1. Inspect icon-only buttons | `aria-label` present (Refresh, Close, Toggle filters) |
| A11Y-06 ⚠️ | Color contrast | 1. Check text/background ratios | Meets WCAG AA (4.5:1 for normal text) |
| A11Y-07 ⚠️ | Focus management on modals | 1. Open modal | Focus trapped inside modal; returns to trigger on close |
| A11Y-08 ⚠️ | Focus management on route change | 1. Navigate via sidebar | Focus moves to main content or page heading |

### 22.2 Browser Compatibility

| ID | Scenario | Steps | Expected Behavior |
|----|----------|-------|-------------------|
| BROW-01 ⚠️ | Chrome (latest) | 1. Full test suite | All features work |
| BROW-02 ⚠️ | Firefox (latest) | 1. Full test suite | All features work |
| BROW-03 ⚠️ | Safari (latest) | 1. Full test suite | Passkeys may differ; CSS verified |
| BROW-04 ⚠️ | Edge (latest) | 1. Full test suite | All features work |

---

## 23. Multi-Tab & Concurrency

| ID | Scenario | Steps | Expected Behavior |
|----|----------|-------|-------------------|
| CONC-01 ⚠️ | Same user, two tabs — session sync | 1. Open app in 2 tabs 2. Logout in tab 1 | Tab 2 detects logout; redirects to login |
| CONC-02 ⚠️ | Same user, two tabs — notification sync | 1. Open 2 tabs 2. Notification arrives | Both tabs show notification (separate SSE connections) |
| CONC-03 ⚠️ | Two officers review same application | 1. Officer A starts review 2. Officer B tries | Officer B blocked: already under review |
| CONC-04 ❌ | Concurrent profile edit | 1. Edit profile in tab 1 and tab 2 2. Both save | Last write wins or conflict error |
| CONC-05 ❌ | Race condition on payment | 1. Click "Pay" rapidly in 2 tabs | Only one payment processed |
| CONC-06 ⚠️ | Theme change syncs across tabs | 1. Change theme in tab 1 | Tab 2 reflects new theme (if synced) |
| CONC-07 ⚠️ | Browser back during form submission | 1. Submit form 2. Immediately click back | Form not re-submitted; state handled |
| CONC-08 ⚠️ | Stale data after tab switch | 1. Tab idle for 10 min 2. Switch back | Data refreshes or stale data warning |

---

## 24. DevTools & Dev-Only Features

| ID | Scenario | Steps | Expected Behavior |
|----|----------|-------|-------------------|
| DEV-01 ✅ | DevFab visible in development | 1. Run in `NODE_ENV=development` | Floating action button visible |
| DEV-02 ✅ | DevPanel actions work | 1. Open DevPanel 2. Trigger actions (simulate tamper, progress permit, etc.) | Actions execute; data changes visible |
| DEV-03 ❌ | DevFab hidden in production | 1. Build for production | No DevFab, DevPanel, or dev-only routes |
| DEV-04 ⚠️ | Dev bypass codes not in production | 1. In production: `BYPASS_MFA_DEV`, `devCode` | Not present in responses; no bypass possible |
| DEV-05 ⚠️ | Dev seed data only in development | 1. `seedDev.js` | Only runs in development; no test data in production |
| DEV-06 ⚠️ | Simulated attack panel | 1. In dev, open `DevSimulatedAttackPanel` | XSS, CSRF, injection simulations work for testing |
| DEV-07 ⚠️ | Dev-only staff recovery features | 1. In production, check `/api/auth/staff/recovery-request` | Dev-only shortcuts not available |

---

## 25. Link Existing Account

| ID | Scenario | Steps | Expected Behavior |
|----|----------|-------|-------------------|
| LINK-01 ✅ | Link existing account to passkey | 1. User has password account 2. On sign-up, detects existing email 3. Modal offers to link 4. User verifies | Account linked; passkey added to existing account |
| LINK-02 ✅ | Link → verify OTP | 1. Start link 2. Verify code sent to existing email | Link completed |
| LINK-03 ❌ | Link with wrong verification code | 1. Enter wrong code | Error: "Invalid code" |
| LINK-04 ❌ | Link to non-existent account | 1. Try to link email that doesn't exist | Error: "Account not found" |
| LINK-05 ❌ | Link when already linked | 1. Try to link already-linked account | Error or graceful handling |
| LINK-06 ⚠️ | Link account modal UI | 1. `LinkExistingAccountModal` appears | Modal shows clear instructions, email, verification input |
| LINK-07 ⚠️ | Cancel link flow | 1. Start link 2. Close modal | Flow cancelled; no partial state |

---

## 26. Renewal Full Lifecycle

| ID | Scenario | Steps | Expected Behavior |
|----|----------|-------|-------------------|
| RENEW-01 ✅ | Check renewal period | 1. GET `/business-renewal/:id/period` | Returns period dates, penalty info, eligibility |
| RENEW-02 ✅ | Start renewal | 1. POST `/business-renewal/:id/start` | Renewal draft created |
| RENEW-03 ✅ | Acknowledge period | 1. POST `.../acknowledge-period` | Period acknowledged; proceed to next step |
| RENEW-04 ✅ | Submit gross receipts | 1. POST `.../gross-receipts` with calendar year data | Gross receipts recorded; fees recalculated |
| RENEW-05 🔄 | Upload renewal documents | 1. POST `.../documents/upload-file` | Documents uploaded to IPFS |
| RENEW-06 🔄 | View renewal assessment | 1. GET `.../assessment` | Fee breakdown + penalty (if late) |
| RENEW-07 ❌ | Renewal for non-eligible business | 1. Try to renew business not yet due | Error: "Not eligible for renewal" |
| RENEW-08 ❌ | Renewal with missing gross receipts | 1. Skip gross receipts step | Validation error |
| RENEW-09 ❌ | Renewal with invalid documents | 1. Upload invalid file type | File validation error |
| RENEW-10 ⚠️ | Auto-flag by cron (Jan 1) | 1. Cron runs 2. Active businesses flagged | Renewal drafts created; owners notified |
| RENEW-11 ⚠️ | Late renewal penalty assessment | 1. Start renewal in March | Assessment includes surcharge + interest |
| RENEW-12 ⚠️ | Renewal dashboard alert | 1. Business approaching renewal deadline | Alert visible on BO dashboard |

---

## 27. Walk-In Full Lifecycle

| ID | Scenario | Steps | Expected Behavior |
|----|----------|-------|-------------------|
| WALKIN-01 ✅ | Search owner by PIS | 1. Staff searches PIS data | User found via auth-service cross-call |
| WALKIN-02 ✅ | Create walk-in application | 1. Fill PIS + business data + activities 2. Submit | Application created; `applicationStatus: submitted` |
| WALKIN-03 ✅ | Compute walk-in fees | 1. POST `.../compute-fees` with activities | Fee breakdown returned |
| WALKIN-04 ❌ | Walk-in with missing required fields | 1. Leave business name blank | Validation error |
| WALKIN-05 ❌ | Walk-in for non-existent user | 1. Search PIS returns no results | "No user found" with option to proceed manually |
| WALKIN-06 ❌ | Walk-in by unauthorized role | 1. Business owner tries walk-in endpoint | 403 Forbidden |
| WALKIN-07 ⚠️ | Walk-in as draft | 1. Submit with `draft: true` | Saved as draft; not submitted yet |
| WALKIN-08 ⚠️ | Walk-in audit trail | 1. Create walk-in | `walk_in_registered` audit event logged |
| WALKIN-09 ⚠️ | Walk-in → regular review flow | 1. After walk-in submitted 2. Staff reviews normally | Same review flow as online applications |

---

## 28. Email Delivery

| ID | Scenario | Steps | Expected Behavior |
|----|----------|-------|-------------------|
| EMAIL-01 ✅ | OTP email received | 1. Trigger OTP (signup/login/password reset) | Email arrives within seconds; contains valid code |
| EMAIL-02 ✅ | Password change notification | 1. Change password | Notification email sent to user |
| EMAIL-03 ⚠️ | Email change notification (old + new) | 1. Change email | Both old and new email addresses receive notification |
| EMAIL-04 ⚠️ | Staff temporary credentials email | 1. Admin creates staff | Email with temp credentials sent |
| EMAIL-05 ⚠️ | MFA/passkey change notification | 1. Enable/disable MFA or add/remove passkey | Security notification email sent |
| EMAIL-06 ⚠️ | Admin alert email (tamper) | 1. Tamper incident detected | Admin alert email sent via `sendAdminAlertEmail` |
| EMAIL-07 ❌ | Email provider down (SendGrid) | 1. SendGrid unavailable 2. Trigger OTP | Fallback provider (Mailgun/SES/Resend/Postmark) used |
| EMAIL-08 ❌ | All email providers down | 1. All providers fail | Error logged; user sees "Unable to send email, try again" |
| EMAIL-09 ❌ | Email to invalid address | 1. Enter "test@nonexistent.invalid" | Bounce handled gracefully; no crash |

---

## 29. Security Hardening (OWASP-Aligned)

> App-specific security tests based on actual configuration found in the codebase.

### 29.1 Injection Attacks

| ID | Scenario | Steps | Expected Behavior |
|----|----------|-------|-------------------|
| SEC-INJ-01 ❌ | XSS via business name | 1. Add business with name `<img src=x onerror=alert(1)>` | `sanitizeString()` strips tags; no script execution |
| SEC-INJ-02 ❌ | XSS via profile first name | 1. PATCH `/api/auth/profile` with `<script>` in firstName | `sanitizeName()` strips tags |
| SEC-INJ-03 ❌ | NoSQL injection via login email | 1. POST `/api/auth/login/start` with `{"email": {"$gt": ""}}` | Mongoose rejects; no data leak |
| SEC-INJ-04 ❌ | NoSQL injection via search | 1. GET `/api/auth/users/search?q={"$gt":""}` | Sanitized; no injection |
| SEC-INJ-05 ❌ | Command injection via file name | 1. Upload file named `; rm -rf /` | Filename sanitized; no shell exec |
| SEC-INJ-06 ⚠️ | SQL injection detection | 1. Input `'; DROP TABLE users;--` in any field | `containsSqlInjection()` detects; security event logged |
| SEC-INJ-07 ⚠️ | XSS detection by security monitor | 1. Input `<script>` in request | `securityMonitor` flags suspicious pattern; audit logged |

### 29.2 Authentication & Session Security

| ID | Scenario | Steps | Expected Behavior |
|----|----------|-------|-------------------|
| SEC-AUTH-01 ⚠️ | JWT in localStorage (XSS risk) | 1. Inspect localStorage for `auth__currentUser` | Token present — document this as known risk |
| SEC-AUTH-02 ⚠️ | Token not in URL (except SSE) | 1. Check all API calls | Only SSE `/stream?token=` uses URL token; short-lived (60s), one-time |
| SEC-AUTH-03 ⚠️ | bcrypt cost factor adequate | 1. Verify password hash cost | Cost factor = 10 (adequate for current hardware) |
| SEC-AUTH-04 ⚠️ | Session cookie security | 1. Inspect session cookie | `secure: true` in production, `sameSite: lax` |
| SEC-AUTH-05 ⚠️ | CSRF double-submit pattern | 1. Inspect CSRF cookie | `httpOnly: false` (SPA reads for header); `secure` in production |
| SEC-AUTH-06 ❌ | Replay old JWT after logout | 1. Copy JWT 2. Logout 3. Use copied JWT | Token should be invalid (session invalidated) |
| SEC-AUTH-07 ❌ | Brute force login (rate limit) | 1. Send 6+ login attempts in 10 min | Rate limited: 5/10min; 429 response |
| SEC-AUTH-08 ❌ | Brute force OTP (rate limit) | 1. Send 6+ OTP verifications in 10 min | Rate limited: 5/10min; 429 response |

### 29.3 Security Headers & CORS

| ID | Scenario | Steps | Expected Behavior |
|----|----------|-------|-------------------|
| SEC-HDR-01 ⚠️ | CSP header present | 1. Check response headers | `Content-Security-Policy` with `default-src 'self'` |
| SEC-HDR-02 ⚠️ | X-Frame-Options header | 1. Check response headers | `SAMEORIGIN` (Helmet default) |
| SEC-HDR-03 ⚠️ | X-Content-Type-Options | 1. Check response headers | `nosniff` (Helmet default) |
| SEC-HDR-04 ⚠️ | Strict-Transport-Security | 1. Check response headers | HSTS present (Helmet default) |
| SEC-HDR-05 ❌ | CORS from unauthorized origin | 1. Request from `http://evil.com` | Blocked if `CORS_ORIGIN` is set (⚠️ defaults to `*` if unset) |
| SEC-HDR-06 ⚠️ | CSP blocks inline scripts | 1. Try inline `<script>` | Blocked by `scriptSrc: ["'self'"]` |
| SEC-HDR-07 ⚠️ | Turnstile iframe allowed | 1. CAPTCHA loads | `frameSrc: ["https://challenges.cloudflare.com"]` allows it |

### 29.4 Error Information Leakage

| ID | Scenario | Steps | Expected Behavior |
|----|----------|-------|-------------------|
| SEC-ERR-01 ⚠️ | 500 error in production | 1. Trigger server error in prod | Generic "An unexpected error occurred" — no stack trace |
| SEC-ERR-02 ⚠️ | 500 error in development | 1. Trigger server error in dev | Full error message + stack trace included |
| SEC-ERR-03 ⚠️ | Correlation ID in error response | 1. Trigger error | `correlationId` in response for debugging |
| SEC-ERR-04 ❌ | Login error doesn't leak user existence | 1. Login with non-existent email | Same error as wrong password |

### 29.5 Account Lockout & Containment

| ID | Scenario | Steps | Expected Behavior |
|----|----------|-------|-------------------|
| SEC-LOCK-01 ✅ | Account locks after 5 failed attempts | 1. Enter wrong password 5 times | Account locked for 15 minutes |
| SEC-LOCK-02 ✅ | Lockout banner displayed | 1. After lockout | Banner shows countdown timer |
| SEC-LOCK-03 ⚠️ | Lockout auto-expires | 1. Wait 15 minutes after lockout | Account unlocked; `unlockAccounts` job runs |
| SEC-LOCK-04 ⚠️ | Lockout clears on successful login | 1. After lockout expires 2. Login successfully | Failed attempts counter reset |
| SEC-LOCK-05 ⚠️ | Lockout applies to password reset too | 1. Brute-force password reset codes | Lockout triggered |
| SEC-LOCK-06 🔄 | Tamper containment blocks user | 1. Tamper detected for user 2. `containmentActive: true` | User receives 423 `ACCOUNT_CONTAINED` on all requests |
| SEC-LOCK-07 🔄 | Admin toggles containment | 1. Admin acknowledges incident 2. Toggles containment off | User uncontained; can access again |
| SEC-LOCK-08 ⚠️ | Containment refreshes every 60s | 1. Contain user 2. Check within 60s | `containmentCheck` middleware refreshes list |
| SEC-LOCK-09 ❌ | Lockout on delete account code | 1. Brute-force delete account codes | Lockout triggered after 5 attempts |

### 29.6 Security Monitoring

| ID | Scenario | Steps | Expected Behavior |
|----|----------|-------|-------------------|
| SEC-MON-01 ⚠️ | Failed login tracking | 1. Fail login 5+ times from same IP | Security event logged; alert triggered |
| SEC-MON-02 ⚠️ | Rate limit violation tracking | 1. Hit rate limit 10+ times from same IP+path | Security event logged |
| SEC-MON-03 ⚠️ | Suspicious user-agent detection | 1. Send request with empty User-Agent | Flagged as suspicious; logged |
| SEC-MON-04 ⚠️ | Rapid request detection | 1. Send many requests quickly | Flagged; tracked |
| SEC-MON-05 ⚠️ | Security events visible to admin | 1. Admin views security dashboard | All security events displayed with details |

---

## 30. Philippine Address (PSGC) Integration

| ID | Scenario | Steps | Expected Behavior |
|----|----------|-------|-------------------|
| PSGC-01 ✅ | Province cascading | 1. Open address form 2. Select province | Cities/municipalities for that province load |
| PSGC-02 ✅ | City cascading | 1. Select city | Barangays for that city load |
| PSGC-03 ✅ | Barangay selection | 1. Select barangay | Value stored correctly |
| PSGC-04 🔄 | Change province → clears city and barangay | 1. Select province A 2. Select city 3. Change to province B | City and barangay fields reset |
| PSGC-05 🔄 | Change city → clears barangay | 1. Select city A 2. Select barangay 3. Change to city B | Barangay field reset |
| PSGC-06 ⚠️ | Alaminos-only address fields | 1. Use `AlaminosAddressFields` component | Only Alaminos barangays shown; no province/city selection needed |
| PSGC-07 ⚠️ | PSGC API down | 1. `psgc.gitlab.io` unreachable 2. Open address form | Graceful error; manual input fallback or cached data |
| PSGC-08 ⚠️ | PSGC slow response | 1. Slow network | Loading spinner on dropdowns |
| PSGC-09 ⚠️ | OCR prefill with fuzzy match | 1. OCR scans ID document 2. Province/city/barangay names fuzzy-matched | `findProvinceByName`, `findCityByName`, `findBarangayByName` resolve correctly |
| PSGC-10 ❌ | Province not found in PSGC data | 1. OCR returns unrecognizable province | Graceful fallback; user can select manually |
| PSGC-11 ⚠️ | Address in dynamic form | 1. Form definition uses `address` or `address_alaminos` field type | Correct address component renders |
| PSGC-12 ⚠️ | Address data saved to backend | 1. Fill address 2. Submit | `barangay`, `cityMunicipality`, `province` stored in User/BusinessProfile |

---

## 31. AI Recommendation Service (Detailed)

| ID | Scenario | Steps | Expected Behavior |
|----|----------|-------|-------------------|
| AI-01 ✅ | Basic recommendation | 1. Enter "bakery selling bread and pastries" 2. Click recommend | AI returns LOB recommendations (e.g., "Bakery") |
| AI-02 ✅ | Accept recommendation | 1. View recommendations 2. Click accept | LOB added to business activities |
| AI-03 🔄 | Accept with edits | 1. View recommendations 2. Modify and accept | Feedback stored as `acceptedWithEdits` |
| AI-04 🔄 | Reject and manually select | 1. Dismiss AI recommendations 2. Manually add LOB | Manual selection works; feedback stored |
| AI-05 ⚠️ | Low-confidence result (< 0.18) | 1. Enter vague description like "services" | `noConfidentMatch: true`; message: "Please provide more details" |
| AI-06 ⚠️ | Vague retail detection | 1. Enter "selling things" or "retail" | Heuristic gate returns conservative "General merchandise" |
| AI-07 ⚠️ | Gemini fallback | 1. Trained model unavailable or fails 2. Gemini configured | Gemini provides recommendation as fallback |
| AI-08 ❌ | AI service completely down | 1. AI Flask service not running | Graceful fallback: manual LOB selection still works; no crash |
| AI-09 ❌ | AI returns empty recommendations | 1. Edge case input | UI shows "No recommendations" with manual option |
| AI-10 ⚠️ | Confidence not shown to user | 1. Get recommendation | Note: backend has confidence; frontend doesn't display it |
| AI-11 ⚠️ | Feedback stored correctly | 1. Accept/reject recommendation | `LobRecommendationFeedback` record created with `accepted` flag |
| AI-12 ⚠️ | Rate limit on AI endpoint | 1. Call recommendation 11+ times in 1 min | Rate limited: 10/min per user/IP |
| AI-13 ⚠️ | Multiple recommendations returned | 1. Enter complex description with multiple business activities | Multiple LOBs returned; user can select/deselect each |

---

## 32. Input Validation & Boundary Values

### 32.1 Password Strength

| ID | Scenario | Steps | Expected Behavior |
|----|----------|-------|-------------------|
| VAL-PW-01 ✅ | Strong password accepted | 1. Enter `MyP@ss1234!` | All 5 checks pass (length, lowercase, uppercase, number, special) |
| VAL-PW-02 ❌ | Password missing uppercase | 1. Enter `myp@ss1234!` | "Uppercase letter" check fails; progress bar at 4/5 |
| VAL-PW-03 ❌ | Password missing special char | 1. Enter `MyPass1234` | "Special character" check fails |
| VAL-PW-04 ❌ | Password too short (< 8 chars) | 1. Enter `Ab1!` | "At least 8 characters" fails |
| VAL-PW-05 ⚠️ | Password strength indicator updates live | 1. Type password character by character | Indicator updates in real-time; color changes (red→yellow→green) |
| VAL-PW-06 ⚠️ | Password with 128+ characters | 1. Enter very long password | Accepted or truncated with feedback |

### 32.2 Phone Number Guards

| ID | Scenario | Steps | Expected Behavior |
|----|----------|-------|-------------------|
| VAL-PH-01 ✅ | Valid Philippine phone (11 digits) | 1. Enter `09171234567` | Accepted |
| VAL-PH-02 ❌ | Non-numeric keypress in phone field | 1. Press 'a' in phone field | `preventNonNumericKeyDown` blocks the key |
| VAL-PH-03 ❌ | Paste non-numeric into phone | 1. Paste "abc123" | `sanitizePhonePaste` strips to "123" |
| VAL-PH-04 ⚠️ | Phone max 11 characters | 1. Try typing 12th digit | `sanitizePhoneInput` limits to 11 |
| VAL-PH-05 ⚠️ | Paste more than 11 digits | 1. Paste "091712345678999" | Truncated to 11 digits |

### 32.3 Name Fields

| ID | Scenario | Steps | Expected Behavior |
|----|----------|-------|-------------------|
| VAL-NM-01 ⚠️ | Name with accented characters | 1. Enter "José María" | `sanitizeName()` preserves accented chars |
| VAL-NM-02 ❌ | Name with HTML tags | 1. Enter `<b>John</b>` | Tags stripped by sanitizer |
| VAL-NM-03 ⚠️ | Very long name (200+ chars) | 1. Enter extremely long name | Accepted or max length enforced |
| VAL-NM-04 ❌ | Name with null bytes | 1. Enter name with `\x00` | Null bytes stripped by `sanitizeString` |
| VAL-NM-05 ⚠️ | Whitespace-only name | 1. Enter "   " | Validation: "Name is required" after trim |

### 32.4 Email Fields

| ID | Scenario | Steps | Expected Behavior |
|----|----------|-------|-------------------|
| VAL-EM-01 ⚠️ | Email case normalization | 1. Enter `User@Example.COM` | `sanitizeEmail()` lowercases to `user@example.com` |
| VAL-EM-02 ❌ | Email with angle brackets | 1. Enter `<user@example.com>` | `sanitizeEmail()` removes `<>"'` |
| VAL-EM-03 ⚠️ | Email with leading/trailing spaces | 1. Enter ` user@example.com ` | Trimmed before processing |
| VAL-EM-04 ⚠️ | Email with + alias | 1. Enter `user+test@example.com` | Should be accepted as valid |

### 32.5 General Input Edge Cases

| ID | Scenario | Steps | Expected Behavior |
|----|----------|-------|-------------------|
| VAL-GEN-01 ⚠️ | Empty string vs null | 1. Submit form with empty string in optional field | Backend handles both consistently |
| VAL-GEN-02 ⚠️ | Extremely long input (10000 chars) | 1. Paste 10000 chars in text field | Either accepted with max length or truncated/rejected |
| VAL-GEN-03 ⚠️ | Unicode emoji in text fields | 1. Enter "My Business 🏪🎉" | Stored and displayed correctly |
| VAL-GEN-04 ⚠️ | Copy-paste into OTP field | 1. Copy OTP from email 2. Paste | OTP populated correctly |
| VAL-GEN-05 ❌ | Negative numbers in monetary fields | 1. Enter `-1000` for gross receipts | Validation error: positive number required |
| VAL-GEN-06 ⚠️ | Decimal numbers in integer fields | 1. Enter `1.5` in floor area | Either accepted/rounded or validated as integer |

---

## 33. Sorting & Filtering on Tables

| ID | Scenario | Steps | Expected Behavior |
|----|----------|-------|-------------------|
| SORT-01 ✅ | Sort table by column (ascending) | 1. Click column header | Data sorted ascending; indicator shown |
| SORT-02 ✅ | Sort table by column (descending) | 1. Click same column again | Data sorted descending |
| SORT-03 ⚠️ | Sort → third click clears sort | 1. Click column 3 times | Sort removed; default order restored |
| SORT-04 ⚠️ | Filter by status (custom select) | 1. Select status from dropdown filter | Table shows only matching rows |
| SORT-05 ⚠️ | Filter by date range | 1. Select start and end date | Table shows rows within range |
| SORT-06 ⚠️ | Multiple filters combined | 1. Apply status filter + date filter + search | All filters applied together (AND logic) |
| SORT-07 ⚠️ | Clear all filters | 1. Reset filters | Table shows all rows |
| SORT-08 ❌ | Filter with no matching results | 1. Apply filter that matches nothing | "No data" message; no crash |
| SORT-09 ⚠️ | Sort persists through filter | 1. Sort by column 2. Apply filter | Sorted and filtered simultaneously |
| SORT-10 ⚠️ | Sort on LGU Manager report tables | 1. Sort Period, Submitted, Approved columns | `sorter: true` works on these columns |

---

## 34. Health Monitoring (Admin)

| ID | Scenario | Steps | Expected Behavior |
|----|----------|-------|-------------------|
| HEALTH-01 ✅ | View services health | 1. Admin navigates to maintenance overview | Health cards for auth, business, admin, audit, AI, MongoDB, IPFS |
| HEALTH-02 ✅ | All services healthy | 1. All services running | Green status on all cards |
| HEALTH-03 ❌ | One service down | 1. Stop audit-service 2. View health | Audit card shows red/error; others green |
| HEALTH-04 ⚠️ | MongoDB connection status | 1. View health details | Database connection status shown per service |
| HEALTH-05 ⚠️ | AI service health | 1. AI service running/stopped | AI card reflects status |
| HEALTH-06 ⚠️ | IPFS dependency status | 1. IPFS available/unavailable | IPFS card reflects status |
| HEALTH-07 ⚠️ | Health check API endpoint | 1. GET `/api/health` on each service | Returns health status with DB and dependency info |
| HEALTH-08 ⚠️ | Monitoring stats | 1. GET `/api/admin/monitoring/stats` | Performance and security metrics returned |

---

## 35. Maintenance Mode (Detailed)

| ID | Scenario | Steps | Expected Behavior |
|----|----------|-------|-------------------|
| MAINT-01 ✅ | Maintenance status API (public) | 1. GET `/api/maintenance/status` | Returns `active`, `message`, `expectedResumeAt`, `activatedAt` |
| MAINT-02 🔄 | Enable via dual-approval | 1. Admin requests maintenance 2. Two admins approve | `MaintenanceWindow` created; status active |
| MAINT-03 ⚠️ | Non-admin redirected during maintenance | 1. Maintenance active 2. BO navigates to `/owner` | `ProtectedRoute` redirects to `/maintenance` |
| MAINT-04 ⚠️ | Admin still accesses dashboard during maintenance | 1. Maintenance active 2. Admin navigates | Full access to admin panel |
| MAINT-05 ⚠️ | Maintenance page shows message | 1. Redirected to `/maintenance` | Shows `message` and `expectedResumeAt` from API |
| MAINT-06 ⚠️ | API calls during maintenance | 1. BO tries API call while maintenance active | Backend should also block or frontend prevents |
| MAINT-07 ⚠️ | Maintenance ends → users can access again | 1. Admin ends maintenance | `ProtectedRoute` stops redirecting |
| MAINT-08 ❌ | Non-admin login attempt during maintenance | 1. Maintenance active 2. BO tries to login | Login succeeds but immediately redirected to `/maintenance` |
| MAINT-09 ⚠️ | Maintenance triggered by dual-approval | 1. Check `AdminApproval` with `requestType: 'maintenance_mode'` | Approval syncs with `MaintenanceWindow` |

---

## 36. Announcements Visibility

| ID | Scenario | Steps | Expected Behavior |
|----|----------|-------|-------------------|
| ANN-01 ✅ | Admin creates announcement | 1. Admin CRUD on announcements | Announcement created/updated/deleted |
| ANN-02 ⚠️ | Users see active announcements | 1. GET `/api/admin/announcements` (public) | ⚠️ Backend returns active announcements but **no frontend display component exists for end users** |
| ANN-03 ⚠️ | Expired announcements hidden | 1. Announcement past `expiresAt` | Filtered out by backend query |
| ANN-04 ⚠️ | Inactive announcements hidden | 1. Announcement `isActive: false` | Filtered out |

> **Note:** Announcements backend CRUD exists but user-facing display is NOT implemented in the web frontend. This is a feature gap.

---

## 37. Logout & Session Cleanup

| ID | Scenario | Steps | Expected Behavior |
|----|----------|-------|-------------------|
| LOGOUT-01 ✅ | Logout clears localStorage | 1. Logout | `auth__currentUser` removed from localStorage |
| LOGOUT-02 ✅ | Logout clears sessionStorage | 1. Logout | `auth__sessionUser` removed from sessionStorage |
| LOGOUT-03 ✅ | Logout calls backend | 1. Logout | POST `/api/auth/logout` invalidates server session |
| LOGOUT-04 ⚠️ | Logout clears remembered email | 1. Logout | `auth__rememberedEmail` removed |
| LOGOUT-05 ⚠️ | SSE connection closed on logout | 1. Logout | EventSource closed; stream registry entry removed |
| LOGOUT-06 ⚠️ | Back button after logout | 1. Logout 2. Click browser back | Cannot access protected content; redirected to login |
| LOGOUT-07 ⚠️ | Theme preferences survive logout | 1. Set dark theme 2. Logout 3. Login | Theme preference retained (expected behavior) |
| LOGOUT-08 ❌ | Stale cached data after logout + different user login | 1. Logout 2. Login as different user | No stale data from previous user visible |
| LOGOUT-09 ⚠️ | 401 auto-logout | 1. Token expires during usage | `http.js` clears storage on 401; redirects to login |
| LOGOUT-10 ⚠️ | Confirm logout modal | 1. Click logout | Modal asks "Are you sure?"; confirm to proceed |

---

## 38. Mobile Hardware Interactions (Flutter App)

| ID | Scenario | Steps | Expected Behavior |
|----|----------|-------|-------------------|
| 📱 HW-01 ⚠️ | GPS permission prompt | 1. First time starting inspection | OS permission dialog for location access |
| 📱 HW-02 ❌ | GPS permission denied | 1. Deny location permission | App explains why GPS needed; can proceed with reason |
| 📱 HW-03 ⚠️ | Camera permission for evidence | 1. Tap "Upload Evidence" → "Take Photo" | Camera permission requested |
| 📱 HW-04 ❌ | Camera permission denied | 1. Deny camera | Gallery option still available; clear message |
| 📱 HW-05 ⚠️ | Gallery access for evidence | 1. Tap "Upload Evidence" → "Choose from Gallery" | Gallery picker opens via `image_picker` |
| 📱 HW-06 ⚠️ | Biometric authentication (Google Sign-In) | 1. Use Google Sign-In | `google_sign_in` SDK triggers OS auth |
| 📱 HW-07 ⚠️ | App backgrounded during inspection | 1. Start inspection 2. Switch to another app 3. Return | Inspection state preserved; no data loss |
| 📱 HW-08 ⚠️ | Network switch (WiFi → cellular) | 1. Switch from WiFi to 4G during use | `connectivity_plus` detects; app continues |
| 📱 HW-09 ⚠️ | Low storage during upload | 1. Device nearly full 2. Upload large evidence | Graceful error: "Insufficient storage" |
| 📱 HW-10 ⚠️ | GPS accuracy low | 1. Indoor inspection with poor GPS | Warning shown; can proceed with note |

---

## 39. Error Message Consistency

| ID | Scenario | Steps | Expected Behavior |
|----|----------|-------|-------------------|
| ERR-01 ⚠️ | Error message parsing | 1. API returns error | `parseErrorMessage()` extracts `{ message, field, type }` |
| ERR-02 ⚠️ | Form field errors set automatically | 1. Submit invalid form | `setFormError()` sets error on correct field |
| ERR-03 ⚠️ | Rate limit message user-friendly | 1. Hit rate limit | User sees "Too many attempts. Please wait." (not raw 429) |
| ERR-04 ⚠️ | Account locked message | 1. Get locked out | User sees countdown timer with friendly message |
| ERR-05 ⚠️ | Session expired message | 1. Token expires | User sees "Session expired. Please log in again." |
| ERR-06 ⚠️ | Network error message | 1. Go offline | User sees "No internet connection" or similar |
| ERR-07 ⚠️ | Correlation ID for support | 1. Hit 500 error | Correlation ID visible for user to share with support |
| ERR-08 ❌ | Error messages don't leak internals | 1. In production, trigger various errors | No stack traces, file paths, or DB details |

---

## Summary Statistics

| Category | Happy Path | Error | Edge Case | Total |
|----------|-----------|-------|-----------|-------|
| Authentication (Web) | 15 | 20 | 18 | 53 |
| MFA & Passkeys | 6 | 5 | 6 | 17 |
| Password Recovery | 2 | 4 | 3 | 9 |
| Business Owner | 30 | 12 | 25 | 67 |
| Staff / LGU Officer | 18 | 6 | 10 | 34 |
| Inspector (Mobile App) | 18 | 5 | 20 | 43 |
| LGU Manager | 7 | 1 | 6 | 14 |
| Admin | 28 | 10 | 18 | 56 |
| Common User | 10 | 8 | 8 | 26 |
| Session & Security | 3 | 4 | 10 | 17 |
| Notifications | 5 | 0 | 13 | 18 |
| Cross-Cutting UI | 0 | 0 | 18 | 18 |
| Mobile Web Views | 38 | 0 | 57 | 95 |
| API Backend | 0 | 13 | 12 | 25 |
| End-to-End Cross-Role | 10 | 5 | 10 | 25 |
| Cron & Scheduled Jobs | 0 | 5 | 12 | 17 |
| Infrastructure (IPFS/Blockchain/SSE) | 3 | 8 | 14 | 25 |
| Dual-Approval Workflows | 4 | 4 | 6 | 14 |
| Fee & Penalty Calculation | 4 | 3 | 9 | 16 |
| File Upload, Scan & Export | 4 | 6 | 7 | 17 |
| Pagination, Search & URL Params | 3 | 4 | 7 | 14 |
| Accessibility & Browser Compat | 0 | 0 | 12 | 12 |
| Multi-Tab & Concurrency | 0 | 2 | 6 | 8 |
| DevTools & Dev-Only Features | 2 | 1 | 4 | 7 |
| Link Existing Account | 2 | 3 | 2 | 7 |
| Renewal Full Lifecycle | 4 | 3 | 5 | 12 |
| Walk-In Full Lifecycle | 3 | 3 | 3 | 9 |
| Email Delivery | 2 | 3 | 4 | 9 |
| Security Hardening (OWASP) | 2 | 14 | 21 | 37 |
| Philippine Address (PSGC) | 3 | 1 | 8 | 12 |
| AI Recommendation (Detailed) | 2 | 2 | 9 | 13 |
| Input Validation & Boundaries | 1 | 10 | 16 | 27 |
| Sorting & Filtering on Tables | 2 | 1 | 7 | 10 |
| Health Monitoring | 2 | 1 | 5 | 8 |
| Maintenance Mode (Detailed) | 1 | 1 | 7 | 9 |
| Announcements Visibility | 1 | 0 | 3 | 4 |
| Logout & Session Cleanup | 3 | 1 | 6 | 10 |
| Mobile Hardware (Flutter) | 0 | 2 | 8 | 10 |
| Error Message Consistency | 0 | 1 | 7 | 8 |
| **TOTAL** | **248** | **172** | **443** | **863** |

---

## How to Use This Document

1. **Before testing:** Ensure dev environment is running (auth:3001, business:3002, admin:3003, audit:3004, web:5173, mobile emulator)
2. **Assign scenarios to testers** by section or role
3. **Track results** by marking each ID as PASS/FAIL/BLOCKED
4. **Error scenarios** are critical — these validate the app handles mistakes gracefully
5. **Edge cases** may not all be implemented yet — use them to identify gaps
6. **Mobile scenarios** (📱) require the Flutter app on a device/emulator
7. **Infrastructure scenarios** require IPFS, Ganache, ClamAV, and email provider configured
8. **Security scenarios** should be tested in both development and production-like environments
9. **After another AI finishes current work**, re-verify all scenarios

### Known Feature Gaps Identified During Scenario Creation

| Gap | Severity | Notes |
|-----|----------|-------|
| Announcements have no user-facing display in web frontend | Medium | Backend CRUD works; no frontend component for end users to view them |
| AI confidence scores not shown to users | Low | Backend returns confidence; frontend doesn't display it |
| CORS defaults to `*` if `CORS_ORIGIN` unset | High (production) | Must set `CORS_ORIGIN` in production |
| JWT stored in localStorage (XSS risk) | Medium | Known trade-off for SPA; mitigated by CSP |
| LGU Manager pages have no mobile web handling | High | 7 pages with no responsive logic |
| `ApplicationDetailPanel` (1426 lines) has no mobile handling | High | Only CSS tab scroll; no layout adaptation |
| `BusinessOwnerDashboard` has no mobile handling | High | Primary BO page |

---

*This document covers 863 test scenarios across 39 sections, covering web (desktop + mobile views), mobile app (Flutter), backend (4 services), infrastructure (IPFS, blockchain, SSE), security (OWASP-aligned), and domain-specific features (PSGC addresses, AI, fees, penalties).*
