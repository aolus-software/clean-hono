import { AuthService } from "./modules/auth/service";
import { UserService } from "./modules/settings/users/services";
import { RoleService } from "./modules/settings/roles/services";
import { PermissionService } from "./modules/settings/permissions/services";
import { ProfileService } from "./modules/profile/service";
import { SelectOptionsService } from "./modules/settings/select-options/services";
import { container } from "@hono-libs";

/**
 * Bootstrap the application by registering all services in the DI container
 * This should be called once at application startup
 */
export const bootstrap = () => {
	// Register services
	container.register("authService", () => new AuthService());
	container.register("userService", () => new UserService());
	container.register("roleService", () => new RoleService());
	container.register("permissionService", () => new PermissionService());
	container.register("profileService", () => new ProfileService());
	container.register(
		"settingSelectOptionsService",
		() => new SelectOptionsService(),
	);
};
