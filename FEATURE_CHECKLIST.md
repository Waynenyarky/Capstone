Use this checklist to verify that each feature in the application has been implemented correctly.

---

## Table of Contents

- [Public/Authentication Features](https://www.notion.so/Feature-Test-Checklist-311145455df68074a73ae46617f6c17c?pvs=21)
- [Business Owner Features](https://www.notion.so/Feature-Test-Checklist-311145455df68074a73ae46617f6c17c?pvs=21)
- [Staff - LGU Officer Features](https://www.notion.so/Feature-Test-Checklist-311145455df68074a73ae46617f6c17c?pvs=21)
- [Staff - Inspector Features](https://www.notion.so/Feature-Test-Checklist-311145455df68074a73ae46617f6c17c?pvs=21)
- [Staff - CSO Features](https://www.notion.so/Feature-Test-Checklist-311145455df68074a73ae46617f6c17c?pvs=21)
- [LGU Manager Features](https://www.notion.so/Feature-Test-Checklist-311145455df68074a73ae46617f6c17c?pvs=21)
- [Admin Features](https://www.notion.so/Feature-Test-Checklist-311145455df68074a73ae46617f6c17c?pvs=21)
- [Common Features (All Authenticated Users)](https://www.notion.so/Feature-Test-Checklist-311145455df68074a73ae46617f6c17c?pvs=21)

---

- [ ]  INCLUDE NORMAL, EDGE, AND ATTACK CASE AFTER YOU FINISHED EVERYTHING!
- [ ]  AI TEST
- [ ]  BLOCKCHAIN TEST
- [ ]  mobile page test for each feature.
- [ ]  proper notifications test.
- [ ]  you forgot about unit testing, integration testing, and fuzzy testing

## Public/Authentication Features

### Landing & Public Pages

- [x]  Home page (`/`) loads correctly
    - [ ]  Make it more interesting
    - [ ]  could have the announcements section
- [x]  Terms of Service page (`/terms`) displays content
- [x]  Privacy Policy page (`/privacy`) displays content
- [x]  Maintenance page (`/maintenance`) shows when system is in maintenance mode

### User Registration

- [x]  Sign up page (`/sign-up`) loads correctly
- [x]  Can create new account with email and password
    - [x]  Add simulated attacks
- [x]  Email verification is sent after registration
- [x]  Email verification link works correctly
- [x]  Validation errors display for invalid inputs

### Login

- [x]  Login page (`/login`) loads correctly
- [x]  Can login with valid email and password
    - [x]  Add prefill options for invalid credentials.
    - [x]  Add simulated attacks button.
        - [ ]  Test all simulated attacks.
        - [ ]  Test with ZAP
        - [x]  if the email already exists, the logic is worng. like it redirects to the login apge.
- [x]  Error message shows for invalid credentials
- [x]  "Remember me" functionality works
- [x]  Redirects to appropriate dashboard based on user role
- [ ]  test on ios
- [ ]  test on android
- [x]  passkey login
- [ ]  authenticator login
- [x]  email content verification

### Multi-Factor Authentication (MFA)

- [x]  MFA prompt appears after login (if enabled)
- [x]  TOTP code verification works
- [x]  Invalid TOTP code shows error
- [x]  MFA setup flow works for new users

### Passkey/WebAuthn

- [x]  Passkey registration works
- [x]  Passkey login works
- [x]  Cross-device passkey authentication (`/auth/passkey-mobile`) works
- [x]  PASSKEY ISSUE
- [ ]  r3emember me issue

### Password Recovery

- [x]  Forgot password page (`/forgot-password`) loads
- [x]  Forgot password does not work for staff accounts. An alert is sent to the security system.
- [x]  Password reset email is sent
- [x]  Password reset link works
- [x]  Can set new password successfully
- [x]  notifications!!!

### Security Threats

- [ ]  Research on more possible security threats.
- [ ]  USE THE GRADING CRITERIA from ias2

---

## Business Owner Features

- [ ]  NOTIFICATIONS!

### Dashboard (`/owner`)

- [x]  Dashboard loads correctly
- [x]  Left panel shows list of all owned businesses
- [x]  Can select a business to view details
- [ ]  Business detail panel shows correct information
- [ ]  Pending application view displays for applications under review
- [ ]  Approved business view displays for active businesses
- [ ]  needs overview
- [ ]  needs to be alerted about the permit renewal thing and
- [ ]  needs notifications
- [ ]  needs dedicated profile button

### Add New Business

- [x]  "Add Business" button is visible
- [x]  Add Business form/wizard opens
- [x]  Can fill out business information
- [ ]  Dynamic form fields render based on business type
- [ ]  check for invalid scenarios
    - [ ]  submitting a form with empty fields
- [ ]  accreditation section is wrong.
- [x]  Can upload required documents
    - [x]  check if documents exist in lpfs
- [x]  Form validation works correctly
- [x]  Can submit new business application
- [x]  Success message/confirmation displays after submission

### My Businesses (`/owner/businesses`)

- [x]  Page loads correctly
- [x]  List of all registered businesses displays
- [ ]  Can view business details
- [ ]  Business status is shown correctly

### General Permits (`/owner/general-permits`)

- [ ]  Page loads correctly
- [ ]  List of general permits displays
- [ ]  Can view permit details
- [ ]  Permit status is shown correctly
- [ ]  Can apply for new permit (if applicable)

### Occupational Permits (`/owner/occupational-permits`)

- [ ]  Page loads correctly
- [ ]  List of occupational permits displays
- [ ]  Can view permit details
- [ ]  Can apply for occupational permit

### Business Retirement/Cessation (`/owner/retirement`)

- [ ]  Page loads correctly
- [ ]  Can select business for retirement
- [ ]  Retirement form displays
- [ ]  Can fill out cessation details
- [ ]  Can submit retirement application
- [ ]  Confirmation displays after submission

### Appeals (`/owner/my-appeals`)

- [ ]  Page loads correctly
- [ ]  List of appeals displays
- [ ]  Can view appeal details
- [ ]  Can submit new appeal
- [ ]  Appeal status tracking works
- [ ]  Can upload supporting documents for appeal

### Edit Requests (`/owner/edit-requests`)

- [ ]  Page loads correctly
- [ ]  Can request changes to business information
- [ ]  Edit request form works
- [ ]  Can track edit request status

### Payments (`/owner/payments`)

- [ ]  Page loads correctly
- [ ]  List of payments/dues displays
- [ ]  Can view payment details
- [ ]  Payment amounts are correct
- [ ]  Can initiate payment (if online payment implemented)
- [ ]  Payment history displays
- [ ]  Payment status updates correctly

### Violations & Inspections (Business Owner View)

- [ ]  Can view violations associated with business
- [ ]  Violation details display correctly
- [ ]  Can view inspection schedules
- [ ]  Inspection results display

---

## Staff - LGU Officer Features

### Onboarding (`/staff/onboarding`)

- [ ]  First-time login redirects to onboarding
- [ ]  Credential change requirement enforced
- [ ]  MFA setup is required
- [ ]  Account setup wizard completes successfully

### Dashboard (`/staff`)

- [ ]  Dashboard loads correctly
- [ ]  Relevant KPIs/metrics display
- [ ]  Quick actions are accessible

### Permit Applications Review (`/staff/applications`)

- [ ]  Page loads correctly
- [ ]  bookmark a thing.
- [ ]  save application for self.
- [ ]  List of permit applications displays
- [ ]  Can filter applications by status
- [ ]  Can search applications
- [ ]  Application detail panel opens when selected
- [ ]  Business information section displays
- [ ]  Owner personal info section displays
- [ ]  Documents section displays
- [ ]  Can view uploaded documents
- [ ]  Can approve application
- [ ]  Can reject application with reason
- [ ]  Can request revision with comments
- [ ]  Status updates correctly after action

### Walk-In Applications

- [ ]  Walk-in application page loads
- [ ]  Can create application for walk-in customer
- [ ]  All required fields are present
- [ ]  Can submit walk-in application

### Cessation Review (`/staff/cessation`)

- [ ]  Page loads correctly
- [ ]  List of cessation requests displays
- [ ]  Can view cessation details
- [ ]  Can approve/reject cessation request

### Inspections Management (`/staff/inspections`)

- [ ]  Page loads correctly
- [ ]  Assigned inspections display
- [ ]  Can view inspection details
- [ ]  Can record inspection results

### Appeals Handling (`/staff/appeals`)

- [ ]  Page loads correctly
- [ ]  List of appeals displays
- [ ]  Can view appeal details
- [ ]  Can process appeal (approve/reject)

### Account Recovery Requests (`/staff/recovery-request`)

- [ ]  Page loads correctly
- [ ]  Recovery requests display
- [ ]  Can process recovery requests

---

## Staff - Inspector Features

### Dashboard (`/staff`)

- [ ]  Inspector-specific dashboard loads
- [ ]  Assigned inspections summary displays

### Violations & Inspections (`/staff/inspections`)

- [ ]  Page loads correctly
- [ ]  Assigned inspections list displays
- [ ]  Can view inspection details
- [ ]  Can record inspection findings
- [ ]  Can add violations
- [ ]  Can upload inspection evidence/photos
- [ ]  Can mark inspection as complete

---

## LGU Manager Features

### Dashboard (`/lgu-manager`)

- [ ]  Dashboard loads correctly
- [ ]  Permits metrics display (total, pending, approved, rejected, overdue)
- [ ]  Violations metrics display (total, pending, resolved, overdue)
- [ ]  Inspections metrics display (scheduled, completed, missed, compliance rate)
- [ ]  Appeals metrics display (total, pending, under review, approved, rejected, SLA compliance)
- [ ]  Cessations metrics display (total, active, resolved, pending)
- [ ]  Department metrics display (total officers, active officers, workload)
- [ ]  Trend analysis with period comparisons works

### Reports & Analytics (`/lgu-manager/reports`)

- [ ]  Page loads correctly
- [ ]  Can generate reports
- [ ]  Report filters work
- [ ]  Can export reports (if implemented)

### Permit Applications Overview (`/lgu-manager/permit-applications`)

- [ ]  Page loads correctly
- [ ]  Overview of all permit applications displays
- [ ]  Can filter by status/date/officer
- [ ]  Summary statistics display

### Cessation Overview (`/lgu-manager/cessation`)

- [ ]  Page loads correctly
- [ ]  Overview of cessation requests displays
- [ ]  Can view cessation statistics

### Violations & Inspections Overview (`/lgu-manager/violations-inspections`)

- [ ]  Page loads correctly
- [ ]  Violations overview displays
- [ ]  Inspections overview displays
- [ ]  Compliance metrics display

### Assign Inspection (`/lgu-manager/assign-inspection`)

- [ ]  Page loads correctly
- [ ]  Can view unassigned inspections
- [ ]  Can view available inspectors
- [ ]  Can assign inspection to inspector
- [ ]  Assignment confirmation displays

### Appeals Overview (`/lgu-manager/appeals`)

- [ ]  Page loads correctly
- [ ]  Overview of all appeals displays
- [ ]  Appeal statistics display
- [ ]  SLA compliance metrics display

---

## Admin Features

- [ ]  INFO SECTION!!!!

### Onboarding (`/admin/onboarding`)

- [x]  First-time admin login redirects to onboarding
- [x]  Admin setup wizard completes successfully

### Dashboard (`/admin/dashboard`)

- [ ]  Dashboard loads correctly
- [ ]  KPI cards display (pending requests, tamper incidents, form groups)
- [ ]  Maintenance mode status indicator works
- [ ]  Recent admin activity log displays
- [ ]  Tamper/security incident summary panel displays

### User Management (`/admin/users`)

- [x]  Page loads correctly
- [x]  List of users displays
- [x]  Can filter users by office/role
- [x]  Can create new admin account
- [x]  Can create new staff account
- [x]  Can disable user account
- [x]  Can reset user password
- [x]  User activity logs display
- [ ]  what happens to disable account when the user logs in?
- [ ]  staff account contract and extendor

### Requests (`/admin/requests`)

- [ ]  Page loads correctly
- [ ]  Pending requests display
- [ ]  Can approve request
- [ ]  Can reject request with reason

### Form Definitions (`/admin/form-definitions`)

- [x]  Page loads correctly
- [x]  List of form groups displays
- [x]  Can create new form group
- [x]  Can edit form group

### Form Group Detail (`/admin/form-definitions/group/:groupId`)

- [ ]  Page loads correctly
- [ ]  Form group details display
- [ ]  Industry-specific forms display
- [ ]  Can add forms to group
- [ ]  Can remove forms from group

### Form Editor (`/admin/form-definitions/:id`)

- [x]  Page loads correctly
- [x]  Form builder interface displays
- [x]  Can add form fields
- [x]  Can edit form fields
- [x]  Can remove form fields
- [x]  Can reorder form fields
- [x]  Can set field validation rules
- [x]  Can save form definition
- [x]  Form preview works

### Fee Configuration (`/admin/fee-configuration`)

- [ ]  Page loads correctly
- [ ]  Fee configuration by line of business displays
- [ ]  Can add/edit fees
- [ ]  Special fees configuration works
- [ ]  Penalty configuration works
- [ ]  Can save fee changes
- [ ]  may mga mali dito i think. like there should be a thing that allows the admin to set the different fees to different forms.

### Finance (`/admin/finance`)

- [ ]  Page loads correctly
- [ ]  Financial overview displays
- [ ]  Transaction list displays
- [ ]  Financial reports accessible

### Security (`/admin/security`)

- [ ]  Page loads correctly
- [ ]  Audit tamper detection displays
- [ ]  Security incidents list displays
- [ ]  History logs display
- [ ]  Block IPs
- [ ]  Can export audit logs
- [ ]  Can view incident details

### Maintenance Mode (`/admin/maintenance`)

- [ ]  Page loads correctly
- [ ]  Current maintenance status displays
- [ ]  Can request to enable maintenance mode
- [ ]  Dual-approval workflow works
- [ ]  Can disable maintenance mode
- [ ]  Maintenance schedule displays (if applicable)

### Step-Up Authentication

- [x]  Sensitive operations require re-authentication
- [x]  Step-up auth modal displays
- [x]  Can complete step-up authentication
- [x]  Operation proceeds after successful auth

---

## Common Features (All Authenticated Users)

### Profile Settings (`/settings-profile`)

- [x]  Settings page loads correctly

### General Tab

- [x]  Basic profile information displays
- [x]  Can edit profile information
- [x]  Can save profile changes

### Account Tab

- [x]  Account information displays
- [x]  Can request email change
- [x]  Email change verification works

### Security Tab

- [x]  Security settings display
- [x]  Can change password
- [x]  Password validation works
- [x]  MFA settings display
- [x]  Can enable/disable MFA
- [x]  Can add new passkey
- [x]  Can remove passkey
- [ ]  INSPECTOR WAS NOT TESTED PROPERLY! REMOVED BIOMETRICS!

### Theme Tab

- [x]  Theme options display
- [x]  Can switch between light/dark mode
- [x]  Theme persists after refresh

### Notifications (`/notifications`)

- [x]  Notifications page loads
- [x]  Notification history displays
- [x]  Can mark notifications as read
- [x]  Real-time notifications work
- [x]  Notification badge updates correctly

### Account Deletion

- [x]  Can request account deletion
- [x]  Deletion pending page (`/deletion-pending`) displays
- [x]  Grace period information shows
- [x]  Can cancel deletion request (if within grace period)

### Session Management

- [x]  Session timeout works correctly
- [x]  Can logout successfully
- [x]  Logout clears session data
- [x]  Protected routes redirect to login when not authenticated

---

## Cross-Cutting Concerns

### Responsive Design

- [ ]  Application works on desktop
- [ ]  Application works on tablet
- [ ]  Application works on mobile
- [ ]  Navigation adapts to screen size

### Error Handling

- [ ]  404 page displays for invalid routes
- [ ]  Error boundaries catch component errors
- [ ]  API errors display user-friendly messages
- [ ]  Network errors are handled gracefully

### Loading States

- [ ]  Loading indicators display during data fetch
- [ ]  Skeleton loaders display (if implemented)
- [ ]  Buttons show loading state during actions

---

## Notes

- **Date Tested:** _______________
- **Tester Name:** _______________
- **Environment:** _______________
- **Browser/Device:** _______________

### Issues Found

| Feature | Issue Description | Severity | Status |
| --- | --- | --- | --- |
|  |  |  |  |
|  |  |  |  |
|  |  |  |  |

### Additional Notes

*Add any additional observations or notes here.*