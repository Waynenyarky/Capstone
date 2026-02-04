# 🚀 Quick Start Guide

## One-Command Start (Easiest Way!)

Instead of remembering long commands, just run:

```bash
./start.sh
```

This will:
1. ✅ Start all Docker services
2. ✅ Wait for them to be ready
3. ✅ Automatically open browser tabs for:
   - IPFS Gateway (http://localhost:8080)
   - MongoDB Connection Info
   - All API services (if running)
   - Web app (if running)

**No commands to remember!** 🎉

## Stop Services

To stop everything:

```bash
./stop.sh
```

This will:
- ✅ Stop all Docker services
- ✅ Optionally remove volumes (asks you first)

## Restart Services

To restart and reopen browser tabs:

```bash
./restart.sh
```

## Alternative: Just Open Browser Tabs

If Docker is already running, just open the browser tabs:

```bash
./scripts/open-services.sh
```

## What Gets Opened?

### 🌐 IPFS Gateway
- **URL**: http://localhost:8080
- **Use**: View IPFS files by visiting `http://localhost:8080/ipfs/{CID}`
- **Example**: If you have a CID like `QmXxxx...`, visit `http://localhost:8080/ipfs/QmXxxx...`

### 🔌 MongoDB Connection Info
- Shows connection string: `mongodb://localhost:27017`
- Database: `capstone_project`
- Quick commands to access MongoDB

### 📡 API Services
- Auth Service: http://localhost:3001/api/auth
- Business Service: http://localhost:3002/api/business
- Admin Service: http://localhost:3003/api/admin
- Audit Service: http://localhost:3004/api/audit

### 💻 Web App
- http://localhost:5173 (if you've started it with `cd web && npm run dev`)

## Manual Access (If You Need It)

### MongoDB
```bash
# Interactive shell
docker exec -it capstone-mongodb mongosh capstone_project

# Or use MongoDB Compass
# Download: https://www.mongodb.com/try/download/compass
# Connect to: mongodb://localhost:27017
```

### IPFS
```bash
# View files in browser
# Just visit: http://localhost:8080/ipfs/{CID}

# Or use the browser script
cd backend/services/auth-service
node scripts/browseIpfs.js
```

### Docker Commands
```bash
# Start services
docker-compose up -d

# Stop services
docker-compose down

# View logs
docker-compose logs -f

# Restart services
docker-compose restart
```

## Troubleshooting

### Scripts won't run?
```bash
chmod +x start.sh scripts/open-services.sh
```

### Services not opening?
- Make sure Docker is running: `docker ps`
- Wait a bit longer - services might still be starting
- Check logs: `docker-compose logs`

### Browser tabs not opening?
- On macOS, the `open` command should work automatically
- On Linux, you might need: `xdg-open` instead
- On Windows, the script should use `start`

### Database empty after Docker restart?
- **Form definitions** and **dev users/roles** seed automatically when the DB is empty (with `SEED_FORM_DEFINITIONS=true` and `SEED_DEV=true` in Docker).
- If seeding didn't run (e.g. services started before MongoDB was ready), restart the admin and auth services:
  ```bash
  docker-compose restart admin-service auth-service
  ```
- To manually seed form definitions:
  ```bash
  docker exec -it capstone-admin-service npm run migrate:seed-forms
  ```
  (Requires `MONGO_URI` to point at the MongoDB container; the admin-service container has this set.)

## Pro Tips 💡

1. **Bookmark the pages** that open - then you don't need the script!
2. **Use the IPFS browser script** to find CIDs: `node backend/services/auth-service/scripts/browseIpfs.js`
3. **MongoDB Compass** is like a browser for MongoDB - much easier than command line!
