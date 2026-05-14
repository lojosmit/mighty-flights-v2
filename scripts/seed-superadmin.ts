// Run once: npx tsx scripts/seed-superadmin.ts
import { config } from "dotenv";
config({ path: ".env.local" });

import bcrypt from "bcryptjs";
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import * as schema from "../lib/db/schema";
import { eq } from "drizzle-orm";

const sql = postgres(process.env.DATABASE_URL!, { max: 1, ssl: "require" });
const db = drizzle(sql, { schema });

const EMAIL = "smitwikus@gmail.com";
const PASSWORD = "ChangeMe123!"; // change after first login via /admin

async function main() {
  const existing = await db
    .select()
    .from(schema.users)
    .where(eq(schema.users.email, EMAIL));

  if (existing.length > 0) {
    console.log(`Super-admin already exists: ${EMAIL}`);
    await sql.end();
    return;
  }

  const passwordHash = await bcrypt.hash(PASSWORD, 12);
  const [user] = await db
    .insert(schema.users)
    .values({
      email: EMAIL,
      passwordHash,
      name: "Admin",
      role: "super_admin",
      clubId: undefined,
    })
    .returning();

  console.log(`Created super-admin: ${user.email}`);
  console.log(`Temporary password: ${PASSWORD}`);
  console.log(`Change it at /admin after first login.`);
  await sql.end();
}

main().catch((e) => { console.error(e); process.exit(1); });
