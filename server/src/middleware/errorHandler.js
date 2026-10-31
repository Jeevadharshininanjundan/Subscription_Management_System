export function notFoundHandler(request, response) {
  response.status(404).json({
    data: null,
    meta: { requestId: request.requestId },
    error: {
      code: 'NOT_FOUND',
      message: 'The requested resource was not found.'
    }
  });
}

export function errorHandler(error, request, response, _next) {
  console.error(error);
  const status = error.status || (error.code === 11000 ? 409 : error.name === 'ValidationError' ? 400 : 500);
  response.status(status).json({
    data: null,
    meta: { requestId: request.requestId },
    error: {
      code: error.code === 11000 ? 'DUPLICATE_RESOURCE' : error.name === 'ValidationError' ? 'VALIDATION_ERROR' : (error.code || 'INTERNAL_SERVER_ERROR'),
      message: status === 500 ? 'An unexpected error occurred.' : error.message
    }
  });
}
