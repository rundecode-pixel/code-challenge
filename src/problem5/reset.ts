// Wipe the database, apply migrations, and seed — `npm run p5:db:reset`.
import 'reflect-metadata';
import 'dotenv/config';
import { AppDataSource } from './data-source.js';
import { runSeed } from './seed.js';

async function main() {
  const ds = await AppDataSource.initialize();
  await ds.query('DROP SCHEMA IF EXISTS public CASCADE');
  await ds.query('CREATE SCHEMA public');
  await ds.destroy();

  const migrated = await AppDataSource.initialize();
  await migrated.runMigrations();
  await runSeed(migrated);
  await migrated.destroy();

  console.log('Reset complete: schema dropped, migrations applied, seed run.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
