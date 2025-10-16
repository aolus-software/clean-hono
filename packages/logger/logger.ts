import pino from "pino";

interface LoggerOptions {
	level?: string;
	destination?: string;
	sensitiveKeys?: string[];
}

const defaultSensitiveKeys = [
	"password",
	"password_confirmation",
	"passwordConfirmation",
	"token",
	"bearer",
	"authorization",
	"api_key",
	"apiKey",
	"secret",
	"credit_card",
	"creditCard",
	"ssn",
	"pin",
];

const redactSensitive = (obj: any, sensitiveKeys: string[]): any => {
	if (typeof obj !== "object" || obj === null) return obj;

	const result = Array.isArray(obj) ? [...obj] : { ...obj };

	for (const key in result) {
		if (sensitiveKeys.some((k) => key.toLowerCase().includes(k))) {
			result[key] = "***REDACTED***";
		} else if (typeof result[key] === "object") {
			result[key] = redactSensitive(result[key], sensitiveKeys);
		}
	}
	return result;
};

export const createLogger = (options: LoggerOptions = {}) => {
	const {
		level = "info",
		destination = "./storage/logs/app.log",
		sensitiveKeys = defaultSensitiveKeys,
	} = options;

	return pino({
		level,
		transport: {
			target: "pino/file",
			options: {
				destination,
				mkdir: true,
			},
		},
		formatters: {
			level: (label) => {
				return { level: label.toUpperCase() };
			},
			log: (object) => {
				const sanitized = { ...object };
				return redactSensitive(sanitized, sensitiveKeys);
			},
		},
		timestamp: () => `,"time":"${new Date().toISOString()}"`,
	});
};

export const logger = createLogger();
