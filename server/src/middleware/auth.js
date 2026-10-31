import { User } from '../models/User.js';
import { verifyAccessToken } from '../utils/jwt.js';

function unauthorized(response, request) {
  return response.status(401).json({
    data: null,
    meta: { requestId: request.requestId },
    error: { code: 'UNAUTHENTICATED', message: 'Authentication is required.' }
  });
}

export async function requireAuth(request, response, next) {
  const header = request.get('authorization');
  if (!header?.startsWith('Bearer ')) return unauthorized(response, request);
  try {
    const claims = verifyAccessToken(header.slice(7));
    const user = await User.findById(claims.sub).select('+tokenVersion');
    if (!user || user.status !== 'ACTIVE' || user.tokenVersion !== claims.tokenVersion) {
      return unauthorized(response, request);
    }
    request.user = user;
    return next();
  } catch {
    return unauthorized(response, request);
  }
}

export function requireRoles(...roles) {
  return (request, response, next) => {
    if (!request.user || !roles.includes(request.user.role)) {
      return response.status(403).json({
        data: null,
        meta: { requestId: request.requestId },
        error: { code: 'FORBIDDEN', message: 'You do not have permission to perform this action.' }
      });
    }
    return next();
  };
}

export function requireCustomerOwnership(request, response, next) {
  if (request.user?.role === 'CUSTOMER'
    && request.user.customerId?.toString() !== request.params.customerId) {
    return response.status(403).json({
      data: null,
      meta: { requestId: request.requestId },
      error: { code: 'FORBIDDEN', message: 'You do not have access to this customer resource.' }
    });
  }
  return next();
}
