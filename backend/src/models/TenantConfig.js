const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const TenantConfig = sequelize.define('TenantConfig', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  tenant_id: {
    type: DataTypes.UUID,
    allowNull: false,
    unique: true,
  },
  online_payment_enabled: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  allow_event_booking: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
  allow_partial_payments: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
  default_reminder_time: {
    type: DataTypes.STRING(10),
    defaultValue: '09:00',
  },
  enable_salary_module: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
  enable_offline_mode: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
}, {
  tableName: 'tenant_configs',
});

module.exports = TenantConfig;
