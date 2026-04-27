import { parseApiEnv } from "@repo/config";
import { buildApp } from "./app.js";
import { createLogger } from "@repo/observability";

const env = parseApiEnv();
const logger = createLogger("api", env.LOG_LEVEL);

const { app } = await buildApp(env.REDIS_URL);

await app.listen({ port: env.PORT, host: "0.0.0.0" });
logger.info(`API listening on port ${env.PORT}`);
