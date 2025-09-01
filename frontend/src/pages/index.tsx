import { useEffect, useMemo, useState } from "react";

/**
 * Configure your backend base URL via NEXT_PUBLIC_API_BASE
 */
const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE ?? "http://localhost:8000/api/v1";

type Health = { status: string; service: string; env: string };

type QueryRequest = {
  user_id: string;
  sql: string;
  preview: boolean;
};

type QueryResponse = {
  allowed: boolean;
  reason: string;
  rows: number;
  data_preview?: Array<Record<string, any>> | null;
  agent_rationale?: string | null;
};

export default function Home() {
  // Health status
  const [health, setHealth] = useState<Health | null>(null);
  const [healthErr, setHealthErr] = useState<string | null>(null);
  const [loadingHealth, setLoadingHealth] = useState(false);

  // Query form state
  const [userId, setUserId] = useState("alice");
  const [sql, setSql] = useState(
    "select id, symbol, price, qty, ts from trades order by id desc"
  );
  const [preview, setPreview] = useState(true);

  // Query result state
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
        const data = (await r.json()) as Health;
        setHealth(data);
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
        body: JSON.stringify({
          user_id: userId.trim() || "anonymous",
          sql,
          preview,
        } as QueryRequest),
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
    for (const row of result.data_preview) {
      Object.keys(row || {}).forEach((k) => keys.add(k));
    }
    return Array.from(keys);
  }, [result]);

  return (
    <main
      style={{
        fontFamily: "Inter, ui-sans-serif, system-ui, -apple-system",
        padding: 24,
        maxWidth: 1000,
        margin: "0 auto",
      }}
    >
      <header style={{ marginBottom: 16 }}>
        <h1 style={{ margin: 0 }}>Real-Time Data Access Platform</h1>
        <p style={{ color: "#555", marginTop: 6 }}>
          Demo dashboard — send preview queries, see guardrails & agent help.
        </p>
        <p style={{ marginTop: 8 }}>
          <a href="/exports" style={{ color: "#2563eb", textDecoration: "underline" }}>
            Go to Exports →
          </a>
        </p>
      </header>

      {/* Health Card */}
      <section
        style={{
          border: "1px solid #e5e7eb",
          borderRadius: 12,
          padding: 16,
          marginBottom: 16,
          boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
          background: "#fff",
        }}
      >
        <h3 style={{ marginTop: 0 }}>Backend Health</h3>
        {loadingHealth && <p>Checking…</p>}
        {healthErr && (
          <p style={{ color: "crimson", whiteSpace: "pre-wrap" }}>{healthErr}</p>
        )}
        {health && (
          <pre
            style={{
              background: "#f6f8fa",
              padding: 12,
              borderRadius: 8,
              overflowX: "auto",
              margin: 0,
            }}
          >
            {JSON.stringify(health, null, 2)}
          </pre>
        )}
      </section>

      {/* Query Form */}
      <section
        style={{
          border: "1px solid #e5e7eb",
          borderRadius: 12,
          padding: 16,
          marginBottom: 16,
          boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
          background: "#fff",
        }}
      >
        <h3 style={{ marginTop: 0 }}>Run a Query</h3>
        <div
          style={{
            display: "grid",
            gap: 12,
            gridTemplateColumns: "1fr",
          }}
        >
          <label style={{ display: "grid", gap: 6 }}>
            <span>User ID</span>
            <input
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              placeholder="alice"
              style={{
                padding: "8px 10px",
                borderRadius: 8,
                border: "1px solid #d1d5db",
              }}
            />
          </label>

          <label style={{ display: "grid", gap: 6 }}>
            <span>SQL</span>
            <textarea
              value={sql}
              onChange={(e) => setSql(e.target.value)}
              rows={6}
              spellCheck={false}
              style={{
                width: "100%",
                padding: 12,
                borderRadius: 10,
                border: "1px solid #d1d5db",
                fontFamily:
                  "ui-monospace, Menlo, Consolas, 'Liberation Mono', monospace",
                fontSize: 14,
              }}
            />
            <small style={{ color: "#6b7280" }}>
              Try without <code>LIMIT</code> to see the agent add one during
              preview.
            </small>
          </label>

          <label style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <input
              type="checkbox"
              checked={preview}
              onChange={() => setPreview((v) => !v)}
            />
            <span>Preview (safer, enforced limit)</span>
          </label>

          <div style={{ display: "flex", gap: 8 }}>
            <button
              onClick={onRun}
              disabled={loadingQuery}
              style={{
                padding: "10px 14px",
                borderRadius: 10,
                border: "1px solid #111827",
                background: loadingQuery ? "#9ca3af" : "#111827",
                color: "#fff",
                cursor: loadingQuery ? "not-allowed" : "pointer",
              }}
            >
              {loadingQuery ? "Running…" : "Run"}
            </button>
          </div>
        </div>
      </section>

      {/* Result Panel */}
      <section
        style={{
          border: "1px solid #e5e7eb",
          borderRadius: 12,
          padding: 16,
          boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
          background: "#fff",
        }}
      >
        <h3 style={{ marginTop: 0 }}>Result</h3>

        {queryErr && (
          <div
            style={{
              background: "#FEF2F2",
              border: "1px solid #FECACA",
              color: "#991B1B",
              padding: 12,
              borderRadius: 10,
              marginBottom: 12,
              whiteSpace: "pre-wrap",
            }}
          >
            {queryErr}
          </div>
        )}

        {result?.agent_rationale && (
          <p
            style={{
              background: "#F3F4F6",
              padding: 10,
              borderRadius: 8,
              marginTop: 0,
            }}
          >
            <strong>Agent:</strong> {result.agent_rationale}
          </p>
        )}

        {result && (
          <>
            <div
              style={{
                display: "flex",
                gap: 16,
                flexWrap: "wrap",
                marginBottom: 12,
              }}
            >
              <Badge label={`allowed: ${String(result.allowed)}`} />
              <Badge label={`rows: ${result.rows}`} />
            </div>

            {/* Table preview if any rows */}
            {result.data_preview && result.data_preview.length > 0 ? (
              <div style={{ overflowX: "auto", marginBottom: 12 }}>
                <table
                  style={{
                    width: "100%",
                    borderCollapse: "collapse",
                    fontSize: 14,
                  }}
                >
                  <thead>
                    <tr>
                      {tableHeaders.map((h) => (
                        <th
                          key={h}
                          style={{
                            textAlign: "left",
                            padding: "8px 10px",
                            borderBottom: "1px solid #e5e7eb",
                            background: "#fafafa",
                          }}
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {result.data_preview.map((row, i) => (
                      <tr key={i}>
                        {tableHeaders.map((h) => (
                          <td
                            key={h}
                            style={{
                              padding: "8px 10px",
                              borderBottom: "1px solid #f3f4f6",
                              fontFamily:
                                "ui-monospace, Menlo, Consolas, 'Liberation Mono', monospace",
                            }}
                          >
                            {formatCell(row?.[h])}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p style={{ color: "#6b7280" }}>
                No rows to display yet. Try running a preview query.
              </p>
            )}

            {/* Raw JSON (handy for debugging) */}
            <details>
              <summary style={{ cursor: "pointer" }}>Raw JSON</summary>
              <pre
                style={{
                  background: "#f6f8fa",
                  padding: 12,
                  borderRadius: 8,
                  overflowX: "auto",
                }}
              >
                {JSON.stringify(result, null, 2)}
              </pre>
            </details>
          </>
        )}

        {!result && !queryErr && <p>Run a query to see results.</p>}
      </section>
    </main>
  );
}

/** Small badge component */
function Badge({ label }: { label: string }) {
  return (
    <span
      style={{
        display: "inline-block",
        background: "#EEF2FF",
        color: "#3730A3",
        border: "1px solid #C7D2FE",
        padding: "4px 8px",
        borderRadius: 999,
      }}
    >
      {label}
    </span>
  );
}

/** Format primitive values for table cells */
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
