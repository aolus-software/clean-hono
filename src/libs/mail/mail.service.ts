import fs from "fs";
import path from "path";
import { transporter } from "./transport.mail";
import { AppConfig, MailConfig } from "@config";
import { logger } from "@utils";
import { DEFAULT_LOCALE, type Locale } from "@i18n";

export interface EmailOptions {
	to: string;
	subject: string;
	template?: string;
	variables?: Record<string, string>;
	html?: string;
	text?: string;
	lang?: Locale;
}

const resolveTemplatePath = (template: string, lang?: Locale): string => {
	const baseDir = path.join(__dirname, "templates");
	if (lang && lang !== DEFAULT_LOCALE) {
		const localized = path.join(baseDir, `${template}.${lang}.html`);
		if (fs.existsSync(localized)) return localized;
	}
	return path.join(baseDir, `${template}.html`);
};

export const EmailService = {
	async sendEmail(options: EmailOptions) {
		let htmlContent = options.html;

		if (options.template) {
			try {
				const templatePath = resolveTemplatePath(
					options.template,
					options.lang,
				);
				htmlContent = fs.readFileSync(templatePath, "utf-8");

				if (options.variables) {
					Object.entries(options.variables).forEach(([key, value]) => {
						htmlContent = htmlContent?.replace(
							new RegExp(`{{${key}}}`, "g"),
							value,
						);
					});
				}
			} catch (error) {
				throw new Error("Error when parsing the template file", {
					cause: error,
				});
			}
		}

		if (AppConfig.APP_ENV !== "production") {
			options.subject = `[${AppConfig.APP_ENV.toUpperCase()}] ${options.subject}`;
		}

		const mailOptions = {
			from: MailConfig.from || "noreply@yourapp.com",
			to: options.to,
			subject: options.subject,
			html: htmlContent,
			text: options.text,
		};

		logger.info(
			`Sending email to ${options.to} with subject "${options.subject}"`,
		);

		return await transporter
			.sendMail({
				...mailOptions,
			})
			.then(() => {
				logger.info(
					`Email sent to ${options.to} with subject "${options.subject}"`,
				);
			})
			.catch((error) => {
				logger.error(`Failed to send email to ${options.to}:`);
				throw new Error("Failed to send email", {
					cause: error,
				});
			});
	},
};
