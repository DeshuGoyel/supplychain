#!/bin/bash

# Production Database Backup Script
# This script creates encrypted backups of the production database

set -e

# Configuration
BACKUP_DIR="/backups/database"
RETENTION_DAYS=30
ENCRYPTION_KEY_FILE="/etc/supplychain-ai/backup-key"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_NAME="supplychain_backup_${TIMESTAMP}"
COMPRESSED_BACKUP="${BACKUP_DIR}/${BACKUP_NAME}.sql.gz"
ENCRYPTED_BACKUP="${BACKUP_DIR}/${BACKUP_NAME}.sql.gz.enc"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Logging function
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

error() {
    echo -e "${RED}[ERROR] $1${NC}"
    exit 1
}

warn() {
    echo -e "${YELLOW}[WARNING] $1${NC}"
}

# Pre-flight checks
preflight_checks() {
    log "Running pre-flight checks..."
    
    # Check if backup directory exists
    if [ ! -d "$BACKUP_DIR" ]; then
        mkdir -p "$BACKUP_DIR"
        log "Created backup directory: $BACKUP_DIR"
    fi
    
    # Check if encryption key exists
    if [ ! -f "$ENCRYPTION_KEY_FILE" ]; then
        warn "Encryption key file not found. Creating new key..."
        openssl rand -base64 32 > "$ENCRYPTION_KEY_FILE"
        chmod 600 "$ENCRYPTION_KEY_FILE"
        log "Encryption key created at: $ENCRYPTION_KEY_FILE"
    fi
    
    # Check disk space (require at least 5GB free)
    AVAILABLE_SPACE=$(df "$BACKUP_DIR" | awk 'NR==2 {print $4}')
    if [ "$AVAILABLE_SPACE" -lt 5242880 ]; then  # 5GB in KB
        error "Insufficient disk space. Available: $(($AVAILABLE_SPACE/1024/1024))GB"
    fi
    
    # Check if database is accessible
    if ! pg_isready -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" > /dev/null 2>&1; then
        error "Database is not accessible"
    fi
    
    log "Pre-flight checks completed"
}

# Create database backup
create_backup() {
    log "Creating database backup..."
    
    # Export database
    PGPASSWORD="$DB_PASSWORD" pg_dump \
        -h "$DB_HOST" \
        -p "$DB_PORT" \
        -U "$DB_USER" \
        -d "$DB_NAME" \
        --verbose \
        --no-password \
        --clean \
        --if-exists \
        --create \
        --format=custom \
        --compress=9 \
        --file="$BACKUP_DIR/${BACKUP_NAME}.custom"
    
    if [ $? -eq 0 ]; then
        log "Database backup created successfully"
    else
        error "Database backup failed"
    fi
}

# Compress backup
compress_backup() {
    log "Compressing backup..."
    
    # Convert custom format to SQL and compress
    pg_restore \
        --verbose \
        --clean \
        --if-exists \
        --create \
        --no-password \
        "$BACKUP_DIR/${BACKUP_NAME}.custom" | gzip > "$COMPRESSED_BACKUP"
    
    # Remove custom format file
    rm "$BACKUP_DIR/${BACKUP_NAME}.custom"
    
    if [ -f "$COMPRESSED_BACKUP" ]; then
        BACKUP_SIZE=$(du -h "$COMPRESSED_BACKUP" | cut -f1)
        log "Backup compressed successfully. Size: $BACKUP_SIZE"
    else
        error "Backup compression failed"
    fi
}

# Encrypt backup
encrypt_backup() {
    log "Encrypting backup..."
    
    openssl enc -aes-256-cbc -salt -in "$COMPRESSED_BACKUP" -out "$ENCRYPTED_BACKUP" -pass file:"$ENCRYPTION_KEY_FILE"
    
    if [ -f "$ENCRYPTED_BACKUP" ]; then
        log "Backup encrypted successfully"
        
        # Remove unencrypted backup
        rm "$COMPRESSED_BACKUP"
        
        # Set secure permissions
        chmod 600 "$ENCRYPTED_BACKUP"
    else
        error "Backup encryption failed"
    fi
}

# Upload to cloud storage (S3)
upload_to_cloud() {
    if [ -n "$S3_BACKUP_BUCKET" ] && [ -n "$AWS_ACCESS_KEY_ID" ]; then
        log "Uploading backup to S3..."
        
        aws s3 cp "$ENCRYPTED_BACKUP" "s3://${S3_BACKUP_BUCKET}/database-backups/"
        
        if [ $? -eq 0 ]; then
            log "Backup uploaded to S3 successfully"
            
            # Remove local encrypted backup
            rm "$ENCRYPTED_BACKUP"
        else
            warn "Failed to upload to S3. Keeping local backup."
        fi
    fi
}

# Verify backup integrity
verify_backup() {
    log "Verifying backup integrity..."
    
    # Test decryption
    openssl enc -aes-256-cbc -d -in "$ENCRYPTED_BACKUP" -out "${BACKUP_DIR}/verify_${BACKUP_NAME}.sql.gz" -pass file:"$ENCRYPTION_KEY_FILE"
    
    if [ $? -eq 0 ]; then
        log "Backup decryption successful"
        
        # Test decompression
        gunzip -t "${BACKUP_DIR}/verify_${BACKUP_NAME}.sql.gz"
        
        if [ $? -eq 0 ]; then
            log "Backup decompression successful"
            
            # Clean up verification files
            rm "${BACKUP_DIR}/verify_${BACKUP_NAME}.sql.gz"
        else
            error "Backup compression verification failed"
        fi
    else
        error "Backup decryption verification failed"
    fi
}

# Clean up old backups
cleanup_old_backups() {
    log "Cleaning up old backups (older than $RETENTION_DAYS days)..."
    
    # Find and remove old local backups
    find "$BACKUP_DIR" -name "supplychain_backup_*.sql.gz.enc" -type f -mtime +$RETENTION_DAYS -delete
    
    # Clean up old S3 backups
    if [ -n "$S3_BACKUP_BUCKET" ] && [ -n "$AWS_ACCESS_KEY_ID" ]; then
        aws s3 ls "s3://${S3_BACKUP_BUCKET}/database-backups/" | while read -r line; do
            BACKUP_DATE=$(echo "$line" | awk '{print $1}')
            BACKUP_FILE=$(echo "$line" | awk '{print $4}')
            
            # Calculate age in days
            BACKUP_AGE=$(( ($(date +%s) - $(date -d "$BACKUP_DATE" +%s)) / 86400 ))
            
            if [ "$BACKUP_AGE" -gt "$RETENTION_DAYS" ]; then
                log "Deleting old S3 backup: $BACKUP_FILE"
                aws s3 rm "s3://${S3_BACKUP_BUCKET}/database-backups/$BACKUP_FILE"
            fi
        done
    fi
    
    log "Cleanup completed"
}

# Generate backup report
generate_report() {
    log "Generating backup report..."
    
    REPORT_FILE="${BACKUP_DIR}/backup_report_${TIMESTAMP}.txt"
    
    cat > "$REPORT_FILE" << EOF
Database Backup Report
=======================
Timestamp: $(date)
Backup Name: $BACKUP_NAME
Encrypted File: $ENCRYPTED_BACKUP
File Size: $(du -h "$ENCRYPTED_BACKUP" | cut -f1)
Database: $DB_NAME
Database Host: $DB_HOST
Database Port: $DB_PORT
Encryption: AES-256-CBC
Cloud Storage: ${S3_BACKUP_BUCKET:-"Not configured"}
Retention: $RETENTION_DAYS days
EOF
    
    log "Backup report generated: $REPORT_FILE"
}

# Send notification
send_notification() {
    local status=$1
    local message=$2
    
    if [ -n "$SLACK_WEBHOOK_URL" ]; then
        curl -X POST -H 'Content-type: application/json' \
            --data "{\"text\":\"Database Backup - $status: $message\"}" \
            "$SLACK_WEBHOOK_URL"
    fi
    
    if [ -n "$EMAIL_NOTIFICATION" ]; then
        echo "$message" | mail -s "Database Backup - $status" "$EMAIL_NOTIFICATION"
    fi
}

# Main execution
main() {
    log "Starting database backup process..."
    
    # Source environment variables
    if [ -f "/etc/supplychain-ai/environment" ]; then
        source /etc/supplychain-ai/environment
    else
        error "Environment file not found"
    fi
    
    # Run backup steps
    preflight_checks
    create_backup
    compress_backup
    encrypt_backup
    verify_backup
    upload_to_cloud
    cleanup_old_backups
    generate_report
    
    send_notification "SUCCESS" "Database backup completed successfully: $BACKUP_NAME"
    
    log "Database backup process completed successfully!"
}

# Error handling
trap 'send_notification "ERROR" "Database backup failed: $?"' ERR

# Run main function
main "$@"