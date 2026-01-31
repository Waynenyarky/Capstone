#!/bin/bash
# ==========================================
# Auto-Shutdown After Inactivity
# ==========================================
# This script monitors for web traffic and shuts down the instance
# if there's no activity for a specified period.
#
# Install: Run on EC2 after deployment
#   chmod +x ~/capstone/deploy/auto-shutdown.sh
#   ~/capstone/deploy/auto-shutdown.sh --install
#
# Uninstall:
#   ~/capstone/deploy/auto-shutdown.sh --uninstall
#
# ==========================================

# Configuration
INACTIVITY_MINUTES=${INACTIVITY_MINUTES:-30}  # Shutdown after 30 min of no traffic
CHECK_INTERVAL=300  # Check every 5 minutes
ACTIVITY_FILE="/tmp/last_activity"
LOG_FILE="/var/log/auto-shutdown.log"

# Ports to monitor for traffic (your services)
MONITORED_PORTS="3001,3002,3003,3004,3005,5173,8080"

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | sudo tee -a "$LOG_FILE"
}

# Check if there's active network connections on monitored ports
check_activity() {
    # Count established connections to our service ports
    CONNECTIONS=$(ss -tn state established "( dport = :3001 or dport = :3002 or dport = :3003 or dport = :3004 or dport = :3005 or dport = :5173 or dport = :8080 or sport = :3001 or sport = :3002 or sport = :3003 or sport = :3004 or sport = :3005 or sport = :5173 or sport = :8080 )" 2>/dev/null | wc -l)
    
    # Also check for recent HTTP access in docker logs (last 5 minutes)
    RECENT_REQUESTS=$(docker logs capstone-auth-service --since 5m 2>&1 | grep -c "HTTP" || echo "0")
    
    if [ "$CONNECTIONS" -gt 1 ] || [ "$RECENT_REQUESTS" -gt 0 ]; then
        return 0  # Activity detected
    else
        return 1  # No activity
    fi
}

# Update last activity timestamp
update_activity() {
    date +%s > "$ACTIVITY_FILE"
}

# Get minutes since last activity
get_idle_minutes() {
    if [ ! -f "$ACTIVITY_FILE" ]; then
        update_activity
        echo 0
        return
    fi
    
    LAST_ACTIVITY=$(cat "$ACTIVITY_FILE")
    NOW=$(date +%s)
    DIFF=$((NOW - LAST_ACTIVITY))
    MINUTES=$((DIFF / 60))
    echo $MINUTES
}

# Main monitoring loop
monitor_loop() {
    log "Auto-shutdown monitor started (shutdown after ${INACTIVITY_MINUTES} min of inactivity)"
    update_activity
    
    while true; do
        if check_activity; then
            update_activity
            log "Activity detected - resetting idle timer"
        else
            IDLE_MINUTES=$(get_idle_minutes)
            log "No activity - idle for ${IDLE_MINUTES} minutes (shutdown at ${INACTIVITY_MINUTES})"
            
            if [ "$IDLE_MINUTES" -ge "$INACTIVITY_MINUTES" ]; then
                log "SHUTTING DOWN due to ${IDLE_MINUTES} minutes of inactivity"
                
                # Give 1 minute warning in case someone connects
                sleep 60
                
                # Check one more time before shutdown
                if check_activity; then
                    log "Activity detected during grace period - cancelling shutdown"
                    update_activity
                else
                    log "Proceeding with shutdown..."
                    sudo shutdown -h now
                fi
            fi
        fi
        
        sleep $CHECK_INTERVAL
    done
}

# Install as systemd service
install_service() {
    echo "Installing auto-shutdown service..."
    
    # Create systemd service
    sudo tee /etc/systemd/system/auto-shutdown.service > /dev/null << EOF
[Unit]
Description=Auto-shutdown after inactivity
After=docker.service

[Service]
Type=simple
ExecStart=/home/ec2-user/capstone/deploy/auto-shutdown.sh --monitor
Restart=always
RestartSec=10
Environment=INACTIVITY_MINUTES=${INACTIVITY_MINUTES}

[Install]
WantedBy=multi-user.target
EOF

    sudo systemctl daemon-reload
    sudo systemctl enable auto-shutdown
    sudo systemctl start auto-shutdown
    
    echo "✓ Auto-shutdown service installed and started"
    echo "  - Shutdown after: ${INACTIVITY_MINUTES} minutes of inactivity"
    echo "  - Check status: sudo systemctl status auto-shutdown"
    echo "  - View logs: sudo tail -f /var/log/auto-shutdown.log"
}

# Uninstall service
uninstall_service() {
    echo "Removing auto-shutdown service..."
    sudo systemctl stop auto-shutdown 2>/dev/null
    sudo systemctl disable auto-shutdown 2>/dev/null
    sudo rm -f /etc/systemd/system/auto-shutdown.service
    sudo systemctl daemon-reload
    echo "✓ Auto-shutdown service removed"
}

# Show status
show_status() {
    echo "=== Auto-Shutdown Status ==="
    if systemctl is-active --quiet auto-shutdown 2>/dev/null; then
        echo "Service: RUNNING"
        IDLE=$(get_idle_minutes)
        echo "Idle time: ${IDLE} minutes"
        echo "Shutdown at: ${INACTIVITY_MINUTES} minutes"
        echo ""
        echo "Recent logs:"
        sudo tail -5 "$LOG_FILE" 2>/dev/null || echo "(no logs yet)"
    else
        echo "Service: NOT RUNNING"
        echo ""
        echo "Install with: $0 --install"
    fi
}

# Parse arguments
case "$1" in
    --install|-i)
        install_service
        ;;
    --uninstall|-u)
        uninstall_service
        ;;
    --monitor|-m)
        monitor_loop
        ;;
    --status|-s)
        show_status
        ;;
    --help|-h)
        echo "Usage: $0 [OPTION]"
        echo ""
        echo "Options:"
        echo "  --install, -i     Install as systemd service"
        echo "  --uninstall, -u   Remove the service"
        echo "  --status, -s      Show current status"
        echo "  --monitor, -m     Run monitor loop (used by service)"
        echo "  --help, -h        Show this help"
        echo ""
        echo "Environment variables:"
        echo "  INACTIVITY_MINUTES  Minutes before shutdown (default: 30)"
        echo ""
        echo "Example:"
        echo "  INACTIVITY_MINUTES=60 $0 --install  # Shutdown after 1 hour"
        ;;
    *)
        show_status
        ;;
esac
