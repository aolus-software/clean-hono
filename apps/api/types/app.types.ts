import { UserInformation } from "@packages/*";
import { Hono } from "hono";

/**
 * Define variables that can be stored in the Hono context
 * These will be available via c.get() and c.set()
 */
export type Variables = {
	currentUser: UserInformation;
};

/**
 * Environment type for Hono app
 * This defines the shape of the context environment
 */
export type Env = {
	Variables: Variables;
};

/**
 * Type-safe Hono app type
 * Use this instead of plain Hono when creating app instances
 */
export type AppType = Hono<Env>;
