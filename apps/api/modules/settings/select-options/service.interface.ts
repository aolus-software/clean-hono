import { PermissionSelectOptions } from "@postgres/repositories";

export interface ISelectOptionsService {
	getPermissionOptions(): Promise<PermissionSelectOptions[]>;
	getRoleOptions(): Promise<{ id: string; name: string }[]>;
}
