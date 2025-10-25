import { RoleRepository } from "@app/api/repositories";
import { DatatableToolkit } from "@toolkit/datatable";
import { ResponseToolkit } from "@toolkit/response";
import vine from "@vinejs/vine";
import { Context } from "hono";

const RoleSchema = {
	CreatePermissionSchema: vine.object({
		name: vine.string().minLength(2).maxLength(255),
		permission_ids: vine.array(vine.string().minLength(1).uuid()),
	}),
	UpdatePermissionSchema: vine.object({
		name: vine.string().minLength(2).maxLength(255),
		permission_ids: vine.array(vine.string().minLength(1).uuid()),
	}),
};

export const RoleHandler = {
	list: async (ctx: Context) => {
		const queryParam = DatatableToolkit.parseFilter(ctx);
		const datatable = await RoleRepository().findAll(queryParam);

		return ResponseToolkit.success(
			ctx,
			{
				data: datatable.data,
				meta: datatable.meta,
			},
			"Success get role list",
			200,
		);
	},

	create: async (ctx: Context) => {
		const payload = await ctx.req.json();
		const validate = await vine.validate({
			schema: RoleSchema.CreatePermissionSchema,
			data: payload,
		});

		await RoleRepository().create(validate);

		return ResponseToolkit.success(ctx, {}, "Success create new role", 200);
	},

	detail: async (ctx: Context) => {
		const roleId = ctx.req.param("id");
		const role = await RoleRepository().getDetail(roleId);

		return ResponseToolkit.success(ctx, role, "Success get role detail", 200);
	},

	update: async (ctx: Context) => {
		const roleId = ctx.req.param("id");
		const payload = await ctx.req.json();

		const validate = await vine.validate({
			schema: RoleSchema.UpdatePermissionSchema,
			data: payload,
		});

		await RoleRepository().update(roleId, validate);

		return ResponseToolkit.success(ctx, {}, "Success update role", 200);
	},

	delete: async (ctx: Context) => {
		const roleId = ctx.req.param("id");
		await RoleRepository().delete(roleId);

		return ResponseToolkit.success(ctx, {}, "Success delete role", 200);
	},
};
