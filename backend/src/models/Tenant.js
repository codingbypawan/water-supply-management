const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Tenant = sequelize.define('Tenant', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  slug: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true,
  },
  domain: {
    type: DataTypes.STRING(255),
    unique: true,
  },
  logo_url: {
    type: DataTypes.STRING(500),
  },
  tagline: {
    type: DataTypes.STRING(255),
  },
  primary_color: {
    type: DataTypes.STRING(7),
    defaultValue: '#1E40AF',
  },
  secondary_color: {
    type: DataTypes.STRING(7),
    defaultValue: '#3B82F6',
  },
  status: {
    type: DataTypes.ENUM('active', 'suspended', 'expired'),
    defaultValue: 'active',
  },
}, {
  tableName: 'tenants',
});

module.exports = Tenant;
