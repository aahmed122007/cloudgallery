# CloudGallery

**A Scalable Cloud-Native Multimedia Sharing Platform Built on Microsoft Azure**

- **Author:** Ali Ahmed (B00974347)
- **Module:** COM682 — Cloud Native Development
- **Coursework:** CW2 — Implementation

---

## Project Overview

CloudGallery is a cloud-native multimedia sharing platform where users can upload, browse, search, like, and manage images. It implements the design submitted in CW1 using a serverless Azure architecture.

## Architecture

| Layer | Technology |
|---|---|
| Frontend | Azure Static Web Apps (HTML + CSS + Vanilla JS) |
| API / Compute | Azure Functions (Node.js 20, HTTP Triggers) |
| File Storage | Azure Blob Storage |
| Metadata DB | Azure Cosmos DB (NoSQL) |
| User DB | Azure SQL Database (Relational) |
| AI Tagging | Azure AI Vision (Blob Trigger) |
| Content Moderation | Azure AI Content Safety (Blob Trigger) |
| Monitoring | Application Insights |
| CI/CD | GitHub Actions |
| Global Routing | Azure Front Door *(optional)* |

## Repository Layout

```
cloudgallery/
├── frontend/              → Static Web App (HTML/CSS/JS)
├── backend/               → Azure Functions (all REST endpoints)
├── database/              → SQL schema + Cosmos DB setup
├── .github/workflows/     → CI/CD pipelines
├── DEPLOYMENT-GUIDE.md    → Step-by-step Azure deployment
├── VIDEO-SCRIPT.md        → 5-minute demo walkthrough script
└── README.md
```

## Features Implemented

- User registration and login (with bcrypt-hashed passwords + JWT tokens)
- Media upload to Blob Storage with metadata stored in Cosmos DB
- Full CRUD REST API for users and media
- Media feed with search by tag
- Like / comment functionality
- Automatic AI tagging via Azure AI Vision (Blob Trigger)
- Content moderation via Azure AI Content Safety (Blob Trigger, async)
- Application Insights for monitoring
- CI/CD via GitHub Actions

## Getting Started

See **[DEPLOYMENT-GUIDE.md](./DEPLOYMENT-GUIDE.md)** for the complete step-by-step setup.
