const bcrypt = require('bcryptjs');
const { Employee, User } = require('../models');
const ApiResponse = require('../utils/response');

exports.list = async (req, res, next) => {
  try {
    const where = { tenant_id: req.user.tenantId };
    if (req.user.plantId) where.plant_id = req.user.plantId;
    if (req.query.status) where.status = req.query.status;

    const employees = await Employee.findAll({
      where,
      order: [['name', 'ASC']],
    });

    return ApiResponse.success(res, employees);
  } catch (error) {
    next(error);
  }
};

exports.create = async (req, res, next) => {
  try {
    const plantId = req.body.plantId || req.user.plantId;
    if (!plantId) return ApiResponse.badRequest(res, 'Plant ID required');

    const { name, phone, salary, permissions, password } = req.body;

    // Create user account (default password = phone number)
    const passwordHash = await bcrypt.hash(password || phone, 12);
    const user = await User.create({
      tenant_id: req.user.tenantId,
      plant_id: plantId,
      phone,
      password_hash: passwordHash,
      name,
      role: 'employee',
    });

    // Create employee record
    const employee = await Employee.create({
      tenant_id: req.user.tenantId,
      plant_id: plantId,
      user_id: user.id,
      name,
      phone,
      salary: salary || 0,
      permissions: permissions || [],
    });

    return ApiResponse.created(res, employee, 'Employee created');
  } catch (error) {
    next(error);
  }
};

exports.update = async (req, res, next) => {
  try {
    const employee = await Employee.findOne({
      where: { id: req.params.id, tenant_id: req.user.tenantId },
    });
    if (!employee) return ApiResponse.notFound(res, 'Employee not found');

    await employee.update(req.body);
    return ApiResponse.success(res, employee, 'Employee updated');
  } catch (error) {
    next(error);
  }
};

/**
 * Admin resets employee password to their phone number
 */
exports.resetPassword = async (req, res, next) => {
  try {
    const employee = await Employee.findOne({
      where: { id: req.params.id, tenant_id: req.user.tenantId },
    });
    if (!employee) return ApiResponse.notFound(res, 'Employee not found');

    const user = await User.findByPk(employee.user_id);
    if (!user) return ApiResponse.notFound(res, 'User account not found');

    const newPassword = req.body.password || employee.phone;
    const passwordHash = await bcrypt.hash(newPassword, 12);
    await user.update({ password_hash: passwordHash });

    return ApiResponse.success(res, null, `Password reset to ${req.body.password ? 'new password' : 'phone number'}`);
  } catch (error) {
    next(error);
  }
};

exports.updatePermissions = async (req, res, next) => {
  try {
    const employee = await Employee.findOne({
      where: { id: req.params.id, tenant_id: req.user.tenantId },
    });
    if (!employee) return ApiResponse.notFound(res, 'Employee not found');

    await employee.update({ permissions: req.body.permissions });
    return ApiResponse.success(res, employee, 'Permissions updated');
  } catch (error) {
    next(error);
  }
};
