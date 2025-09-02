import { useEffect, useMemo, useState } from "react";
import CardNav from "../../components/CardNav";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? "http://localhost:8000/api/v1";

type ExportItem = {
  key: string;
  size: number;
  last_modified?: string;
};

type ListResp = { items: ExportItem[] };

export default function Exports() {
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [items, setItems] = useState<ExportItem[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [presignUrl, setPresignUrl] = useState<string | null>(null);
  const [selectedKey, setSelectedKey] = useState<string | null>(null);

  const navItems = [
    {
      label: "Query",
      bgColor: "#0D0716",
      textColor: "#fff",
      links: [{ label: "Dashboard", href: "/", ariaLabel: "Query Dashboard" }],
    },
    {
      label: "Exports",
      bgColor: "#170D27",
      textColor: "#fff",
      links: [{ label: "Daily Parquet", href: "/exports", ariaLabel: "Daily Exports" }],
    },
    {
      label: "Help",
      bgColor: "#271E37",
      textColor: "#fff",
      links: [{ label: "Support", href: "#", ariaLabel: "Support" }],
    },
  ];

  async function load() {
    setLoading(true);
    setErr(null);
    setPresignUrl(null);
    setSelectedKey(null);
    try {
      const r = await fetch(`${API_BASE}/exports/list?date=${encodeURIComponent(date)}`);
      if (!r.ok) throw new Error(`List failed: HTTP ${r.status}`);
      const data = (await r.json()) as ListResp;
      setItems(data.items || []);
    } catch (e: any) {
      setErr(e.message ?? String(e));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function presign(key: string) {
    setErr(null);
    setPresignUrl(null);
    setSelectedKey(key);
    try {
      const r = await fetch(`${API_BASE}/exports/presign?key=${encodeURIComponent(key)}`);
      const data = await r.json();
      if (!r.ok) throw new Error(data?.detail || `HTTP ${r.status}`);
      setPresignUrl(data.url);
    } catch (e: any) {
      setErr(e.message ?? String(e));
    }
  }

  const prettyItems = useMemo(
    () =>
      items
        .slice()
        .sort((a, b) => (a.key < b.key ? 1 : -1))
        .map((it) => ({ ...it, sizeMB: (it.size / (1024 * 1024)).toFixed(2) })),
    [items]
  );

  return (
    <div className="min-h-screen bg-[#F3F4F6]">
      <CardNav
        items={navItems}
        baseColor="#fff"
        menuColor="#000"
        buttonBgColor="#111"
        buttonTextColor="#fff"
        ctaHref="/"
        ctaLabel="Back to Query"
      />

      <main className="mx-auto max-w-4xl px-6 pt-28 pb-12">
        <header className="mb-4">
          <h1 className="m-0 text-2xl font-extrabold tracking-tight">SRTA Exports</h1>
          <p className="text-[#555] mt-2">
            <strong>Generate a short-lived presigned URL for today’s trades Parquet and download it.</strong>
          </p>
          <p className="text-sm text-gray-600">
            Make sure the Airflow DAG <code>trades_to_s3_parquet</code> finished for the selected date.
          </p>
        </header>

        <section className="border border-gray-200 rounded-xl p-4 mb-4 shadow-sm bg-white">
          <div className="flex flex-wrap items-end gap-3">
            <label className="grid gap-1">
              <span className="text-sm">Date (UTC)</span>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="px-3 py-2 rounded-lg border border-gray-300"
              />
            </label>
            <button
              onClick={load}
              disabled={loading}
              className={`px-4 h-10 rounded-xl border ${
                loading ? "bg-gray-400 cursor-not-allowed" : "bg-gray-900 hover:bg-black"
              } text-white border-gray-900`}
            >
              {loading ? "Loading…" : "Refresh"}
            </button>
          </div>
        </section>

        <section className="border border-gray-200 rounded-xl p-4 shadow-sm bg-white">
          <h3 className="mt-0 font-semibold">Available Files</h3>

          {err && (
            <div className="bg-red-50 border border-red-200 text-red-800 p-3 rounded-xl mb-3 whitespace-pre-wrap">
              {err}
            </div>
          )}

          {prettyItems.length === 0 ? (
            <p className="text-gray-500">No objects found under this date.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr>
                    <th className="text-left px-3 py-2 border-b bg-gray-50">Key</th>
                    <th className="text-left px-3 py-2 border-b bg-gray-50">Size (MB)</th>
                    <th className="text-left px-3 py-2 border-b bg-gray-50">Last Modified</th>
                    <th className="text-left px-3 py-2 border-b bg-gray-50"></th>
                  </tr>
                </thead>
                <tbody>
                  {prettyItems.map((it) => (
                    <tr key={it.key}>
                      <td className="px-3 py-2 border-b font-mono">{it.key}</td>
                      <td className="px-3 py-2 border-b">{(it as any).sizeMB}</td>
                      <td className="px-3 py-2 border-b">{it.last_modified ?? ""}</td>
                      <td className="px-3 py-2 border-b">
                        <button
                          onClick={() => presign(it.key)}
                          className="px-3 py-1.5 rounded-lg border bg-gray-900 hover:bg-black text-white border-gray-900"
                        >
                          Get presigned URL
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {selectedKey && presignUrl && (
                <div className="mt-3 p-3 border border-green-200 bg-green-50 rounded-xl">
                  <div className="font-semibold">Presigned URL</div>
                  <div className="text-xs break-all">{presignUrl}</div>
                  <div className="mt-2">
                    <a
                      className="px-3 py-1.5 inline-block rounded-lg border bg-white hover:bg-gray-50 text-gray-900 border-gray-300"
                      href={presignUrl}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Download {selectedKey.split("/").pop()}
                    </a>
                  </div>
                </div>
              )}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
