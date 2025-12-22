#!/bin/bash

###############################################################################
# Jenkins Installation Script for Ubuntu
# 
# This script automates the installation of Jenkins CI/CD server on Ubuntu.
# It handles Java installation, Jenkins repository setup, and service configuration.
#
# Usage: sudo ./install-jenkins-ubuntu.sh
#
# Author: DevOps Engineer
# Date: 2024
###############################################################################

set -e  # Exit on any error

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Logging functions
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
    log_error "Please run as root or with sudo"
    exit 1
fi

log_info "Starting Jenkins installation on Ubuntu..."

# Step 1: Update system packages
log_info "Updating system packages..."
apt update -qq
apt upgrade -y -qq

# Step 2: Install Java (Jenkins requires Java 11 or 17)
log_info "Installing Java 17 (OpenJDK)..."
apt install -y openjdk-17-jdk

# Verify Java installation
JAVA_VERSION=$(java -version 2>&1 | head -n 1)
log_info "Java installed: $JAVA_VERSION"

# Step 3: Add Jenkins repository key
log_info "Adding Jenkins repository key..."
curl -fsSL https://pkg.jenkins.io/debian-stable/jenkins.io-2023.key | tee \
  /usr/share/keyrings/jenkins-keyring.asc > /dev/null

# Step 4: Add Jenkins repository to sources list
log_info "Adding Jenkins repository..."
echo deb [signed-by=/usr/share/keyrings/jenkins-keyring.asc] \
  https://pkg.jenkins.io/debian-stable binary/ | tee \
  /etc/apt/sources.list.d/jenkins.list > /dev/null

# Step 5: Update package list with Jenkins repository
log_info "Updating package list..."
apt update -qq

# Step 6: Install Jenkins
log_info "Installing Jenkins..."
apt install -y jenkins

# Step 7: Start and enable Jenkins service
log_info "Starting Jenkins service..."
systemctl start jenkins
systemctl enable jenkins

# Step 8: Check Jenkins service status
if systemctl is-active --quiet jenkins; then
    log_info "Jenkins service is running"
else
    log_error "Jenkins service failed to start"
    exit 1
fi

# Step 9: Configure firewall (if UFW is active)
if command -v ufw &> /dev/null; then
    if ufw status | grep -q "Status: active"; then
        log_info "Configuring UFW firewall to allow port 8080..."
        ufw allow 8080/tcp
        log_info "Firewall rule added for port 8080"
    else
        log_warn "UFW is installed but not active. Skipping firewall configuration."
    fi
else
    log_warn "UFW not found. Please manually configure firewall if needed."
fi

# Step 10: Display installation summary
log_info "=========================================="
log_info "Jenkins installation completed successfully!"
log_info "=========================================="
echo ""
log_info "Next steps:"
echo "  1. Access Jenkins at: http://$(hostname -I | awk '{print $1}'):8080"
echo "  2. Retrieve initial admin password:"
echo "     sudo cat /var/lib/jenkins/secrets/initialAdminPassword"
echo ""
log_info "Useful commands:"
echo "  - Check status:  sudo systemctl status jenkins"
echo "  - View logs:     sudo journalctl -u jenkins -f"
echo "  - Restart:       sudo systemctl restart jenkins"
echo ""

# Display initial admin password location
if [ -f /var/lib/jenkins/secrets/initialAdminPassword ]; then
    INITIAL_PASSWORD=$(cat /var/lib/jenkins/secrets/initialAdminPassword)
    log_info "Initial admin password: $INITIAL_PASSWORD"
    log_warn "Save this password securely! You'll need it to unlock Jenkins."
else
    log_warn "Initial admin password file not found yet. It may take a moment to generate."
fi

log_info "Installation script completed."

