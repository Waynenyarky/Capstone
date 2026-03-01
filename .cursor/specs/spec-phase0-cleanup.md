# Phase 0: Dead Code Cleanup & Bug Fixes

## Overview
Remove all unused files, fix broken require paths, wire up unscheduled cron jobs, and clean up barrel exports. This creates a clean foundation before building new features.

## Prerequisites
None — this is the first phase.

## Files to DELETE

### Web: Authentication Components (9 files)
```
DELETE web/src/features/authentication/components/PasskeyManager.jsx
DELETE web/src/features/authentication/components/SendCodeForCurrentUser.jsx
DELETE web/src/features/authentication/components/SendDeleteCodeForCurrentUser.jsx
DELETE web/src/features/authentication/components/Profile.jsx
DELETE web/src/features/authentication/components/SessionActivityIndicator.jsx
DELETE web/src/features/authentication/components/SessionTimeoutWarning.jsx
DELETE web/src/features/authentication/components/RecoveryLockoutBanner.jsx
DELETE web/src/features/authentication/components/SuspiciousActivityAlert.jsx
DELETE web/src/features/authentication/components/RecoverySuspiciousActivityAlert.jsx
```

### Web: Authentication Hooks (1 file)
```
DELETE web/src/features/authentication/hooks/useConfirmLogout.js
```

### Web: Admin Components (6 files)
```
DELETE web/src/features/admin/pages/FormGroupDetailPanel.jsx
DELETE web/src/features/admin/pages/formDefinitions/components/DesktopView.jsx
DELETE web/src/features/admin/pages/formDefinitions/components/MobileView.jsx
DELETE web/src/features/admin/pages/formDefinitions/components/FilterDropdownContent.jsx
DELETE web/src/features/admin/pages/formDefinitions/components/FormStatsPieChart.jsx
DELETE web/src/features/admin/pages/formDefinitions/components/AuditLogSection.jsx
```

### Web: Shared Components (3 files)
```
DELETE web/src/features/shared/components/TopBar.jsx
DELETE web/src/shared/components/molecules/IconPicker.jsx
DELETE web/src/shared/components/molecules/iconOptions.js
```

### Web: Lib (1 file)
```
DELETE web/src/lib/otpClient.js
```

### Web: Storybook Defaults (9 files)
```
DELETE web/src/stories/Button.jsx
DELETE web/src/stories/Button.stories.js
DELETE web/src/stories/Header.jsx
DELETE web/src/stories/Header.stories.js
DELETE web/src/stories/Page.jsx
DELETE web/src/stories/Page.stories.js
DELETE web/src/stories/button.css
DELETE web/src/stories/header.css
DELETE web/src/stories/page.css
```

### Web: Walk-in Page (1 file — being replaced by integration into PermitReviewPage in Phase 1)
```
DELETE web/src/features/staffs/lgu-officer/pages/WalkInApplicationPage.jsx
```

### Backend: Unused Middleware (6 files)
```
DELETE backend/services/audit-service/src/middleware/fieldPermissions.js
DELETE backend/services/audit-service/src/middleware/validation.js
DELETE backend/services/admin-service/src/middleware/fieldPermissions.js
DELETE backend/services/admin-service/src/middleware/rateLimit.js
DELETE backend/services/business-service/src/middleware/fieldPermissions.js
DELETE backend/services/business-service/src/middleware/validation.js
```

### Backend: Unused Lib (1 file)
```
DELETE backend/services/business-service/src/lib/ipfsService.real.js
```

### ~~Backend: Duplicate Job~~ — KEEP
> `backend/services/auth-service/src/jobs/finalizeAccountDeletions.js` is imported by `backend/__tests__/features/background-jobs.test.js`. Deleting it would break an existing test. Leave it in place.

### Mobile: Unused Use Cases (5 files)
```
DELETE mobile/app/lib/domain/usecases/sign_in_with_google.dart
DELETE mobile/app/lib/domain/usecases/send_signup_code.dart
DELETE mobile/app/lib/domain/usecases/verify_signup_code.dart
DELETE mobile/app/lib/domain/usecases/schedule_account_deletion.dart
DELETE mobile/app/lib/domain/usecases/get_mfa_status.dart
```

**Total: 43 files to delete**

---

## Investigate for Deletion: `web/src/features/lgu-officer/` (non-staffs path)

Both `web/src/features/lgu-officer/` (~20 files) and `web/src/features/staffs/lgu-officer/` exist. The staffs/ version is used by `StaffDashboard.jsx`. Before deleting, grep for imports of the non-staffs path:

```bash
rg "features/lgu-officer" web/src/ --type js --type jsx
```

If no live imports reference `features/lgu-officer/` (only `features/staffs/lgu-officer/`), delete the entire `web/src/features/lgu-officer/` directory. If some imports do reference it, those imports need to be redirected to the staffs/ equivalents first.

---

## Files to MODIFY

### 1. Clean auth components barrel

**File:** `web/src/features/authentication/components/index.js`

Remove these export lines:
```javascript
// REMOVE these lines:
export { default as SendCodeForCurrentUser } from './SendCodeForCurrentUser.jsx'
export { default as SendDeleteCodeForCurrentUser } from './SendDeleteCodeForCurrentUser.jsx'
export { default as Profile } from './Profile.jsx'
export { default as RecoverySuspiciousActivityAlert } from './RecoverySuspiciousActivityAlert.jsx'
export { default as RecoveryLockoutBanner } from './RecoveryLockoutBanner.jsx'
export { default as SessionTimeoutWarning } from './SessionTimeoutWarning.jsx'
export { default as SessionActivityIndicator } from './SessionActivityIndicator.jsx'
export { default as SuspiciousActivityAlert } from './SuspiciousActivityAlert.jsx'
```

Note: PasskeyManager.jsx is NOT in this barrel (imported directly), so no barrel change needed for it.

### 2. Clean admin formDefinitions components barrel

**File:** `web/src/features/admin/pages/formDefinitions/components/index.js`

Remove these export lines:
```javascript
// REMOVE these lines:
export { default as FormStatsPieChart } from './FormStatsPieChart'
export { default as AuditLogSection } from './AuditLogSection'
export { default as FilterDropdownContent } from './FilterDropdownContent'
export { default as MobileView } from './MobileView'
export { default as DesktopView } from './DesktopView'
```

Keep these lines:
```javascript
export { default as FormDefinitionsDesktopView } from './FormDefinitionsDesktopView'
export { default as FormDefinitionsMobileView } from './FormDefinitionsMobileView'
export { default as FormDefinitionsLogsTab } from './FormDefinitionsLogsTab'
export { default as DraftsModal } from './DraftsModal'
export { default as AddVersionModal } from './AddVersionModal'
export { default as FormContentEditor } from './FormContentEditor'
export { default as DeactivateFormModal } from './DeactivateFormModal'
export { default as TargetingTab } from './TargetingTab'
```

### 3. Clean features/shared barrel

**File:** `web/src/features/shared/index.js`

Remove TopBar export and fix the duplicate LayoutPageHeader bug:
```javascript
// CURRENT (buggy):
export { default as TopBar } from './components/TopBar'
export { default as Sidebar } from './components/Sidebar'
export { default as LayoutPageHeader } from './components/LayoutPageHeader'
export { default as LayoutPageHeader } from './components/OnboardingStepContent'

// FIXED:
export { default as Sidebar } from './components/Sidebar'
export { default as LayoutPageHeader } from './components/LayoutPageHeader'
export { default as OnboardingStepContent } from './components/OnboardingStepContent'
```

**File:** `web/src/features/shared/components/index.js`

Remove TopBar export:
```javascript
// CURRENT:
export { default as TopBar } from './TopBar'
export { default as Sidebar } from './Sidebar'
export { default as LayoutPageHeader } from './LayoutPageHeader'
export { default as OnboardingStepContent } from './OnboardingStepContent'

// FIXED:
export { default as Sidebar } from './Sidebar'
export { default as LayoutPageHeader } from './LayoutPageHeader'
export { default as OnboardingStepContent } from './OnboardingStepContent'
```

### 4. Fix broken require path #1

**File:** `backend/services/admin-service/src/services/permitApplicationService.js`

Find the line (around line 488):
```javascript
require('../../../src/services/notificationService')
```

Replace with:
```javascript
require('../lib/notificationService')
```

Or if the correct module is within admin-service, use the admin-service-local path. Verify by checking what notification functions are called from this location.

### 5. Fix broken require path #2

**File:** `backend/services/auth-service/src/routes/notifications.js`

Find:
```javascript
require('../../src/lib/respond')
```

Replace with:
```javascript
require('../middleware/respond')
```

### 6. Remove mongo_dart from mobile pubspec.yaml

> **Note:** Cron job wiring (renewalAutoFlag, abandonedDetection) is handled in Phase 4C, which also installs `node-cron` and adds the postRequirementOverdue cron. Do NOT wire cron jobs here.



**File:** `mobile/app/pubspec.yaml`

Remove the `mongo_dart` dependency line from the dependencies section.

Then run: `cd mobile/app && flutter pub get`

---

## Edge Cases

- Before deleting any file, verify one more time it's not imported by doing a quick grep for its filename
- The `features/shared/index.js` has a REAL BUG (duplicate `LayoutPageHeader` export) — fix it while cleaning
- After deleting Storybook default files, verify Storybook still builds (it should; these are just example stories)
- After deleting mobile use cases, verify `flutter analyze` passes

## Acceptance Criteria

1. All 43 files are deleted (plus the `lgu-officer/` directory if confirmed unused)
2. All barrel exports are cleaned — no remaining references to deleted files
3. `features/shared/index.js` duplicate export bug is fixed
4. Both broken `require` paths are fixed
5. `mongo_dart` removed from pubspec.yaml
6. No new lint errors introduced
7. Web app builds without errors: `cd web && npm run build`
8. Backend services start without errors (test each: auth, business, admin, audit)
9. Mobile app analyzes clean: `cd mobile/app && flutter analyze`

## Rollback Plan

All changes are file deletions or small edits. Revert via `git checkout -- .` if anything breaks.
