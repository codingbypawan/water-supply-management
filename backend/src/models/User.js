const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const User = sequelize.define('User', {
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
    allowNull: true,
  },
  phone: {
    type: DataTypes.STRING(20),
    allowNull: false,
  },
  password_hash: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  name: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  role: {
    type: DataTypes.ENUM('platform_admin', 'tenant_admin', 'plant_admin', 'employee', 'customer'),
    allowNull: false,
  },
  status: {
    type: DataTypes.ENUM('active', 'inactive'),
    defaultValue: 'active',
  },
  refresh_token: {
    type: DataTypes.TEXT,
  },
  last_login: {
    type: DataTypes.DATE,
  },
}, {
  tableName: 'users',
  indexes: [
    { fields: ['tenant_id'] },
    { fields: ['plant_id'] },
    { unique: true, fields: ['phone', 'tenant_id'] },
  ],
});

module.exports = User;
