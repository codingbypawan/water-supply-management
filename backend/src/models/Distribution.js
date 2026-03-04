const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Distribution = sequelize.define('Distribution', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  tenant_id: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  plant_id: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  customer_id: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  employee_id: {
    type: DataTypes.UUID,
    allowNull: true,
  },
  distribution_date: {
    type: DataTypes.DATEONLY,
    allowNull: false,
  },
  quantity: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
  rate: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
  total_amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
  payment_status: {
    type: DataTypes.ENUM('paid', 'unpaid', 'partial'),
    defaultValue: 'unpaid',
  },
}, {
  tableName: 'distributions',
  indexes: [
    { fields: ['tenant_id', 'plant_id', 'distribution_date'] },
    { fields: ['customer_id'] },
  ],
});

module.exports = Distribution;
