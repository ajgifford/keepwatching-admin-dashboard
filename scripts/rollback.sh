#!/bin/bash

#######################################
# Admin Dashboard Rollback Script
#
# This script allows rolling back to a previous deployment
# Supports:
# - Listing available backups
# - Dry-run mode to preview changes
# - Selective rollback to specific backup
#######################################

set -e

# Configuration
PROD_DIR=/var/www/keepwatching-admin-dashboard
BACKUP_DIR=/var/www/keepwatching-admin-dashboard-backups

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Logging functions
log() {
    echo -e "${GREEN}[$(date '+%Y-%m-%d %H:%M:%S')]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1" >&2
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

dry_run_msg() {
    echo -e "${CYAN}[DRY-RUN]${NC} $1"
}

# Display usage
usage() {
    cat << EOF
${GREEN}Usage:${NC} $0 [OPTIONS]

${YELLOW}Options:${NC}
    --list              List all available backups
    --rollback N        Rollback to backup number N (use --list to see numbers)
    --dry-run           Preview rollback without making changes (use with --rollback)
    --help              Show this help message

${YELLOW}Examples:${NC}
    $0 --list                      # List all backups
    $0 --rollback 1 --dry-run      # Preview rollback to backup #1
    $0 --rollback 1                # Actually rollback to backup #1

EOF
    exit 0
}

# List available backups
list_backups() {
    if [ ! -d "$BACKUP_DIR" ]; then
        error "Backup directory $BACKUP_DIR does not exist!"
        exit 1
    fi

    BACKUPS=($(sudo ls -1dt "$BACKUP_DIR"/backup_* 2>/dev/null || true))

    if [ ${#BACKUPS[@]} -eq 0 ]; then
        warning "No backups found in $BACKUP_DIR"
        exit 0
    fi

    echo -e "${GREEN}Available Backups:${NC}\n"
    echo -e "${CYAN}#${NC}  | ${CYAN}Date/Time${NC}           | ${CYAN}Git Commit${NC} | ${CYAN}Path${NC}"
    echo "---|---------------------|------------|-----"

    for i in "${!BACKUPS[@]}"; do
        BACKUP="${BACKUPS[$i]}"
        BACKUP_NAME=$(basename "$BACKUP")

        # Try to read metadata
        if sudo [ -f "$BACKUP/.deployment-meta" ]; then
            TIMESTAMP=$(sudo grep "TIMESTAMP=" "$BACKUP/.deployment-meta" | cut -d= -f2)
            GIT_COMMIT=$(sudo grep "GIT_COMMIT=" "$BACKUP/.deployment-meta" | cut -d= -f2)
            DEPLOY_DATE=$(sudo grep "DEPLOYMENT_DATE=" "$BACKUP/.deployment-meta" | cut -d= -f2)

            # Format timestamp to readable date
            if [ -n "$TIMESTAMP" ]; then
                FORMATTED_DATE=$(date -d "${TIMESTAMP:0:8} ${TIMESTAMP:9:2}:${TIMESTAMP:11:2}:${TIMESTAMP:13:2}" '+%Y-%m-%d %H:%M:%S' 2>/dev/null || echo "$DEPLOY_DATE")
            else
                FORMATTED_DATE="$DEPLOY_DATE"
            fi

            printf "${YELLOW}%-2s${NC} | %-19s | %-10s | %s\n" \
                "$((i+1))" \
                "$FORMATTED_DATE" \
                "${GIT_COMMIT:0:8}" \
                "$BACKUP_NAME"
        else
            # Fallback: extract date from directory name
            TIMESTAMP=$(echo "$BACKUP_NAME" | grep -oP 'backup_\K[0-9_]+' | head -1)
            printf "${YELLOW}%-2s${NC} | %-19s | %-10s | %s\n" \
                "$((i+1))" \
                "${TIMESTAMP//_/ }" \
                "unknown" \
                "$BACKUP_NAME"
        fi
    done

    echo ""
    info "Current production deployment:"
    if [ -f "$PROD_DIR/.deployment-meta" ]; then
        CURRENT_COMMIT=$(sudo grep "GIT_COMMIT=" "$PROD_DIR/.deployment-meta" | cut -d= -f2 || echo "unknown")
        CURRENT_DATE=$(sudo grep "DEPLOYMENT_DATE=" "$PROD_DIR/.deployment-meta" | cut -d= -f2 || echo "unknown")
        echo "  Commit: ${CURRENT_COMMIT:0:8}"
        echo "  Date:   $CURRENT_DATE"
    else
        echo "  No metadata found"
    fi
}

# Perform rollback
rollback() {
    local BACKUP_NUM=$1
    local DRY_RUN=$2

    if [ ! -d "$BACKUP_DIR" ]; then
        error "Backup directory $BACKUP_DIR does not exist!"
        exit 1
    fi

    BACKUPS=($(sudo ls -1dt "$BACKUP_DIR"/backup_* 2>/dev/null || true))

    if [ ${#BACKUPS[@]} -eq 0 ]; then
        error "No backups found in $BACKUP_DIR"
        exit 1
    fi

    if [ "$BACKUP_NUM" -lt 1 ] || [ "$BACKUP_NUM" -gt ${#BACKUPS[@]} ]; then
        error "Invalid backup number. Please choose between 1 and ${#BACKUPS[@]}"
        exit 1
    fi

    BACKUP_PATH="${BACKUPS[$((BACKUP_NUM-1))]}"
    BACKUP_NAME=$(basename "$BACKUP_PATH")

    # Read backup metadata
    if sudo [ -f "$BACKUP_PATH/.deployment-meta" ]; then
        BACKUP_COMMIT=$(sudo grep "GIT_COMMIT=" "$BACKUP_PATH/.deployment-meta" | cut -d= -f2)
        BACKUP_DATE=$(sudo grep "DEPLOYMENT_DATE=" "$BACKUP_PATH/.deployment-meta" | cut -d= -f2)
    else
        BACKUP_COMMIT="unknown"
        BACKUP_DATE="unknown"
    fi

    if [ "$DRY_RUN" = true ]; then
        dry_run_msg "ROLLBACK DRY-RUN MODE"
        echo ""
        info "Would rollback to:"
        echo "  Backup:  $BACKUP_NAME"
        echo "  Commit:  ${BACKUP_COMMIT:0:8}"
        echo "  Date:    $BACKUP_DATE"
        echo ""
        dry_run_msg "Changes that would be made:"
        dry_run_msg "1. Current production backed up to: ${BACKUP_DIR}/backup_$(date +%Y%m%d_%H%M%S)_current"
        dry_run_msg "2. Production directory cleared: $PROD_DIR"
        dry_run_msg "3. Files copied from: $BACKUP_PATH"
        dry_run_msg "4. Total files to restore: $(sudo find "$BACKUP_PATH" -type f | wc -l)"
        echo ""
        dry_run_msg "To actually perform this rollback, run:"
        dry_run_msg "  $0 --rollback $BACKUP_NUM"
        echo ""
    else
        warning "About to rollback to:"
        echo "  Backup:  $BACKUP_NAME"
        echo "  Commit:  ${BACKUP_COMMIT:0:8}"
        echo "  Date:    $BACKUP_DATE"
        echo ""

        read -p "Are you sure you want to proceed? (yes/no): " CONFIRM
        if [ "$CONFIRM" != "yes" ]; then
            info "Rollback cancelled"
            exit 0
        fi

        log "Starting rollback process..."

        # Backup current production before rollback
        TIMESTAMP=$(date +%Y%m%d_%H%M%S)
        CURRENT_BACKUP="$BACKUP_DIR/backup_${TIMESTAMP}_current"

        log "Backing up current production to: $CURRENT_BACKUP"
        sudo cp -r "$PROD_DIR" "$CURRENT_BACKUP"

        # Restore from backup
        log "Clearing production directory..."
        sudo rm -rf "$PROD_DIR"/*

        log "Restoring files from backup..."
        sudo cp -r "$BACKUP_PATH"/* "$PROD_DIR/"

        # Update deployment metadata
        sudo bash -c "cat > '$PROD_DIR/.deployment-meta' << EOF
TIMESTAMP=$TIMESTAMP
GIT_COMMIT=$BACKUP_COMMIT
DEPLOYMENT_DATE=$(date '+%Y-%m-%d %H:%M:%S')
DEPLOYED_BY=$(whoami)
ROLLBACK_FROM=$CURRENT_BACKUP
ROLLBACK_SOURCE=$BACKUP_PATH
EOF"

        log "Rollback completed successfully!"
        info "Production restored to commit: ${BACKUP_COMMIT:0:8}"
        info "Previous production saved to: $CURRENT_BACKUP"
    fi
}

# Parse command line arguments
DRY_RUN=false
ACTION=""
BACKUP_NUM=""

while [[ $# -gt 0 ]]; do
    case $1 in
        --list)
            ACTION="list"
            shift
            ;;
        --rollback)
            ACTION="rollback"
            BACKUP_NUM="$2"
            shift 2
            ;;
        --dry-run)
            DRY_RUN=true
            shift
            ;;
        --help)
            usage
            ;;
        *)
            error "Unknown option: $1"
            usage
            ;;
    esac
done

# Execute action
case $ACTION in
    list)
        list_backups
        ;;
    rollback)
        if [ -z "$BACKUP_NUM" ]; then
            error "Backup number required for rollback"
            usage
        fi
        rollback "$BACKUP_NUM" "$DRY_RUN"
        ;;
    *)
        error "No action specified"
        usage
        ;;
esac
