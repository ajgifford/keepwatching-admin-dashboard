#!/bin/bash

#######################################
# Admin Dashboard Deployment Script with Backup
#
# This script:
# - Backs up current production before deploying
# - Pulls latest code from git
# - Builds the project
# - Deploys to production
# - Maintains deployment history for rollbacks
#######################################

set -e

# Configuration
REPO_DIR=~/git/keepwatching-admin-dashboard
PROD_DIR=/var/www/keepwatching-admin-dashboard
BACKUP_DIR=/var/www/keepwatching-admin-dashboard-backups
MAX_BACKUPS=10  # Number of backups to keep

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging function
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

# Check GIT_NPM_TOKEN is set (required for @ajgifford private packages)
if [ -z "${GIT_NPM_TOKEN}" ]; then
    error "GIT_NPM_TOKEN is not set. Export it before running this script."
    error "Add 'export GIT_NPM_TOKEN=<token>' to ~/.bashrc and re-source it."
    exit 1
fi

# Check if production directory exists
if [ ! -d "$PROD_DIR" ]; then
    error "Production directory $PROD_DIR does not exist!"
    error "Run: sudo mkdir -p $PROD_DIR"
    exit 1
fi

# Create backup directory if it doesn't exist
sudo mkdir -p "$BACKUP_DIR"

# Create backup of current production
log "Creating backup of current production..."
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
CURRENT_COMMIT=$(cd "$REPO_DIR" && git rev-parse HEAD 2>/dev/null || echo "unknown")
BACKUP_PATH="$BACKUP_DIR/backup_${TIMESTAMP}_${CURRENT_COMMIT:0:8}"

# Check if production directory has content
if [ "$(ls -A $PROD_DIR 2>/dev/null)" ]; then
    sudo cp -r "$PROD_DIR" "$BACKUP_PATH"

    # Save metadata
    sudo bash -c "cat > '$BACKUP_PATH/.deployment-meta' << EOF
TIMESTAMP=$TIMESTAMP
GIT_COMMIT=$CURRENT_COMMIT
DEPLOYMENT_DATE=$(date '+%Y-%m-%d %H:%M:%S')
EOF"

    log "Backup created: $BACKUP_PATH"
else
    warning "Production directory is empty, skipping backup"
fi

# Clean up old backups (keep only MAX_BACKUPS most recent)
BACKUP_COUNT=$(sudo ls -1d "$BACKUP_DIR"/backup_* 2>/dev/null | wc -l)
if [ "$BACKUP_COUNT" -gt "$MAX_BACKUPS" ]; then
    info "Cleaning up old backups (keeping $MAX_BACKUPS most recent)..."
    sudo ls -1dt "$BACKUP_DIR"/backup_* | tail -n +$((MAX_BACKUPS + 1)) | xargs sudo rm -rf
    log "Old backups cleaned up"
fi

# Start deployment
log "Admin Dashboard Deployment Starting..."

# Navigate to repo and pull latest
cd "$REPO_DIR" || exit 1
log "Pulling latest from Git..."
git pull

# Get new commit hash
NEW_COMMIT=$(git rev-parse HEAD)
NEW_COMMIT_MSG=$(git log -1 --pretty=%B)
info "Deploying commit: ${NEW_COMMIT:0:8} - $NEW_COMMIT_MSG"

# Install dependencies
log "Installing dependencies..."
yarn install

# Build project
log "Building project..."
yarn build

# Verify build directory exists
if [ ! -d "dist" ]; then
    error "Build directory (dist/) not found! Build may have failed."
    exit 1
fi

# Deploy to production
log "Publishing to production..."
sudo rm -rf "$PROD_DIR"/*
sudo cp -r dist/* "$PROD_DIR/"

# Save deployment metadata in production
sudo bash -c "cat > '$PROD_DIR/.deployment-meta' << EOF
TIMESTAMP=$TIMESTAMP
GIT_COMMIT=$NEW_COMMIT
DEPLOYMENT_DATE=$(date '+%Y-%m-%d %H:%M:%S')
DEPLOYED_BY=$(whoami)
EOF"

log "Admin Dashboard Deployment Successful!"
info "Deployed: ${NEW_COMMIT:0:8}"
info "Backup: $BACKUP_PATH"
info "Run './scripts/rollback.sh --list' to see available backups"
