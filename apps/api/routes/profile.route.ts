import { Hono } from "hono";
import { ProfileHandler } from "../handlers/profile.handler";
import { authMiddleware } from "../middlewares";

const profileRoutes = new Hono();

profileRoutes.use(authMiddleware);
profileRoutes.get("/", ProfileHandler.profile);
profileRoutes.patch("/", ProfileHandler.updateProfile);
profileRoutes.patch("/password", ProfileHandler.updatePassword);

export default profileRoutes;
