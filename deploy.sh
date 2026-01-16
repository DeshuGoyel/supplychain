#!/bin/bash

# Production Deployment Script for Supply Chain AI
# This script handles the complete deployment process

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
APP_NAME="supplychain-ai"
DOCKER_IMAGE="$APP_NAME:latest"
BACKUP_DIR="./backups"
LOG_FILE="./deploy.log"

# Logging function
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}" | tee -a $LOG_FILE
}

error() {
    echo -e "${RED}[ERROR] $1${NC}" | tee -a $LOG_FILE
    exit 1
}

warn() {
    echo -e "${YELLOW}[WARNING] $1${NC}" | tee -a $LOG_FILE
}

info() {
    echo -e "${BLUE}[INFO] $1${NC}" | tee -a $LOG_FILE
}

# Pre-deployment checks
pre_deployment_checks() {
    log "Running pre-deployment checks..."
    
    # Check if environment file exists
    if [ ! -f ".env.production" ]; then
        error "Environment file .env.production not found"
    fi
    
    # Check if required environment variables are set
    source .env.production
    
    required_vars=("DATABASE_URL" "JWT_SECRET" "NODE_ENV")
    for var in "${required_vars[@]}"; do
        if [ -z "${!var}" ]; then
            error "Required environment variable $var is not set"
        fi
    done
    
    # Check Docker availability
    if ! command -v docker &> /dev/null; then
        error "Docker is not installed or not in PATH"
    fi
    
    # Check disk space (require at least 1GB free)
    available_space=$(df . | awk 'NR==2 {print $4}')
    if [ $available_space -lt 1048576 ]; then  # 1GB in KB
        warn "Low disk space detected. Available: $(($available_space/1024/1024))GB"
    fi
    
    log "Pre-deployment checks completed successfully"
}

# Database backup
backup_database() {
    log "Creating database backup..."
    
    backup_file="$BACKUP_DIR/backup-$(date +%Y%m%d-%H%M%S).sql"
    mkdir -p $BACKUP_DIR
    
    # Extract database credentials from DATABASE_URL
    DB_URL=$DATABASE_URL
    DB_HOST=$(echo $DB_URL | sed -n 's/.*@\([^:]*\):.*/\1/p')
    DB_PORT=$(echo $DB_URL | sed -n 's/.*:\([0-9]*\)\/.*/\1/p')
    DB_NAME=$(echo $DB_URL | sed -n 's/.*\/\([^?]*\).*/\1/p')
    DB_USER=$(echo $DB_URL | sed -n 's/.*:\([^@]*\)@.*/\1/p')
    DB_PASS=$(echo $DB_URL | sed -n 's/.*:\([^@]*\)@.*/\1/p')
    
    # Create backup using pg_dump
    PGPASSWORD=$DB_PASS pg_dump -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME > $backup_file
    
    if [ $? -eq 0 ]; then
        log "Database backup created: $backup_file"
        # Compress backup
        gzip $backup_file
        log "Backup compressed: $backup_file.gz"
    else
        error "Database backup failed"
    fi
}

# Application build
build_application() {
    log "Building application..."
    
    # Install dependencies
    npm ci --only=production
    
    # Generate Prisma client
    npx prisma generate
    
    # Build TypeScript
    npm run build
    
    log "Application built successfully"
}

# Run database migrations
run_migrations() {
    log "Running database migrations..."
    
    # Ensure we're using the production database
    export DATABASE_URL
    
    # Run migrations
    npx prisma migrate deploy
    
    # Generate Prisma client after migrations
    npx prisma generate
    
    log "Database migrations completed"
}

# Seed production data (if needed)
seed_production() {
    if [ "$SKIP_SEED" != "true" ]; then
        log "Seeding production data..."
        npm run seed:production
        log "Production seeding completed"
    else
        info "Skipping production seeding (SKIP_SEED=true)"
    fi
}

# Health check
health_check() {
    log "Running health check..."
    
    max_attempts=30
    attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        if curl -f http://localhost:3001/api/health > /dev/null 2>&1; then
            log "Health check passed"
            return 0
        fi
        
        info "Health check attempt $attempt/$max_attempts failed, retrying in 10 seconds..."
        sleep 10
        attempt=$((attempt + 1))
    done
    
    error "Health check failed after $max_attempts attempts"
}

# Start application
start_application() {
    log "Starting application..."
    
    # Stop existing application
    pm2 stop $APP_NAME 2>/dev/null || true
    
    # Start new application
    pm2 start npm --name $APP_NAME -- run start
    
    # Save PM2 configuration
    pm2 save
    
    log "Application started"
}

# Rollback function
rollback() {
    log "Initiating rollback..."
    
    # Find the most recent backup
    latest_backup=$(ls -t $BACKUP_DIR/*.sql.gz 2>/dev/null | head -n 1)
    
    if [ -n "$latest_backup" ]; then
        log "Rolling back to backup: $latest_backup"
        
        # Extract database credentials
        DB_URL=$DATABASE_URL
        DB_HOST=$(echo $DB_URL | sed -n 's/.*@\([^:]*\):.*/\1/p')
        DB_PORT=$(echo $DB_URL | sed -n 's/.*:\([0-9]*\)\/.*/\1/p')
        DB_NAME=$(echo $DB_URL | sed -n 's/.*\/\([^?]*\).*/\1/p')
        DB_USER=$(echo $DB_URL | sed -n 's/.*:\([^@]*\)@.*/\1/p')
        DB_PASS=$(echo $DB_URL | sed -n 's/.*:\([^@]*\)@.*/\1/p')
        
        # Restore backup
        gunzip -c $latest_backup | PGPASSWORD=$DB_PASS psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME
        
        log "Database rollback completed"
    else
        error "No backup found for rollback"
    fi
    
    # Restart application
    pm2 restart $APP_NAME
    
    log "Rollback completed"
}

# Cleanup old backups
cleanup_old_backups() {
    log "Cleaning up old backups (keeping last 10)..."
    
    cd $BACKUP_DIR
    ls -t *.sql.gz 2>/dev/null | tail -n +11 | xargs rm -f 2>/dev/null || true
    
    log "Backup cleanup completed"
}

# Main deployment function
deploy() {
    log "Starting deployment of $APP_NAME"
    
    # Pre-deployment checks
    pre_deployment_checks
    
    # Create backup
    backup_database
    
    # Build application
    build_application
    
    # Run migrations
    run_migrations
    
    # Seed production data
    seed_production
    
    # Start application
    start_application
    
    # Health check
    health_check
    
    # Cleanup old backups
    cleanup_old_backups
    
    log "Deployment completed successfully!"
}

# Usage function
usage() {
    echo "Usage: $0 [COMMAND]"
    echo ""
    echo "Commands:"
    echo "  deploy     Full deployment (default)"
    echo "  backup     Create database backup only"
    echo "  migrate    Run database migrations only"
    echo "  health     Run health check"
    echo "  rollback   Rollback to previous version"
    echo "  cleanup    Clean up old backups"
    echo ""
    echo "Environment variables:"
    echo "  SKIP_SEED=true    Skip production data seeding"
    echo ""
    echo "Example:"
    echo "  $0 deploy"
    echo "  SKIP_SEED=true $0 deploy"
    echo "  $0 rollback"
}

# Main script logic
case "${1:-deploy}" in
    "deploy")
        deploy
        ;;
    "backup")
        pre_deployment_checks
        backup_database
        ;;
    "migrate")
        pre_deployment_checks
        run_migrations
        ;;
    "health")
        health_check
        ;;
    "rollback")
        rollback
        ;;
    "cleanup")
        cleanup_old_backups
        ;;
    "help"|"-h"|"--help")
        usage
        ;;
    *)
        error "Unknown command: $1. Use 'help' for usage information."
        ;;
esac