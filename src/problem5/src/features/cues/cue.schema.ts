import { z } from 'zod';
import { CUE_CONDITIONS, CUE_MATERIALS, CUE_STATUSES } from './cue.entity.js';

const price = z.coerce.number().min(0).max(100_000);

export const cueIdParamSchema = z.object({
  id: z.string().uuid('id must be a valid UUID'),
});

export const createCueSchema = z.object({
  brand: z.string().trim().min(1).max(80),
  model: z.string().trim().min(1).max(120),
  material: z.enum(CUE_MATERIALS),
  tipSizeMm: z.coerce.number().min(1).max(20),
  weightOz: z.coerce.number().min(1).max(40),
  lengthIn: z.coerce.number().int().min(30).max(72),
  priceUsd: price,
  condition: z.enum(CUE_CONDITIONS),
  status: z.enum(CUE_STATUSES).default('available'),
});

export const updateCueSchema = createCueSchema.partial();

export const listCuesQuerySchema = z.object({
  // Bounded because it feeds an ILIKE scan.
  q: z.string().trim().min(1).max(200).optional(),
  material: z.enum(CUE_MATERIALS).optional(),
  condition: z.enum(CUE_CONDITIONS).optional(),
  status: z.enum(CUE_STATUSES).optional(),
  priceMin: price.optional(),
  priceMax: price.optional(),
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

export type CueIdParam = z.infer<typeof cueIdParamSchema>;
export type CreateCueInput = z.infer<typeof createCueSchema>;
export type UpdateCueInput = z.infer<typeof updateCueSchema>;
export type ListCuesQuery = z.infer<typeof listCuesQuerySchema>;
