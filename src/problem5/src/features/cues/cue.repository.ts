import { Between, FindOptionsWhere, ILike, IsNull } from 'typeorm';
import { AppDataSource } from '../../../data-source.js';
import { Cue } from './cue.entity.js';
import type {
  CreateCueInput,
  ListCuesQuery,
  UpdateCueInput,
} from './cue.schema.js';

export interface CuePage {
  rows: Cue[];
  total: number;
}

// Every query enforces ownership + non-deleted here, so a soft-deleted row
// can never resurface through a route that forgot a where clause.
const activeWhere = (id: string, ownerId: string): FindOptionsWhere<Cue> => ({
  id,
  createdById: ownerId,
  deletedAt: IsNull(),
});

export const cueRepository = {
  repo() {
    return AppDataSource.getRepository(Cue);
  },

  create(ownerId: string, input: CreateCueInput): Promise<Cue> {
    return this.repo().save(
      this.repo().create({ ...input, createdById: ownerId }),
    );
  },

  async findPage(ownerId: string, query: ListCuesQuery): Promise<CuePage> {
    const base: FindOptionsWhere<Cue> = {
      createdById: ownerId,
      deletedAt: IsNull(),
      ...(query.status ? { status: query.status } : {}),
      ...(query.condition ? { condition: query.condition } : {}),
      ...(query.material ? { material: query.material } : {}),
      ...(query.priceMin !== undefined || query.priceMax !== undefined
        ? {
            priceUsd: Between(
              query.priceMin ?? 0,
              query.priceMax ?? 100_000,
            ),
          }
        : {}),
    };

    // q searches brand OR model — the array-of-where form expresses that
    // union (TypeORM 0.3 rejects an OR key mixed into a single object).
    const where: FindOptionsWhere<Cue> | FindOptionsWhere<Cue>[] = query.q
      ? [
          { ...base, brand: ILike(`%${query.q}%`) },
          { ...base, model: ILike(`%${query.q}%`) },
        ]
      : base;

    const [rows, total] = await this.repo().findAndCount({
      where,
      order: { createdAt: 'DESC' },
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
    });
    return { rows, total };
  },

  findById(ownerId: string, id: string): Promise<Cue | null> {
    return this.repo().findOneBy(activeWhere(id, ownerId));
  },

  async update(
    ownerId: string,
    id: string,
    data: Partial<UpdateCueInput>,
  ): Promise<{ count: number }> {
    return this.repo().update(activeWhere(id, ownerId), data).then((r) => ({ count: r.affected ?? 0 }));
  },

  async softDelete(ownerId: string, id: string): Promise<{ count: number }> {
    return this.repo()
      .update(activeWhere(id, ownerId), { deletedAt: new Date() })
      .then((r) => ({ count: r.affected ?? 0 }));
  },
};
