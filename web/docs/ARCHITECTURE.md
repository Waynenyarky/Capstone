# Clean Architecture with MVC Pattern

This document describes the Clean Architecture implementation in the web folder, ensuring proper separation of concerns and maintainability.

## Architecture Layers

### 1. Domain Layer (`domain/`)
**Purpose**: Contains business logic and entities - no dependencies on external frameworks

**Structure**:
```
domain/
  passkey/
    entities/
      PasskeyCredential.js    # Domain entity
    useCases/
      RegisterPasskeyUseCase.js
      ListPasskeysUseCase.js
      DeletePasskeyUseCase.js
      DeleteAllPasskeysUseCase.js
      CrossDeviceAuthUseCase.js
```

**Principles**:
- Pure business logic
- No dependencies on React, services, or infrastructure
- Entities contain domain rules
- Use cases orchestrate business operations

### 2. Application Layer (`application/`)
**Purpose**: Defines interfaces and coordinates use cases

**Structure**:
```
application/
  passkey/
    repositories/
      WebAuthnRepository.js   # Repository interface
      UserRepository.js        # Repository interface
    index.js                   # Barrel export
```

**Principles**:
- Defines contracts (interfaces) for infrastructure
- Coordinates use cases
- Dependency injection point

### 3. Infrastructure Layer (`services/`)
**Purpose**: Implements repository interfaces, handles API calls

**Structure**:
```
services/
  webauthnService.js          # API implementation
  authService.js              # API implementation
```

**Principles**:
- Implements repository interfaces
- Handles HTTP requests
- Data transformation
- No business logic

### 4. Presentation Layer (`presentation/` and `views/`)
**Purpose**: UI components and hooks that connect to use cases

**Structure**:
```
presentation/
  passkey/
    hooks/
      usePasskeyManager.js    # Connects UI to use cases
      useCrossDeviceAuth.js
    components/
      PasskeyStatusCard.jsx   # Pure presentation
      PasskeyList.jsx
      PasskeyRegistrationGuide.jsx
      PasskeyDisableModal.jsx
      CrossDeviceAuthStatus.jsx

views/
  components/
    PasskeyManager.jsx        # Container component
  pages/
    PasskeyMobileAuth.jsx     # Page component
```

**Principles**:
- Components are pure presentation (no business logic)
- Hooks connect UI to use cases
- Container components orchestrate presentation components
- Maximum file size: ~200 lines per component

## MVC Pattern Implementation

### Model (Domain + Application)
- **Domain Entities**: `domain/passkey/entities/PasskeyCredential.js`
- **Use Cases**: `domain/passkey/useCases/*.js`
- **Repositories**: `application/passkey/repositories/*.js`

### View (Presentation)
- **Components**: `presentation/passkey/components/*.jsx`
- **Pages**: `views/pages/*.jsx`
- **Hooks**: `presentation/passkey/hooks/*.js`

### Controller (Hooks + Use Cases)
- **Hooks**: Connect View to Use Cases
- **Use Cases**: Execute business logic
- **Repositories**: Abstract data access

## Dependency Direction

```
Presentation → Application → Domain
     ↓              ↓
Infrastructure (Services)
```

**Rules**:
1. Domain has NO dependencies
2. Application depends only on Domain
3. Infrastructure implements Application interfaces
4. Presentation depends on Application and Domain

## File Size Guidelines

- **Components**: Max 200 lines
- **Hooks**: Max 150 lines
- **Use Cases**: Max 100 lines
- **Services**: Max 150 lines

If a file exceeds these limits, split it into smaller, focused files.

## Refactoring Status

### ✅ Completed
- Passkey feature follows Clean Architecture
- PasskeyManager.jsx: 424 lines → ~80 lines (container) + 4 components
- PasskeyMobileAuth.jsx: 685 lines → ~50 lines (container) + 1 component + 1 hook

### 🔄 In Progress
- ProfileSettings.jsx: 1224 lines (needs refactoring)
- Other large components

## Best Practices

1. **Single Responsibility**: Each file has one clear purpose
2. **Dependency Injection**: Use cases receive dependencies via constructor
3. **Pure Functions**: Business logic in use cases is testable
4. **Component Composition**: Break large components into smaller ones
5. **Separation of Concerns**: UI logic separate from business logic

## Example: Adding a New Feature

1. **Domain**: Create entity and use case
   ```js
   domain/feature/entities/FeatureEntity.js
   domain/feature/useCases/DoSomethingUseCase.js
   ```

2. **Application**: Create repository interface
   ```js
   application/feature/repositories/FeatureRepository.js
   ```

3. **Infrastructure**: Implement repository
   ```js
   services/featureService.js  // Implements FeatureRepository
   ```

4. **Presentation**: Create hook and components
   ```js
   presentation/feature/hooks/useFeature.js
   presentation/feature/components/FeatureComponent.jsx
   views/components/FeatureContainer.jsx
   ```
