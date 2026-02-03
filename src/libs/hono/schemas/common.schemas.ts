import { StrongPassword } from "@default";
import { z } from "zod";

/**
 * Common reusable Zod schemas for consistent validation across the application
 */

// ============================================================
// Basic Field Schemas
// ============================================================

export const EmailSchema = z.string().email().max(255);

export const PasswordSchema = z.string().min(8).max(128);

export const StrongPasswordSchema = z.string().regex(StrongPassword, {
	message:
		"Password must contain at least 8 characters, one uppercase, one lowercase, one number and one special character",
});

export const UUIDSchema = z.string().uuid();

export const NameSchema = z.string().min(1).max(255);

export const OptionalRemarksSchema = z.string().max(500).optional();

// ============================================================
// Pagination & Sorting Schemas
// ============================================================

export const PaginationQuerySchema = z.object({
	page: z.coerce.number().int().positive().default(1),
	limit: z.coerce.number().int().positive().max(100).default(10),
});

export const SortQuerySchema = z.object({
	sortBy: z.string().optional(),
	sortOrder: z.enum(["asc", "desc"]).default("asc"),
});

export const PaginatedQuerySchema =
	PaginationQuerySchema.merge(SortQuerySchema);

// ============================================================
// Common Param Schemas
// ============================================================

export const UUIDParamSchema = z.object({
	id: UUIDSchema,
});

export const SlugParamSchema = z.object({
	slug: z.string().min(1).max(255),
});

// ============================================================
// Date/Time Schemas
// ============================================================

export const DateSchema = z.coerce.date();

export const DateRangeSchema = z.object({
	startDate: DateSchema.optional(),
	endDate: DateSchema.optional(),
});

// ============================================================
// Status Schemas
// ============================================================

export const UserStatusSchema = z.enum([
	"active",
	"inactive",
	"suspended",
	"blocked",
]);

export const BooleanQuerySchema = z
	.enum(["true", "false"])
	.transform((val) => val === "true");

// ============================================================
// Search & Filter Schemas
// ============================================================

export const SearchQuerySchema = z.object({
	q: z.string().min(1).optional(),
	search: z.string().min(1).optional(),
});

export const FilterQuerySchema = PaginatedQuerySchema.merge(SearchQuerySchema);

// ============================================================
// File Upload Schemas
// ============================================================

export const FileUploadSchema = z.object({
	filename: z.string(),
	mimetype: z.string(),
	size: z.number().positive(),
});

// ============================================================
// Token Schemas
// ============================================================

export const TokenSchema = z.string().min(1);

export const RefreshTokenSchema = z.object({
	refreshToken: TokenSchema,
});

// ============================================================
// Utility Schemas
// ============================================================

/**
 * Schema for confirming passwords match
 */
export const PasswordConfirmationSchema = z
	.object({
		password: StrongPasswordSchema,
		password_confirmation: z.string(),
	})
	.refine((data) => data.password === data.password_confirmation, {
		message: "Passwords do not match",
		path: ["password_confirmation"],
	});

/**
 * Schema for bulk operations
 */
export const BulkIdSchema = z.object({
	ids: z.array(UUIDSchema).min(1).max(100),
});

/**
 * Schema for soft delete/restore
 */
export const SoftDeleteQuerySchema = z.object({
	force: BooleanQuerySchema.optional(),
});
