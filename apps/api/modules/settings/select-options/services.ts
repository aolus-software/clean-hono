import { PermissionRepository, RoleRepository } from "@postgres/repositories";

export class SelectOptionsService {
	async getPermissionOptions() {
		return PermissionRepository().selectOptions();
	}

	async getRoleOptions() {
		return RoleRepository().selectOptions();
	}
}
