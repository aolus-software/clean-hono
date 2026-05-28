import { Queue } from "bullmq";
import { RedisClient } from "@database";

export const sendEmailQueue = new Queue("send-email", {
	connection: RedisClient.getQueueConnection(),
});
