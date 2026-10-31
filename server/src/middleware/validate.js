export function validateBody(schema) {
  return (request, response, next) => {
    const result = schema.safeParse(request.body);
    if (!result.success) {
      return response.status(400).json({
        data: null,
        meta: { requestId: request.requestId },
        error: {
          code: 'VALIDATION_ERROR',
          message: result.error.issues.map(issue => issue.message).join('; ')
        }
      });
    }
    request.body = result.data;
    return next();
  };
}
