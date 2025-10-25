// c{ Context } from "@app/apis/types/elysia";
import { PermissionRepository } from "@app/api/repositories";
import { DatatableToolkit } from "@toolkit/datatable";
import { ResponseToolkit } from "@toolkit/response";
import vine from "@vinejs/vine";
import { Context } from "hono";

const PermissionSchema = {
	CreatePermissionSchema: vine.object({
		name: vine.array(vine.string().minLength(2).maxLength(100)),
		group: vine.string().minLength(2).maxLength(100),
	}),
	UpdatePermissionSchema: vine.object({
		name: vine.string().minLength(2).maxLength(100),
		group: vine.string().minLength(2).maxLength(100),
	}),
};

export const PermissionHandler = {
	list: async (c: Context) => {
		const queryParam = DatatableToolkit.parseFilter(c);
		const datatable = await PermissionRepository().findAll(queryParam);

		return ResponseToolkit.success(
			c,
			{
				data: datatable.data,
				meta: datatable.meta,
			},
			"Permission list retrieved successfully",
			200,
		);
	},

	create: async (c: Context) => {
		const payload = await c.req.json();
		const validate = await vine.validate({
			schema: PermissionSchema.CreatePermissionSchema,
			data: payload,
		});

		await PermissionRepository().create({
			name: validate.name,
			group: validate.group,
		});

		return ResponseToolkit.success(
			c,
			{},
			`Success create permission group ${validate.group}`,
			201,
		);
	},

	detail: async (c: Context) => {
		const permissionId = c.req.param("id");
		const permission = await PermissionRepository().getDetail(permissionId);

		return ResponseToolkit.success(
			c,
			{ ...permission },
			"Permission retrieved successfully",
			200,
		);
	},

	update: async (c: Context) => {
		const permissionId = c.req.param("id");
		const payload = await c.req.json();
		const validate = await vine.validate({
			schema: PermissionSchema.UpdatePermissionSchema,
			data: payload,
		});

		await PermissionRepository().update(permissionId, {
			name: validate.name,
			group: validate.group,
		});

		return ResponseToolkit.success(
			c,
			{},
			`Success update permission ${validate.name}`,
			200,
		);
	},

	delete: async (c: Context) => {
		const permissionId = c.req.param("id");
		await PermissionRepository().delete(permissionId);

		return ResponseToolkit.success(c, {}, `Success delete permission`, 200);
	},
};
