# Architecture Documentation

This folder contains architecture diagrams and visual documentation for the Jenkins CI server setup.

## Recommended Diagrams

1. **Infrastructure Diagram**
   - Visual representation of AWS EC2, Jenkins, and network components
   - File: `jenkins-ec2-architecture.png` or `.svg`

2. **Network Flow Diagram**
   - SSH connection flow (Local → EC2)
   - Jenkins web access flow (Browser → EC2:8080)
   - Security Group rules visualization

3. **Service Architecture**
   - Jenkins service lifecycle
   - Systemd service management
   - User and permission model



## Example Architecture

```
┌─────────────────────────────────────────────────┐
│           Local Machine (WSL/Windows)          │
│                                                 │
│  ┌──────────────┐                              │
│  │ SSH Client   │                              │
│  │ + .pem key   │                              │
│  └──────┬───────┘                              │
└─────────┼──────────────────────────────────────┘
          │ SSH (port 22)
          │
┌─────────▼──────────────────────────────────────┐
│              AWS EC2 Instance                   │
│              Ubuntu 22.04 LTS                   │
│                                                 │
│  ┌──────────────────────────────────────────┐  │
│  │         Jenkins Service                  │  │
│  │         (systemd)                        │  │
│  │         Port: 8080                       │  │
│  └──────────────────────────────────────────┘  │
└─────────────────────────────────────────────────┘
          │
          │ HTTP (port 8080)
          │
┌─────────▼──────────────────────────────────────┐
│              Web Browser                        │
│         http://<EC2-IP>:8080                   │
└─────────────────────────────────────────────────┘
```

Architecture Diagram





