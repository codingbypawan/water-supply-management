const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Payment = sequelize.define('Payment', {
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
  distribution_id: {
    type: DataTypes.UUID,
    allowNull: true,
  },
  event_id: {
    type: DataTypes.UUID,
    allowNull: true,
  },
  amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
  payment_method: {
    type: DataTypes.ENUM('cash', 'upi', 'bank', 'online'),
    allowNull: false,
  },
  payment_type: {
    type: DataTypes.ENUM('distribution', 'event', 'advance'),
    defaultValue: 'distribution',
  },
  transaction_ref: {
    type: DataTypes.STRING(255),
  },
  collected_by: {
    type: DataTypes.UUID,
  },
  status: {
    type: DataTypes.ENUM('completed', 'pending', 'failed'),
    defaultValue: 'completed',
  },
  payment_date: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
}, {
  tableName: 'payments',
  indexes: [
    { fields: ['tenant_id', 'plant_id'] },
    { fields: ['customer_id'] },
    { fields: ['payment_date'] },
  ],
});

module.exports = Payment;
