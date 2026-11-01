import { and, eq, isNull } from "drizzle-orm";

import { db } from "../client";
import { password_reset_tokensTable } from "../schema";
import type { DbTransaction } from ".";

export type PasswordResetTokenRow = {
	id: string;
	userId: string;
	expiresAt: Date;
	usedAt: Date | null;
};

export function PasswordResetRepository(tx?: DbTransaction) {
	const dbClient = tx || db;

	return {
		async findByToken(token: string): Promise<PasswordResetTokenRow | null> {
			const [row] = await dbClient
				.select({
					id: password_reset_tokensTable.id,
					userId: password_reset_tokensTable.user_id,
					expiresAt: password_reset_tokensTable.expired_at,
					usedAt: password_reset_tokensTable.used_at,
				})
				.from(password_reset_tokensTable)
				.where(eq(password_reset_tokensTable.token, token))
				.limit(1);
			return row ?? null;
		},

		async create(
			userId: string,
			token: string,
			expiresAt: Date,
		): Promise<void> {
			await dbClient
				.insert(password_reset_tokensTable)
				.values({ user_id: userId, token, expired_at: expiresAt });
		},

		async markAllUsed(userId: string): Promise<void> {
			await dbClient
				.update(password_reset_tokensTable)
				.set({ used_at: new Date() })
				.where(
					and(
						eq(password_reset_tokensTable.user_id, userId),
						isNull(password_reset_tokensTable.used_at),
					),
				);
		},
	};
}
