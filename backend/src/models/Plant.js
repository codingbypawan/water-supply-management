const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Plant = sequelize.define('Plant', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  tenant_id: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  name: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  address: {
    type: DataTypes.TEXT,
  },
  phone: {
    type: DataTypes.STRING(20),
  },
  logo_url: {
    type: DataTypes.STRING(500),
  },
  tagline: {
    type: DataTypes.STRING(255),
  },
  primary_color: {
    type: DataTypes.STRING(7),
  },
  secondary_color: {
    type: DataTypes.STRING(7),
  },
  status: {
    type: DataTypes.ENUM('active', 'inactive'),
    defaultValue: 'active',
  },
}, {
  tableName: 'plants',
  indexes: [{ fields: ['tenant_id'] }],
});

module.exports = Plant;
