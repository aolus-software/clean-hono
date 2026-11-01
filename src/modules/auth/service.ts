import {
	db,
	EmailVerificationRepository,
	PasswordResetRepository,
	UserRepository,
	UserStatus,
} from "@database";
import {
	BadRequestError,
	UnauthorizedError,
	UnprocessableEntityError,
} from "@errors";
import { t } from "@i18n";
import { AuthMailService } from "@mail/auth-mail.service";
import {
	currentRefreshTokenId,
	forgetUserInformation,
	revokeSessions,
	storeRefreshTokenId,
} from "@cache";
import { Hash, JWTToolkit, logger } from "@utils";

import type { LoginData, TokenPair } from "./schema";
import type { IAuthService } from "./service.interface";

const TIMING_EQUALISER_HASH =
	"$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy";

export class AuthService implements IAuthService {
	/**
	 * The password is checked before account state, and an unknown address
	 * gets the same answer as a wrong password (compared against a dummy hash
	 * so both paths take as long), so a caller cannot probe which addresses
	 * are registered.
	 */
	async login(email: string, password: string): Promise<LoginData> {
		const user = await UserRepository().findByEmail(email);
		const isPasswordValid = await Hash.compareHash(
			password,
			user?.password ?? TIMING_EQUALISER_HASH,
		);

		if (!user || !isPasswordValid) {
			throw new BadRequestError(t("auth.validationError"), [
				{ field: "email", message: t("auth.invalidCredentials") },
			]);
		}
		if (user.emailVerifiedAt === null) {
			throw new BadRequestError(t("auth.validationError"), [
				{ field: "email", message: t("auth.emailNotVerified") },
			]);
		}
		if (user.status !== UserStatus.ACTIVE) {
			throw new BadRequestError(t("auth.validationError"), [
				{ field: "email", message: t("auth.accountInactive") },
			]);
		}

		const information = await UserRepository().findUserInformation(user.id);
		if (!information) {
			throw new BadRequestError(t("auth.validationError"), [
				{ field: "email", message: t("auth.accountInactive") },
			]);
		}
		await forgetUserInformation([user.id]);

		logger.info({ userId: user.id }, "User logged in");
		return { user: information, ...(await this.issueSession(user.id)) };
	}

	async refresh(refreshToken: string): Promise<TokenPair> {
		const payload = await JWTToolkit.verify(refreshToken, "refresh");
		if (!payload?.jti) {
			throw new UnauthorizedError(t("auth.invalidRefreshToken"));
		}
		if ((await currentRefreshTokenId(payload.id)) !== payload.jti) {
			throw new UnauthorizedError(t("auth.invalidRefreshToken"));
		}

		const user = await UserRepository().findUserInformation(payload.id);
		if (!user) {
			await revokeSessions(payload.id);
			throw new UnauthorizedError(t("auth.invalidRefreshToken"));
		}

		return this.issueSession(user.id);
	}

	async register(data: {
		name: string;
		email: string;
		password: string;
	}): Promise<void> {
		const existing = await UserRepository().findLiveByEmail(data.email);
		if (existing) {
			throw new UnprocessableEntityError(t("auth.validationError"), [
				{ field: "email", message: t("auth.userAlreadyExists") },
			]);
		}

		const user = await UserRepository().create({
			name: data.name,
			email: data.email,
			password: await Hash.generateHash(data.password),
			status: UserStatus.ACTIVE,
			remark: null,
		});

		await AuthMailService.sendVerificationEmail(user);
	}

	async resendVerification(email: string): Promise<void> {
		const user = await UserRepository().findByEmail(email);
		if (!user || user.emailVerifiedAt !== null) {
			return;
		}
		await AuthMailService.sendVerificationEmail(user);
	}

	async verifyEmail(token: string): Promise<void> {
		const record = await EmailVerificationRepository().findByToken(token);
		if (!record || record.usedAt !== null || record.expiresAt < new Date()) {
			throw new BadRequestError(t("auth.validationError"), [
				{ field: "token", message: t("auth.invalidVerificationToken") },
			]);
		}

		await db.transaction(async (tx) => {
			await UserRepository(tx).markEmailVerified(record.userId);
			await EmailVerificationRepository(tx).markAllUsed(record.userId);
		});

		logger.info({ userId: record.userId }, "Email verified");
	}

	async forgotPassword(email: string): Promise<void> {
		const user = await UserRepository().findByEmail(email);
		if (!user) {
			return;
		}
		await AuthMailService.sendResetPasswordEmail(user);
	}

	async resetPassword(token: string, newPassword: string): Promise<void> {
		const record = await PasswordResetRepository().findByToken(token);
		if (!record || record.usedAt !== null || record.expiresAt < new Date()) {
			throw new BadRequestError(t("auth.validationError"), [
				{ field: "token", message: t("auth.invalidResetPasswordToken") },
			]);
		}

		const hashedPassword = await Hash.generateHash(newPassword);
		await db.transaction(async (tx) => {
			await UserRepository(tx).updatePassword(record.userId, hashedPassword);
			await PasswordResetRepository(tx).markAllUsed(record.userId);
		});
		await revokeSessions(record.userId);

		logger.info({ userId: record.userId }, "Password reset");
	}

	/**
	 * Issues an access/refresh pair and stores the refresh token's id, which
	 * replaces the previous one: only the newest refresh token can be used.
	 */
	private async issueSession(userId: string): Promise<TokenPair> {
		const pair = await JWTToolkit.issuePair(userId);
		await storeRefreshTokenId(
			userId,
			pair.refreshTokenId,
			pair.refreshExpiresInSeconds,
		);
		return { accessToken: pair.accessToken, refreshToken: pair.refreshToken };
	}
}
