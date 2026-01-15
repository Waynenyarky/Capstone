# Admin Feature

Preferred import paths and usage:

- Components and views: import from `@/features/admin` and sub-feature barrels.
  - Example: `import { AdminWorkspaceGate } from '@/features/admin'`
  - Example: `import { ServiceTable, CreateServiceForm } from '@/features/admin/services'`
  - Example: `import { ProvidersTable } from '@/features/admin/providers'`

- Hooks: import from the corresponding sub-feature barrel.
  - Example: `import { useServiceTable, useServiceForm } from '@/features/admin/services'`
  - Example: `import { useProvidersTable } from '@/features/admin/providers'`
  - Example: `import { useUsersTable } from '@/features/admin/users'`
  - Example: `import { useConfirmAreasSave } from '@/features/admin/areas'`

- Services: internal to each sub-feature. Use admin services only within admin hooks/components.

Notes:
- The root barrel `@/features/admin` re-exports `AdminWorkspaceGate` and sub-feature barrels (`services`, `providers`, `users`, `areas`) to avoid deep imports.
- Each sub-feature barrel consolidates its components, hooks, constants, and helpers. Prefer importing from these barrels instead of nested paths.

Conventions:
- Avoid deep paths (e.g., `@/features/admin/services/organisms/...`). Use the barrels above for imports.
- For Ant Design forms, use `form.setFieldsValue()` for programmatic changes; do not rely on dynamic `initialValues`.

Examples:
- Admin workspace:
  ```js
  import { AdminWorkspaceGate } from '@/features/admin'
  ```
- Admin services table and hooks:
  ```js
  import { ServiceTable, useServiceTable } from '@/features/admin/services'
  ```
- Supported areas:
  ```js
  import { SupportedAreasTable, useConfirmAreasSave } from '@/features/admin/areas'
  ```
