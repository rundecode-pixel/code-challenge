// Boot script. config/env validates the environment as a side effect of
// being imported, so a misconfigured start fails here rather than later.
import { env } from './config/env.js';
import { connectDb } from './common/db.js';
import { createApp } from './app.js';

const app = createApp();

await connectDb();

app.listen(env.PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`[problem5] listening on http://localhost:${env.PORT}`);
});
