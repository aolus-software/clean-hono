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
	"password",
	"user.creditCardNumber",
	"headers.authorization",
	"*.sensitiveField",
	"req.headers.authorization",
	"req.headers.api_key",
	"req.headers.apiKey",
	"req.body.password",
	"req.body.token",
	"req.body.secret",
	"req.body.ssn",
	"req.body.creditCard",
	"req.body.pin",
];

const isPlainObject = (v: unknown): v is Record<string, unknown> =>
	v !== null && typeof v === "object" && !Array.isArray(v);

const isTokenLikeString = (val: unknown): boolean => {
	if (typeof val !== "string") return false;
	const s = val.trim();
	if (/^bearer\s+/i.test(s)) return true;
	if (/^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+$/.test(s)) return true;
	if (/^[A-Za-z0-9-_]{32,}$/.test(s)) return true;

	return false;
};

const redactSensitive = (
	obj: unknown,
	sensitiveKeysLower: string[],
): unknown => {
	if (obj === null || typeof obj !== "object") return obj;

	if (Array.isArray(obj)) {
		return obj.map((item) => redactSensitive(item, sensitiveKeysLower));
	}

	const result: Record<string, unknown> = {
		...(obj as Record<string, unknown>),
	};

	for (const key of Object.keys(result)) {
		const value = result[key];
		const keyLower = key.toLowerCase();

		if (
			sensitiveKeysLower.some((k) => keyLower.includes(k)) ||
			isTokenLikeString(value)
		) {
			result[key] = "***REDACTED***";
		} else if (isPlainObject(value) || Array.isArray(value)) {
			result[key] = redactSensitive(value, sensitiveKeysLower);
		} else {
			result[key] = value;
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

	const sensitiveKeysLower = sensitiveKeys.map((k) => k.toLowerCase());

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
			level: (label) => ({ level: String(label).toUpperCase() }),
		},
		timestamp: () => `,"time":"${new Date().toISOString()}"`,
		redact: {
			paths: defaultSensitiveKeys,
			// censor: "***REDACTED***",
			remove: true,
		},
		hooks: {
			logMethod(args, method) {
				if (
					args.length > 0 &&
					typeof args[0] === "object" &&
					args[0] !== null
				) {
					args[0] = redactSensitive(args[0], sensitiveKeysLower);
				}
				return method.apply(this, args);
			},
		},
	});
};
export const logger = createLogger();
