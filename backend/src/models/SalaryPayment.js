const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const SalaryPayment = sequelize.define('SalaryPayment', {
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
  salary_id: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  employee_id: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
  payment_method: {
    type: DataTypes.ENUM('cash', 'upi', 'bank', 'online'),
    defaultValue: 'cash',
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  paid_by: {
    type: DataTypes.UUID,
    allowNull: false,
    comment: 'Admin user who made the payment',
  },
  payment_date: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
}, {
  tableName: 'salary_payments',
  indexes: [
    { fields: ['salary_id'] },
    { fields: ['employee_id'] },
    { fields: ['tenant_id', 'plant_id'] },
  ],
});

module.exports = SalaryPayment;
