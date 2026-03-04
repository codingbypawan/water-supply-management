const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Rate = sequelize.define('Rate', {
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
  rate_per_unit: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
  unit_type: {
    type: DataTypes.ENUM('container', 'litre'),
    defaultValue: 'container',
  },
  effective_from: {
    type: DataTypes.DATEONLY,
    allowNull: false,
  },
  status: {
    type: DataTypes.ENUM('active', 'inactive'),
    defaultValue: 'active',
  },
}, {
  tableName: 'rates',
  indexes: [{ fields: ['plant_id', 'status'] }],
});

module.exports = Rate;
