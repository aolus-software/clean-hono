import { Hono } from "hono";
import { authMiddleware } from "../middlewares";
import { PermissionHandler } from "../handlers/settings/permisison.handler";

const settingRoutes = new Hono();

settingRoutes.use(authMiddleware);
settingRoutes.get("/permission", PermissionHandler.list);
settingRoutes.post("/permission", PermissionHandler.create);
settingRoutes.get("/permission/:id", PermissionHandler.detail);
settingRoutes.put("/permission/:id", PermissionHandler.update);
settingRoutes.delete("/permission/:id", PermissionHandler.delete);

export default settingRoutes;
