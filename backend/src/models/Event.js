const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Event = sequelize.define('Event', {
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
  event_date: {
    type: DataTypes.DATEONLY,
    allowNull: false,
  },
  container_count: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  rate: {
    type: DataTypes.DECIMAL(10, 2),
  },
  total_amount: {
    type: DataTypes.DECIMAL(10, 2),
  },
  address: {
    type: DataTypes.TEXT,
  },
  comment: {
    type: DataTypes.TEXT,
  },
  status: {
    type: DataTypes.ENUM('pending', 'contacted', 'approved', 'rejected', 'completed', 'cancelled'),
    defaultValue: 'pending',
  },
  payment_status: {
    type: DataTypes.ENUM('paid', 'unpaid', 'partial'),
    defaultValue: 'unpaid',
  },
  approved_by: {
    type: DataTypes.UUID,
  },
}, {
  tableName: 'events',
  indexes: [
    { fields: ['tenant_id', 'plant_id', 'event_date'] },
    { fields: ['status'] },
  ],
});

module.exports = Event;
