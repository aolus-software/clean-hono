import { and, eq, isNull } from "drizzle-orm";

import { db } from "../client";
import { email_verificationsTable } from "../schema";
import type { DbTransaction } from ".";

export type EmailVerificationToken = {
	id: string;
	userId: string;
	expiresAt: Date;
	usedAt: Date | null;
};

export function EmailVerificationRepository(tx?: DbTransaction) {
	const dbClient = tx || db;

	return {
		async findByToken(token: string): Promise<EmailVerificationToken | null> {
			const [row] = await dbClient
				.select({
					id: email_verificationsTable.id,
					userId: email_verificationsTable.user_id,
					expiresAt: email_verificationsTable.expired_at,
					usedAt: email_verificationsTable.used_at,
				})
				.from(email_verificationsTable)
				.where(eq(email_verificationsTable.token, token))
				.limit(1);
			return row ?? null;
		},

		async create(
			userId: string,
			token: string,
			expiresAt: Date,
		): Promise<void> {
			await dbClient
				.insert(email_verificationsTable)
				.values({ user_id: userId, token, expired_at: expiresAt });
		},

		async markAllUsed(userId: string): Promise<void> {
			await dbClient
				.update(email_verificationsTable)
				.set({ used_at: new Date() })
				.where(
					and(
						eq(email_verificationsTable.user_id, userId),
						isNull(email_verificationsTable.used_at),
					),
				);
		},
	};
}
