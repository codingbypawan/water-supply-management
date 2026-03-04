const ApiResponse = require('../utils/response');
const { AppError } = require('../utils/errors');

const errorHandler = (err, req, res, _next) => {
  console.error('Error:', err);

  if (err.isOperational) {
    return ApiResponse.error(res, err.message, err.statusCode, err.code);
  }

  // Sequelize validation error
  if (err.name === 'SequelizeValidationError') {
    const messages = err.errors.map((e) => e.message).join(', ');
    return ApiResponse.badRequest(res, messages);
  }

  // Sequelize unique constraint error
  if (err.name === 'SequelizeUniqueConstraintError') {
    return ApiResponse.badRequest(res, 'Duplicate entry. Resource already exists.');
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return ApiResponse.unauthorized(res, 'Invalid token');
  }

  if (err.name === 'TokenExpiredError') {
    return ApiResponse.unauthorized(res, 'Token expired');
  }

  // Default
  return ApiResponse.error(
    res,
    process.env.NODE_ENV === 'development' ? err.message : 'Internal server error',
    500,
    'INTERNAL_ERROR'
  );
};

module.exports = errorHandler;
