# Start both development servers
Write-Host "Starting Project X Development Servers..." -ForegroundColor Cyan
Write-Host ""

# Start backend server in background
Write-Host "Starting Backend Server (http://localhost:3002)..." -ForegroundColor Magenta
$serverJob = Start-Job -ScriptBlock {
    Set-Location $using:PWD
    Set-Location server
    npm run dev
}

# Wait a moment for server to start
Start-Sleep -Seconds 2

# Start frontend in current terminal
Write-Host "Starting Frontend Server (http://localhost:3001)..." -ForegroundColor Blue
Write-Host ""
npm run dev

# Cleanup on exit
Stop-Job $serverJob
Remove-Job $serverJob
