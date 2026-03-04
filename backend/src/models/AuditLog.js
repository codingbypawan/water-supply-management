const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const AuditLog = sequelize.define('AuditLog', {
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
  },
  user_id: {
    type: DataTypes.UUID,
  },
  action: {
    type: DataTypes.STRING(100),
    allowNull: false,
  },
  entity_type: {
    type: DataTypes.STRING(50),
    allowNull: false,
  },
  entity_id: {
    type: DataTypes.UUID,
  },
  old_values: {
    type: DataTypes.JSON,
  },
  new_values: {
    type: DataTypes.JSON,
  },
  ip_address: {
    type: DataTypes.STRING(45),
  },
}, {
  tableName: 'audit_logs',
  updatedAt: false,
  indexes: [
    { fields: ['tenant_id'] },
    { fields: ['action'] },
    { fields: ['created_at'] },
  ],
});

module.exports = AuditLog;
