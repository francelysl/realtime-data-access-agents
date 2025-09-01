import { useEffect, useMemo, useState } from "react";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? "http://localhost:8000";

type ExportItem = {
  key: string;
  size: number;
  last_modified: string; // ISO string from FastAPI
};

export default function Exports() {
  const [date, setDate] = useState<string>(() => new Date().toISOString().slice(0, 10));
  const [items, setItems] = useState<ExportItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function fetchList(d: string) {
    setLoading(true);
    setErr(null);
    try {
      const res = await fetch(`${API_BASE}/api/v1/exports/list?date=${encodeURIComponent(d)}`);
      if (!res.ok) {
        const txt = await res.text();
        throw new Error(`${res.status} ${res.statusText} - ${txt}`);
      }
      const data = await res.json() as { items: ExportItem[] };
      setItems(data.items || []);
    } catch (e: any) {
      setErr(e.message ?? "Failed to list exports");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchList(date); }, [date]);

  async function download(key: string) {
    try {
      const r = await fetch(`${API_BASE}/api/v1/exports/presign?key=${encodeURIComponent(key)}&expires_in=600`);
      if (!r.ok) {
        const txt = await r.text();
        throw new Error(`${r.status} ${r.statusText} - ${txt}`);
      }
      const data = await r.json();
      window.open(data.url, "_blank", "noopener,noreferrer");
    } catch (e: any) {
      alert(e.message ?? "Failed to presign");
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-100 text-gray-900 p-6">
      <div className="bg-white shadow-xl rounded-2xl p-8 w-full max-w-4xl">
        <div className="flex items-center justify-between mb-6 gap-4">
          <div>
            <h1 className="text-2xl font-bold">SRTA Exports</h1>
            <p className="text-sm text-gray-600">
              Browse partitioned Parquet exports and download via presigned URL.
            </p>
          </div>
          <a href="/" className="text-sm text-gray-700 underline">← Back to Query Dashboard</a>
        </div>

        <div className="flex items-center gap-3 mb-4">
          <label className="text-sm text-gray-700">Date</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="border rounded-lg px-3 py-2"
          />
          <button
            onClick={() => fetchList(date)}
            className="px-3 py-2 text-sm rounded-lg border bg-gray-50 hover:bg-gray-100"
          >
            Refresh
          </button>
        </div>

        {loading && <p>Loading…</p>}
        {err && <p className="text-red-600">{err}</p>}

        {!loading && !err && items.length === 0 && (
          <p className="text-gray-600">No objects found for {date}.</p>
        )}

        {items.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-gray-50">
                  <th className="text-left p-2 border-b">Key</th>
                  <th className="text-left p-2 border-b">Size (bytes)</th>
                  <th className="text-left p-2 border-b">Last Modified (UTC)</th>
                  <th className="text-left p-2 border-b">Action</th>
                </tr>
              </thead>
              <tbody>
                {items.map((it) => (
                  <tr key={it.key} className="hover:bg-gray-50">
                    <td className="p-2 border-b break-all">{it.key}</td>
                    <td className="p-2 border-b">{it.size}</td>
                    <td className="p-2 border-b">{new Date(it.last_modified).toISOString()}</td>
                    <td className="p-2 border-b">
                      <button
                        onClick={() => download(it.key)}
                        className="px-3 py-1 rounded bg-black text-white hover:bg-gray-800"
                      >
                        Download
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="mt-6 text-xs text-gray-500">
          <p><b>Backend:</b> {API_BASE}</p>
          <p>
            Objects are expected under <code>s3://$&#123;S3_BUCKET&#125;/$&#123;S3_PREFIX&#125;/dt=YYYY-MM-DD/</code>.
          </p>
        </div>
      </div>
    </main>
  );
}
