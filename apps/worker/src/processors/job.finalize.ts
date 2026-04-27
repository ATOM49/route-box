import type { Job } from "bullmq";
import { prisma } from "@repo/db";
import { createLogger } from "@repo/observability";

const logger = createLogger("worker:job.finalize");

export interface JobFinalizeData {
  jobId: string;
}

export async function finalizeJob(job: Job<JobFinalizeData>): Promise<void> {
  const { jobId } = job.data;

  logger.info("Finalizing job", { jobId });

  await prisma.pathJob.update({
    where: { id: jobId },
    data: {
      status: "completed",
      outputJson: { completedAt: new Date().toISOString() },
    },
  });

  logger.info("Job finalized", { jobId });
}
