# Software Requirement Document (SRD v2.0)

## Multi-Tenant Water Supply Management SaaS (PWA-Based)

---

## 1. Project Summary

### 1.1 Objective

Build a **Multi-Tenant SaaS-based Water Supply Management System** with:

- Tenant isolation
- Plant-level operational control
- Configurable online payments
- Subscription-based billing
- PWA mobile-first experience
- Simplified daily distribution
- Event booking & reminders
- Employee RBAC
- Financial tracking

> The system must be **scalable, secure, configurable**, and easy for plant-level daily use.

---

## 2. System Architecture

### 2.1 Multi-Tenant Model

- **Single backend + single database**
- All tables must include: `tenantId`, `plantId` (if applicable)
- Strict validation required on every request

### 2.2 Hierarchy

```
Platform
  └── Tenant
        └── Plant
              ├── Employees
              ├── Customers
              ├── Distributions
              ├── Events
              ├── Payments
              ├── Salaries
              └── Subscriptions
```

---

## 3. User Roles

| Role | Key Responsibilities |
|------|---------------------|
| **Platform Admin** | Manage tenants, subscription plans, activate/suspend tenants, view revenue, feature flags |
| **Tenant Admin** | Manage plants, configure payment settings, enable/disable online payment, view subscription status, revenue reports |
| **Plant Admin** | Manage customers/employees, configure plant settings, set rates, approve events, assign permissions |
| **Employee** | Permission-based: create/update customer, distribute water, collect payment, approve event, view reports |
| **Customer** | Login via phone/password, view distribution/outstanding, apply for events, pay online, receive reminders |

---

## 4. Configuration Management

### 4.1 Tenant-Level Configuration

| Setting | Description |
|---------|-------------|
| Online Payment Enabled | Yes/No |
| Allow Event Booking | Yes/No |
| Allow Partial Payments | Yes/No |
| Default Reminder Time | Configurable |
| Enable Salary Module | Yes/No |
| Enable Offline Mode | Yes/No |

> If Tenant disables Online Payment → All plants under tenant **cannot** use online payment.

### 4.2 Plant-Level Configuration

| Setting | Description |
|---------|-------------|
| Online Payment Enabled | Yes/No (if tenant allows) |
| Distribution Type | Container / Litre |
| Active Rate | Numeric |
| Event Booking Enabled | Yes/No |
| Require Event Approval | Yes/No |
| Auto Payment Reminder | Yes/No |

> **Online Payment availability** = Tenant Enabled **AND** Plant Enabled

---

## 5. Subscription Management (SaaS Billing)

### 5.1 Plans

| Plan | Features |
|------|----------|
| **Basic** | 1 Plant, Max 1000 customers, No online payment, No event reminder automation |
| **Pro** | Multiple plants, Online payment, PWA notifications, Event reminders, Salary module |
| **Enterprise** | Unlimited plants, All features, Custom integrations |

### 5.2 Rules

- Tenant **cannot** access system if subscription expired
- Grace period configurable
- Feature access controlled via plan
- Online payment feature only available in eligible plans

### 5.3 Billing Models

- **Option A**: Per Tenant Pricing
- **Option B**: Per Plant Pricing
- **Option C**: Per Active Customer Pricing

---

## 6. Customer Management

**Fields**: Name, Phone (unique within tenant), Address, Default container count, Outstanding balance, Status

**Features**: Search by name/phone, View ledger, View distribution history, View event history

---

## 7. Water Distribution (Ultra Simple Flow)

### UI Flow
1. Search Customer
2. Date auto-selected
3. Enter container/litre count
4. Auto calculate
5. Save

**Fields**: `quantity`, `rate`, `totalAmount`, `employeeId`, `paymentStatus`

---

## 8. Payment Management

### 8.1 Offline Collection
- Cash, UPI (manual), Bank
- Partial allowed
- Auto outstanding update

### 8.2 Online Payment
- Only if enabled (Tenant + Plant + Plan)
- Customer sees outstanding → Pay partial/full
- Payment gateway + Webhook validation
- If disabled → Payment button hidden

---

## 9. Event Management

### 9.1 Customer Application
Fields: Event Date, Container Count, Comment, Address (optional), Status = Pending

### 9.2 Approval Flow
Plant Admin / Authorized Employee → Contact offline → Set rate → Approve → Mark payment status

### 9.3 Event Status Lifecycle
`Pending → Contacted → Approved → Rejected → Completed → Cancelled`

### 9.4 Event Reminders
- T-1 Day Reminder
- Event Day Morning Reminder
- Post Event Payment Reminder
- Delivery: PWA Push Notification, SMS (future)

---

## 10. Employee Management

**Fields**: Name, Phone, Role, Salary, Status

**Features**: Assign granular permissions, Disable employee, View performance

---

## 11. RBAC (Granular Control)

Permissions: `CREATE_CUSTOMER`, `UPDATE_CUSTOMER`, `DISTRIBUTE_WATER`, `COLLECT_PAYMENT`, `APPROVE_EVENT`, `VIEW_REPORT`, `MANAGE_RATE`, `MANAGE_EMPLOYEE`

Plant Admin assigns permissions.

---

## 12. Salary Management

- Monthly salary setup
- Record payment (partial allowed)
- Salary ledger
- Pending salary report

---

## 13. PWA Requirements

- Installable, Mobile optimized, Offline capability, Push notifications, Background sync
- **Offline Mode**: Cached customers, Add distribution/payment offline, Auto sync, Pending indicator

---

## 14. Reporting

| Level | Reports |
|-------|---------|
| **Plant** | Daily distribution, Collection, Outstanding, Event summary, Employee activity |
| **Tenant** | Revenue per plant, Customer growth, Outstanding across plants, Subscription status |
| **Platform** | Total active tenants, Revenue, Plan distribution |

---

## 15. Audit Logs

Track: Rate change, Permission change, Payment collection, Event approval, Salary payment, Subscription change

---

## 16. Security

- JWT authentication
- Password hashing
- Tenant validation middleware
- Role middleware
- Rate limiting
- API logging

---

## 17. Database Tables (Core)

`tenants`, `plants`, `subscription_plans`, `tenant_subscriptions`, `plant_subscriptions`, `users`, `employees`, `customers`, `rates`, `distributions`, `payments`, `events`, `salaries`, `roles`, `permissions`, `audit_logs`, `notifications`

> All must contain: `tenantId`, `createdAt`, `updatedAt`

---

## 18. Performance Requirements

- Customer search < 1 sec
- Distribution save < 2 sec
- Handle 10,000+ customers per tenant
- Support 100+ tenants initially

---

## 19. Future Extensions

Inventory tracking, GPS tracking, SMS integration, WhatsApp alerts, PDF invoice, Auto recurring billing, Referral program
