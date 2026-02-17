# Admin Feature

Preferred import paths and usage:

- Components and views: import from `@/features/admin` and sub-feature barrels.
  - Example: `import { AdminLayout, TamperIncidentsPanel } from '@/features/admin'`
  - Example: `import { UsersTable } from '@/features/admin/users'`

- Hooks: import from the corresponding sub-feature barrel.
  - Example: `import { useStaffManagement } from '@/features/admin/hooks'`
  - Example: `import { useUsersTable } from '@/features/admin/users'`

- Services: internal to each sub-feature. Use admin services only within admin hooks/components.

Notes:
- The root barrel `@/features/admin` re-exports components and sub-feature barrels (`users`, `components`) to avoid deep imports.
- Each sub-feature barrel consolidates its components, hooks, constants, and helpers. Prefer importing from these barrels instead of nested paths.

Conventions:
- Avoid deep paths (e.g., `@/features/admin/services/organisms/...`). Use the barrels above for imports.
- For Ant Design forms, use `form.setFieldsValue()` for programmatic changes; do not rely on dynamic `initialValues`.

Examples:
- Admin components:
  ```js
  import { AdminLayout, TamperIncidentsPanel, RecoveryRequestsTable } from '@/features/admin'
  ```
- User management:
  ```js
  import { UsersTable } from '@/features/admin/users'
  import { useStaffManagement } from '@/features/admin/hooks'
  ```
