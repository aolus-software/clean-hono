import type { ExtractTablesWithRelations } from "drizzle-orm";
import type { NodePgQueryResultHKT } from "drizzle-orm/node-postgres";
import type { PgTransaction } from "drizzle-orm/pg-core";

import type { schema } from "../schema";

export * from "./email-verification.repository";
export * from "./password-reset.repository";
export * from "./permission.repository";
export * from "./role.repository";
export * from "./user.repository";

export type DbTransaction = PgTransaction<
	NodePgQueryResultHKT,
	typeof schema,
	ExtractTablesWithRelations<typeof schema>
>;
