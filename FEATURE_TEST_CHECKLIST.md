# Feature Test Checklist

Use this checklist to verify that each feature in the application has been implemented correctly.

---

## Table of Contents
- [Public/Authentication Features](#publicauthentication-features)
- [Business Owner Features](#business-owner-features)
- [Staff - LGU Officer Features](#staff---lgu-officer-features)
- [Staff - Inspector Features](#staff---inspector-features)
- [Staff - CSO Features](#staff---cso-customer-service-officer-features)
- [LGU Manager Features](#lgu-manager-features)
- [Admin Features](#admin-features)
- [Common Features (All Authenticated Users)](#common-features-all-authenticated-users)

---

## Public/Authentication Features

### Landing & Public Pages
- [ ] Home page (`/`) loads correctly
- [ ] Terms of Service page (`/terms`) displays content
- [ ] Privacy Policy page (`/privacy`) displays content
- [ ] Maintenance page (`/maintenance`) shows when system is in maintenance mode

### User Registration
- [ ] Sign up page (`/sign-up`) loads correctly
- [ ] Can create new account with email and password
- [ ] Email verification is sent after registration
- [ ] Email verification link works correctly
- [ ] Validation errors display for invalid inputs

### Login
- [ ] Login page (`/login`) loads correctly
- [ ] Can login with valid email and password
- [ ] Error message shows for invalid credentials
- [ ] "Remember me" functionality works
- [ ] Redirects to appropriate dashboard based on user role

### Multi-Factor Authentication (MFA)
- [ ] MFA prompt appears after login (if enabled)
- [ ] TOTP code verification works
- [ ] Invalid TOTP code shows error
- [ ] MFA setup flow works for new users

### Passkey/WebAuthn
- [ ] Passkey registration works
- [ ] Passkey login works
- [ ] Cross-device passkey authentication (`/auth/passkey-mobile`) works

### Password Recovery
- [ ] Forgot password page (`/forgot-password`) loads
- [ ] Password reset email is sent
- [ ] Password reset link works
- [ ] Can set new password successfully

---

## Business Owner Features

### Dashboard (`/owner`)
- [ ] Dashboard loads correctly
- [ ] Left panel shows list of all owned businesses
- [ ] Can select a business to view details
- [ ] Business detail panel shows correct information
- [ ] Pending application view displays for applications under review
- [ ] Approved business view displays for active businesses

### Add New Business
- [ ] "Add Business" button is visible
- [ ] Add Business form/wizard opens
- [ ] Can fill out business information
- [ ] Dynamic form fields render based on business type
- [ ] Can upload required documents
- [ ] Form validation works correctly
- [ ] Can submit new business application
- [ ] Success message/confirmation displays after submission

### My Businesses (`/owner/businesses`)
- [ ] Page loads correctly
- [ ] List of all registered businesses displays
- [ ] Can view business details
- [ ] Business status is shown correctly
- [ ] Can filter/search businesses (if implemented)

### General Permits (`/owner/general-permits`)
- [ ] Page loads correctly
- [ ] List of general permits displays
- [ ] Can view permit details
- [ ] Permit status is shown correctly
- [ ] Can apply for new permit (if applicable)

### Occupational Permits (`/owner/occupational-permits`)
- [ ] Page loads correctly
- [ ] List of occupational permits displays
- [ ] Can view permit details
- [ ] Can apply for occupational permit

### Business Retirement/Cessation (`/owner/retirement`)
- [ ] Page loads correctly
- [ ] Can select business for retirement
- [ ] Retirement form displays
- [ ] Can fill out cessation details
- [ ] Can submit retirement application
- [ ] Confirmation displays after submission

### Appeals (`/owner/my-appeals`)
- [ ] Page loads correctly
- [ ] List of appeals displays
- [ ] Can view appeal details
- [ ] Can submit new appeal
- [ ] Appeal status tracking works
- [ ] Can upload supporting documents for appeal

### Edit Requests (`/owner/edit-requests`)
- [ ] Page loads correctly
- [ ] Can request changes to business information
- [ ] Edit request form works
- [ ] Can track edit request status

### Payments (`/owner/payments`)
- [ ] Page loads correctly
- [ ] List of payments/dues displays
- [ ] Can view payment details
- [ ] Payment amounts are correct
- [ ] Can initiate payment (if online payment implemented)
- [ ] Payment history displays
- [ ] Payment status updates correctly

### Violations & Inspections (Business Owner View)
- [ ] Can view violations associated with business
- [ ] Violation details display correctly
- [ ] Can view inspection schedules
- [ ] Inspection results display

---

## Staff - LGU Officer Features

### Onboarding (`/staff/onboarding`)
- [ ] First-time login redirects to onboarding
- [ ] Credential change requirement enforced
- [ ] MFA setup is required
- [ ] Account setup wizard completes successfully

### Dashboard (`/staff`)
- [ ] Dashboard loads correctly
- [ ] Relevant KPIs/metrics display
- [ ] Quick actions are accessible

### Permit Applications Review (`/staff/applications`)
- [ ] Page loads correctly
- [ ] List of permit applications displays
- [ ] Can filter applications by status
- [ ] Can search applications
- [ ] Application detail panel opens when selected
- [ ] Business information section displays
- [ ] Owner personal info section displays
- [ ] Documents section displays
- [ ] Can view uploaded documents
- [ ] Can approve application
- [ ] Can reject application with reason
- [ ] Can request revision with comments
- [ ] Status updates correctly after action

### Walk-In Applications
- [ ] Walk-in application page loads
- [ ] Can create application for walk-in customer
- [ ] All required fields are present
- [ ] Can submit walk-in application

### Cessation Review (`/staff/cessation`)
- [ ] Page loads correctly
- [ ] List of cessation requests displays
- [ ] Can view cessation details
- [ ] Can approve/reject cessation request

### Inspections Management (`/staff/inspections`)
- [ ] Page loads correctly
- [ ] Assigned inspections display
- [ ] Can view inspection details
- [ ] Can record inspection results

### Appeals Handling (`/staff/appeals`)
- [ ] Page loads correctly
- [ ] List of appeals displays
- [ ] Can view appeal details
- [ ] Can process appeal (approve/reject)

### Account Recovery Requests (`/staff/recovery-request`)
- [ ] Page loads correctly
- [ ] Recovery requests display
- [ ] Can process recovery requests

---

## Staff - Inspector Features

### Dashboard (`/staff`)
- [ ] Inspector-specific dashboard loads
- [ ] Assigned inspections summary displays

### Violations & Inspections (`/staff/inspections`)
- [ ] Page loads correctly
- [ ] Assigned inspections list displays
- [ ] Can view inspection details
- [ ] Can record inspection findings
- [ ] Can add violations
- [ ] Can upload inspection evidence/photos
- [ ] Can mark inspection as complete

---

## Staff - CSO (Customer Service Officer) Features

### Dashboard (`/staff`)
- [ ] CSO-specific dashboard loads

### Customer Support/Inquiry (`/staff/support`)
- [ ] Page loads correctly
- [ ] Customer inquiries display
- [ ] Can view inquiry details
- [ ] Can respond to inquiries
- [ ] Can escalate issues (if applicable)

---

## LGU Manager Features

### Dashboard (`/lgu-manager`)
- [ ] Dashboard loads correctly
- [ ] Permits metrics display (total, pending, approved, rejected, overdue)
- [ ] Violations metrics display (total, pending, resolved, overdue)
- [ ] Inspections metrics display (scheduled, completed, missed, compliance rate)
- [ ] Appeals metrics display (total, pending, under review, approved, rejected, SLA compliance)
- [ ] Cessations metrics display (total, active, resolved, pending)
- [ ] Department metrics display (total officers, active officers, workload)
- [ ] Trend analysis with period comparisons works

### Reports & Analytics (`/lgu-manager/reports`)
- [ ] Page loads correctly
- [ ] Can generate reports
- [ ] Report filters work
- [ ] Can export reports (if implemented)

### Permit Applications Overview (`/lgu-manager/permit-applications`)
- [ ] Page loads correctly
- [ ] Overview of all permit applications displays
- [ ] Can filter by status/date/officer
- [ ] Summary statistics display

### Cessation Overview (`/lgu-manager/cessation`)
- [ ] Page loads correctly
- [ ] Overview of cessation requests displays
- [ ] Can view cessation statistics

### Violations & Inspections Overview (`/lgu-manager/violations-inspections`)
- [ ] Page loads correctly
- [ ] Violations overview displays
- [ ] Inspections overview displays
- [ ] Compliance metrics display

### Assign Inspection (`/lgu-manager/assign-inspection`)
- [ ] Page loads correctly
- [ ] Can view unassigned inspections
- [ ] Can view available inspectors
- [ ] Can assign inspection to inspector
- [ ] Assignment confirmation displays

### Appeals Overview (`/lgu-manager/appeals`)
- [ ] Page loads correctly
- [ ] Overview of all appeals displays
- [ ] Appeal statistics display
- [ ] SLA compliance metrics display

---

## Admin Features

### Onboarding (`/admin/onboarding`)
- [ ] First-time admin login redirects to onboarding
- [ ] Admin setup wizard completes successfully

### Dashboard (`/admin/dashboard`)
- [ ] Dashboard loads correctly
- [ ] KPI cards display (pending requests, tamper incidents, form groups)
- [ ] Maintenance mode status indicator works
- [ ] Recent admin activity log displays
- [ ] Tamper/security incident summary panel displays

### User Management (`/admin/users`)
- [ ] Page loads correctly
- [ ] List of users displays
- [ ] Can filter users by office/role
- [ ] Can create new admin account
- [ ] Can create new staff account
- [ ] Can disable user account
- [ ] Can reset user password
- [ ] User activity logs display

### Requests (`/admin/requests`)
- [ ] Page loads correctly
- [ ] Pending requests display
- [ ] Can approve request
- [ ] Can reject request with reason

### Form Definitions (`/admin/form-definitions`)
- [ ] Page loads correctly
- [ ] List of form groups displays
- [ ] Can create new form group
- [ ] Can edit form group

### Form Group Detail (`/admin/form-definitions/group/:groupId`)
- [ ] Page loads correctly
- [ ] Form group details display
- [ ] Industry-specific forms display
- [ ] Can add forms to group
- [ ] Can remove forms from group

### Form Editor (`/admin/form-definitions/:id`)
- [ ] Page loads correctly
- [ ] Form builder interface displays
- [ ] Can add form fields
- [ ] Can edit form fields
- [ ] Can remove form fields
- [ ] Can reorder form fields
- [ ] Can set field validation rules
- [ ] Can save form definition
- [ ] Form preview works

### Fee Configuration (`/admin/fee-configuration`)
- [ ] Page loads correctly
- [ ] Fee configuration by line of business displays
- [ ] Can add/edit fees
- [ ] Special fees configuration works
- [ ] Penalty configuration works
- [ ] Can save fee changes

### Finance (`/admin/finance`)
- [ ] Page loads correctly
- [ ] Financial overview displays
- [ ] Transaction list displays
- [ ] Financial reports accessible

### Security (`/admin/security`)
- [ ] Page loads correctly
- [ ] Audit tamper detection displays
- [ ] Security incidents list displays
- [ ] History logs display
- [ ] Can export audit logs
- [ ] Can view incident details

### Maintenance Mode (`/admin/maintenance`)
- [ ] Page loads correctly
- [ ] Current maintenance status displays
- [ ] Can request to enable maintenance mode
- [ ] Dual-approval workflow works
- [ ] Can disable maintenance mode
- [ ] Maintenance schedule displays (if applicable)

### Step-Up Authentication
- [ ] Sensitive operations require re-authentication
- [ ] Step-up auth modal displays
- [ ] Can complete step-up authentication
- [ ] Operation proceeds after successful auth

---

## Common Features (All Authenticated Users)

### Profile Settings (`/settings-profile`)
- [ ] Settings page loads correctly

#### General Tab
- [ ] Basic profile information displays
- [ ] Can edit profile information
- [ ] Can save profile changes
- [ ] Profile picture upload works (if implemented)

#### Account Tab
- [ ] Account information displays
- [ ] Can request email change
- [ ] Email change verification works

#### Security Tab
- [ ] Security settings display
- [ ] Can change password
- [ ] Password validation works
- [ ] MFA settings display
- [ ] Can enable/disable MFA
- [ ] Can add new passkey
- [ ] Can remove passkey
- [ ] Passkey list displays

#### Notifications Tab
- [ ] Notification preferences display
- [ ] Can toggle notification types
- [ ] Preferences save correctly

#### Theme Tab
- [ ] Theme options display
- [ ] Can switch between light/dark mode
- [ ] Theme persists after refresh

### Notifications (`/notifications`)
- [ ] Notifications page loads
- [ ] Notification history displays
- [ ] Can mark notifications as read
- [ ] Real-time notifications work
- [ ] Notification badge updates correctly

### Account Deletion
- [ ] Can request account deletion
- [ ] Deletion pending page (`/deletion-pending`) displays
- [ ] Grace period information shows
- [ ] Can cancel deletion request (if within grace period)

### Session Management
- [ ] Session timeout works correctly
- [ ] Can logout successfully
- [ ] Logout clears session data
- [ ] Protected routes redirect to login when not authenticated

---

## Cross-Cutting Concerns

### Responsive Design
- [ ] Application works on desktop
- [ ] Application works on tablet
- [ ] Application works on mobile
- [ ] Navigation adapts to screen size

### Error Handling
- [ ] 404 page displays for invalid routes
- [ ] Error boundaries catch component errors
- [ ] API errors display user-friendly messages
- [ ] Network errors are handled gracefully

### Loading States
- [ ] Loading indicators display during data fetch
- [ ] Skeleton loaders display (if implemented)
- [ ] Buttons show loading state during actions

### Accessibility
- [ ] Keyboard navigation works
- [ ] Screen reader compatible (if tested)
- [ ] Color contrast is sufficient
- [ ] Form labels are present

---

## Notes

- **Date Tested:** _______________
- **Tester Name:** _______________
- **Environment:** _______________
- **Browser/Device:** _______________

### Issues Found
| Feature | Issue Description | Severity | Status |
|---------|-------------------|----------|--------|
|         |                   |          |        |
|         |                   |          |        |
|         |                   |          |        |

### Additional Notes
_Add any additional observations or notes here._
