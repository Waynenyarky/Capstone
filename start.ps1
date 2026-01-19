# Capstone Project - Complete Startup Script (PowerShell)
# 
# This script starts Docker services and web frontend properly on Windows
# 
# Usage:
#   .\start.ps1          # Production mode
#   .\start.ps1 -Dev     # Development mode (auto-reload enabled)

param(
    [switch]$Dev
)

$ErrorActionPreference = "Continue"

# Colors for output
function Write-ColorOutput($ForegroundColor, $Message) {
    $fc = $host.UI.RawUI.ForegroundColor
    $host.UI.RawUI.ForegroundColor = $ForegroundColor
    Write-Output $Message
    $host.UI.RawUI.ForegroundColor = $fc
}

Write-ColorOutput "Cyan" "🚀 Capstone Project Startup Script"
Write-Output ""

# Step 1: Start Docker Services
if ($Dev) {
    Write-ColorOutput "Cyan" "🔥 Starting in DEVELOPMENT mode (auto-reload enabled)..."
    docker-compose -f docker-compose.yml -f docker-compose.dev.yml up -d
} else {
    Write-ColorOutput "Cyan" "🚀 Starting Docker services..."
    docker-compose up -d
}

Write-Output ""
Write-ColorOutput "Cyan" "⏳ Waiting for services to initialize..."
Start-Sleep -Seconds 10

# Step 2: Verify Docker services are running
Write-Output ""
Write-ColorOutput "Blue" "📦 Checking Docker services..."
$services = docker-compose ps --format "{{.Name}}: {{.Status}}"
foreach ($service in $services) {
    if ($service -match "Up") {
        Write-ColorOutput "Green" "   ✅ $service"
    } else {
        Write-ColorOutput "Yellow" "   ⚠️  $service"
    }
}

# Step 3: Start Web Frontend
Write-Output ""
Write-ColorOutput "Cyan" "🌐 Starting web frontend..."

$webPath = Join-Path $PSScriptRoot "web"
if (Test-Path $webPath) {
    Push-Location $webPath
    
    # Check if node_modules exists
    if (-not (Test-Path "node_modules")) {
        Write-ColorOutput "Yellow" "   Installing web dependencies (first time only)..."
        npm install
    }
    
    # Check if Vite is already running on port 5173
    $viteRunning = $false
    try {
        $connection = Test-NetConnection -ComputerName localhost -Port 5173 -WarningAction SilentlyContinue -InformationLevel Quiet
        if ($connection) {
            $viteRunning = $true
        }
    } catch {
        # Port check failed, assume not running
    }
    
    if (-not $viteRunning) {
        Write-ColorOutput "Green" "   Starting web dev server on port 5173..."
        Write-ColorOutput "Cyan" "   Opening in a new PowerShell window..."
        
        # Start in a new window so user can see logs
        # Use -ExecutionPolicy Bypass to avoid execution policy issues with npm
        $webPathEscaped = $PWD.Path.Replace("'", "''")
        Start-Process powershell -ArgumentList "-NoExit", "-ExecutionPolicy", "Bypass", "-Command", "cd '$webPathEscaped'; Write-Host '🌐 Vite Dev Server Running...' -ForegroundColor Green; Write-Host 'Press Ctrl+C to stop' -ForegroundColor Yellow; Write-Host ''; npm run dev" -WindowStyle Normal
        
        Write-ColorOutput "Green" "   ✅ Web server starting in new window"
        Write-ColorOutput "Cyan" "   Wait 5-10 seconds for it to fully start"
    } else {
        Write-ColorOutput "Yellow" "   Web dev server already running on port 5173"
    }
    
    Pop-Location
} else {
    Write-ColorOutput "Yellow" "   ⚠️  Web directory not found, skipping web frontend"
}

# Step 4: Wait and verify
Write-Output ""
Write-ColorOutput "Cyan" "⏳ Waiting for everything to be ready..."
Start-Sleep -Seconds 5

# Step 5: Wait for API services and open browser tabs
Write-Output ""
Write-ColorOutput "Cyan" "⏳ Waiting for API services to be ready..."
$apiServices = @(
    @{Port=3001; Name="Auth Service"},
    @{Port=3002; Name="Business Service"},
    @{Port=3003; Name="Admin Service"},
    @{Port=3004; Name="Audit Service"}
)

foreach ($service in $apiServices) {
    $maxWait = 30
    $waited = 0
    $ready = $false
    
    while ($waited -lt $maxWait) {
        try {
            $response = Invoke-WebRequest -Uri "http://localhost:$($service.Port)/api/health" -TimeoutSec 2 -UseBasicParsing -ErrorAction SilentlyContinue
            if ($response.StatusCode -eq 200) {
                Write-ColorOutput "Green" "   ✅ $($service.Name) ($($service.Port)) is ready"
                $ready = $true
                break
            }
        } catch {
            # Service not ready yet
        }
        Start-Sleep -Seconds 1
        $waited++
    }
    
    if (-not $ready) {
        Write-ColorOutput "Yellow" "   ⚠️  $($service.Name) ($($service.Port)) not responding after ${maxWait}s"
    }
}

Start-Sleep -Seconds 2

# Step 6: Open browser tabs
Write-Output ""
Write-ColorOutput "Cyan" "🌐 Opening browser tabs..."
Write-ColorOutput "Cyan" "💡 Note: Browser tabs may open in the background. Check your browser!"
Write-Output ""

# Function to open URL with delay
function Open-BrowserTab {
    param($Url, $Name)
    Write-ColorOutput "Green" "   ✅ Opening $Name..."
    Write-ColorOutput "Cyan" "      URL: $Url"
    try {
        Start-Process $Url
        Start-Sleep -Milliseconds 500
    } catch {
        Write-ColorOutput "Yellow" "   ⚠️  Failed to open $Url"
    }
}

# Open IPFS Gateway (with test CID)
Open-BrowserTab "http://localhost:8080/ipfs/QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG" "IPFS Gateway (Test)"
Start-Sleep -Seconds 1

# Open IPFS Web UI
Open-BrowserTab "http://localhost:5001/webui" "IPFS Web UI"
Start-Sleep -Seconds 1

# Print MongoDB connection info
Write-Output ""
Write-ColorOutput "Blue" "🔌 MongoDB Connection Info:"
Write-ColorOutput "Cyan" "   Connection String: mongodb://localhost:27017"
Write-ColorOutput "Cyan" "   Database: capstone_project"
Write-ColorOutput "Cyan" "   Quick Access: docker exec -it capstone-mongodb mongosh capstone_project"
Write-Output ""

# Open API service health checks
Write-ColorOutput "Blue" "🔌 Opening API service tabs..."
foreach ($service in $apiServices) {
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:$($service.Port)/api/health" -TimeoutSec 2 -UseBasicParsing -ErrorAction SilentlyContinue
        if ($response.StatusCode -eq 200) {
            Open-BrowserTab "http://localhost:$($service.Port)/api/health" "$($service.Name) (Health Check)"
            Start-Sleep -Milliseconds 500
        }
    } catch {
        Write-ColorOutput "Yellow" "   ⚠️  Skipping $($service.Name) ($($service.Port)) - not ready"
    }
}

# Open Web App (always try, even if not running)
$webRunning = $false
try {
    $connection = Test-NetConnection -ComputerName localhost -Port 5173 -WarningAction SilentlyContinue -InformationLevel Quiet
    if ($connection) {
        $webRunning = $true
    }
} catch {
    # Port check failed
}

if ($webRunning) {
    Open-BrowserTab "http://localhost:5173" "Web App"
} else {
    Write-ColorOutput "Yellow" "   ℹ️  Web frontend not running, but opening anyway..."
    Write-ColorOutput "Yellow" "   (Start it with: cd web && npm run dev)"
    Open-BrowserTab "http://localhost:5173" "Web App (Not Running)"
}

Write-Output ""
Write-ColorOutput "Green" "✅ Done! Browser tabs should be open."
Write-Output ""
Write-ColorOutput "Cyan" "💡 Tip: If tabs didn't open, check your browser - they might be in the background."
Write-ColorOutput "Cyan" "💡 Tip: Bookmark these pages for quick access!"
Write-Output ""
Write-ColorOutput "Yellow" "📋 Quick URLs (copy/paste these if needed):"
Write-Output "   Web App: http://localhost:5173"
Write-Output "   IPFS Gateway: http://localhost:8080/ipfs/{CID}"
Write-Output "   IPFS Web UI: http://localhost:5001/webui"
Write-Output "   Auth API: http://localhost:3001/api/health"
Write-Output "   Business API: http://localhost:3002/api/health"
Write-Output "   Admin API: http://localhost:3003/api/health"
Write-Output "   Audit API: http://localhost:3004/api/health"
Write-Output "   MongoDB: mongodb://localhost:27017/capstone_project"
Write-Output ""

Write-Output ""
Write-ColorOutput "Green" "✅ All done! Your services are running and browser tabs are open."
Write-Output ""
if ($Dev) {
    Write-ColorOutput "Cyan" "🔥 Development Mode: Auto-reload enabled!"
    Write-ColorOutput "Cyan" "   • Backend services will restart automatically on file changes"
    Write-ColorOutput "Cyan" "   • Frontend has hot module replacement (HMR) - changes appear instantly"
    Write-Output ""
}
Write-ColorOutput "Cyan" "Running services:"
Write-Output "   • Docker services (MongoDB, IPFS, APIs on ports 3001-3004)"
Write-Output "   • Web frontend (http://localhost:5173) - Check the new PowerShell window"
Write-Output ""
Write-ColorOutput "Cyan" "To stop:"
Write-Output "   • Docker: .\stop.ps1 or docker-compose down"
Write-Output "   • Web: Close the PowerShell window running npm run dev"
Write-Output ""
Write-ColorOutput "Cyan" "To view logs:"
if ($Dev) {
    Write-Output "   • Docker: docker-compose -f docker-compose.yml -f docker-compose.dev.yml logs -f"
} else {
    Write-Output "   • Docker: docker-compose logs -f"
}
Write-Output "   • Web: Check the PowerShell window running npm run dev"
Write-Output ""
