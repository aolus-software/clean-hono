import {
	email_verificationsRelations,
	email_verificationsTable,
} from "./email_verification";
import {
	password_reset_tokensRelations,
	password_reset_tokensTable,
} from "./password_reset_token";
import {
	permissionsRelations,
	permissionsTable,
	role_permissionsRelations,
	role_permissionsTable,
	rolesRelations,
	rolesTable,
	user_rolesRelations,
	user_rolesTable,
} from "./rbac";
import { usersRelations, usersTable, userStatusEnum } from "./user";

// Schema object for Drizzle
export const schema = {
	// Tables
	users: usersTable,
	roles: rolesTable,
	permissions: permissionsTable,
	role_permissions: role_permissionsTable,
	user_roles: user_rolesTable,
	email_verifications: email_verificationsTable,
	password_reset_tokens: password_reset_tokensTable,

	// Relations
	usersRelations,
	rolesRelations,
	permissionsRelations,
	role_permissionsRelations,
	user_rolesRelations,
	email_verificationsRelations,
	password_reset_tokensRelations,
};

// Export all tables
export {
	usersTable,
	rolesTable,
	permissionsTable,
	role_permissionsTable,
	user_rolesTable,
	email_verificationsTable,
	password_reset_tokensTable,
};

// Export relations
export {
	usersRelations,
	rolesRelations,
	permissionsRelations,
	role_permissionsRelations,
	user_rolesRelations,
	email_verificationsRelations,
	password_reset_tokensRelations,
};

export { userStatusEnum };
export type { UserStatusEnum } from "./user";

// Export types from rbac
export type {
	Role,
	Permission,
	RolePermission,
	UserRole,
	InsertRole,
	InsertPermission,
	InsertRolePermission,
	InsertUserRole,
} from "./rbac";

// Export types from user
export type User = typeof usersTable.$inferSelect;
export type InsertUser = typeof usersTable.$inferInsert;

// Export types from password_reset_token
export type PasswordResetToken = typeof password_reset_tokensTable.$inferSelect;
export type InsertPasswordResetToken =
	typeof password_reset_tokensTable.$inferInsert;

// Export types from email_verification
export type EmailVerification = typeof email_verificationsTable.$inferSelect;
export type InsertEmailVerification =
	typeof email_verificationsTable.$inferInsert;
