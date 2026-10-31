import { Router } from 'express';
import { addStaff, listStaff, updateStaff } from '../controllers/staff.js';
import { requireAuth, requireRoles } from '../middleware/auth.js';
import { validateBody } from '../middleware/validate.js';
import { staffSchema } from '../validators/auth.js';
import { z } from 'zod';

export const staffRouter = Router();
const statusSchema = z.object({ status: z.enum(['ACTIVE', 'INACTIVE']) });

staffRouter.use(requireAuth, requireRoles('ADMIN'));
staffRouter.get('/', listStaff);
staffRouter.post('/', validateBody(staffSchema), addStaff);
staffRouter.patch('/:id', validateBody(statusSchema), updateStaff);
