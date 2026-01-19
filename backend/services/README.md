# Backend Microservices

This directory contains the 4 microservices that make up the backend system.

## Services

### Auth Service (Port 3001)
- Authentication, authorization, session management
- MFA/WebAuthn
- User account operations
- Email notifications (via REST API)

### Business Service (Port 3002)
- Business registration workflow
- Permit processing
- Document management (with IPFS support)
- PDF generation

### Admin Service (Port 3003)
- Admin approvals
- Monitoring operations
- Maintenance windows
- Tamper incident tracking

### Audit Service (Port 3004)
- Audit log creation
- Blockchain integration
- Hash verification
- Audit history queries

## Quick Start

### Install Dependencies

```bash
npm run install:all
```

This installs dependencies for the orchestrator and all 4 services.

### Run All Services

```bash
npm start
```

Or for development with auto-reload:

```bash
npm run dev
```

### Run Individual Services

```bash
npm run auth      # Auth Service only
npm run business  # Business Service only
npm run admin     # Admin Service only
npm run audit     # Audit Service only
```

## Architecture

Each service follows a **layered architecture**:
- `routes/` - API endpoints
- `services/` - Business logic
- `models/` - Data models
- `lib/` - Infrastructure utilities
- `config/` - Configuration
- `middleware/` - Express middleware
- `jobs/` - Background jobs

## Environment Variables

Each service needs its own `.env` file. See individual service READMEs for details.

## IPFS Integration

File uploads now support IPFS storage with automatic fallback to local storage. Configure IPFS in `.env`:

```env
IPFS_PROVIDER=local|pinata|infura
IPFS_API_URL=http://127.0.0.1:5001
IPFS_GATEWAY_URL=http://127.0.0.1:8080/ipfs/
```

## Deployment

For capstone, all services can run in a single Render instance using `concurrently`. See `package.json` for orchestration scripts.
