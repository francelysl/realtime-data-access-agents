import { useEffect, useMemo, useState } from "react";
import CardNav from "../../components/CardNav";
import RationalePanel from "../../components/RationalePanel";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? "http://localhost:8000/api/v1";

type Health = { status: string; service: string; env: string };
type QueryRequest = { user_id: string; sql: string; preview: boolean };
type QueryResponse = {
  allowed: boolean;
  reason: string;
  rows: number;
  data_preview?: Array<Record<string, any>> | null;
  agent_rationale?: string | null;
};

export default function Home() {
  // Health
  const [health, setHealth] = useState<Health | null>(null);
  const [healthErr, setHealthErr] = useState<string | null>(null);
  const [loadingHealth, setLoadingHealth] = useState(false);

  // Query form
  const [userId, setUserId] = useState("alice");
  const [sql, setSql] = useState("select id, symbol, price, qty, ts from trades order by id desc");
  const [preview, setPreview] = useState(true);

  // Results
  const [result, setResult] = useState<QueryResponse | null>(null);
  const [queryErr, setQueryErr] = useState<string | null>(null);
  const [loadingQuery, setLoadingQuery] = useState(false);

  useEffect(() => {
    const fetchHealth = async () => {
      setLoadingHealth(true);
      setHealthErr(null);
      try {
        const r = await fetch(`${API_BASE}/health`);
        if (!r.ok) throw new Error(`Health failed: ${r.status}`);
        setHealth((await r.json()) as Health);
      } catch (e: any) {
        setHealthErr(e.message ?? String(e));
      } finally {
        setLoadingHealth(false);
      }
    };
    fetchHealth();
  }, []);

  async function onRun() {
    setLoadingQuery(true);
    setQueryErr(null);
    setResult(null);
    try {
      const r = await fetch(`${API_BASE}/query`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: userId.trim() || "anonymous", sql, preview } as QueryRequest),
      });
      const data = (await r.json()) as QueryResponse;
      setResult(data);
      if (!r.ok || data.allowed === false) {
        setQueryErr(data.reason || `HTTP ${r.status}`);
      }
    } catch (e: any) {
      setQueryErr(e.message ?? String(e));
    } finally {
      setLoadingQuery(false);
    }
  }

  const tableHeaders = useMemo(() => {
    if (!result?.data_preview || result.data_preview.length === 0) return [];
    const keys = new Set<string>();
    for (const row of result.data_preview) Object.keys(row || {}).forEach((k) => keys.add(k));
    return Array.from(keys);
  }, [result]);

  return (
    <main className="min-h-screen bg-slate-50">
      <CardNav
        title="SRTA — Real-Time Data Access"
        items={[
          {
            label: "Query",
            bgColor: "#111827",
            textColor: "#fff",
            links: [
              { label: "Dashboard", href: "/", ariaLabel: "Query Dashboard" },
              { label: "Guardrails", href: "/", ariaLabel: "Agent Guardrails" },
            ],
          },
          {
            label: "Exports",
            bgColor: "#1f2937",
            textColor: "#fff",
            links: [
              { label: "Daily Parquet", href: "/exports", ariaLabel: "Daily Parquet Exports" },
              { label: "Presigned URLs", href: "/exports", ariaLabel: "S3 Presigned URLs" },
            ],
          },
          {
            label: "Help",
            bgColor: "#0b1220",
            textColor: "#fff",
            links: [
              { label: "README", href: "https://github.com/", ariaLabel: "README" },
            ],
          },
        ]}
        baseColor="#ffffff"
        headerTextColor="#0b1220"
        gradientFrom="#f8fafc"
        gradientTo="#0f172a"
        ctaHref="/exports"
        ctaLabel="Go to Exports"
      />

      <div className="max-w-[1100px] mx-auto px-6 pt-28 pb-10">
        {/* HERO */}
        <header className="mb-6">
          <h1 className="text-3xl font-extrabold tracking-tight">
            <strong>Real-Time Data Access Platform</strong>
          </h1>
          <p className="text-slate-700 mt-2">
            <strong>Demo dashboard — send preview queries, see guardrails & agent help.</strong>
          </p>
          <p className="text-slate-700 mt-3 leading-relaxed">
            This dashboard provides a safe, self-serve interface for exploring operational data with built-in governance.
            Queries run in <em>Preview</em> mode are automatically constrained (e.g., row limits) and evaluated against
            policy guardrails. The agent annotates each request with a rationale so you know exactly why a query was
            modified, approved, or blocked. <br className="hidden sm:inline" />
            <span className="block mt-2">
              <span className="font-semibold">Target audience:</span> data analysts, operations engineers, and product teams
              who need rapid insights from fresh data without risking noisy or expensive queries.
            </span>
            <span className="block mt-1">
              <span className="font-semibold">Typical use cases:</span> trading activity checks, incident triage, KPI drill-downs,
              ad-hoc investigations, and lightweight reporting.
            </span>
            <span className="block mt-1">
              <span className="font-semibold">Example metrics we track:</span> query approval rate, auto-limited scans,
              average preview latency, blocked queries by reason, and export download conversions.
            </span>
          </p>
        </header>

        {/* Health */}
        <section className="border border-gray-200 rounded-xl p-4 mb-4 shadow-sm bg-white">
          <h3 className="m-0 font-semibold">Backend Health</h3>
          {loadingHealth && <p>Checking…</p>}
          {healthErr && <p className="text-red-700 whitespace-pre-wrap">{healthErr}</p>}
          {health && <pre className="bg-gray-50 p-3 rounded-lg overflow-x-auto m-0">{JSON.stringify(health, null, 2)}</pre>}
        </section>

        {/* Query Form */}
        <section className="border border-gray-200 rounded-xl p-4 mb-4 shadow-sm bg-white">
          <h3 className="m-0 font-semibold">Run a Query</h3>
          <div className="grid gap-3">
            <label className="grid gap-1">
              <span>User ID</span>
              <input
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                placeholder="alice"
                className="px-3 py-2 rounded-lg border border-gray-300"
              />
            </label>

            <label className="grid gap-1">
              <span>SQL</span>
              <textarea
                value={sql}
                onChange={(e) => setSql(e.target.value)}
                rows={6}
                spellCheck={false}
                className="w-full p-3 rounded-lg border border-gray-300 font-mono text-sm"
              />
              <small className="text-gray-500">
                Try without <code>LIMIT</code> to see the agent add one during preview.
              </small>
            </label>

            <label className="flex gap-2 items-center">
              <input type="checkbox" checked={preview} onChange={() => setPreview((v) => !v)} />
              <span>Preview (safer, enforced limit)</span>
            </label>

            <div className="flex gap-2">
              <button
                onClick={onRun}
                disabled={loadingQuery}
                className={`px-4 py-2 rounded-lg border ${
                  loadingQuery ? "bg-gray-400 border-gray-700" : "bg-gray-900 border-gray-900"
                } text-white`}
              >
                {loadingQuery ? "Running…" : "Run"}
              </button>
            </div>
          </div>
        </section>

        {/* Result */}
        <section className="border border-gray-200 rounded-xl p-4 shadow-sm bg-white">
          <h3 className="m-0 font-semibold">Result</h3>

          {queryErr && (
            <div className="bg-red-50 border border-red-200 text-red-800 p-3 rounded-lg mb-3 whitespace-pre-wrap">
              {queryErr}
            </div>
          )}

          {/* Agent rationale collapsible */}
          <RationalePanel text={result?.agent_rationale} />

          {result && (
            <>
              <div className="flex gap-3 flex-wrap mb-3">
                <Badge label={`allowed: ${String(result.allowed)}`} />
                <Badge label={`rows: ${result.rows}`} />
              </div>

              {result.data_preview && result.data_preview.length > 0 ? (
                <div className="overflow-x-auto mb-3">
                  <table className="w-full border-collapse text-sm">
                    <thead>
                      <tr>
                        {tableHeaders.map((h) => (
                          <th key={h} className="text-left px-3 py-2 border-b bg-gray-50">
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {result.data_preview.map((row, i) => (
                        <tr key={i}>
                          {tableHeaders.map((h) => (
                            <td key={h} className="px-3 py-2 border-b font-mono">
                              {formatCell(row?.[h])}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-gray-500">No rows to display yet. Try running a preview query.</p>
              )}

              <details>
                <summary className="cursor-pointer">Raw JSON</summary>
                <pre className="bg-gray-50 p-3 rounded-lg overflow-x-auto">{JSON.stringify(result, null, 2)}</pre>
              </details>
            </>
          )}

          {!result && !queryErr && <p>Run a query to see results.</p>}
        </section>

        <p className="text-sm text-gray-500 mt-4">
          API: {process.env.NEXT_PUBLIC_API_BASE ?? "http://localhost:8000/api/v1"}
        </p>
      </div>
    </main>
  );
}

function Badge({ label }: { label: string }) {
  return (
    <span className="inline-block bg-indigo-50 text-indigo-800 border border-indigo-200 px-2.5 py-1 rounded-full">
      {label}
    </span>
  );
}

function formatCell(v: unknown): string {
  if (v == null) return "";
  if (typeof v === "object") {
    try {
      return JSON.stringify(v);
    } catch {
      return String(v);
    }
  }
  return String(v);
}