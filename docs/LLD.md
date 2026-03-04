# Low-Level Design (LLD)

## Multi-Tenant Water Supply Management SaaS

---

## 1. Database Schema (MySQL)

### 1.1 Entity Relationship Diagram

```
tenants ──────1:N──── plants
  │                     │
  │                     ├──1:N── customers
  │                     ├──1:N── employees
  │                     ├──1:N── distributions
  │                     ├──1:N── payments
  │                     ├──1:N── events
  │                     ├──1:N── salaries
  │                     ├──1:N── rates
  │                     └──1:1── plant_configs
  │
  ├──1:N── tenant_configs
  ├──1:N── users
  └──1:N── tenant_subscriptions ── subscription_plans
```

### 1.2 Table Definitions

#### `tenants`
```sql
CREATE TABLE tenants (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(100) NOT NULL UNIQUE,
  domain VARCHAR(255) UNIQUE,
  logo_url VARCHAR(500),
  tagline VARCHAR(255),
  primary_color VARCHAR(7) DEFAULT '#1E40AF',
  secondary_color VARCHAR(7) DEFAULT '#3B82F6',
  status ENUM('active','suspended','expired') DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

#### `plants`
```sql
CREATE TABLE plants (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  tenant_id CHAR(36) NOT NULL,
  name VARCHAR(255) NOT NULL,
  address TEXT,
  phone VARCHAR(20),
  logo_url VARCHAR(500),
  tagline VARCHAR(255),
  primary_color VARCHAR(7),
  secondary_color VARCHAR(7),
  status ENUM('active','inactive') DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id),
  INDEX idx_tenant (tenant_id)
);
```

#### `users`
```sql
CREATE TABLE users (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  tenant_id CHAR(36) NOT NULL,
  plant_id CHAR(36),
  phone VARCHAR(20) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  role ENUM('platform_admin','tenant_admin','plant_admin','employee','customer') NOT NULL,
  status ENUM('active','inactive') DEFAULT 'active',
  refresh_token TEXT,
  last_login TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id),
  FOREIGN KEY (plant_id) REFERENCES plants(id),
  UNIQUE KEY uk_phone_tenant (phone, tenant_id),
  INDEX idx_tenant (tenant_id),
  INDEX idx_plant (plant_id)
);
```

#### `tenant_configs`
```sql
CREATE TABLE tenant_configs (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  tenant_id CHAR(36) NOT NULL UNIQUE,
  online_payment_enabled BOOLEAN DEFAULT FALSE,
  allow_event_booking BOOLEAN DEFAULT TRUE,
  allow_partial_payments BOOLEAN DEFAULT TRUE,
  default_reminder_time VARCHAR(10) DEFAULT '09:00',
  enable_salary_module BOOLEAN DEFAULT TRUE,
  enable_offline_mode BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id)
);
```

#### `plant_configs`
```sql
CREATE TABLE plant_configs (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  tenant_id CHAR(36) NOT NULL,
  plant_id CHAR(36) NOT NULL UNIQUE,
  online_payment_enabled BOOLEAN DEFAULT FALSE,
  distribution_type ENUM('container','litre') DEFAULT 'container',
  event_booking_enabled BOOLEAN DEFAULT TRUE,
  require_event_approval BOOLEAN DEFAULT TRUE,
  auto_payment_reminder BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id),
  FOREIGN KEY (plant_id) REFERENCES plants(id)
);
```

#### `subscription_plans`
```sql
CREATE TABLE subscription_plans (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  name VARCHAR(100) NOT NULL,
  description TEXT,
  max_plants INT DEFAULT 1,
  max_customers_per_plant INT DEFAULT 1000,
  features JSON,
  price_monthly DECIMAL(10,2) NOT NULL,
  price_yearly DECIMAL(10,2),
  billing_model ENUM('per_tenant','per_plant','per_customer') DEFAULT 'per_tenant',
  status ENUM('active','inactive') DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

#### `tenant_subscriptions`
```sql
CREATE TABLE tenant_subscriptions (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  tenant_id CHAR(36) NOT NULL,
  plan_id CHAR(36) NOT NULL,
  status ENUM('active','expired','cancelled','grace') DEFAULT 'active',
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  grace_period_days INT DEFAULT 7,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id),
  FOREIGN KEY (plan_id) REFERENCES subscription_plans(id)
);
```

#### `customers`
```sql
CREATE TABLE customers (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  tenant_id CHAR(36) NOT NULL,
  plant_id CHAR(36) NOT NULL,
  user_id CHAR(36),
  name VARCHAR(255) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  address TEXT,
  default_container_count INT DEFAULT 1,
  outstanding_balance DECIMAL(10,2) DEFAULT 0.00,
  status ENUM('active','inactive') DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id),
  FOREIGN KEY (plant_id) REFERENCES plants(id),
  UNIQUE KEY uk_phone_tenant (phone, tenant_id),
  INDEX idx_tenant_plant (tenant_id, plant_id),
  INDEX idx_name (name),
  INDEX idx_phone (phone)
);
```

#### `employees`
```sql
CREATE TABLE employees (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  tenant_id CHAR(36) NOT NULL,
  plant_id CHAR(36) NOT NULL,
  user_id CHAR(36) NOT NULL,
  name VARCHAR(255) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  salary DECIMAL(10,2) DEFAULT 0.00,
  permissions JSON,
  status ENUM('active','inactive') DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id),
  FOREIGN KEY (plant_id) REFERENCES plants(id),
  FOREIGN KEY (user_id) REFERENCES users(id),
  INDEX idx_tenant_plant (tenant_id, plant_id)
);
```

#### `rates`
```sql
CREATE TABLE rates (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  tenant_id CHAR(36) NOT NULL,
  plant_id CHAR(36) NOT NULL,
  rate_per_unit DECIMAL(10,2) NOT NULL,
  unit_type ENUM('container','litre') DEFAULT 'container',
  effective_from DATE NOT NULL,
  status ENUM('active','inactive') DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id),
  FOREIGN KEY (plant_id) REFERENCES plants(id),
  INDEX idx_plant_active (plant_id, status)
);
```

#### `distributions`
```sql
CREATE TABLE distributions (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  tenant_id CHAR(36) NOT NULL,
  plant_id CHAR(36) NOT NULL,
  customer_id CHAR(36) NOT NULL,
  employee_id CHAR(36),
  distribution_date DATE NOT NULL,
  quantity DECIMAL(10,2) NOT NULL,
  rate DECIMAL(10,2) NOT NULL,
  total_amount DECIMAL(10,2) NOT NULL,
  payment_status ENUM('paid','unpaid','partial') DEFAULT 'unpaid',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id),
  FOREIGN KEY (plant_id) REFERENCES plants(id),
  FOREIGN KEY (customer_id) REFERENCES customers(id),
  FOREIGN KEY (employee_id) REFERENCES employees(id),
  INDEX idx_tenant_plant_date (tenant_id, plant_id, distribution_date),
  INDEX idx_customer (customer_id)
);
```

#### `payments`
```sql
CREATE TABLE payments (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  tenant_id CHAR(36) NOT NULL,
  plant_id CHAR(36) NOT NULL,
  customer_id CHAR(36) NOT NULL,
  distribution_id CHAR(36),
  event_id CHAR(36),
  amount DECIMAL(10,2) NOT NULL,
  payment_method ENUM('cash','upi','bank','online') NOT NULL,
  payment_type ENUM('distribution','event','advance') DEFAULT 'distribution',
  transaction_ref VARCHAR(255),
  collected_by CHAR(36),
  status ENUM('completed','pending','failed') DEFAULT 'completed',
  payment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id),
  FOREIGN KEY (plant_id) REFERENCES plants(id),
  FOREIGN KEY (customer_id) REFERENCES customers(id),
  INDEX idx_tenant_plant (tenant_id, plant_id),
  INDEX idx_customer (customer_id),
  INDEX idx_date (payment_date)
);
```

#### `events`
```sql
CREATE TABLE events (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  tenant_id CHAR(36) NOT NULL,
  plant_id CHAR(36) NOT NULL,
  customer_id CHAR(36) NOT NULL,
  event_date DATE NOT NULL,
  container_count INT NOT NULL,
  rate DECIMAL(10,2),
  total_amount DECIMAL(10,2),
  address TEXT,
  comment TEXT,
  status ENUM('pending','contacted','approved','rejected','completed','cancelled') DEFAULT 'pending',
  payment_status ENUM('paid','unpaid','partial') DEFAULT 'unpaid',
  approved_by CHAR(36),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id),
  FOREIGN KEY (plant_id) REFERENCES plants(id),
  FOREIGN KEY (customer_id) REFERENCES customers(id),
  INDEX idx_tenant_plant_date (tenant_id, plant_id, event_date),
  INDEX idx_status (status)
);
```

#### `salaries`
```sql
CREATE TABLE salaries (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  tenant_id CHAR(36) NOT NULL,
  plant_id CHAR(36) NOT NULL,
  employee_id CHAR(36) NOT NULL,
  month VARCHAR(7) NOT NULL,
  salary_amount DECIMAL(10,2) NOT NULL,
  paid_amount DECIMAL(10,2) DEFAULT 0.00,
  status ENUM('pending','partial','paid') DEFAULT 'pending',
  payment_date TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id),
  FOREIGN KEY (plant_id) REFERENCES plants(id),
  FOREIGN KEY (employee_id) REFERENCES employees(id),
  INDEX idx_employee_month (employee_id, month)
);
```

#### `audit_logs`
```sql
CREATE TABLE audit_logs (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  tenant_id CHAR(36) NOT NULL,
  plant_id CHAR(36),
  user_id CHAR(36),
  action VARCHAR(100) NOT NULL,
  entity_type VARCHAR(50) NOT NULL,
  entity_id CHAR(36),
  old_values JSON,
  new_values JSON,
  ip_address VARCHAR(45),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_tenant (tenant_id),
  INDEX idx_action (action),
  INDEX idx_created (created_at)
);
```

#### `notifications`
```sql
CREATE TABLE notifications (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  tenant_id CHAR(36) NOT NULL,
  plant_id CHAR(36),
  user_id CHAR(36),
  title VARCHAR(255) NOT NULL,
  body TEXT,
  type ENUM('event_reminder','payment_reminder','subscription','announcement') NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  scheduled_at TIMESTAMP,
  sent_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_user (user_id),
  INDEX idx_scheduled (scheduled_at)
);
```

---

## 2. Backend API Specification

### 2.1 Auth Routes

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/auth/login` | Login with phone + password |
| POST | `/api/v1/auth/refresh` | Refresh access token |
| POST | `/api/v1/auth/logout` | Invalidate refresh token |
| GET | `/api/v1/auth/me` | Get current user profile |
| GET | `/api/v1/auth/branding?domain=` | Get tenant branding by domain |
| GET | `/api/v1/auth/plants` | Get plants list (fallback flow) |

### 2.2 Tenant Routes (Platform Admin)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/tenants` | List all tenants |
| POST | `/api/v1/tenants` | Create tenant |
| GET | `/api/v1/tenants/:id` | Get tenant details |
| PUT | `/api/v1/tenants/:id` | Update tenant |
| PATCH | `/api/v1/tenants/:id/status` | Activate/Suspend |

### 2.3 Plant Routes (Tenant Admin+)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/plants` | List plants |
| POST | `/api/v1/plants` | Create plant |
| GET | `/api/v1/plants/:id` | Get plant details |
| PUT | `/api/v1/plants/:id` | Update plant |
| GET | `/api/v1/plants/:id/config` | Get plant config |
| PUT | `/api/v1/plants/:id/config` | Update plant config |

### 2.4 Customer Routes

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/customers` | List/Search customers |
| POST | `/api/v1/customers` | Create customer |
| GET | `/api/v1/customers/:id` | Get customer detail |
| PUT | `/api/v1/customers/:id` | Update customer |
| GET | `/api/v1/customers/:id/ledger` | Customer ledger |

### 2.5 Distribution Routes

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/distributions` | List distributions |
| POST | `/api/v1/distributions` | Create distribution |
| GET | `/api/v1/distributions/daily` | Today's distribution report |

### 2.6 Payment Routes

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/payments` | List payments |
| POST | `/api/v1/payments` | Record payment |
| GET | `/api/v1/payments/outstanding` | Outstanding report |

### 2.7 Event Routes

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/events` | List events |
| POST | `/api/v1/events` | Create event application |
| PUT | `/api/v1/events/:id` | Update event |
| PATCH | `/api/v1/events/:id/status` | Change event status |

### 2.8 Employee Routes

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/employees` | List employees |
| POST | `/api/v1/employees` | Create employee |
| PUT | `/api/v1/employees/:id` | Update employee |
| PUT | `/api/v1/employees/:id/permissions` | Update permissions |

### 2.9 Report Routes

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/reports/daily-distribution` | Daily distribution report |
| GET | `/api/v1/reports/collection` | Collection report |
| GET | `/api/v1/reports/outstanding` | Outstanding summary |
| GET | `/api/v1/reports/revenue` | Revenue report |

---

## 3. Backend Directory Structure

```
backend/
├── src/
│   ├── config/
│   │   ├── database.js         # Sequelize connection
│   │   ├── environment.js      # ENV vars
│   │   └── cors.js             # CORS config
│   ├── middleware/
│   │   ├── auth.js             # JWT verification
│   │   ├── tenantResolver.js   # Domain → tenantId
│   │   ├── rbac.js             # Role + permission check
│   │   ├── rateLimiter.js      # Rate limiting
│   │   ├── validator.js        # Request validation
│   │   └── errorHandler.js     # Global error handler
│   ├── models/
│   │   ├── index.js            # Model registry + associations
│   │   ├── Tenant.js
│   │   ├── Plant.js
│   │   ├── User.js
│   │   ├── TenantConfig.js
│   │   ├── PlantConfig.js
│   │   ├── SubscriptionPlan.js
│   │   ├── TenantSubscription.js
│   │   ├── Customer.js
│   │   ├── Employee.js
│   │   ├── Rate.js
│   │   ├── Distribution.js
│   │   ├── Payment.js
│   │   ├── Event.js
│   │   ├── Salary.js
│   │   ├── AuditLog.js
│   │   └── Notification.js
│   ├── routes/
│   │   ├── index.js            # Route aggregator
│   │   ├── auth.routes.js
│   │   ├── tenant.routes.js
│   │   ├── plant.routes.js
│   │   ├── customer.routes.js
│   │   ├── distribution.routes.js
│   │   ├── payment.routes.js
│   │   ├── event.routes.js
│   │   ├── employee.routes.js
│   │   ├── salary.routes.js
│   │   ├── subscription.routes.js
│   │   └── report.routes.js
│   ├── controllers/
│   │   ├── auth.controller.js
│   │   ├── tenant.controller.js
│   │   ├── plant.controller.js
│   │   ├── customer.controller.js
│   │   ├── distribution.controller.js
│   │   ├── payment.controller.js
│   │   ├── event.controller.js
│   │   ├── employee.controller.js
│   │   ├── salary.controller.js
│   │   ├── subscription.controller.js
│   │   └── report.controller.js
│   ├── services/
│   │   ├── auth.service.js
│   │   ├── tenant.service.js
│   │   └── audit.service.js
│   ├── utils/
│   │   ├── response.js         # Standard response helper
│   │   ├── errors.js           # Custom error classes
│   │   └── constants.js        # Enums, permissions
│   ├── seeders/
│   │   └── seed.js             # Initial data seed
│   └── app.js                  # Express app setup
├── server.js                   # Entry point
├── package.json
├── .env.example
└── Dockerfile
```

---

## 4. Frontend Directory Structure

```
frontend/
├── public/
│   ├── index.html
│   ├── manifest.json
│   └── favicon.ico
├── src/
│   ├── api/
│   │   └── axios.js            # Axios instance with interceptors
│   ├── components/
│   │   ├── common/
│   │   │   ├── Sidebar.jsx
│   │   │   ├── Header.jsx
│   │   │   ├── LoadingSpinner.jsx
│   │   │   └── DataTable.jsx
│   │   └── login/
│   │       ├── BrandingPanel.jsx
│   │       ├── LoginForm.jsx
│   │       └── PlantSelector.jsx
│   ├── pages/
│   │   ├── Login.jsx
│   │   ├── Dashboard.jsx
│   │   ├── Customers.jsx
│   │   ├── Distribution.jsx
│   │   ├── Payments.jsx
│   │   ├── Events.jsx
│   │   ├── Employees.jsx
│   │   ├── Reports.jsx
│   │   └── Settings.jsx
│   ├── context/
│   │   ├── AuthContext.jsx
│   │   └── TenantContext.jsx
│   ├── hooks/
│   │   ├── useAuth.js
│   │   └── useTenant.js
│   ├── utils/
│   │   └── constants.js
│   ├── styles/
│   │   └── globals.css
│   ├── App.jsx
│   └── index.js
├── tailwind.config.js
├── package.json
├── .env.example
└── Dockerfile
```

---

## 5. Key Algorithms

### 5.1 Tenant Resolution Algorithm

```
function resolveTenant(request):
    hostname = request.hostname
    
    // Step 1: Check for custom domain
    tenant = DB.findTenant({ domain: hostname })
    if tenant: return tenant
    
    // Step 2: Check subdomain
    subdomain = hostname.split('.')[0]
    if subdomain != 'www' and subdomain != 'app':
        tenant = DB.findTenant({ slug: subdomain })
        if tenant: return tenant
    
    // Step 3: Check X-Tenant-ID header (fallback flow)
    tenantId = request.headers['x-tenant-id']
    if tenantId:
        tenant = DB.findTenant({ id: tenantId })
        if tenant: return tenant
    
    // Step 4: Return null (show plant selector)
    return null
```

### 5.2 Outstanding Balance Calculation

```
function calculateOutstanding(customerId):
    totalDistributed = SUM(distributions.total_amount) WHERE customer_id = customerId
    totalPaid = SUM(payments.amount) WHERE customer_id = customerId AND status = 'completed'
    return totalDistributed - totalPaid
```

### 5.3 Permission Check

```
function hasPermission(user, requiredPermission):
    if user.role in ['platform_admin', 'tenant_admin', 'plant_admin']:
        return true
    
    employee = DB.findEmployee({ user_id: user.id })
    return requiredPermission in employee.permissions
```
