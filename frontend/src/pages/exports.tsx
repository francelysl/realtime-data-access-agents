import { useState } from "react";

/**
 * Configure your backend base URL via NEXT_PUBLIC_API_BASE
 * Example: http://localhost:8000  (no trailing /api/v1 here; we add full path below)
 */
const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? "http://localhost:8000";

export default function Exports() {
  const [url, setUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function getPresigned() {
    setLoading(true);
    setErr(null);
    setUrl(null);
    try {
      // Must match the key naming from your Airflow DAG
      const dt = new Date().toISOString().slice(0, 10);
      const key = `exports/trades/dt=${dt}/trades_${dt}.parquet`;

      const res = await fetch(
        `${API_BASE}/api/v1/exports/presign?key=${encodeURIComponent(key)}&expires_in=600`
      );
      if (!res.ok) {
        const txt = await res.text();
        throw new Error(`${res.status} ${res.statusText} - ${txt}`);
      }
      const data = await res.json();
      setUrl(data.url);
    } catch (e: any) {
      setErr(e.message ?? "Failed to fetch presigned URL");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-100 text-gray-900 p-6">
      <div className="bg-white shadow-xl rounded-2xl p-8 w-full max-w-xl">
        <h1 className="text-2xl font-bold mb-2">SRTA Exports</h1>
        <p className="text-sm text-gray-600 mb-6">
          Generate a short-lived presigned URL for today’s trades Parquet and download it.
        </p>

        <button
          onClick={getPresigned}
          disabled={loading}
          className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 disabled:opacity-50"
        >
          {loading ? "Fetching..." : "Get Today’s Export"}
        </button>

        {url && (
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="block mt-4 text-blue-600 underline break-all"
          >
            Download Parquet
          </a>
        )}

        {err && <p className="mt-4 text-red-600">{err}</p>}

        <div className="mt-6 text-xs text-gray-500">
          <p><b>Backend:</b> {API_BASE}</p>
          <p><b>Tip:</b> Make sure Airflow ran <code>trades_to_s3_parquet</code> for today first.</p>
        </div>

        <div className="mt-6">
          <a href="/" className="text-sm text-gray-700 underline">← Back to Query Dashboard</a>
        </div>
      </div>
    </main>
  );
}
