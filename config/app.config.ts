import { env } from "./env";

interface IAppConfig {
	APP_NAME: string;
	APP_PORT: number;
	APP_URL: string;
	APP_ENV: "development" | "staging" | "production";
	APP_TIMEZONE: string;
	APP_SECRET: string;
	APP_JWT_SECRET: string;
	APP_JWT_EXPIRES_IN: number;
	LOG_LEVEL: "info" | "warn" | "debug" | "error";
	CLIENT_URL: string;
}

export const AppConfig: IAppConfig = {
	APP_NAME: env.APP_NAME,
	APP_PORT: env.APP_PORT,
	APP_URL: env.APP_URL,
	APP_ENV: env.APP_ENV,
	APP_TIMEZONE: env.APP_TIMEZONE,
	APP_SECRET: env.APP_SECRET,
	APP_JWT_SECRET: env.APP_JWT_SECRET,
	APP_JWT_EXPIRES_IN: env.APP_JWT_EXPIRES_IN,
	LOG_LEVEL: env.LOG_LEVEL,
	CLIENT_URL: env.CLIENT_URL,
};
