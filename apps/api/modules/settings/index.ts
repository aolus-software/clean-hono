import { OpenAPIHono } from "@hono/zod-openapi";
import { defaultHook } from "packages/errors";

const SettingsRoutes = new OpenAPIHono({ defaultHook });

export default SettingsRoutes;
