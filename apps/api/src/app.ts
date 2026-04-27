import Fastify from "fastify";
import { jobsRoutes } from "./routes/jobs.js";
import { Queue } from "bullmq";
import { Redis } from "ioredis";

export async function buildApp(redisUrl: string) {
  const app = Fastify({ logger: false });

  const connection = new Redis(redisUrl, { maxRetriesPerRequest: null });

  const queue = new Queue("route-pipeline", { connection });

  await app.register(
    async (fastify) => {
      await jobsRoutes(fastify, { queue });
    },
    { prefix: "/api/v1" },
  );

  app.get("/health", async () => ({ status: "ok" }));

  return { app, queue };
}
