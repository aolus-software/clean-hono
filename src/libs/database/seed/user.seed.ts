import { db, rolesTable, user_rolesTable, usersTable } from "@database";
import { Hash } from "@utils";
import { eq } from "drizzle-orm";

export const UserSeeder = async () => {
	await db.transaction(async (tx) => {
		await tx.insert(usersTable).values({
			name: "superuser",
			email: "superuser@example.com",
			email_verified_at: new Date(),
			password: await Hash.generateHash("password"),
		});

		await tx.insert(usersTable).values({
			name: "admin",
			email: "admin@example.com",
			email_verified_at: new Date(),
			password: await Hash.generateHash("password"),
		});

		// get created user
		const superUser = await tx
			.select()
			.from(usersTable)
			.where(eq(usersTable.name, "superuser"))
			.limit(1);
		const admin = await tx
			.select()
			.from(usersTable)
			.where(eq(usersTable.name, "admin"))
			.limit(1);

		// assign role
		const superUserRole = await tx
			.select()
			.from(rolesTable)
			.where(eq(rolesTable.name, "superuser"))
			.limit(1);
		const adminRole = await tx
			.select()
			.from(rolesTable)
			.where(eq(rolesTable.name, "admin"))
			.limit(1);

		if (superUserRole[0] && superUser[0]) {
			await tx.insert(user_rolesTable).values({
				userId: superUser[0].id,
				roleId: superUserRole[0].id,
			});
		}

		if (adminRole[0] && admin[0]) {
			await tx.insert(user_rolesTable).values({
				userId: admin[0].id,
				roleId: adminRole[0].id,
			});
		}
	});
};
