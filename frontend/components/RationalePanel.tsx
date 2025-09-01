import React, { useState } from "react";

export default function RationalePanel({ text }: { text?: string | null }) {
  if (!text) return null;
  const [open, setOpen] = useState(true);

  return (
    <section
      style={{
        border: "1px solid #e5e7eb",
        borderRadius: 12,
        padding: 12,
        margin: "12px 0",
        background: "#F9FAFB",
      }}
    >
      <div
        onClick={() => setOpen((v) => !v)}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          cursor: "pointer",
        }}
      >
        <strong>Agent Rationale</strong>
        <span style={{ fontSize: 12, color: "#6b7280" }}>
          {open ? "Hide ▲" : "Show ▼"}
        </span>
      </div>
      {open && (
        <pre
          style={{
            marginTop: 8,
            whiteSpace: "pre-wrap",
            background: "#fff",
            border: "1px solid #e5e7eb",
            borderRadius: 8,
            padding: 10,
            overflowX: "auto",
          }}
        >
          {text}
        </pre>
      )}
      <small style={{ color: "#6b7280" }}>
        Why the agent modified/approved or blocked your query.
      </small>
    </section>
  );
}
