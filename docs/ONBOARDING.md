# Onboarding Guide — Water Supply Management SaaS

Welcome to the **Multi-Tenant Water Supply Management** platform. This guide will get you from zero to running in minutes.

---

## Table of Contents

1. [Prerequisites](#1-prerequisites)
2. [Repository Setup](#2-repository-setup)
3. [Local Development (without Docker)](#3-local-development-without-docker)
4. [Docker Development](#4-docker-development)
5. [Seeding Demo Data](#5-seeding-demo-data)
6. [Demo Credentials](#6-demo-credentials)
7. [Project Structure](#7-project-structure)
8. [Tech Stack](#8-tech-stack)
9. [User Roles & Hierarchy](#9-user-roles--hierarchy)
10. [API Overview](#10-api-overview)
11. [Key Workflows](#11-key-workflows)
12. [Environment Variables](#12-environment-variables)
13. [Production Deployment (EC2)](#13-production-deployment-ec2)
14. [Troubleshooting](#14-troubleshooting)

---

## 1. Prerequisites

| Tool       | Version  | Purpose            |
|------------|----------|--------------------|
| Node.js    | ≥ 18     | Backend & frontend |
| MySQL      | 8.0      | Database           |
| npm        | ≥ 9      | Package manager    |
| Docker     | ≥ 24     | Container deploy   |
| Git        | ≥ 2.40   | Version control    |

---

## 2. Repository Setup

```bash
git clone https://github.com/codingbypawan/water-supply-management.git
cd water-supply-management
```

---

## 3. Local Development (without Docker)

### 3.1 Database

Make sure MySQL 8 is running. Create the database:

```sql
CREATE DATABASE water_supply_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 3.2 Backend

```bash
cd backend
cp .env.example .env
# Edit .env — set DB_HOST, DB_PORT, DB_USER, DB_PASSWORD to match your MySQL
npm install
npm run seed       # Creates tables + demo data
npm run dev        # Starts on http://localhost:5000
```

### 3.3 Frontend

```bash
cd frontend
cp .env.example .env   # If it exists; default API URL is /api/v1
npm install
npm start              # Starts on http://localhost:3000
```

> The frontend proxies `/api/v1` requests to the backend. In local dev, set `REACT_APP_API_URL=http://localhost:5000/api/v1` in frontend `.env` or configure the React proxy.

---

## 4. Docker Development

The fastest way to get everything running:

```bash
docker compose up -d --build
```

This starts three containers:

| Service    | Container      | Port | Description                     |
|------------|----------------|------|---------------------------------|
| mysql      | wsm-mysql      | 3306 | MySQL 8.0 database              |
| backend    | wsm-backend    | 5000 | Node.js/Express API server      |
| frontend   | wsm-frontend   | 80   | React app served by Nginx       |

After the containers are healthy, seed the database:

```bash
docker exec -it wsm-backend node src/seeders/seed.js
```

Open **http://localhost** in your browser.

To stop:

```bash
docker compose down          # Stop containers (keeps data)
docker compose down -v       # Stop containers + delete DB volume
```

---

## 5. Seeding Demo Data

The seed script (`backend/src/seeders/seed.js`) creates:

- **3 subscription plans**: Basic, Pro, Enterprise
- **2 tenants**: Jalpani Water Supply (Pro), AquaFlow Solutions (Basic)
- **2 plants**: one per tenant, with rates and config
- **5 admin/employee users** across both tenants
- **5 sample customers** under Jalpani (with customer login accounts)

Run it:

```bash
# Local
cd backend && npm run seed

# Docker
docker exec -it wsm-backend node src/seeders/seed.js
```

> ⚠️ The seed uses `sequelize.sync({ force: true })` — it **drops and recreates all tables**.

---

## 6. Demo Credentials

### Admin & Employee Users

| Role            | Phone        | Password  | Tenant   |
|-----------------|-------------|-----------|----------|
| Platform Admin  | 9999999999  | admin123  | Jalpani  |
| Tenant Admin    | 9888888888  | admin123  | Jalpani  |
| Plant Admin     | 9777777777  | admin123  | Jalpani  |
| Tenant Admin    | 9555555555  | admin123  | AquaFlow |
| Plant Admin     | 9444444444  | admin123  | AquaFlow |

### Customer Users (password = phone number)

| Name          | Phone        | Password    |
|---------------|-------------|-------------|
| Rahul Sharma  | 9111111111  | 9111111111  |
| Priya Patel   | 9111111112  | 9111111112  |
| Amit Kumar    | 9111111113  | 9111111113  |
| Sneha Gupta   | 9111111114  | 9111111114  |
| Vikram Singh  | 9111111115  | 9111111115  |

> When an employee is created, their default password is set to their phone number.

---

## 7. Project Structure

```
water-supply-management/
├── backend/
│   ├── server.js                  # Entry point
│   ├── Dockerfile                 # Node 18 Alpine image
│   ├── .env.example               # Environment template
│   ├── package.json
│   └── src/
│       ├── app.js                 # Express app setup (middleware, routes)
│       ├── config/
│       │   ├── database.js        # Sequelize connection
│       │   ├── cors.js            # CORS configuration
│       │   └── environment.js     # Env var loader
│       ├── controllers/           # Route handlers
│       │   ├── auth.controller.js
│       │   ├── customer.controller.js
│       │   ├── customerPortal.controller.js
│       │   ├── distribution.controller.js
│       │   ├── employee.controller.js
│       │   ├── employeeReport.controller.js
│       │   ├── event.controller.js
│       │   ├── payment.controller.js
│       │   ├── plant.controller.js
│       │   ├── rate.controller.js
│       │   ├── report.controller.js
│       │   ├── salary.controller.js
│       │   ├── subscription.controller.js
│       │   ├── tenant.controller.js
│       │   └── user.controller.js
│       ├── middleware/
│       │   ├── auth.js            # JWT verify + attach req.user
│       │   ├── rbac.js            # requireRole() & requirePermission()
│       │   ├── tenantResolver.js  # Multi-tenant isolation
│       │   ├── validator.js       # Joi request validation
│       │   ├── errorHandler.js    # Global error handler
│       │   └── rateLimiter.js     # Express rate limiter
│       ├── models/                # Sequelize models + associations
│       │   ├── index.js           # Model registry & associations
│       │   ├── User.js
│       │   ├── Tenant.js
│       │   ├── Plant.js
│       │   ├── Customer.js
│       │   ├── Distribution.js
│       │   ├── Payment.js
│       │   ├── Employee.js
│       │   ├── EmployeeSettlement.js
│       │   ├── Event.js
│       │   ├── Rate.js
│       │   ├── Salary.js
│       │   ├── SalaryPayment.js
│       │   └── ... (configs, subscriptions, audit, notification)
│       ├── routes/                # Express route definitions
│       │   └── index.js           # Route aggregator
│       ├── seeders/
│       │   └── seed.js            # Demo data seeder
│       └── utils/
│           ├── constants.js       # Roles, permissions, enums
│           ├── errors.js          # Custom error classes
│           └── response.js        # ApiResponse helper
├── frontend/
│   ├── Dockerfile                 # Multi-stage: build + Nginx
│   ├── nginx.conf                 # Reverse proxy /api/ → backend
│   ├── package.json
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   ├── public/
│   │   └── index.html
│   └── src/
│       ├── App.jsx                # Router + auth guards
│       ├── index.js               # React entry
│       ├── api/
│       │   └── axios.js           # Axios instance + interceptors
│       ├── context/
│       │   ├── AuthContext.jsx     # Auth state + JWT management
│       │   └── TenantContext.jsx   # Tenant/plant selection
│       ├── components/
│       │   ├── common/
│       │   │   ├── Sidebar.jsx    # Role-based navigation
│       │   │   ├── Header.jsx     # Top bar
│       │   │   ├── DataTable.jsx  # Reusable table component
│       │   │   └── LoadingSpinner.jsx
│       │   └── login/
│       │       ├── LoginForm.jsx
│       │       ├── BrandingPanel.jsx
│       │       └── PlantSelector.jsx
│       ├── pages/
│       │   ├── Dashboard.jsx      # Role-specific dashboards
│       │   ├── Customers.jsx
│       │   ├── CustomerDashboard.jsx
│       │   ├── Distribution.jsx
│       │   ├── Payments.jsx
│       │   ├── Employees.jsx
│       │   ├── Salaries.jsx
│       │   ├── Events.jsx
│       │   ├── Plants.jsx
│       │   ├── Tenants.jsx
│       │   ├── Users.jsx
│       │   ├── Reports.jsx
│       │   ├── Settings.jsx
│       │   ├── Subscriptions.jsx
│       │   └── Login.jsx
│       └── styles/
│           └── globals.css        # Tailwind directives
├── docs/
│   ├── REQUIREMENTS.md            # Full SRD
│   ├── HLD.md                     # High-level design
│   ├── LLD.md                     # Low-level design
│   └── ONBOARDING.md              # ← You are here
├── docker-compose.yml             # 3-service stack
├── .gitignore
└── Requirement.txt
```

---

## 8. Tech Stack

| Layer     | Technology                                       |
|-----------|--------------------------------------------------|
| Frontend  | React 18, React Router 6, Tailwind CSS 3, Axios  |
| Backend   | Node.js 18, Express 4, Sequelize 6, JWT          |
| Database  | MySQL 8.0                                        |
| Auth      | bcryptjs + JWT (access + refresh tokens)         |
| Deploy    | Docker Compose, Nginx reverse proxy              |
| UI        | Mobile-first responsive, bottom tab navigation   |

---

## 9. User Roles & Hierarchy

```
Platform
  └── Tenant
        └── Plant
              ├── Employees
              ├── Customers
              └── Resources (Distributions, Payments, Events, Salaries)
```

| Role             | Scope    | Key Capabilities                                              |
|------------------|----------|---------------------------------------------------------------|
| platform_admin   | Global   | Manage tenants, subscription plans, global overview           |
| tenant_admin     | Tenant   | Manage plants, tenant config, payment settings, revenue       |
| plant_admin      | Plant    | CRUD customers/employees, rates, reports, permissions, events |
| employee         | Plant    | Distribute water, collect payments, view own stats            |
| customer         | Plant    | View bills, distribution history, apply for events, pay       |

**RBAC model:**
- `platform_admin`, `tenant_admin`, and `plant_admin` bypass `requirePermission()` checks.
- `employee` role uses granular permissions (e.g., `MANAGE_CUSTOMER`, `VIEW_REPORT`).
- `requireRole()` middleware enforces strict role matching (e.g., employee-only endpoints).

---

## 10. API Overview

All routes are under **`/api/v1`**.

| Module            | Base Route                  | Key Operations                                    |
|-------------------|-----------------------------|---------------------------------------------------|
| Auth              | `/auth`                     | Login, refresh token, change password             |
| Tenants           | `/tenants`                  | CRUD tenants (platform admin)                     |
| Plants            | `/plants`                   | CRUD plants per tenant                            |
| Users             | `/users`                    | CRUD users, reset password                        |
| Customers         | `/customers`                | CRUD, set rates, manage outstanding               |
| Distributions     | `/distributions`            | Record water delivery                             |
| Payments          | `/payments`                 | Record cash/UPI/bank payments                     |
| Events            | `/events`                   | Create, approve/reject, book                      |
| Employees         | `/employees`                | Manage employee profiles                          |
| Employee Reports  | `/employee-reports`         | Admin: all employees summary; Employee: own stats |
| Salaries          | `/salaries`                 | Salary config + payment records                   |
| Rates             | `/rates`                    | Manage per-plant water rates                      |
| Reports           | `/reports`                  | Financial/distribution reports                    |
| Subscriptions     | `/subscriptions`            | Plan management, tenant subscriptions             |
| Customer Portal   | `/customer-portal`          | Customer self-service (dashboard, history)        |

**Response format:**
```json
{
  "success": true,
  "data": { ... },
  "pagination": { "page": 1, "limit": 20, "total": 100, "pages": 5 }
}
```

---

## 11. Key Workflows

### 11.1 Daily Water Distribution

1. Employee logs in → sees **Employee Dashboard** with stats.
2. Clicks **Distribute Water** → selects customer, enters container count.
3. System auto-calculates amount (containers × customer rate or plant default rate).
4. Distribution recorded; customer balance updated.

### 11.2 Payment Collection

1. Employee clicks **Collect Payment** → selects customer.
2. Enters amount and payment method (cash / UPI / bank).
3. Payment recorded; customer outstanding reduced.
4. Employee's **Cash in Hand** updates for cash payments.

### 11.3 Employee Settlement

1. Admin views employee report → sees cash-in-hand balance.
2. Creates a settlement record to clear the employee's cash.
3. Settlement logged; cash-in-hand resets.

### 11.4 Customer Onboarding

1. Plant Admin creates a customer → system auto-creates a `customer` role user.
2. Customer can log in with phone/password (default password = phone number).
3. Customer dashboard shows distribution history, outstanding balance, events.

### 11.5 Event Management

1. Plant Admin creates an event (e.g., water tanker booking).
2. Customers can view and apply for events.
3. Admin approves/rejects applications.

---

## 12. Environment Variables

### Backend (`backend/.env`)

| Variable                | Default            | Description                        |
|-------------------------|--------------------|------------------------------------|
| `NODE_ENV`              | development        | Environment mode                   |
| `PORT`                  | 5000               | Server port                        |
| `DB_HOST`               | localhost          | MySQL host                         |
| `DB_PORT`               | 4001               | MySQL port                         |
| `DB_NAME`               | water_supply_db    | Database name                      |
| `DB_USER`               | root               | Database user                      |
| `DB_PASSWORD`           | DB%40Password      | Database password                  |
| `JWT_SECRET`            | —                  | **Change in production**           |
| `JWT_REFRESH_SECRET`    | —                  | **Change in production**           |
| `JWT_EXPIRES_IN`        | 15m                | Access token TTL                   |
| `JWT_REFRESH_EXPIRES_IN`| 7d                 | Refresh token TTL                  |
| `CORS_ORIGINS`          | http://localhost:3000 | Allowed origins (comma-separated) |

### Frontend (`frontend/.env`)

| Variable               | Default     | Description          |
|------------------------|-------------|----------------------|
| `REACT_APP_API_URL`    | /api/v1     | Backend API base URL |

---

## 13. Production Deployment (EC2)

### Quick Steps

1. **Launch EC2**: Ubuntu 22.04, t2.small (2 GB RAM), open ports 22, 80, 443.

2. **Install Docker**:
   ```bash
   sudo apt update && sudo apt install -y docker.io docker-compose-plugin
   sudo usermod -aG docker $USER
   # Log out and back in
   ```

3. **Clone & configure**:
   ```bash
   git clone https://github.com/codingbypawan/water-supply-management.git
   cd water-supply-management
   ```

4. **Update production secrets** in `docker-compose.yml`:
   - `MYSQL_ROOT_PASSWORD` → strong password
   - `DB_PASSWORD` → same strong password
   - `JWT_SECRET` → random 64-char string
   - `JWT_REFRESH_SECRET` → different random 64-char string
   - `CORS_ORIGINS` → your domain

5. **Build & start**:
   ```bash
   docker compose up -d --build
   ```

6. **Seed data**:
   ```bash
   docker exec -it wsm-backend node src/seeders/seed.js
   ```

7. **Verify**: Visit `http://<EC2-public-IP>` — login with demo credentials.

### Optional: HTTPS with Let's Encrypt

Install Certbot and configure Nginx or use a reverse proxy like Caddy for automatic TLS.

---

## 14. Troubleshooting

| Problem                          | Solution                                                    |
|----------------------------------|-------------------------------------------------------------|
| Backend can't connect to MySQL   | Check `DB_HOST`, `DB_PORT`, `DB_PASSWORD` in `.env`         |
| Docker MySQL not ready           | Wait for healthcheck; `docker logs wsm-mysql`               |
| Frontend shows blank page        | Check `REACT_APP_API_URL`; run `npm run build` for prod     |
| "Unknown" in dashboard           | Sequelize alias is lowercase `customer`, not `Customer`     |
| Seed fails with "table exists"   | Seed uses `force: true` to drop tables — check DB perms     |
| CORS errors                      | Add frontend origin to `CORS_ORIGINS` env var               |
| Port 80 in use                   | Stop other web servers or change frontend port in compose    |
| Employee can't see reports       | Employee has own endpoints `/my-summary`, `/my-detail`      |

---

## Need Help?

- **Requirements**: `docs/REQUIREMENTS.md`
- **Architecture**: `docs/HLD.md` (high-level) and `docs/LLD.md` (low-level)
- **Repository**: https://github.com/codingbypawan/water-supply-management
