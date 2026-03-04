const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Salary = sequelize.define('Salary', {
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
  employee_id: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  month: {
    type: DataTypes.STRING(7),
    allowNull: false,
  },
  salary_amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
  paid_amount: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0.00,
  },
  status: {
    type: DataTypes.ENUM('pending', 'partial', 'paid'),
    defaultValue: 'pending',
  },
  payment_date: {
    type: DataTypes.DATE,
  },
}, {
  tableName: 'salaries',
  indexes: [{ fields: ['employee_id', 'month'] }],
});

module.exports = Salary;
