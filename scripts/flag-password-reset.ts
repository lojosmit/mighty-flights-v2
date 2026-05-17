import { config } from "dotenv";
config({ path: ".env.local" });

import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { ne } from "drizzle-orm";
import * as schema from "../lib/db/schema";

const sql = postgres(process.env.DATABASE_URL!, { max: 1, ssl: "require" });
const db = drizzle(sql, { schema });
const { users } = schema;

const result = await db
  .update(users)
  .set({ mustResetPassword: true })
  .where(ne(users.role, "super_admin"))
  .returning({ id: users.id, name: users.name, email: users.email });

console.log(`Flagged ${result.length} user(s) for first-login password reset:`);
result.forEach((u) => console.log(`  ${u.name} <${u.email}>`));
process.exit(0);
