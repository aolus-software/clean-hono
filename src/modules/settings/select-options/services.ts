import {
	PermissionRepository,
	PermissionSelectOptions,
	RoleRepository,
} from "@database";
import { ISelectOptionsService } from "./service.interface";

export class SelectOptionsService implements ISelectOptionsService {
	async getPermissionOptions(): Promise<PermissionSelectOptions[]> {
		return await PermissionRepository().selectOptions();
	}

	async getRoleOptions(): Promise<{ id: string; name: string }[]> {
		return await RoleRepository().selectOptions();
	}
}
