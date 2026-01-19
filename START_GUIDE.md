# Complete Startup Guide for Capstone Project

## 🚀 Proper Commands to Start Everything

### Option 1: Using start.sh (Recommended for Linux/Mac/Git Bash)

```bash
# Stop everything first (if running)
./stop.sh

# Start everything in development mode
./start.sh --dev
```

**What this does:**
- ✅ Starts all Docker services (MongoDB, IPFS, Ganache, Backend APIs)
- ✅ Starts web frontend dev server (Vite)
- ✅ Opens browser tabs automatically
- ✅ Enables hot-reload for both backend and frontend

### Option 2: Manual Step-by-Step (Windows PowerShell)

#### Step 1: Start Docker Services

```powershell
# Navigate to project root
cd "c:\Users\John Wayne Enrique\Capstone"

# Start Docker services in dev mode
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up -d

# Wait for services to be ready (about 10-15 seconds)
Start-Sleep -Seconds 10

# Verify services are running
docker-compose ps
```

#### Step 2: Start Web Frontend

```powershell
# Navigate to web directory
cd web

# Install dependencies (first time only)
npm install

# Start Vite dev server
npm run dev
```

**Keep this terminal open** - the web server runs in the foreground.

### Option 3: Separate Terminals (Best for Development)

**Terminal 1: Docker Services**
```powershell
cd "c:\Users\John Wayne Enrique\Capstone"
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up
```
*(Press Ctrl+C to stop)*

**Terminal 2: Web Frontend**
```powershell
cd "c:\Users\John Wayne Enrique\Capstone\web"
npm run dev
```
*(Press Ctrl+C to stop)*

## 📋 Verification Checklist

After starting, verify everything is running:

```powershell
# Check Docker services
docker-compose ps

# Check ports are listening
netstat -ano | Select-String ":(3001|3002|3003|3004|5173).*LISTENING"

# Test backend endpoints
curl http://localhost:3001/api/health
curl http://localhost:3002/api/health
curl http://localhost:3003/api/health
curl http://localhost:3004/api/health

# Test web frontend
curl http://localhost:5173
```

## 🛑 How to Stop Everything

### Option 1: Using stop.sh
```bash
./stop.sh
```

### Option 2: Manual Stop
```powershell
# Stop Docker services
docker-compose down

# Stop web dev server
# Press Ctrl+C in the terminal running npm run dev
# OR kill the process:
Get-NetTCPConnection -LocalPort 5173 | Select-Object -ExpandProperty OwningProcess | ForEach-Object { Stop-Process -Id $_ -Force }
```

## 🔧 Troubleshooting

### Web server not starting?
- Check if port 5173 is already in use
- Make sure you're in the `web` directory
- Run `npm install` if `node_modules` is missing

### Backend services not starting?
- Check Docker is running: `docker ps`
- Check logs: `docker-compose logs auth-service`
- Verify `.env` file exists in project root

### Port conflicts?
- Check what's using the ports: `netstat -ano | Select-String ":5173"`
- Stop conflicting processes or change ports in config files

## 📝 Environment Variables

Make sure your `.env` file in the project root has:
- `MONGO_URI=mongodb://127.0.0.1:27017/capstone_project`
- `EMAIL_API_KEY=your_sendgrid_key`
- `DEFAULT_FROM_EMAIL=your_verified_email`
- `WEBAUTHN_RPID=localhost`
- `WEBAUTHN_ORIGIN=http://localhost:5173`
- `FRONTEND_URL=http://localhost:5173`

## 🎯 Quick Reference

| Service | Port | URL | Status Check |
|---------|------|-----|--------------|
| Auth Service | 3001 | http://localhost:3001 | `/api/health` |
| Business Service | 3002 | http://localhost:3002 | `/api/health` |
| Admin Service | 3003 | http://localhost:3003 | `/api/health` |
| Audit Service | 3004 | http://localhost:3004 | `/api/health` |
| Web Frontend | 5173 | http://localhost:5173 | Root URL |
| MongoDB | 27017 | mongodb://localhost:27017 | Docker logs |
| IPFS | 5001 | http://localhost:5001 | `/api/v0/version` |
| Ganache | 7545 | http://localhost:7545 | Docker logs |
