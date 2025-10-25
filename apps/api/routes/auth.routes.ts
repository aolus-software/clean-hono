import { Hono } from "hono";
import { AuthHandler } from "../handlers/auth.handler";

const authRoutes = new Hono();

authRoutes.post("/login", AuthHandler.login);
authRoutes.post("/register", AuthHandler.register);
authRoutes.post("/verify-email", AuthHandler.verifyEmail);
authRoutes.post("/resent-verification-email", AuthHandler.resendVerification);
authRoutes.post("/forgot-password", AuthHandler.forgotPassword);
authRoutes.post("/reset-password", AuthHandler.resetPassword);

export default authRoutes;
