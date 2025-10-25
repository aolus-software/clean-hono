import { Context } from "hono";
import { UserInformation } from "../types/UserInformation";
import { ResponseToolkit } from "@toolkit/response";
import { ProfileService } from "../services/profile.service";
import vine from "@vinejs/vine";
import { StrongPassword } from "@default/strong-password";

const ProfileSchema = {
	updateProfileSchema: vine.object({
		name: vine.string().maxLength(255),
		email: vine.string().email(),
	}),

	updatePasswordSchema: vine.object({
		current_password: vine.string(),
		new_password: vine.string().regex(StrongPassword),
	}),
};

const profileService = ProfileService;

export const ProfileHandler = {
	profile: (c: Context) => {
		const userInformation: UserInformation = c.get("currentUser");
		return ResponseToolkit.success(
			c,
			{ user: userInformation },
			"Profile fetched successfully",
			200,
		);
	},

	updateProfile: async (c: Context) => {
		const payload = await c.req.json();
		const validation = await vine.validate({
			data: payload,
			schema: ProfileSchema.updateProfileSchema,
		});

		const userInformation: UserInformation = c.get("currentUser");
		const data: UserInformation = await profileService.updateProfile(
			userInformation,
			validation,
		);

		return ResponseToolkit.success(
			c,
			{
				user: data,
			},
			"Profile updated successfully",
			200,
		);
	},

	updatePassword: async (c: Context) => {
		const payload = await c.req.json();
		const validation = await vine.validate({
			data: payload,
			schema: ProfileSchema.updatePasswordSchema,
		});

		const userInformation: UserInformation = c.get("currentUser");
		await profileService.updatePassword(userInformation, validation);

		return ResponseToolkit.success(c, {}, "Password updated successfully", 200);
	},
};
