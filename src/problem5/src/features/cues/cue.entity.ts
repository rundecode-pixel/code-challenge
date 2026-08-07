import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  type ValueTransformer,
} from 'typeorm';
import { User } from '../auth/user.entity.js';

export const CUE_MATERIALS = ['ash', 'maple', 'carbon'] as const;
export const CUE_CONDITIONS = ['new', 'used'] as const;
export const CUE_STATUSES = ['available', 'reserved', 'in_restoration', 'retired'] as const;

// Postgres `numeric` columns come back as strings; convert to JS numbers on
// read so the wire DTO is plain JSON numbers.
const numericTransformer: ValueTransformer = {
  to: (value: number | null): number | null => value,
  from: (value: string | null): number | null =>
    value === null ? null : Number.parseFloat(value),
};

@Entity('cues')
export class Cue {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar' })
  brand!: string;

  @Column({ type: 'varchar' })
  model!: string;

  // Validated against CUE_MATERIALS by the zod schema at the boundary.
  @Column({ type: 'varchar' })
  material!: string;

  @Column({ type: 'numeric', precision: 4, scale: 1, name: 'tip_size_mm', transformer: numericTransformer })
  tipSizeMm!: number;

  @Column({ type: 'numeric', precision: 4, scale: 1, name: 'weight_oz', transformer: numericTransformer })
  weightOz!: number;

  @Column({ type: 'integer', name: 'length_in' })
  lengthIn!: number;

  @Column({ type: 'numeric', precision: 10, scale: 2, name: 'price_usd', transformer: numericTransformer })
  priceUsd!: number;

  // Validated against CUE_CONDITIONS by the zod schema.
  @Column({ type: 'varchar' })
  condition!: string;

  @Column({ type: 'varchar', default: 'available' })
  status!: string;

  @Column({ type: 'uuid', name: 'created_by' })
  createdById!: string;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updatedAt!: Date;

  @DeleteDateColumn({ type: 'timestamptz', name: 'deleted_at' })
  deletedAt!: Date | null;

  @ManyToOne(() => User, (user) => user.cues, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'created_by' })
  createdBy!: User;
}
