const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const TenantSubscription = sequelize.define('TenantSubscription', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  tenant_id: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  plan_id: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  status: {
    type: DataTypes.ENUM('active', 'expired', 'cancelled', 'grace'),
    defaultValue: 'active',
  },
  start_date: {
    type: DataTypes.DATEONLY,
    allowNull: false,
  },
  end_date: {
    type: DataTypes.DATEONLY,
    allowNull: false,
  },
  grace_period_days: {
    type: DataTypes.INTEGER,
    defaultValue: 7,
  },
}, {
  tableName: 'tenant_subscriptions',
});

module.exports = TenantSubscription;
