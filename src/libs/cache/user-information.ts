import { Cache } from "./cache";
import { RefreshTokenCacheKey, UserInformationCacheKey } from "./const";

export const USER_INFORMATION_TTL_SECONDS = 3600;

/**
 * Drops cached identities so the next request re-reads status, roles and
 * permissions from the database.
 */
export const forgetUserInformation = async (
	userIds: string[],
): Promise<void> => {
	await Promise.all(
		userIds.map((userId) => Cache.delete(UserInformationCacheKey(userId))),
	);
};

/**
 * One refresh-token id (jti) per user. Issuing a pair overwrites it, so the
 * previous refresh token stops working; revoking deletes it.
 */
export const storeRefreshTokenId = async (
	userId: string,
	jti: string,
	ttlSeconds: number,
): Promise<void> => {
	await Cache.set(RefreshTokenCacheKey(userId), jti, ttlSeconds);
};

export const currentRefreshTokenId = async (
	userId: string,
): Promise<string | null> => Cache.get<string>(RefreshTokenCacheKey(userId));

/**
 * Ends every session of the user: the refresh token can no longer be used
 * and the cached identity is re-read on the next request.
 */
export const revokeSessions = async (userId: string): Promise<void> => {
	await Promise.all([
		Cache.delete(UserInformationCacheKey(userId)),
		Cache.delete(RefreshTokenCacheKey(userId)),
	]);
};
