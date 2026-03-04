const ROLES = {
  PLATFORM_ADMIN: 'platform_admin',
  TENANT_ADMIN: 'tenant_admin',
  PLANT_ADMIN: 'plant_admin',
  EMPLOYEE: 'employee',
  CUSTOMER: 'customer',
};

const PERMISSIONS = {
  CREATE_CUSTOMER: 'CREATE_CUSTOMER',
  UPDATE_CUSTOMER: 'UPDATE_CUSTOMER',
  DISTRIBUTE_WATER: 'DISTRIBUTE_WATER',
  COLLECT_PAYMENT: 'COLLECT_PAYMENT',
  APPROVE_EVENT: 'APPROVE_EVENT',
  VIEW_REPORT: 'VIEW_REPORT',
  MANAGE_RATE: 'MANAGE_RATE',
  MANAGE_EMPLOYEE: 'MANAGE_EMPLOYEE',
};

const EVENT_STATUS = {
  PENDING: 'pending',
  CONTACTED: 'contacted',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
};

const PAYMENT_STATUS = {
  PAID: 'paid',
  UNPAID: 'unpaid',
  PARTIAL: 'partial',
};

const PAYMENT_METHODS = {
  CASH: 'cash',
  UPI: 'upi',
  BANK: 'bank',
  ONLINE: 'online',
};

module.exports = {
  ROLES,
  PERMISSIONS,
  EVENT_STATUS,
  PAYMENT_STATUS,
  PAYMENT_METHODS,
};
