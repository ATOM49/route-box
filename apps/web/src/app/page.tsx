import Link from "next/link";

export default function HomePage() {
  return (
    <main>
      <h1>Route Box</h1>
      <p>Generate map imagery for your routes.</p>
      <nav>
        <Link href="/jobs/new">Create New Job</Link>
        {" | "}
        <Link href="/jobs">View Jobs</Link>
      </nav>
    </main>
  );
}
