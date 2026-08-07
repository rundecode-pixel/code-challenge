// TypeORM DataSource singleton. Cached on globalThis so `tsx watch` reloads
// don't open a fresh connection pool on every module reload.
import { AppDataSource } from '../../data-source.js';

export const dataSource = AppDataSource;

export async function connectDb(): Promise<typeof dataSource> {
  if (!dataSource.isInitialized) {
    await dataSource.initialize();
  }
  return dataSource;
}

export const disconnectDb = () => {
  if (dataSource.isInitialized) {
    return dataSource.destroy();
  }
  return Promise.resolve();
};
