# 🛠️ FixFlow — Real-Time Facility & Campus Issue Resolution System

> **Adyapan AI Full Stack Sprint — Problem Statement 3: FixFlow**  
> An enterprise-grade, real-time ticket lifecycle tracking platform for facilities management across universities, commercial parks, and tech hubs. It moves beyond naive CRUD applications into a strict, auditable **Finite State Machine (FSM)** engine with automated **SLA tracking**, multi-role RBAC, and real-time operational analytics.

---

![Next.js](https://img.shields.io/badge/Next.js-14+-000000?style=for-the-badge&logo=nextdotjs&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4+-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Neon_Cloud-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma_ORM-5.21+-2D3748?style=for-the-badge&logo=prisma&logoColor=white)
![Vercel](https://img.shields.io/badge/Vercel-Production-000000?style=for-the-badge&logo=vercel&logoColor=white)

---

## 🔗 Live Links & Hackathon Metadata

- **GitHub Repository**: [https://github.com/Shantanu7096/FixFlow](https://github.com/Shantanu7096/FixFlow)
- **Database Engine**: Cloud Neon PostgreSQL (`ep-frosty-shape-b4b2hlf4-pooler`)
- **Hackathon Track**: Adyapan AI Full Stack Hackathon — Problem Statement 3 (FixFlow)

---

## 💡 Executive Overview

Facilities and campus management frequently suffer from untracked issue escalation, missing resolution proof, manual dispatch delays, and broken SLA accountability.

**FixFlow** resolves this by enforcing a deterministic, state-machine driven ticket pipeline:
1. **Auditable State Transitions**: Prohibits invalid status jumps (e.g. jumping from `REPORTED` directly to `RESOLVED` without assigned staff or photo evidence).
2. **Automated Dynamic SLA Engine**: Computes exact resolution deadlines upon creation (`CRITICAL`: 4h, `HIGH`: 12h, `MEDIUM`: 24h, `LOW`: 48h) and flags live SLA breach alerts.
3. **Mandatory Proof Verification**: Requires technicians to submit a photo proof URL (`resolutionProofUrl`) before resolving a ticket.
4. **Role-Based Access Control (RBAC)**: Supports 3 distinct operational perspectives (`CITIZEN`, `STAFF`, `ADMIN`) accessible seamlessly via a top demo navigation bar.

---

## 🔄 Finite State Machine & Core Workflows

```mermaid
flowchart LR
    REPORTED["1. REPORTED\n(Citizen Created)"] -->|Admin Dispatches Staff| ASSIGNED["2. ASSIGNED\n(Technician Assigned)"]
    ASSIGNED -->|Staff Accepts Work| IN_PROGRESS["3. IN_PROGRESS\n(Work Started)"]
    IN_PROGRESS -->|Staff Uploads Photo Proof| RESOLVED["4. RESOLVED\n(ResolvedAt Locked)"]
    RESOLVED -->|Citizen Validates & Rates| CLOSED["5. CLOSED\n(Audit Complete)"]
```

### Role Capabilities
- 👤 **Citizen Portal**: Quick issue reporting modal with camera/photo upload simulator, active ticket tracking with a **5-step visual stepper pipeline**, live SLA countdown badges, and 1–5 star rating feedback.
- 🔧 **Staff Mobile Dashboard**: Assigned work queue, quick status toggles (`Start Work`, `Mark Resolved`), mandatory photo proof uploader, and internal staff notes timeline.
- 🛡️ **Admin Command Center**: Executive KPI metric cards (Total, Open, In-Progress, SLA Breach Rate %, Average Resolution Time in hours), category & building distribution gauge bar charts, filterable central dispatch board, staff re-assignment drawer, and CSV report export.

---

## 📸 System UI Wireframes & Visual Architecture

| Portal View | Description |
|---|---|
| **Citizen Portal & 5-Step Stepper**<br>![Citizen Portal](docs/screenshots/citizen-portal.png) | Issue submission modal with priority picker, dynamic location inputs, SLA target calculation, and 5-step visual stepper tracker. |
| **Staff Mobile Dashboard**<br>![Staff Dashboard](docs/screenshots/staff-dashboard.png) | Responsive field-technician view, filterable work queue, one-tap status toggles, and mandatory photo proof upload dialog. |
| **Admin Command Center**<br>![Admin Command Center](docs/screenshots/admin-analytics.png) | Real-time metric cards (Total, In-Progress, SLA Breach %, ART), category breakdown charts, central dispatch table, and CSV export. |

---

## 🛠️ Tech Stack & Key Libraries

| Layer | Technology | Purpose |
|---|---|---|
| **Framework** | Next.js 14+ (App Router) | React server components & API route handlers |
| **Language** | TypeScript 5.0+ | Strict type checking & zero `any` compile safety |
| **Styling & UI** | Tailwind CSS & Shadcn/UI | Responsive styling, custom design tokens, & accessible UI primitives |
| **Icons** | Lucide React | Modern crisp icon system |
| **Database** | PostgreSQL (Neon Cloud) | Serverless cloud relational database |
| **ORM** | Prisma ORM 5.21+ | Type-safe query building, migrations, & relational seeding |
| **Validation** | Zod | Runtime validation for forms and API action payloads |
| **Hosting** | Vercel | Production serverless deployment |

---

## ⚡ Quick Start & Local Installation Guide

### Prerequisites
- Node.js 18.x or higher
- npm or yarn
- Git

### 1. Clone Repository & Install Dependencies
```bash
git clone https://github.com/Shantanu7096/FixFlow.git
cd FixFlow
npm install
```

### 2. Environment Setup
Create a `.env` file in the root directory:
```env
DATABASE_URL="postgresql://neondb_owner:npg_vw4bgWZC9aId@ep-frosty-shape-b4b2hlf4-pooler.c-6.us-east-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require"
DIRECT_URL="postgresql://neondb_owner:npg_vw4bgWZC9aId@ep-frosty-shape-b4b2hlf4-pooler.c-6.us-east-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require"
```

### 3. Database Migration & Seeding
```bash
# Push schema to PostgreSQL
npx prisma db push

# Generate Prisma Client
npx prisma generate

# Seed sample users and tickets
npx tsx prisma/seed.ts
```

### 4. Launch Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🔑 Demo & Evaluation Credentials

You can use the top navigation role switcher to toggle seamlessly between all three roles during judging:

| Role | Demo User | Email / ID | Department / Specialty |
|---|---|---|---|
| **Citizen** | Alex Chen | `alex.chen@university.edu` | Computer Science |
| **Staff** | Marcus Vance | `marcus.vance@facility.com` | Electrical Maintenance |
| **Staff** | David Miller | `david.miller@facility.com` | HVAC Specialist |
| **Staff** | Elena Rostova | `elena.rostova@facility.com` | Plumbing Maintenance |
| **Admin** | Sarah Connor | `sarah.connor@facility.com` | Operations Command Center |

---

## 📊 Database ERD Diagram

```mermaid
erDiagram
    USER ||--o{ TICKET : "reports"
    USER ||--o{ TICKET : "assigned_to"
    USER ||--o{ TICKET_HISTORY : "performs"
    USER ||--o{ TICKET_COMMENT : "writes"
    TICKET ||--o{ TICKET_HISTORY : "has"
    TICKET ||--o{ TICKET_COMMENT : "has"

    USER {
        string id PK
        string name
        string email UK
        enum role "CITIZEN | STAFF | ADMIN"
        string department
    }

    TICKET {
        string id PK
        string ticketCode UK "FF-XXXX"
        string title
        enum category "ELECTRICAL | HVAC | PLUMBING | NETWORK | CARPENTRY | JANITORIAL | OTHER"
        enum priority "LOW | MEDIUM | HIGH | CRITICAL"
        enum status "REPORTED | ASSIGNED | IN_PROGRESS | RESOLVED | CLOSED"
        string building
        string floor
        string room
        string photoUrl
        string resolutionProofUrl
        datetime slaDeadline
        datetime resolvedAt
        int rating
    }

    TICKET_HISTORY {
        string id PK
        string ticketId FK
        string action
        string fromStatus
        string toStatus
        string changedById FK
        datetime timestamp
    }
```

---

## 🏆 Adyapan Hackathon Compliance Summary
- ✅ **Zero-error Type Safety**: Verified with `npx tsc --noEmit`.
- ✅ **Cloud PostgreSQL Integration**: Connected to Neon PostgreSQL with Prisma ORM.
- ✅ **Finite State Machine Enforcement**: Enforces status graph and mandatory photo proof.
- ✅ **Real-Time SLA Tracking**: Live breach status indicators and Average Resolution Time (ART) metrics.
- ✅ **Comprehensive Portals**: Citizen submission & 5-step stepper, Staff mobile queue & proof upload, Admin executive command center.
