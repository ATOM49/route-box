import type { FastifyInstance } from "fastify";
import { CreateJobRequestSchema, CreateJobResponseSchema } from "@repo/contracts";
import { prisma } from "@repo/db";
import { Queue } from "bullmq";

interface JobsRouteOptions {
  queue: Queue;
}

export async function jobsRoutes(app: FastifyInstance, opts: JobsRouteOptions): Promise<void> {
  app.post("/jobs", async (request, reply) => {
    const input = CreateJobRequestSchema.safeParse(request.body);
    if (!input.success) {
      return reply.status(400).send({ error: input.error.flatten() });
    }

    const route = await prisma.route.upsert({
      where: { id: input.data.routeId },
      update: {},
      create: { id: input.data.routeId, name: `Route ${input.data.routeId}` },
    });

    const job = await prisma.pathJob.create({
      data: {
        routeId: route.id,
        status: "queued",
        inputJson: input.data,
      },
    });

    await opts.queue.add("route.process", { jobId: job.id, input: input.data });

    const response = CreateJobResponseSchema.parse({ jobId: job.id, status: job.status });
    return reply.status(201).send(response);
  });

  app.get<{ Params: { jobId: string } }>("/jobs/:jobId", async (request, reply) => {
    const { jobId } = request.params;
    const job = await prisma.pathJob.findUnique({
      where: { id: jobId },
      include: { artifacts: true },
    });

    if (!job) {
      return reply.status(404).send({ error: "Job not found" });
    }

    return reply.send({
      jobId: job.id,
      status: job.status,
      createdAt: job.createdAt,
      updatedAt: job.updatedAt,
      outputJson: job.outputJson,
      errorJson: job.errorJson,
      artifacts: job.artifacts,
    });
  });

  app.get("/jobs", async (_request, reply) => {
    const jobs = await prisma.pathJob.findMany({
      orderBy: { createdAt: "desc" },
      take: 50,
      include: { artifacts: { select: { id: true, kind: true, storageKey: true } } },
    });
    return reply.send(jobs);
  });
}
