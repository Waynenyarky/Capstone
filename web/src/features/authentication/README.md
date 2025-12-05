# Authentication Feature (Consolidated)

Preferred import paths and usage:

- Components and flows: import from `@/features/authentication`.
  - Example: `import { LoginForm, PasswordResetFlow, LoggedInEmailChangeFlow, LoggedInPasswordChangeFlow } from '@/features/authentication'`
  - Entry flows and logged-in account flows are re-exported here for a single API surface.

 - Hooks: import from `@/features/authentication/hooks`.
   - Example: `import { useAuthSession, useLogin, useChangeEmailForm, useLoggedInEmailChangeFlow } from '@/features/authentication/hooks'`

- Validations: import from `@/features/authentication/validations`.
  - Example: `import { loginEmailRules } from '@/features/authentication/validations'`

- Services: internal to the feature. Use `@/features/authentication/services` only within authentication hooks/components to avoid circular dependencies.
  - Example (internal): `import { loginPost } from '@/features/authentication/services'`

Notes:
- Logged-in account settings (flows, components, hooks) are consolidated under `@/features/authentication`. Prefer importing from the authentication barrels.
- Hooks and validations have their own barrels to keep imports stable and avoid deep paths.