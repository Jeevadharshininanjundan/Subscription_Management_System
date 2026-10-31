import {
  authenticate,
  registerCustomer,
  requestPasswordReset,
  resetPassword,
  revokeUserTokens,
  safeUser
} from '../services/auth.js';
import { signAccessToken } from '../utils/jwt.js';

function respond(response, request, data, status = 200) {
  return response.status(status).json({
    data,
    meta: { requestId: request.requestId },
    error: null
  });
}

function isDuplicate(error) {
  return error?.code === 11000;
}

export async function register(request, response, next) {
  try {
    const user = await registerCustomer(request.body);
    return respond(response, request, { user: safeUser(user), accessToken: signAccessToken(user) }, 201);
  } catch (error) {
    if (isDuplicate(error)) {
      return response.status(409).json({
        data: null,
        meta: { requestId: request.requestId },
        error: { code: 'EMAIL_ALREADY_REGISTERED', message: 'An account with that email already exists.' }
      });
    }
    return next(error);
  }
}

export async function login(request, response, next) {
  try {
    const user = await authenticate(request.body);
    if (!user) {
      return response.status(401).json({
        data: null,
        meta: { requestId: request.requestId },
        error: { code: 'INVALID_CREDENTIALS', message: 'Email or password is incorrect.' }
      });
    }
    return respond(response, request, { user: safeUser(user), accessToken: signAccessToken(user) });
  } catch (error) {
    return next(error);
  }
}

export async function logout(request, response, next) {
  try {
    await revokeUserTokens(request.user);
    return respond(response, request, { loggedOut: true });
  } catch (error) {
    return next(error);
  }
}

export async function forgotPassword(request, response, next) {
  try {
    await requestPasswordReset(request.body.email);
    return respond(response, request, {
      message: 'If an account exists for that email, a reset link has been sent.'
    });
  } catch (error) {
    return next(error);
  }
}

export async function reset(request, response, next) {
  try {
    const success = await resetPassword(request.body.token, request.body.password);
    if (!success) {
      return response.status(400).json({
        data: null,
        meta: { requestId: request.requestId },
        error: { code: 'INVALID_RESET_TOKEN', message: 'The reset link is invalid or expired.' }
      });
    }
    return respond(response, request, { message: 'Password has been reset.' });
  } catch (error) {
    return next(error);
  }
}

export function me(request, response) {
  return respond(response, request, { user: safeUser(request.user) });
}
