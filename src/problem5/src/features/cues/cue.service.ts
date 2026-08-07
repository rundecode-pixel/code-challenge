import { ApiError } from '../../common/errors.js';
import { Cue } from './cue.entity.js';
import type {
  CreateCueInput,
  ListCuesQuery,
  UpdateCueInput,
} from './cue.schema.js';
import { cueRepository } from './cue.repository.js';

// Wire representation: camelCase, including deletedAt so the API is
// transparent about soft deletion.
export interface WireCue {
  id: string;
  brand: string;
  model: string;
  material: string;
  tipSizeMm: number;
  weightOz: number;
  lengthIn: number;
  priceUsd: number;
  condition: string;
  status: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface CueListResult {
  items: WireCue[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

const toWireCue = (cue: Cue): WireCue => ({
  id: cue.id,
  brand: cue.brand,
  model: cue.model,
  material: cue.material,
  tipSizeMm: cue.tipSizeMm,
  weightOz: cue.weightOz,
  lengthIn: cue.lengthIn,
  priceUsd: cue.priceUsd,
  condition: cue.condition,
  status: cue.status,
  createdBy: cue.createdById,
  createdAt: cue.createdAt.toISOString(),
  updatedAt: cue.updatedAt.toISOString(),
  deletedAt: cue.deletedAt ? cue.deletedAt.toISOString() : null,
});

export async function createCue(
  ownerId: string,
  input: CreateCueInput,
): Promise<WireCue> {
  return toWireCue(await cueRepository.create(ownerId, input));
}

export async function listCues(
  ownerId: string,
  query: ListCuesQuery,
): Promise<CueListResult> {
  const { rows, total } = await cueRepository.findPage(ownerId, query);
  const totalPages = Math.ceil(total / query.pageSize) || 1;
  return {
    items: rows.map(toWireCue),
    pagination: {
      page: query.page,
      pageSize: query.pageSize,
      total,
      totalPages,
      hasNextPage: query.page < totalPages,
      hasPreviousPage: query.page > 1,
    },
  };
}

export async function getCue(ownerId: string, id: string): Promise<WireCue> {
  const cue = await cueRepository.findById(ownerId, id);
  if (!cue) throw ApiError.notFound('Cue not found');
  return toWireCue(cue);
}

export async function updateCue(
  ownerId: string,
  id: string,
  input: UpdateCueInput,
): Promise<WireCue> {
  const { count } = await cueRepository.update(ownerId, id, input);
  if (count === 0) throw ApiError.notFound('Cue not found');

  const cue = await cueRepository.findById(ownerId, id);
  return toWireCue(cue!);
}

export async function deleteCue(ownerId: string, id: string): Promise<void> {
  const { count } = await cueRepository.softDelete(ownerId, id);
  if (count === 0) throw ApiError.notFound('Cue not found');
}
