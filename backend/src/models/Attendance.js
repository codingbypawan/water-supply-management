const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Attendance = sequelize.define('Attendance', {
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
  date: {
    type: DataTypes.DATEONLY,
    allowNull: false,
  },
  status: {
    type: DataTypes.ENUM('present', 'absent', 'half_day', 'leave'),
    allowNull: false,
    defaultValue: 'present',
  },
  check_in: {
    type: DataTypes.TIME,
    allowNull: true,
  },
  check_out: {
    type: DataTypes.TIME,
    allowNull: true,
  },
  notes: {
    type: DataTypes.STRING(500),
    allowNull: true,
  },
  marked_by: {
    type: DataTypes.UUID,
    allowNull: false,
    comment: 'User who marked the attendance',
  },
}, {
  tableName: 'attendance',
  indexes: [
    { unique: true, fields: ['employee_id', 'date'] },
    { fields: ['tenant_id', 'plant_id', 'date'] },
  ],
});

module.exports = Attendance;
