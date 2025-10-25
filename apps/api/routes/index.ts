import { Hono } from "hono";
import { HomeHandler } from "@api/handlers/home.handler";
import settingRoutes from "./setting.routes";
import profileRoutes from "./profile.route";
import authRoutes from "./auth.routes";

const routes = new Hono();

routes.get("/", HomeHandler.getHome);
routes.get("/health", HomeHandler.getHealth);

routes.route("/auth", authRoutes);
routes.route("/settings", settingRoutes);
routes.route("/profile", profileRoutes);

export default routes;
