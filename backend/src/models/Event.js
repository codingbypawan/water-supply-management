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
    allowNull: true,
  },
  event_type: {
    type: DataTypes.STRING(50),
    defaultValue: 'other',
  },
  event_date: {
    type: DataTypes.DATEONLY,
    allowNull: false,
  },
  container_count: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  rate: {
    type: DataTypes.DECIMAL(10, 2),
  },
  event_rate: {
    type: DataTypes.DECIMAL(10, 2),
    comment: 'Flat rate for the entire event',
  },
  total_amount: {
    type: DataTypes.DECIMAL(10, 2),
  },
  customer_name: {
    type: DataTypes.STRING(255),
    comment: 'Name submitted via public form (before customer lookup)',
  },
  customer_phone: {
    type: DataTypes.STRING(20),
    comment: 'Phone submitted via public form',
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
