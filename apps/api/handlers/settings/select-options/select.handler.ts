import { db } from "infra/postgres/index";
import { ResponseToolkit } from "@toolkit/response";
import { Context } from "hono";
import { RoleRepository } from "@app/api/repositories";

export const SettingSelectHandler = {
	permissions: async (ctx: Context) => {
		const permissions = await db.query.permissions.findMany({
			columns: {
				id: true,
				name: true,
				group: true,
			},
		});

		const groupedPermissions = permissions.reduce(
			(
				acc: Record<string, { id: string; name: string }[]>,
				permission: {
					id: string;
					name: string;
					group: string | null;
				},
			) => {
				const group = permission.group || "Ungrouped";
				if (!acc[group]) acc[group] = [];
				acc[group].push({
					id: permission.id,
					name: permission.name,
				});
				return acc;
			},
			{},
		);

		return ResponseToolkit.success(
			ctx,
			groupedPermissions,
			"Success get permissions grouped by group",
			200,
		);
	},

	roles: async (ctx: Context) => {
		const roles = await RoleRepository().selectOptions();
		return ResponseToolkit.success<{ id: string; name: string }[]>(
			ctx,
			roles,
			"Success get roles grouped by group",
			200,
		);
	},
};
