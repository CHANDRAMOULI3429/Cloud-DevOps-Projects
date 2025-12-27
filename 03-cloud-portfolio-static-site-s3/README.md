# Cloud Portfolio Website – AWS S3 Static Hosting

## Overview
This project demonstrates how to design, build, and deploy a **production-ready static portfolio website** using **AWS S3 static website hosting**.

The goal was to create a **scalable, low-cost, cloud-native portfolio** that can evolve as new cloud and DevOps projects are added.

This website itself acts as a **living cloud project** and a professional showcase for recruiters and freelance clients.

---

## Problem Statement
Traditional portfolios often require backend servers, databases, and ongoing maintenance.

I needed:
- A zero-server solution
- Extremely low hosting cost
- High availability
- Simple deployment
- Easy project extensibility

---

## Solution
I built a **pure static website** hosted on **AWS S3**, using:
- HTML for structure
- CSS for styling
- Vanilla JavaScript for dynamic rendering
- JSON-driven project data for scalability

No backend. No frameworks. No build process.

---

## Architecture

User Browser  ---> AWS S3 ---->HTML,CSS,JS(Load)


### Key Architecture Decisions
- **Static Hosting on S3** for cost efficiency and reliability
- **JSON-based project data** to add new projects without HTML changes
- **Relative paths** for S3 compatibility
- **Modular CSS & JS** for maintainability

---

## AWS Services Used
- **Amazon S3** – Static website hosting
- *(Optional / Future)* CloudFront, Route 53

---

## Key Features
- Dynamic project rendering from JSON
- Fully responsive design
- SEO-friendly structure
- No backend or database dependency
- Easily extensible for future projects

---

## Deployment Summary
1. Created an S3 bucket
2. Enabled static website hosting
3. Configured bucket policy for public access
4. Uploaded static files
5. Accessed site via S3 website endpoint

---

## What I Learned
- Designing cloud solutions with **zero server management**
- Using AWS S3 beyond basic storage
- Structuring static projects for long-term scalability
- Thinking infrastructure-first, not just UI-first

---

## Live Demo
🔗 **S3 Website URL:** http://mouli-cloud-portfolio.s3-website.ap-south-1.amazonaws.com/

---

## GitHub
📦 Portfolio code is included in this repository.

---

## Future Enhancements
- CloudFront CDN
- Custom domain with Route 53
- CI/CD deployment using GitHub Actions
