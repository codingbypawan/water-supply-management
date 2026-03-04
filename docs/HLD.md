# High-Level Design (HLD)

## Multi-Tenant Water Supply Management SaaS

---

## 1. System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENTS                                  │
│  ┌──────────┐  ┌──────────────┐  ┌──────────────────────────┐  │
│  │ Browser  │  │ PWA (Mobile) │  │ Admin Panel (Browser)    │  │
│  └────┬─────┘  └──────┬───────┘  └───────────┬──────────────┘  │
│       └───────────────┼──────────────────────┘                  │
│                       ▼                                         │
│              ┌────────────────┐                                 │
│              │  React.js SPA  │                                 │
│              │  (Frontend)    │                                 │
│              └───────┬────────┘                                 │
└──────────────────────┼──────────────────────────────────────────┘
                       │ HTTPS / REST API
                       ▼
┌──────────────────────────────────────────────────────────────────┐
│                     API GATEWAY / NGINX                          │
│              (Reverse Proxy, SSL, Rate Limiting)                 │
└──────────────────────┬───────────────────────────────────────────┘
                       │
                       ▼
┌──────────────────────────────────────────────────────────────────┐
│                   BACKEND (Node.js + Express)                    │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  Middleware Layer                                         │   │
│  │  ├── Auth Middleware (JWT)                                │   │
│  │  ├── Tenant Resolution Middleware (domain → tenantId)     │   │
│  │  ├── RBAC Middleware                                      │   │
│  │  ├── Rate Limiting                                        │   │
│  │  └── Request Logging / Audit                              │   │
│  └──────────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  API Modules                                              │   │
│  │  ├── Auth Module         (login, register, token refresh) │   │
│  │  ├── Tenant Module       (CRUD, config)                   │   │
│  │  ├── Plant Module        (CRUD, config)                   │   │
│  │  ├── Customer Module     (CRUD, search, ledger)           │   │
│  │  ├── Distribution Module (create, history)                │   │
│  │  ├── Payment Module      (collect, online, webhook)       │   │
│  │  ├── Event Module        (CRUD, approval, reminders)      │   │
│  │  ├── Employee Module     (CRUD, permissions)              │   │
│  │  ├── Salary Module       (record, ledger)                 │   │
│  │  ├── Subscription Module (plans, billing)                 │   │
│  │  ├── Reports Module      (plant/tenant/platform)          │   │
│  │  └── Notification Module (push, reminders)                │   │
│  └──────────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  Services Layer                                           │   │
│  │  ├── TenantService                                        │   │
│  │  ├── AuthService                                          │   │
│  │  ├── SubscriptionService                                  │   │
│  │  ├── PaymentGatewayService                                │   │
│  │  ├── NotificationService (web-push)                       │   │
│  │  ├── CronService (reminders, subscription checks)         │   │
│  │  └── AuditService                                         │   │
│  └──────────────────────────────────────────────────────────┘   │
└──────────────────────┬───────────────────────────────────────────┘
                       │
                       ▼
┌──────────────────────────────────────────────────────────────────┐
│                     DATA LAYER                                   │
│  ┌───────────────┐  ┌──────────────┐  ┌────────────────────┐   │
│  │   MySQL 8.x   │  │    Redis     │  │   File Storage     │   │
│  │  (Primary DB) │  │  (Sessions/  │  │  (Logos/Branding)  │   │
│  │               │  │   Cache)     │  │                    │   │
│  └───────────────┘  └──────────────┘  └────────────────────┘   │
└──────────────────────────────────────────────────────────────────┘
```

---

## 2. Deployment Architecture

```
┌─────────────────────────────────────────────┐
│               Production Server              │
│                                              │
│  ┌──────────────────────────────────────┐   │
│  │           Docker Compose              │   │
│  │                                       │   │
│  │  ┌─────────┐  ┌──────────────────┐   │   │
│  │  │  NGINX  │  │  Node.js Backend │   │   │
│  │  │  :80    │──│  :5000           │   │   │
│  │  │  :443   │  └──────────────────┘   │   │
│  │  │         │  ┌──────────────────┐   │   │
│  │  │         │──│  React Frontend  │   │   │
│  │  │         │  │  (static build)  │   │   │
│  │  └─────────┘  └──────────────────┘   │   │
│  │               ┌──────────────────┐   │   │
│  │               │     MySQL 8      │   │   │
│  │               │     :3306        │   │   │
│  │               └──────────────────┘   │   │
│  └──────────────────────────────────────┘   │
└─────────────────────────────────────────────┘
```

---

## 3. Multi-Tenant Strategy

### 3.1 Tenant Resolution

```
Request from: https://jalpani.waterapp.com
                    │
                    ▼
         ┌─────────────────────┐
         │ Extract subdomain   │
         │ "jalpani"           │
         └─────────┬───────────┘
                   │
                   ▼
         ┌─────────────────────┐
         │ Lookup tenant by    │
         │ domain/subdomain    │
         └─────────┬───────────┘
                   │
            ┌──────┴──────┐
            │             │
         Found        Not Found
            │             │
            ▼             ▼
    Set tenantId    Show fallback:
    in request      Plant selection
    context         page → then login
```

### 3.2 Data Isolation

- Every DB query includes `WHERE tenantId = ?`
- Middleware injects `tenantId` into every request
- No cross-tenant data leaks possible

---

## 4. Authentication Flow

```
┌──────────┐     POST /api/auth/login      ┌──────────┐
│  Client  │ ──────────────────────────────→│  Server  │
│          │     { phone, password,         │          │
│          │       tenantId, plantId }      │          │
│          │                                │          │
│          │     { accessToken,             │          │
│          │←────── refreshToken,           │          │
│          │       user, tenant,            │          │
│          │       branding }               │          │
└──────────┘                                └──────────┘
```

---

## 5. Login Screen Design

```
┌──────────────────────────────────────────────────┐
│                  LOGIN PAGE                       │
│                                                   │
│  ┌──────────────────┬──────────────────────────┐ │
│  │                  │                           │ │
│  │   BRANDING       │     LOGIN FORM            │ │
│  │   PANEL          │                           │ │
│  │                  │  ┌─────────────────────┐  │ │
│  │   [Plant Logo]   │  │  Phone Number       │  │ │
│  │                  │  └─────────────────────┘  │ │
│  │   Plant Name     │  ┌─────────────────────┐  │ │
│  │                  │  │  Password            │  │ │
│  │   Tagline        │  └─────────────────────┘  │ │
│  │                  │                           │ │
│  │   Brand Colors   │  [ Login Button ]         │ │
│  │                  │                           │ │
│  │                  │  Forgot password?          │ │
│  │                  │                           │ │
│  └──────────────────┴──────────────────────────┘ │
└──────────────────────────────────────────────────┘

Flow:
1. Domain detected → Load tenant branding
2. Domain NOT detected → Show plant selector → Load branding
3. Plant selected → Show login form with branding
```

---

## 6. Technology Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React.js 18+, React Router, Axios, Tailwind CSS |
| Backend | Node.js 18+, Express.js |
| Database | MySQL 8.x |
| ORM | Sequelize |
| Auth | JWT (jsonwebtoken, bcrypt) |
| Validation | Joi / express-validator |
| Deployment | Docker, Docker Compose, Nginx |
| Cron Jobs | node-cron |
| Notifications | web-push |

---

## 7. API Design Principles

- RESTful endpoints: `/api/v1/{resource}`
- All routes tenant-scoped via middleware
- Standard response format:
  ```json
  {
    "success": true,
    "data": {},
    "message": "Operation successful",
    "pagination": { "page": 1, "limit": 20, "total": 150 }
  }
  ```
- Error format:
  ```json
  {
    "success": false,
    "error": { "code": "UNAUTHORIZED", "message": "Invalid credentials" }
  }
  ```

---

## 8. Security Architecture

- **Authentication**: JWT access tokens (15min) + refresh tokens (7d)
- **Authorization**: Role + Permission based middleware
- **Tenant Isolation**: Middleware enforces tenantId on every request
- **Password**: bcrypt with salt rounds = 12
- **Rate Limiting**: 100 req/min per IP
- **CORS**: Whitelist tenant domains
- **Input Validation**: All inputs validated via Joi schemas
- **SQL Injection**: Parameterized queries via Sequelize ORM
- **Audit Trail**: All sensitive operations logged
