const jwt = require('jsonwebtoken');
const env = require('../config/environment');
const { User } = require('../models');
const ApiResponse = require('../utils/response');

const auth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return ApiResponse.unauthorized(res, 'Access token required');
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, env.jwt.secret);

    const user = await User.findByPk(decoded.userId, {
      attributes: { exclude: ['password_hash', 'refresh_token'] },
    });

    if (!user || user.status !== 'active') {
      return ApiResponse.unauthorized(res, 'User not found or inactive');
    }

    req.user = {
      id: user.id,
      tenantId: user.tenant_id,
      plantId: user.plant_id,
      role: user.role,
      name: user.name,
      phone: user.phone,
    };

    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return ApiResponse.unauthorized(res, 'Token expired');
    }
    if (error.name === 'JsonWebTokenError') {
      return ApiResponse.unauthorized(res, 'Invalid token');
    }
    return ApiResponse.error(res, 'Authentication failed');
  }
};

module.exports = auth;
