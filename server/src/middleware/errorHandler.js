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
  response.status(500).json({
    data: null,
    meta: { requestId: request.requestId },
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: 'An unexpected error occurred.'
    }
  });
}
