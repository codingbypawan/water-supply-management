const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const SubscriptionPlan = sequelize.define('SubscriptionPlan', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false,
  },
  description: {
    type: DataTypes.TEXT,
  },
  max_plants: {
    type: DataTypes.INTEGER,
    defaultValue: 1,
  },
  max_customers_per_plant: {
    type: DataTypes.INTEGER,
    defaultValue: 1000,
  },
  features: {
    type: DataTypes.JSON,
  },
  price_monthly: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
  price_yearly: {
    type: DataTypes.DECIMAL(10, 2),
  },
  billing_model: {
    type: DataTypes.ENUM('per_tenant', 'per_plant', 'per_customer'),
    defaultValue: 'per_tenant',
  },
  status: {
    type: DataTypes.ENUM('active', 'inactive'),
    defaultValue: 'active',
  },
}, {
  tableName: 'subscription_plans',
});

module.exports = SubscriptionPlan;
