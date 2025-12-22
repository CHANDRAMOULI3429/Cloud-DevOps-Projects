# Jenkins Troubleshooting Guide

This document covers common issues encountered when installing and configuring Jenkins on AWS EC2 Ubuntu instances.

## 🔍 Table of Contents

- [SSH Connection Issues](#ssh-connection-issues)
- [Port 8080 Access Problems](#port-8080-access-problems)
- [Initial Admin Password Issues](#initial-admin-password-issues)
- [Jenkins Service Not Starting](#jenkins-service-not-starting)
- [Java Installation Problems](#java-installation-problems)
- [Firewall Configuration](#firewall-configuration)
- [Permission Issues](#permission-issues)

---

## SSH Connection Issues

### Problem: Cannot connect to EC2 instance via SSH

**Symptoms:**
- Connection timeout
- Permission denied errors
- "Connection refused" message
- "Identity file not accessible" error

**Solutions:**

1. **Check Security Group Rules**
   ```bash
   # In AWS Console: EC2 → Security Groups → Your Security Group
   # Ensure inbound rule exists:
   # Type: SSH, Port: 22, Source: Your IP address
   ```

2. **Verify Key Pair Permissions (Local Machine)**

   **On Linux/Mac/WSL:**
   ```bash
   chmod 400 your-key.pem
   ls -l your-key.pem  # Should show: -r--------
   ```
   
   **On Windows (PowerShell):**
   ```powershell
   icacls your-key.pem
   # Remove inheritance and set permissions to current user only
   ```

3. **WSL-Specific: Copying Key from Windows**
   
   **Common Error:** Using Windows path syntax in WSL
   ```bash
   # ❌ WRONG (Windows syntax doesn't work in WSL)
   cp "C:\Users\Username\Downloads\key.pem" ~/
   
   # ✅ CORRECT (WSL mount point)
   cp /mnt/c/Users/Username/Downloads/key.pem ~/
   chmod 400 ~/key.pem
   ```
   
   **Understanding WSL Paths:**
   - Windows `C:\` → WSL `/mnt/c/`
   - Windows `D:\` → WSL `/mnt/d/`
   - Always use forward slashes in WSL

4. **Check Instance Status**
   - Verify instance is in "running" state
   - Check if instance has a public IP address
   - Ensure instance is in a public subnet

5. **Verify Correct Username**
   ```bash
   # Ubuntu AMI → ubuntu
   ssh -i key.pem ubuntu@<EC2-IP>
   
   # Amazon Linux → ec2-user
   ssh -i key.pem ec2-user@<EC2-IP>
   
   # RHEL → ec2-user
   # CentOS → centos
   ```

6. **Test Connection with Verbose Output**
   ```bash
   ssh -v -i your-key.pem ubuntu@<EC2-PUBLIC-IP>
   # -v flag provides verbose output for debugging
   ```

7. **Common WSL SSH Mistakes**
   - ❌ Trying to SSH from inside EC2 to itself using the same key
   - ❌ Looking for `.pem` file inside EC2 (it should be on local machine)
   - ❌ Using Windows path syntax (`C:\`) in WSL terminal
   - ✅ PEM key stays on local machine, used to connect TO EC2

---

## Port 8080 Access Problems

### Problem: Cannot access Jenkins web interface at http://EC2-IP:8080

**Symptoms:**
- Connection timeout
- "This site can't be reached"
- Browser hangs when trying to access

**Solutions:**

1. **Check Security Group Configuration**
   ```bash
   # In AWS Console: EC2 → Security Groups
   # Add inbound rule:
   # Type: Custom TCP, Port: 8080, Source: Your IP or 0.0.0.0/0 (for testing)
   ```

2. **Verify Jenkins Service is Running**
   ```bash
   sudo systemctl status jenkins
   # Should show "active (running)"
   ```

3. **Check if Port 8080 is Listening**
   ```bash
   sudo netstat -tlnp | grep 8080
   # or
   sudo ss -tlnp | grep 8080
   # Should show jenkins listening on port 8080
   ```

4. **Check UFW Firewall (if active)**
   ```bash
   sudo ufw status
   # If active, allow port 8080:
   sudo ufw allow 8080/tcp
   sudo ufw reload
   ```

5. **Check Jenkins Configuration**
   ```bash
   # Verify Jenkins is configured to listen on all interfaces
   sudo cat /var/lib/jenkins/config.xml | grep -i httpPort
   ```

6. **Test from EC2 Instance Itself**
   ```bash
   curl http://localhost:8080
   # If this works, the issue is with network/firewall configuration
   ```

---

## Initial Admin Password Issues

### Problem: Cannot find or access initialAdminPassword file

**Symptoms:**
- File not found error
- Empty password file
- Permission denied when trying to read
- "No such file or directory" when running from local machine

**Solutions:**

1. **⚠️ CRITICAL: Run Command on EC2, Not Local Machine**
   
   **Common Mistake:** Trying to read password from local WSL/Linux machine
   ```bash
   # ❌ WRONG: Running on local machine
   cat /var/lib/jenkins/secrets/initialAdminPassword
   # Error: No such file or directory (Jenkins is on EC2, not local!)
   
   # ✅ CORRECT: SSH into EC2 first, then run
   ssh -i key.pem ubuntu@<EC2-IP>
   sudo cat /var/lib/jenkins/secrets/initialAdminPassword
   ```
   
   **Key Learning:** The password file exists ONLY on the EC2 instance, not on your local machine.

2. **Wait for Jenkins to Initialize**
   ```bash
   # Jenkins may take 1-2 minutes to generate the password file
   # Check if Jenkins service is fully started:
   sudo systemctl status jenkins
   
   # Wait and check again:
   sleep 30
   sudo cat /var/lib/jenkins/secrets/initialAdminPassword
   ```

3. **Check File Location (Inside EC2)**
   ```bash
   # Standard location:
   sudo cat /var/lib/jenkins/secrets/initialAdminPassword
   
   # Alternative locations to check:
   sudo find /var/lib/jenkins -name "initialAdminPassword"
   ```

4. **Check File Permissions**
   ```bash
   ls -la /var/lib/jenkins/secrets/initialAdminPassword
   # Should be readable by root/jenkins user
   
   # If permission issue:
   sudo chmod 644 /var/lib/jenkins/secrets/initialAdminPassword
   ```

5. **Understanding User Context**
   ```bash
   # Jenkins runs as 'jenkins' user
   # Regular 'ubuntu' user cannot read without sudo
   # Always use sudo:
   sudo cat /var/lib/jenkins/secrets/initialAdminPassword
   ```

6. **Check Jenkins Logs**
   ```bash
   sudo journalctl -u jenkins -n 50
   # Look for errors or initialization messages
   ```

7. **If File Doesn't Exist**
   ```bash
   # Restart Jenkins service
   sudo systemctl restart jenkins
   
   # Wait 1-2 minutes and check again
   sudo cat /var/lib/jenkins/secrets/initialAdminPassword
   ```

---

## Jenkins Service Not Starting

### Problem: Jenkins service fails to start or crashes

**Symptoms:**
- `systemctl status jenkins` shows failed state
- Service starts but immediately stops
- Error messages in logs

**Solutions:**

1. **Check Service Status**
   ```bash
   sudo systemctl status jenkins
   # Look for error messages
   ```

2. **View Detailed Logs**
   ```bash
   sudo journalctl -u jenkins -n 100 --no-pager
   # or
   sudo tail -n 100 /var/log/jenkins/jenkins.log
   ```

3. **Check Java Installation**
   ```bash
   java -version
   # Jenkins requires Java 11 or 17
   
   # If Java is missing:
   sudo apt install openjdk-17-jdk -y
   ```

4. **Check Disk Space**
   ```bash
   df -h
   # Ensure /var has sufficient space (Jenkins needs several GB)
   ```

5. **Check Port Availability**
   ```bash
   sudo lsof -i :8080
   # If another process is using port 8080, either:
   # - Stop that process, or
   # - Change Jenkins port in /var/lib/jenkins/config.xml
   ```

6. **Verify Jenkins User**
   ```bash
   id jenkins
   # Jenkins should have its own user account
   ```

7. **Check File Permissions**
   ```bash
   ls -la /var/lib/jenkins
   # Should be owned by jenkins:jenkins
   
   # If incorrect:
   sudo chown -R jenkins:jenkins /var/lib/jenkins
   ```

8. **Restart Service**
   ```bash
   sudo systemctl daemon-reload
   sudo systemctl restart jenkins
   sudo systemctl status jenkins
   ```

---

## Java Installation Problems

### Problem: Java not found or wrong version

**Symptoms:**
- "java: command not found"
- Jenkins fails to start due to Java version mismatch

**Solutions:**

1. **Install Java 17 (Recommended)**
   ```bash
   sudo apt update
   sudo apt install openjdk-17-jdk -y
   ```

2. **Verify Installation**
   ```bash
   java -version
   # Should show openjdk version "17.x.x"
   ```

3. **Set JAVA_HOME (if needed)**
   ```bash
   # Find Java installation path
   sudo update-alternatives --config java
   
   # Add to /etc/environment or ~/.bashrc:
   export JAVA_HOME=/usr/lib/jvm/java-17-openjdk-amd64
   export PATH=$PATH:$JAVA_HOME/bin
   ```

4. **Check Jenkins Java Configuration**
   ```bash
   # Jenkins should auto-detect Java, but you can specify:
   sudo nano /etc/default/jenkins
   # Add or modify: JAVA_ARGS="-Djava.awt.headless=true"
   ```

---

## Firewall Configuration

### Problem: Firewall blocking Jenkins access

**Solutions:**

1. **UFW (Uncomplicated Firewall)**
   ```bash
   # Check status
   sudo ufw status
   
   # Allow port 8080
   sudo ufw allow 8080/tcp
   
   # Reload firewall
   sudo ufw reload
   
   # Verify rule added
   sudo ufw status numbered
   ```

2. **iptables (if UFW not used)**
   ```bash
   # Allow port 8080
   sudo iptables -A INPUT -p tcp --dport 8080 -j ACCEPT
   
   # Save rules (Ubuntu)
   sudo netfilter-persistent save
   ```

3. **AWS Security Group**
   - Ensure inbound rule allows TCP port 8080
   - Source can be your IP or 0.0.0.0/0 (for testing only)

---

## Permission Issues

### Problem: Permission denied errors when accessing Jenkins files

**Solutions:**

1. **Fix Jenkins Directory Ownership**
   ```bash
   sudo chown -R jenkins:jenkins /var/lib/jenkins
   sudo chown -R jenkins:jenkins /var/log/jenkins
   sudo chown -R jenkins:jenkins /var/cache/jenkins
   ```

2. **Fix File Permissions**
   ```bash
   sudo chmod 755 /var/lib/jenkins
   sudo chmod 644 /var/lib/jenkins/config.xml
   ```

3. **Check Sudo Access**
   ```bash
   # Ensure you're using sudo for Jenkins commands
   sudo systemctl restart jenkins
   ```

4. **Understanding User Context (ubuntu vs root)**
   
   **Common Confusion:** Switching to root unnecessarily
   ```bash
   # ❌ Unnecessary: Switching to root
   sudo su -
   # Now you're root, but this is not needed
   
   # ✅ Better: Work as ubuntu user with sudo
   sudo systemctl status jenkins
   sudo cat /var/lib/jenkins/secrets/initialAdminPassword
   
   # To exit root and return to ubuntu:
   exit  # or logout
   ```
   
   **Best Practice:** Work as regular user (`ubuntu`) and use `sudo` when needed. Avoid staying logged in as `root`.

---

## Additional Debugging Commands

```bash
# Check all Jenkins-related processes
ps aux | grep jenkins

# Check network connections
sudo netstat -tlnp | grep jenkins

# Check system resources
free -h
df -h
top

# View all Jenkins logs
sudo journalctl -u jenkins --since "1 hour ago"

# Test Jenkins HTTP endpoint
curl -I http://localhost:8080

# Check Jenkins configuration syntax
sudo java -jar /usr/share/jenkins/jenkins.war --version
```

---

## Getting Help

If issues persist:

1. Check [Jenkins Official Documentation](https://www.jenkins.io/doc/)
2. Review Jenkins logs: `sudo journalctl -u jenkins -f`
3. Check AWS EC2 instance system logs in AWS Console
4. Verify all prerequisites are met
5. Consider starting with a fresh EC2 instance if configuration is corrupted

---

**Note**: Always backup `/var/lib/jenkins` before making significant changes to avoid data loss.

