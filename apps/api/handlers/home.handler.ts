import { ResponseToolkit } from "@toolkit/response";
import { AppConfig } from "config/app.config";
import { Context } from "hono";

export const HomeHandler = {
	getHome: (c: Context) => {
		return ResponseToolkit.success(
			c,
			{
				app: AppConfig.APP_NAME,
			},
			"Welcome to the API",
			200,
		);
	},

	getHealth: (c: Context) => {
		return ResponseToolkit.success(
			c,
			{
				status: "ok",
				message: "Service is healthy",
				timestamp: new Date().toISOString(),
			},
			"Service is healthy",
			200,
		);
	},
};
