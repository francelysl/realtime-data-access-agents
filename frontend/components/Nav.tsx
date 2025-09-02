import React from "react";
import Link from "next/link";
import { useRouter } from "next/router";

/**
 * Lightweight nav with light/dark-friendly container
 * No eslint-disable lines; no bare expression patterns that can upset lint.
 */
export default function Nav() {
  const r = useRouter();

  function Tab({ href, label }: { href: string; label: string }) {
    const active = r.pathname === href;
    return (
      <Link
        href={href}
        aria-label={label}
        style={{
          padding: "8px 12px",
          borderRadius: 10,
          border: active ? "1px solid #111827" : "1px solid #e5e7eb",
          background: active ? "#111827" : "#fff",
          color: active ? "#fff" : "#111827",
          textDecoration: "none",
          fontWeight: 500,
          boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
        }}
      >
        {label}
      </Link>
    );
  }

  return (
    <nav
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        gap: 12,
        padding: 16,
        border: "1px solid #e5e7eb",
        borderRadius: 12,
        marginBottom: 16,
        background:
          "linear-gradient(180deg, rgba(255,255,255,0.9), rgba(249,250,251,0.9))",
        backdropFilter: "blur(6px)",
      }}
    >
      <div style={{ fontWeight: 800 }}>SRTA</div>
      <div style={{ display: "flex", gap: 10 }}>
        <Tab href="/" label="Query Dashboard" />
        <Tab href="/exports" label="Exports" />
      </div>
      <div style={{ fontSize: 12, color: "#6b7280", whiteSpace: "nowrap" }}>
        API:&nbsp;
        {process.env.NEXT_PUBLIC_API_BASE ?? "http://localhost:8000/api/v1"}
      </div>
    </nav>
  );
}
