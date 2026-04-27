"use client";

import { useState } from "react";

export default function NewJobPage() {
  const [routeId, setRouteId] = useState("");
  const [stepMeters, setStepMeters] = useState(10);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ jobId: string; status: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const apiUrl = process.env["NEXT_PUBLIC_API_BASE_URL"] ?? "http://localhost:3001";
      const res = await fetch(`${apiUrl}/api/v1/jobs`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          routeId: routeId || crypto.randomUUID(),
          coordinates: [
            [-0.1278, 51.5074],
            [-0.1276, 51.5075],
          ],
          step: { meters: stepMeters },
          streetView: {
            enabled: true,
            radiusMeters: 50,
            fov: 90,
            pitch: 0,
            imageSize: { width: 640, height: 640 },
          },
          satelliteGrid: {
            enabled: true,
            columns: 3,
            rows: 2,
            tileSizePx: 1080,
            oversample: 2,
            paddingMeters: 100,
          },
          tileProvider: "mock",
          storageTarget: "fs",
        }),
      });

      if (!res.ok) {
        const err = await res.json() as { error?: string };
        setError(String(err.error ?? "Unknown error"));
        return;
      }

      const data = await res.json() as { jobId: string; status: string };
      setResult(data);
    } catch (err) {
      setError(String(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main>
      <h1>Create New Job</h1>
      <form onSubmit={(e) => { void handleSubmit(e); }}>
        <div>
          <label htmlFor="routeId">Route ID (optional)</label>
          <input
            id="routeId"
            value={routeId}
            onChange={(e) => setRouteId(e.target.value)}
            placeholder="Auto-generated if empty"
          />
        </div>
        <div>
          <label htmlFor="stepMeters">Step size (meters)</label>
          <input
            id="stepMeters"
            type="number"
            value={stepMeters}
            min={1}
            max={250}
            onChange={(e) => setStepMeters(Number(e.target.value))}
          />
        </div>
        <button type="submit" disabled={submitting}>
          {submitting ? "Submitting..." : "Submit Job"}
        </button>
      </form>
      {result && (
        <div>
          <p>Job created! ID: <a href={`/jobs/${result.jobId}`}>{result.jobId}</a></p>
          <p>Status: {result.status}</p>
        </div>
      )}
      {error && <p style={{ color: "red" }}>Error: {error}</p>}
    </main>
  );
}
