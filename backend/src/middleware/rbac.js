const { ROLES } = require('../utils/constants');
const { Employee } = require('../models');
const ApiResponse = require('../utils/response');

/**
 * Role-based access check
 * @param  {...string} allowedRoles - Roles that can access the route
 */
const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return ApiResponse.unauthorized(res, 'Authentication required');
    }

    if (!allowedRoles.includes(req.user.role)) {
      return ApiResponse.forbidden(res, 'Insufficient role privileges');
    }

    next();
  };
};

/**
 * Permission-based access check for employees
 * @param  {...string} requiredPermissions - Permissions needed
 */
const requirePermission = (...requiredPermissions) => {
  return async (req, res, next) => {
    if (!req.user) {
      return ApiResponse.unauthorized(res, 'Authentication required');
    }

    // Platform admin, tenant admin, plant admin bypass permission check
    if ([ROLES.PLATFORM_ADMIN, ROLES.TENANT_ADMIN, ROLES.PLANT_ADMIN].includes(req.user.role)) {
      return next();
    }

    try {
      const employee = await Employee.findOne({
        where: { user_id: req.user.id, status: 'active' },
      });

      if (!employee) {
        return ApiResponse.forbidden(res, 'Employee record not found');
      }

      const userPermissions = employee.permissions || [];
      const hasPermission = requiredPermissions.every((p) => userPermissions.includes(p));

      if (!hasPermission) {
        return ApiResponse.forbidden(res, 'Insufficient permissions');
      }

      req.employee = employee;
      next();
    } catch (error) {
      console.error('Permission check error:', error);
      return ApiResponse.error(res, 'Permission check failed');
    }
  };
};

module.exports = { requireRole, requirePermission };
