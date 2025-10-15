import { Context } from "hono";

export const HomeHandler = {
	getHome: (c: Context) => {
		return c.json({
			status: "ok",
			message: "Welcome to the Hono API Service",
			timestamp: new Date().toISOString(),
		});
	},

	getHealth: (c: Context) => {
		return c.json({
			status: "ok",
			message: "Service is healthy",
			timestamp: new Date().toISOString(),
		});
	},
};
