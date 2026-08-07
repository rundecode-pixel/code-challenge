import bcrypt from 'bcrypt';
import { pathToFileURL } from 'node:url';
import type { DataSource } from 'typeorm';
import { AppDataSource } from './data-source.js';
import { User } from './src/features/auth/user.entity.js';
import { Cue } from './src/features/cues/cue.entity.js';

export async function runSeed(ds: DataSource): Promise<void> {
  const passwordHash = await bcrypt.hash('P@ssword123', 10);
  const users = ds.getRepository(User);
  const cues = ds.getRepository(Cue);

  const demo = await users.save(
    users.create({ email: 'demo@example.com', name: 'Demo User', passwordHash }),
  );
  await users.save(
    users.create({ email: 'alice@example.com', name: 'Alice', passwordHash }),
  );
  await users.save(
    users.create({ email: 'bob@example.com', name: 'Bob', passwordHash }),
  );

  // Make the seed idempotent by clearing demo's cues first.
  await cues.delete({ createdById: demo.id });

  await cues.save([
    cues.create({
      brand: 'Predator',
      model: 'P3',
      material: 'carbon',
      tipSizeMm: 12.4,
      weightOz: 19.0,
      lengthIn: 58,
      priceUsd: 899.99,
      condition: 'new',
      status: 'available',
      createdById: demo.id,
    }),
    cues.create({
      brand: 'McDermott',
      model: 'G-Series G233',
      material: 'maple',
      tipSizeMm: 13.0,
      weightOz: 19.0,
      lengthIn: 58,
      priceUsd: 459.0,
      condition: 'new',
      status: 'available',
      createdById: demo.id,
    }),
    cues.create({
      brand: 'Viking',
      model: 'VK50',
      material: 'ash',
      tipSizeMm: 13.0,
      weightOz: 18.5,
      lengthIn: 58,
      priceUsd: 299.0,
      condition: 'used',
      status: 'available',
      createdById: demo.id,
    }),
    cues.create({
      brand: 'Lucasi',
      model: 'LZ03',
      material: 'maple',
      tipSizeMm: 12.75,
      weightOz: 19.0,
      lengthIn: 58,
      priceUsd: 379.0,
      condition: 'used',
      status: 'reserved',
      createdById: demo.id,
    }),
    cues.create({
      brand: 'Cuetec',
      model: 'Cynergy',
      material: 'carbon',
      tipSizeMm: 11.75,
      weightOz: 18.0,
      lengthIn: 58,
      priceUsd: 549.0,
      condition: 'new',
      status: 'in_restoration',
      createdById: demo.id,
    }),
  ]);

  console.log('Seeded:');
  console.log('  - demo@example.com / P@ssword123   (the reviewer login)');
  console.log('  - alice@example.com / P@ssword123  (can log in like any user)');
  console.log('  - bob@example.com   / P@ssword123  (can log in like any user)');
  console.log('  - 5 cues for demo user (mix of brands, materials, statuses)');
}

async function main() {
  const ds = await AppDataSource.initialize();
  await runSeed(ds);
  await ds.destroy();
}

// Runs only when this file is executed directly (npm run p5:db:seed).
// When imported by reset.ts the seed is driven by runSeed() instead.
if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
