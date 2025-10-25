import { Hono } from "hono";
import { authMiddleware } from "../middlewares";
import { PermissionHandler } from "../handlers/settings/permission.handler";
import { SettingSelectHandler } from "../handlers/settings/select-options/select.handler";
import { RoleHandler } from "../handlers/settings/role.handler";
import { UserHandler } from "../handlers/settings/user.handler";

const settingRoutes = new Hono();

settingRoutes.use(authMiddleware);

settingRoutes.get("/select/permission", SettingSelectHandler.permissions);
settingRoutes.get("/select/role", SettingSelectHandler.roles);

settingRoutes.get("/permission", PermissionHandler.list);
settingRoutes.post("/permission", PermissionHandler.create);
settingRoutes.get("/permission/:id", PermissionHandler.detail);
settingRoutes.put("/permission/:id", PermissionHandler.update);
settingRoutes.delete("/permission/:id", PermissionHandler.delete);

settingRoutes.get("/role", RoleHandler.list);
settingRoutes.post("/role", RoleHandler.create);
settingRoutes.get("/role/:id", RoleHandler.detail);
settingRoutes.put("/role/:id", RoleHandler.update);
settingRoutes.delete("/role/:id", RoleHandler.delete);

settingRoutes.get("/user", UserHandler.list);
settingRoutes.post("/user", UserHandler.create);
settingRoutes.get("/user/:id", UserHandler.detail);
settingRoutes.put("/user/:id", UserHandler.update);
settingRoutes.delete("/user/:id", UserHandler.delete);
settingRoutes.post("/user/:id/reset-password", UserHandler.resetPassword);

export default settingRoutes;
