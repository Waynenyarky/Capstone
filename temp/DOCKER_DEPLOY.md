# 🐳 Docker Deployment - Super Simple!

Deploy everything with **one command**! No manual setup needed.

## Prerequisites

Just install Docker:
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (Mac/Windows)
- Or Docker Engine + Docker Compose (Linux)

That's it! No need to install MongoDB, Ganache, IPFS, or Node.js separately.

## Quick Start

### 1. Create .env file (optional)

```bash
cp .env.docker .env
```

Edit `.env` if you want to customize:
- `EMAIL_API_KEY` (if using SendGrid)
- `JWT_SECRET` (change in production)
- `DEPLOYER_PRIVATE_KEY` (optional - uses default)

### 2. Deploy Everything

```bash
docker-compose up -d
```

**That's it!** 🎉

### 3. Check Status

```bash
docker-compose ps
```

You should see all services running:
- ✅ mongodb
- ✅ ganache
- ✅ ipfs
- ✅ deploy-contracts (completed)
- ✅ auth-service
- ✅ business-service
- ✅ admin-service
- ✅ audit-service

### 4. View Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f auth-service
docker-compose logs -f audit-service
```

### 5. Test Services

```bash
# Health checks
curl http://localhost:3001/api/health
curl http://localhost:3002/api/health
curl http://localhost:3003/api/health
curl http://localhost:3004/api/health
```

## What Gets Deployed

- **MongoDB** - Database (port 27017)
- **Ganache** - Blockchain network (port 7545)
- **IPFS** - File storage (ports 4001, 5001, 8080)
- **Smart Contracts** - Automatically deployed
- **Auth Service** - Port 3001
- **Business Service** - Port 3002
- **Admin Service** - Port 3003
- **Audit Service** - Port 3004

## Common Commands

```bash
# Start everything
docker-compose up -d

# Stop everything
docker-compose down

# Restart everything
docker-compose restart

# Rebuild and start (after code changes)
docker-compose up -d --build

# View logs
docker-compose logs -f

# Stop and remove everything (including data)
docker-compose down -v
```

## Access Services

- **Auth API**: http://localhost:3001
- **Business API**: http://localhost:3002
- **Admin API**: http://localhost:3003
- **Audit API**: http://localhost:3004
- **MongoDB**: localhost:27017
- **Ganache**: localhost:7545
- **IPFS Gateway**: http://localhost:8080

## Troubleshooting

### Services won't start

```bash
# Check logs
docker-compose logs

# Rebuild
docker-compose up -d --build
```

### Port already in use

If ports are already in use, edit `docker-compose.yml` and change the port mappings.

### Contracts not deploying

```bash
# Check deploy-contracts logs
docker-compose logs deploy-contracts

# Redeploy contracts
docker-compose up deploy-contracts --force-recreate
```

### Need to reset everything

```bash
# Stop and remove everything (including volumes)
docker-compose down -v

# Start fresh
docker-compose up -d
```

## Development Mode

For development with hot-reload:

```bash
# Start infrastructure only
docker-compose up -d mongodb ganache ipfs

# Run services locally
cd backend/services
npm start
```

## Production Notes

For production:
1. Change `JWT_SECRET` to a strong random string
2. Set proper `EMAIL_API_KEY`
3. Use production MongoDB (update `MONGO_URI`)
4. Use production blockchain network
5. Configure proper CORS origins
6. Use environment secrets management

## That's It!

No complex setup, no manual configuration. Just `docker-compose up -d` and you're done! 🚀
