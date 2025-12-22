# Jenkins CI Server on AWS EC2

This project demonstrates the complete setup and installation of a Jenkins CI/CD server on an AWS EC2 Ubuntu instance. This foundational DevOps project showcases **real-world cloud infrastructure skills** including SSH key management, Linux user administration, service management, and Jenkins configuration.

## 📋 Overview

Jenkins is an open-source automation server that enables developers to build, test, and deploy software efficiently. This project documents the **end-to-end process** of provisioning cloud infrastructure, establishing secure access, and deploying a production-ready CI/CD server.

**What This Project Demonstrates:**
- ✅ AWS EC2 instance provisioning and management
- ✅ SSH key-based authentication and security
- ✅ Linux system administration (Ubuntu)
- ✅ Service lifecycle management with systemd
- ✅ Jenkins installation and configuration
- ✅ Network security (Security Groups, port management)
- ✅ Real-world troubleshooting and problem-solving

## 🎯 Objectives

- Provision an AWS EC2 Ubuntu instance
- Install and configure Jenkins server
- Secure Jenkins with proper firewall rules
- Access Jenkins web interface
- Understand basic Jenkins operations

## 🏗️ Architecture

```
┌─────────────────┐
│   AWS EC2       │
│   Ubuntu 22.04  │
│                 │
│  ┌───────────┐  │
│  │  Jenkins  │  │
│  │  :8080    │  │
│  └───────────┘  │
└─────────────────┘
```

## 📦 Prerequisites

- AWS Account with EC2 access
- Basic knowledge of AWS EC2, SSH, and Linux commands
- SSH client installed on your local machine (Windows with WSL, Linux, or Mac)
- Security group configured to allow:
  - SSH (port 22) from your IP
  - HTTP (port 8080) from your IP or 0.0.0.0/0 for testing

## 🎓 Real-World Challenges & Learnings

This project was built through hands-on experience, encountering and solving common DevOps challenges:

### SSH Key Management (WSL/Windows)
- **Challenge**: Understanding Windows vs Linux path differences in WSL
- **Solution**: Learned `/mnt/c/` mount point for Windows drives in WSL
- **Key Learning**: `chmod 400` is mandatory for SSH key security

### Environment Context
- **Challenge**: Distinguishing between local machine and EC2 instance environments
- **Solution**: Understanding that `.pem` keys exist locally, not on EC2
- **Key Learning**: SSH keys are used FROM local machine TO remote server

### Linux User Management
- **Challenge**: Understanding `ubuntu` vs `root` user contexts
- **Solution**: Using `sudo` for administrative tasks instead of switching to root
- **Key Learning**: Best practice is to work as regular user with sudo privileges

### Service Management
- **Challenge**: Locating Jenkins initial admin password
- **Solution**: Understanding Jenkins runs as `jenkins` user, requiring `sudo` to access secrets
- **Key Learning**: System services have dedicated users and permission models

These real-world troubleshooting experiences demonstrate practical DevOps problem-solving skills.

## 🚀 Quick Start

### Step 1: Launch EC2 Instance

1. Log in to AWS Console
2. Navigate to EC2 → Launch Instance
3. Configure instance:
   - **AMI**: Ubuntu Server 22.04 LTS
   - **Instance Type**: t2.micro (free tier) or t2.small
   - **Key Pair**: Create or select existing key pair
   - **Security Group**: 
     - Allow SSH (22) from your IP
     - Allow Custom TCP (8080) from your IP or 0.0.0.0/0
   - **Storage**: 8GB minimum (default is fine)

4. Launch instance and note the public IP address

### Step 2: Connect to EC2 Instance

**For Windows with WSL:**
```bash
# First, copy key from Windows to WSL (if needed)
cp /mnt/c/Users/<YOUR_USERNAME>/Downloads/Jenkins-Instance-Key.pem ~/

# Set correct permissions (MANDATORY)
chmod 400 Jenkins-Instance-Key.pem

# Connect to EC2
ssh -i Jenkins-Instance-Key.pem ubuntu@<EC2-PUBLIC-IP>
```

**For Linux/Mac:**
```bash
# Set correct permissions
chmod 400 your-key.pem

# Connect to EC2
ssh -i your-key.pem ubuntu@<EC2-PUBLIC-IP>
```

**Important Notes:**
- Use `ubuntu` for Ubuntu AMI, `ec2-user` for Amazon Linux
- First connection will prompt: type `yes` to accept host key
- If connection fails, check Security Group allows SSH (port 22) from your IP

### Step 3: Install Jenkins

**Option A: Automated Installation (Recommended)**

```bash
# Download the installation script
wget https://raw.githubusercontent.com/yourusername/Cloud-DevOps-Projects/main/02-jenkins-ci-server-aws-ec2/install-jenkins-ubuntu.sh

# Make it executable
chmod +x install-jenkins-ubuntu.sh

# Run the script
sudo ./install-jenkins-ubuntu.sh
```

**Option B: Manual Installation**

Follow the detailed steps in the [Installation Guide](#-detailed-installation-steps) section below.

### Step 4: Access Jenkins Web Interface

1. Open your browser and navigate to:
   ```
   http://<EC2-PUBLIC-IP>:8080
   ```

2. Retrieve the initial admin password:
   ```bash
   sudo cat /var/lib/jenkins/secrets/initialAdminPassword
   ```

3. Copy the password and paste it into the Jenkins unlock screen

4. Install suggested plugins (recommended for beginners)

5. Create your first admin user

6. Configure Jenkins URL (default is fine)

## 📝 Detailed Installation Steps

### 1. Update System Packages

```bash
sudo apt update
sudo apt upgrade -y
```

### 2. Install Java (Jenkins Requirement)

```bash
sudo apt install openjdk-17-jdk -y
java -version  # Verify installation
```

### 3. Add Jenkins Repository

```bash
curl -fsSL https://pkg.jenkins.io/debian-stable/jenkins.io-2023.key | sudo tee \
  /usr/share/keyrings/jenkins-keyring.asc > /dev/null

echo deb [signed-by=/usr/share/keyrings/jenkins-keyring.asc] \
  https://pkg.jenkins.io/debian-stable binary/ | sudo tee \
  /etc/apt/sources.list.d/jenkins.list > /dev/null
```

### 4. Install Jenkins

```bash
sudo apt update
sudo apt install jenkins -y
```

### 5. Start and Enable Jenkins

```bash
sudo systemctl start jenkins
sudo systemctl enable jenkins
sudo systemctl status jenkins  # Verify it's running
```

### 6. Configure Firewall (if UFW is active)

```bash
sudo ufw allow 8080
sudo ufw status
```

## 🔐 Security Best Practices

1. **Restrict Security Group**: Only allow port 8080 from trusted IPs in production
2. **Use HTTPS**: Configure reverse proxy with SSL/TLS (nginx/Apache)
3. **Regular Updates**: Keep Jenkins and plugins updated
4. **Strong Passwords**: Use complex passwords for admin accounts
5. **SSH Key Authentication**: Disable password authentication for SSH
6. **Backup**: Regularly backup `/var/lib/jenkins` directory

## 📊 Verification

After installation, verify Jenkins is running:

```bash
# Check Jenkins service status
sudo systemctl status jenkins

# Check if port 8080 is listening
sudo netstat -tlnp | grep 8080

# View Jenkins logs
sudo journalctl -u jenkins -f
```

## 🛠️ Useful Commands

```bash
# Start Jenkins
sudo systemctl start jenkins

# Stop Jenkins
sudo systemctl stop jenkins

# Restart Jenkins
sudo systemctl restart jenkins

# View Jenkins logs
sudo tail -f /var/log/jenkins/jenkins.log

# Check Jenkins configuration
sudo cat /var/lib/jenkins/config.xml
```

## 📚 Additional Resources

- [Jenkins Official Documentation](https://www.jenkins.io/doc/)
- [Jenkins User Handbook](https://www.jenkins.io/doc/book/)
- [AWS EC2 Documentation](https://docs.aws.amazon.com/ec2/)

## 🐛 Troubleshooting

Common issues and solutions are documented in [troubleshooting.md](./troubleshooting.md), including:
- SSH connection problems (WSL-specific guidance)
- Port 8080 access issues
- Initial admin password retrieval
- Service management errors
- Permission and user context issues

## 📸 Screenshots

Screenshots demonstrating the setup process are available in the `/screenshots` folder:
- EC2 instance running
- SSH connection established
- Jenkins unlock screen
- Jenkins dashboard

## 🏗️ Architecture

See `/architecture` folder for infrastructure diagrams and visual documentation.

## 📁 Project Structure

```
02-jenkins-ci-server-aws-ec2/
├── README.md                          # This file
├── install-jenkins-ubuntu.sh          # Automated installation script
├── troubleshooting.md                 # Common issues and solutions
├── architecture/                      # Infrastructure diagrams
│   └── README.md                      # Architecture documentation
└── screenshots/                       # Setup proof and visuals
    └── README.md                      # Screenshot descriptions
```

## 🚀 Automation Script

The included `install-jenkins-ubuntu.sh` script automates the entire Jenkins installation process:
- System package updates
- Java 17 installation
- Jenkins repository configuration
- Service setup and management
- Firewall configuration (if UFW is active)

**Usage:**
```bash
chmod +x install-jenkins-ubuntu.sh
sudo ./install-jenkins-ubuntu.sh
```

## 📄 License

This project is for educational and portfolio purposes.

## 👤 Author

DevOps Engineer - Cloud Infrastructure & Automation

---

**Note**: This is a foundational project demonstrating cloud infrastructure setup and CI/CD tool installation. For production environments, consider additional security hardening, monitoring, and backup strategies.

