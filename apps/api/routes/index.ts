import { Hono } from "hono";
import { HomeHandler } from "@api/handlers/home.handler";
import { AuthHandler } from "@api/handlers/auth.handler";
import { authMiddleware } from "../middlewares/auth.middleware";
import { ProfileHandler } from "../handlers/profile.handler";

const routes = new Hono();

routes.get("/", HomeHandler.getHome);
routes.get("/health", HomeHandler.getHealth);

routes.post("/auth/login", AuthHandler.login);
routes.post("/auth/register", AuthHandler.register);
routes.post("/auth/verify-email", AuthHandler.verifyEmail);
routes.post("/auth/forgot-password", AuthHandler.forgotPassword);
routes.post("/auth/reset-password", AuthHandler.resetPassword);

routes.use("*", authMiddleware);

routes.get("/profile", ProfileHandler.profile);
routes.patch("/profile", ProfileHandler.updateProfile);
routes.patch("/profile/password", ProfileHandler.updatePassword);

export default routes;
