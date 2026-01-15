# Feature Architecture Guide

This guide shows how to structure features following Clean Architecture with MVC pattern.

## Reference Implementation: Passkey Feature

The passkey feature (`features/authentication`) serves as the reference implementation.

## Standard Feature Structure

```
features/
└── feature-name/
    ├── domain/                    # Business Logic (Model - Domain)
    │   └── feature-name/
    │       ├── entities/         # Domain entities (pure objects)
    │       │   └── EntityName.js
    │       └── useCases/         # Business use cases
    │           ├── CreateEntityUseCase.js
    │           ├── UpdateEntityUseCase.js
    │           └── DeleteEntityUseCase.js
    │
    ├── application/               # Interfaces (Model - Application)
    │   └── feature-name/
    │       └── repositories/     # Repository interfaces
    │           └── EntityRepository.js
    │
    ├── services/                 # Infrastructure (API implementations)
    │   └── featureService.js    # Implements EntityRepository
    │
    ├── presentation/             # UI Layer (View + Controller)
    │   └── feature-name/
    │       ├── hooks/           # Controllers (connect View to Use Cases)
    │       │   └── useFeatureName.js
    │       └── components/    # View (pure presentation)
    │           ├── FeatureCard.jsx
    │           └── FeatureList.jsx
    │
    └── views/                    # Container Components & Pages
        ├── components/          # Container components
        │   └── FeatureContainer.jsx
        └── pages/               # Page components
            └── FeaturePage.jsx
```

## Layer Responsibilities

### Domain Layer (`domain/`)
- **Purpose**: Pure business logic
- **Rules**: 
  - NO dependencies on React, services, or infrastructure
  - Contains entities and use cases
  - Testable in isolation

**Example**:
```js
// domain/feature/useCases/CreateEntityUseCase.js
export class CreateEntityUseCase {
  constructor({ repository }) {
    this.repository = repository
  }
  
  async execute({ data }) {
    // Business logic only
    if (!data.name) {
      throw new Error('Name is required')
    }
    return await this.repository.create(data)
  }
}
```

### Application Layer (`application/`)
- **Purpose**: Defines interfaces and coordinates
- **Rules**:
  - Defines repository contracts
  - No implementation details
  - Dependency injection point

**Example**:
```js
// application/feature/repositories/EntityRepository.js
export class EntityRepository {
  constructor(service) {
    this.service = service
  }
  
  async create(data) {
    return await this.service.createEntity(data)
  }
}
```

### Infrastructure Layer (`services/`)
- **Purpose**: Implements repository interfaces
- **Rules**:
  - Implements Application layer interfaces
  - Handles HTTP requests
  - Data transformation only

**Example**:
```js
// services/featureService.js
export async function createEntity(data) {
  const response = await fetch('/api/entities', {
    method: 'POST',
    body: JSON.stringify(data)
  })
  return response.json()
}
```

### Presentation Layer (`presentation/` + `views/`)
- **Purpose**: UI components and hooks
- **Rules**:
  - Components are pure presentation
  - Hooks connect UI to use cases
  - Container components orchestrate

**Example Hook**:
```js
// presentation/feature/hooks/useFeatureName.js
export function useFeatureName() {
  const [entities, setEntities] = useState([])
  
  // Initialize use case
  const repo = new EntityRepository(featureService)
  const createUseCase = new CreateEntityUseCase({ repository: repo })
  
  const handleCreate = async (data) => {
    const result = await createUseCase.execute({ data })
    // Update UI state
  }
  
  return { entities, handleCreate }
}
```

**Example Component**:
```jsx
// presentation/feature/components/FeatureCard.jsx
export default function FeatureCard({ entity, onDelete }) {
  return (
    <Card>
      <h3>{entity.name}</h3>
      <Button onClick={() => onDelete(entity.id)}>Delete</Button>
    </Card>
  )
}
```

**Example Container**:
```jsx
// views/components/FeatureContainer.jsx
export default function FeatureContainer() {
  const { entities, handleCreate, handleDelete } = useFeatureName()
  
  return (
    <div>
      <FeatureList entities={entities} onDelete={handleDelete} />
      <CreateForm onSubmit={handleCreate} />
    </div>
  )
}
```

## Dependency Rules

1. **Domain** → No dependencies
2. **Application** → Depends only on Domain
3. **Infrastructure** → Implements Application interfaces
4. **Presentation** → Depends on Application and Domain

## File Size Guidelines

- **Components**: Max 200 lines
- **Hooks**: Max 150 lines
- **Use Cases**: Max 100 lines
- **Services**: Max 150 lines

## Migration Path

For existing features:

1. **Identify business logic** in components/hooks
2. **Extract to use cases** in `domain/feature/useCases/`
3. **Create repository interfaces** in `application/feature/repositories/`
4. **Move API calls** to `services/` (if not already there)
5. **Create presentation hooks** that use use cases
6. **Split large components** into smaller presentation components
7. **Create container components** in `views/components/`

## Example: Migrating a Feature

**Before** (Mixed concerns):
```jsx
// components/UserList.jsx (300 lines)
export default function UserList() {
  const [users, setUsers] = useState([])
  
  useEffect(() => {
    fetch('/api/users').then(r => r.json()).then(setUsers)
  }, [])
  
  const handleDelete = async (id) => {
    await fetch(`/api/users/${id}`, { method: 'DELETE' })
    setUsers(users.filter(u => u.id !== id))
  }
  
  // ... 250 more lines of mixed logic
}
```

**After** (Clean Architecture):
```js
// domain/user/useCases/DeleteUserUseCase.js
export class DeleteUserUseCase {
  constructor({ repository }) {
    this.repository = repository
  }
  async execute({ id }) {
    await this.repository.delete(id)
  }
}

// presentation/user/hooks/useUserList.js
export function useUserList() {
  const repo = new UserRepository(userService)
  const deleteUseCase = new DeleteUserUseCase({ repository: repo })
  // ... use use cases
}

// presentation/user/components/UserCard.jsx
export default function UserCard({ user, onDelete }) {
  // Pure presentation
}

// views/components/UserList.jsx
export default function UserList() {
  const { users, handleDelete } = useUserList()
  return <UserListPresentation users={users} onDelete={handleDelete} />
}
```

## Best Practices

1. ✅ Start with domain layer (entities + use cases)
2. ✅ Define repository interfaces in application layer
3. ✅ Implement repositories in infrastructure layer
4. ✅ Create presentation hooks that use use cases
5. ✅ Keep components pure (no business logic)
6. ✅ Use container components to orchestrate
7. ✅ Follow dependency direction strictly
