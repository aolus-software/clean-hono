import { Hono } from "hono";
import { HomeHandler } from "@api/handlers/home.handler";

const routes = new Hono();

routes.get("/", HomeHandler.getHome);
routes.get("/health", HomeHandler.getHealth);

export default routes;
