import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

import * as schema from "./db/schema";

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL is not set. In Vercel, set it under Project Settings → Environment Variables — .env is never deployed.",
  );
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

export const db = drizzle(pool, { schema });
