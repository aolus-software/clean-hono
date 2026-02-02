import { container } from "@packages/core";
import type { MiddlewareHandler } from "hono";
import type { Env } from "@app/api/types/app.types";
import type { IAuthService } from "@app/api/modules/auth/service.interface";
import type { IProfileService } from "@app/api/modules/profile/service.interface";
import type { IUserService } from "@app/api/modules/settings/users/service.interface";
import type { IRoleService } from "@app/api/modules/settings/roles/service.interface";
import type { IPermissionService } from "@app/api/modules/settings/permissions/service.interface";
import { ISelectOptionsService } from "@app/api/modules/settings/select-options/service.interface";

/**
 * Dependency Injection middleware
 * Injects all registered services into the Hono context
 */
export const diMiddleware: MiddlewareHandler<Env> = async (c, next) => {
	// Inject services from the container into the context
	c.set("authService", container.resolve<IAuthService>("authService"));
	c.set("userService", container.resolve<IUserService>("userService"));
	c.set("roleService", container.resolve<IRoleService>("roleService"));
	c.set(
		"settingSelectOption",
		container.resolve<ISelectOptionsService>("settingSelectOptionsService"),
	);
	c.set(
		"permissionService",
		container.resolve<IPermissionService>("permissionService"),
	);
	c.set("profileService", container.resolve<IProfileService>("profileService"));

	await next();
};
