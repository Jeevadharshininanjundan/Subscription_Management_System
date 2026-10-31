import { User } from '../models/User.js';
import { createStaff, safeUser } from '../services/auth.js';

export async function listStaff(request, response, next) {
  try {
    const users = await User.find({ role: 'STAFF' }).sort({ name: 1 });
    return response.json({
      data: { users: users.map(safeUser) },
      meta: { requestId: request.requestId },
      error: null
    });
  } catch (error) {
    return next(error);
  }
}

export async function addStaff(request, response, next) {
  try {
    const user = await createStaff(request.body);
    return response.status(201).json({
      data: { user: safeUser(user) },
      meta: { requestId: request.requestId },
      error: null
    });
  } catch (error) {
    if (error?.code === 11000) {
      return response.status(409).json({
        data: null,
        meta: { requestId: request.requestId },
        error: { code: 'EMAIL_ALREADY_REGISTERED', message: 'An account with that email already exists.' }
      });
    }
    return next(error);
  }
}

export async function updateStaff(request, response, next) {
  try {
    const user = await User.findOneAndUpdate(
      { _id: request.params.id, role: 'STAFF' },
      { $set: { status: request.body.status } },
      { new: true, runValidators: true }
    );
    if (!user) {
      return response.status(404).json({
        data: null,
        meta: { requestId: request.requestId },
        error: { code: 'NOT_FOUND', message: 'Staff account was not found.' }
      });
    }
    return response.json({
      data: { user: safeUser(user) },
      meta: { requestId: request.requestId },
      error: null
    });
  } catch (error) {
    return next(error);
  }
}
