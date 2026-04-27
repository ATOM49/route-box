interface JobDetailPageProps {
  params: Promise<{ jobId: string }>;
}

export default async function JobDetailPage({ params }: JobDetailPageProps) {
  const { jobId } = await params;

  return (
    <main>
      <h1>Job {jobId}</h1>
      <p>Job details will appear here once the API is connected.</p>
      <a href="/jobs">← Back to Jobs</a>
    </main>
  );
}
