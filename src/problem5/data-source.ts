import 'reflect-metadata';
import 'dotenv/config';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { DataSource } from 'typeorm';
import { User } from './src/features/auth/user.entity.js';
import { Cue } from './src/features/cues/cue.entity.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

export const AppDataSource = new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL,
  entities: [User, Cue],
  // Glob over the migrations dir: new migrations are picked up without edits here.
  migrations: [join(__dirname, 'migrations', '*.ts')],
  synchronize: false,
  logging: false,
});
