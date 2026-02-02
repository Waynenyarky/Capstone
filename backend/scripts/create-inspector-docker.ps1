# Create Inspector account using Docker MongoDB (same DB as backend)
# Use this when backend runs via Docker - ensures same database
# Usage: .\create-inspector-docker.ps1
#    Or: .\create-inspector-docker.ps1 waynenrq@gmail.com "John" "Wayne" "TempPass123!"

param(
    [string]$Email = "waynenrq@gmail.com",
    [string]$FirstName = "John",
    [string]$LastName = "Wayne",
    [string]$Password = "TempPass123!"
)

$env:MONGO_URI = "mongodb://localhost:27017/capstone_project"
node "$PSScriptRoot\create-inspector.js" $Email $FirstName $LastName $Password
