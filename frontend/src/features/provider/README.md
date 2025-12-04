# Provider Feature

Preferred import paths and usage:

- Components and views: import from `@/features/provider`.
  - Example: `import { ProviderWorkspaceGate, ProviderOnboardingView } from '@/features/provider'`

- Hooks: import from `@/features/provider/hooks`.
  - Example: `import { useProviderProfileStatus, useProviderOfferings } from '@/features/provider/hooks'`

- Services: internal to the feature. Use any provider services only within provider hooks/components.

Notes:
- The root barrel `@/features/provider` re-exports commonly used components across sub-features (workspace, onboarding, offerings, account).
- The hooks barrel consolidates hooks from `workspace`, `onboarding`, `offerings`, `account`, and `application` to avoid deep imports.

Conventions:
- Headers: Do not set `'Content-Type'` on `GET` requests. Include `'Content-Type': 'application/json'` on `POST`/`PATCH`.
- Weekdays: Use `WEEK_DAYS` from `@/features/provider/constants.js` rather than hardcoding arrays. Example: `WEEK_DAYS.map(d => d.key)` for payload mapping.
- Indexing helpers: Use `indexById(list)` from `@/features/provider/services` to build quick `id -> item` maps in hooks/components.

Examples:
- Mapping services by id:
  ```js
  import { indexById } from '@/features/provider/services'
  const serviceMap = indexById(allowedServices)
  const service = serviceMap[offering.serviceId]
  ```
- Using weekday constants:
  ```js
  import { WEEK_DAYS } from '@/features/provider/constants.js'
  const availability = WEEK_DAYS.map(({ key }) => ({ day: key, available: false }))
  ```