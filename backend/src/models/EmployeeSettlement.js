const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const EmployeeSettlement = sequelize.define('EmployeeSettlement', {
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
  employee_user_id: {
    type: DataTypes.UUID,
    allowNull: false,
    comment: 'User ID of the employee settling money',
  },
  amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
  settlement_date: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
  received_by: {
    type: DataTypes.UUID,
    allowNull: false,
    comment: 'User ID of the admin who received the money',
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
}, {
  tableName: 'employee_settlements',
  indexes: [
    { fields: ['tenant_id', 'plant_id'] },
    { fields: ['employee_user_id'] },
    { fields: ['settlement_date'] },
  ],
});

module.exports = EmployeeSettlement;
