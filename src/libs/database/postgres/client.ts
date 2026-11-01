import { DatabaseConfig } from "@config";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

import { schema } from "./schema";

const client = new Pool({ connectionString: DatabaseConfig.DATABASE_URL });
const db = drizzle(client, { schema });

export { client, db };
