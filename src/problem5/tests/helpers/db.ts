import { AppDataSource } from '../../data-source.js';
import { User } from '../../src/features/auth/user.entity.js';

const SEED_HINT = 'Run `npm run p5:db:reset` first.';

export async function ensureDemoUser() {
  if (!AppDataSource.isInitialized) {
    await AppDataSource.initialize();
  }
  const user = await AppDataSource.getRepository(User).findOneBy({
    email: 'demo@example.com',
  });
  if (!user) {
    throw new Error(`Demo user not found. ${SEED_HINT}`);
  }
  return user;
}

export const disconnect = () =>
  AppDataSource.isInitialized ? AppDataSource.destroy() : Promise.resolve();
