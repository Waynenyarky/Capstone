# Capstone Project - Stop Script (PowerShell)
# 
# This script stops all Docker services and web frontend

$ErrorActionPreference = "Continue"

function Write-ColorOutput($ForegroundColor, $Message) {
    $fc = $host.UI.RawUI.ForegroundColor
    $host.UI.RawUI.ForegroundColor = $ForegroundColor
    Write-Output $Message
    $host.UI.RawUI.ForegroundColor = $fc
}

Write-ColorOutput "Cyan" "🛑 Stopping Capstone services..."
Write-Output ""

# Stop Docker services
Write-ColorOutput "Yellow" "Stopping Docker services..."
docker-compose down 2>$null
docker-compose -f docker-compose.yml -f docker-compose.dev.yml down 2>$null
Write-ColorOutput "Green" "✅ Docker services stopped"
Write-Output ""

# Stop web dev server
Write-ColorOutput "Yellow" "Stopping web dev server..."
$webProcesses = Get-NetTCPConnection -LocalPort 5173 -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -Unique
if ($webProcesses) {
    foreach ($processId in $webProcesses) {
        try {
            Stop-Process -Id $processId -Force -ErrorAction SilentlyContinue
            Write-ColorOutput "Green" "   ✅ Stopped process $processId"
        } catch {
            Write-ColorOutput "Yellow" "   ⚠️  Could not stop process $processId"
        }
    }
} else {
    Write-ColorOutput "Cyan" "   ℹ️  No web server running on port 5173"
}

Write-Output ""
Write-ColorOutput "Green" "✅ All services stopped!"
Write-Output ""
Write-ColorOutput "Cyan" "To start again: .\start.ps1 -Dev"
Write-Output ""
