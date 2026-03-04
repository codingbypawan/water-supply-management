/**
 * Standard API response helpers
 */
class ApiResponse {
  static success(res, data = null, message = 'Success', statusCode = 200, pagination = null) {
    const response = {
      success: true,
      message,
      data,
    };
    if (pagination) response.pagination = pagination;
    return res.status(statusCode).json(response);
  }

  static created(res, data = null, message = 'Created successfully') {
    return ApiResponse.success(res, data, message, 201);
  }

  static error(res, message = 'Internal server error', statusCode = 500, code = 'INTERNAL_ERROR') {
    return res.status(statusCode).json({
      success: false,
      error: { code, message },
    });
  }

  static badRequest(res, message = 'Bad request') {
    return ApiResponse.error(res, message, 400, 'BAD_REQUEST');
  }

  static unauthorized(res, message = 'Unauthorized') {
    return ApiResponse.error(res, message, 401, 'UNAUTHORIZED');
  }

  static forbidden(res, message = 'Forbidden') {
    return ApiResponse.error(res, message, 403, 'FORBIDDEN');
  }

  static notFound(res, message = 'Resource not found') {
    return ApiResponse.error(res, message, 404, 'NOT_FOUND');
  }

  static paginated(res, data, page, limit, total, message = 'Success') {
    return ApiResponse.success(res, data, message, 200, {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      totalPages: Math.ceil(total / limit),
    });
  }
}

module.exports = ApiResponse;
