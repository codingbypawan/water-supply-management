const sequelize = require('../config/database');

const Tenant = require('./Tenant');
const Plant = require('./Plant');
const User = require('./User');
const TenantConfig = require('./TenantConfig');
const PlantConfig = require('./PlantConfig');
const SubscriptionPlan = require('./SubscriptionPlan');
const TenantSubscription = require('./TenantSubscription');
const Customer = require('./Customer');
const Employee = require('./Employee');
const Rate = require('./Rate');
const Distribution = require('./Distribution');
const Payment = require('./Payment');
const Event = require('./Event');
const Salary = require('./Salary');
const AuditLog = require('./AuditLog');
const Notification = require('./Notification');
const EmployeeSettlement = require('./EmployeeSettlement');
const SalaryPayment = require('./SalaryPayment');
const Attendance = require('./Attendance');

// ── Tenant associations ──
Tenant.hasMany(Plant, { foreignKey: 'tenant_id', as: 'plants' });
Tenant.hasOne(TenantConfig, { foreignKey: 'tenant_id', as: 'config' });
Tenant.hasMany(User, { foreignKey: 'tenant_id', as: 'users' });
Tenant.hasMany(TenantSubscription, { foreignKey: 'tenant_id', as: 'subscriptions' });

// ── Plant associations ──
Plant.belongsTo(Tenant, { foreignKey: 'tenant_id', as: 'tenant' });
Plant.hasOne(PlantConfig, { foreignKey: 'plant_id', as: 'config' });
Plant.hasMany(Customer, { foreignKey: 'plant_id', as: 'customers' });
Plant.hasMany(Employee, { foreignKey: 'plant_id', as: 'employees' });
Plant.hasMany(Distribution, { foreignKey: 'plant_id', as: 'distributions' });
Plant.hasMany(Payment, { foreignKey: 'plant_id', as: 'payments' });
Plant.hasMany(Event, { foreignKey: 'plant_id', as: 'events' });
Plant.hasMany(Rate, { foreignKey: 'plant_id', as: 'rates' });

// ── User associations ──
User.belongsTo(Tenant, { foreignKey: 'tenant_id', as: 'tenant' });
User.belongsTo(Plant, { foreignKey: 'plant_id', as: 'plant' });

// ── Config associations ──
TenantConfig.belongsTo(Tenant, { foreignKey: 'tenant_id', as: 'tenant' });
PlantConfig.belongsTo(Plant, { foreignKey: 'plant_id', as: 'plant' });
PlantConfig.belongsTo(Tenant, { foreignKey: 'tenant_id', as: 'tenant' });

// ── Subscription associations ──
TenantSubscription.belongsTo(Tenant, { foreignKey: 'tenant_id', as: 'tenant' });
TenantSubscription.belongsTo(SubscriptionPlan, { foreignKey: 'plan_id', as: 'plan' });
SubscriptionPlan.hasMany(TenantSubscription, { foreignKey: 'plan_id', as: 'subscriptions' });

// ── Customer associations ──
Customer.belongsTo(Tenant, { foreignKey: 'tenant_id', as: 'tenant' });
Customer.belongsTo(Plant, { foreignKey: 'plant_id', as: 'plant' });
Customer.belongsTo(User, { foreignKey: 'user_id', as: 'user' });
Customer.hasMany(Distribution, { foreignKey: 'customer_id', as: 'distributions' });
Customer.hasMany(Payment, { foreignKey: 'customer_id', as: 'payments' });
Customer.hasMany(Event, { foreignKey: { name: 'customer_id', allowNull: true }, as: 'events', onDelete: 'SET NULL', onUpdate: 'CASCADE' });

// ── Employee associations ──
Employee.belongsTo(Tenant, { foreignKey: 'tenant_id', as: 'tenant' });
Employee.belongsTo(Plant, { foreignKey: 'plant_id', as: 'plant' });
Employee.belongsTo(User, { foreignKey: 'user_id', as: 'user' });
Employee.hasMany(Salary, { foreignKey: 'employee_id', as: 'salaries' });
Employee.hasMany(Attendance, { foreignKey: 'employee_id', as: 'attendance' });

// ── Attendance associations ──
Attendance.belongsTo(Employee, { foreignKey: 'employee_id', as: 'employee' });
Attendance.belongsTo(User, { foreignKey: 'marked_by', as: 'markedByUser' });
Attendance.belongsTo(Plant, { foreignKey: 'plant_id', as: 'plant' });

// ── Distribution associations ──
Distribution.belongsTo(Customer, { foreignKey: 'customer_id', as: 'customer' });
Distribution.belongsTo(Employee, { foreignKey: 'employee_id', as: 'employee' });
Distribution.belongsTo(Plant, { foreignKey: 'plant_id', as: 'plant' });

// ── Payment associations ──
Payment.belongsTo(Customer, { foreignKey: 'customer_id', as: 'customer' });
Payment.belongsTo(Distribution, { foreignKey: 'distribution_id', as: 'distribution' });
Payment.belongsTo(Plant, { foreignKey: 'plant_id', as: 'plant' });
Payment.belongsTo(User, { foreignKey: 'collected_by', as: 'collector' });

// ── Event associations ──
Event.belongsTo(Customer, { foreignKey: { name: 'customer_id', allowNull: true }, as: 'customer', onDelete: 'SET NULL', onUpdate: 'CASCADE' });
Event.belongsTo(Plant, { foreignKey: 'plant_id', as: 'plant' });

// ── Salary associations ──
Salary.belongsTo(Employee, { foreignKey: 'employee_id', as: 'employee' });
Salary.belongsTo(Plant, { foreignKey: 'plant_id', as: 'plant' });
Salary.hasMany(SalaryPayment, { foreignKey: 'salary_id', as: 'payments' });

// ── SalaryPayment associations ──
SalaryPayment.belongsTo(Salary, { foreignKey: 'salary_id', as: 'salary' });
SalaryPayment.belongsTo(Employee, { foreignKey: 'employee_id', as: 'employee' });
SalaryPayment.belongsTo(User, { foreignKey: 'paid_by', as: 'paidByUser' });
SalaryPayment.belongsTo(Plant, { foreignKey: 'plant_id', as: 'plant' });

// ── Rate associations ──
Rate.belongsTo(Plant, { foreignKey: 'plant_id', as: 'plant' });

// ── EmployeeSettlement associations ──
EmployeeSettlement.belongsTo(User, { foreignKey: 'employee_user_id', as: 'employee' });
EmployeeSettlement.belongsTo(User, { foreignKey: 'received_by', as: 'receiver' });
EmployeeSettlement.belongsTo(Plant, { foreignKey: 'plant_id', as: 'plant' });

module.exports = {
  sequelize,
  Tenant,
  Plant,
  User,
  TenantConfig,
  PlantConfig,
  SubscriptionPlan,
  TenantSubscription,
  Customer,
  Employee,
  Rate,
  Distribution,
  Payment,
  Event,
  Salary,
  AuditLog,
  Notification,
  EmployeeSettlement,
  SalaryPayment,
  Attendance,
};
