import { Router } from 'express';
import { asyncHandler } from '../../common/async-handler.js';
import { authenticate, type AuthenticatedRequest } from '../../middleware/authenticate.js';
import {
  createCueSchema,
  cueIdParamSchema,
  listCuesQuerySchema,
  updateCueSchema,
} from './cue.schema.js';
import { createCue, deleteCue, getCue, listCues, updateCue } from './cue.service.js';

export const cuesRouter = Router();

cuesRouter.use(authenticate);

cuesRouter.post(
  '/',
  asyncHandler(async (req, res) => {
    const input = createCueSchema.parse(req.body);
    const cue = await createCue((req as AuthenticatedRequest).user.id, input);
    res.status(201).json({ data: cue });
  }),
);

cuesRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    const query = listCuesQuerySchema.parse(req.query);
    const result = await listCues((req as AuthenticatedRequest).user.id, query);
    res.json({ data: result });
  }),
);

cuesRouter.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const { id } = cueIdParamSchema.parse(req.params);
    const cue = await getCue((req as AuthenticatedRequest).user.id, id);
    res.json({ data: cue });
  }),
);

cuesRouter.patch(
  '/:id',
  asyncHandler(async (req, res) => {
    const { id } = cueIdParamSchema.parse(req.params);
    const input = updateCueSchema.parse(req.body);
    const cue = await updateCue((req as AuthenticatedRequest).user.id, id, input);
    res.json({ data: cue });
  }),
);

cuesRouter.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    const { id } = cueIdParamSchema.parse(req.params);
    await deleteCue((req as AuthenticatedRequest).user.id, id);
    res.status(204).send();
  }),
);
