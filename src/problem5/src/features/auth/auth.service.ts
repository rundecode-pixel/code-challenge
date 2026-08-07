import bcrypt from 'bcrypt';
import { ApiError } from '../../common/errors.js';
import { issueAccessToken } from '../../config/jwt.js';
import { AppDataSource } from '../../../data-source.js';
import { User } from './user.entity.js';
import type { LoginInput } from './auth.schema.js';

export interface SafeUser {
  id: string;
  email: string;
  name: string;
}

export function toSafeUser(user: User): SafeUser {
  return { id: user.id, email: user.email, name: user.name };
}

// Dummy bcrypt hash of a random password. When the email is unknown we
// still run a real bcrypt compare against this so response time stays
// constant and the endpoint cannot be used to enumerate registered emails.
const DUMMY_HASH =
  '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy';

export async function login(
  input: LoginInput,
): Promise<{ token: string; user: SafeUser }> {
  const repo = AppDataSource.getRepository(User);
  const user = await repo.findOneBy({ email: input.email });
  const hash = user?.passwordHash ?? DUMMY_HASH;
  const passwordOk = await bcrypt.compare(input.password, hash);
  if (!user || !passwordOk) {
    throw ApiError.invalidCredentials();
  }
  return {
    token: issueAccessToken({ sub: user.id, email: user.email }),
    user: toSafeUser(user),
  };
}

export async function findProfileById(id: string): Promise<SafeUser | null> {
  const user = await AppDataSource.getRepository(User).findOneBy({ id });
  return user ? toSafeUser(user) : null;
}
