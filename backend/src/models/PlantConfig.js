const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const PlantConfig = sequelize.define('PlantConfig', {
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
    unique: true,
  },
  online_payment_enabled: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  distribution_type: {
    type: DataTypes.ENUM('container', 'litre'),
    defaultValue: 'container',
  },
  event_booking_enabled: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
  require_event_approval: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
  auto_payment_reminder: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
}, {
  tableName: 'plant_configs',
});

module.exports = PlantConfig;
