"use client";

import { useEffect, useState } from "react";

export default function TestingPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const run = async () => {
    try {
      setLoading(true);
      setError(null);
      setData(null);
      const res = await fetch("/api/testing", { cache: "no-store" });
      const json = await res.json();
      if (!res.ok) {
        setError(JSON.stringify(json));
      } else {
        setData(json);
      }
    } catch (e: any) {
      setError(e?.message || "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // auto-run on mount
    run();
  }, []);

  return (
    <div style={{ padding: 24 }}>
      <h1>/testing</h1>
      <p>Runs the web3 audit workflow against the YieldNest repo and shows raw JSON.</p>
      <button onClick={run} disabled={loading} style={{ padding: "8px 12px", marginTop: 8 }}>
        {loading ? "Running..." : "Run Again"}
      </button>

      {error && (
        <pre style={{ marginTop: 16, color: "#b91c1c", whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
{error}
        </pre>
      )}

      {data && (
        <pre style={{ marginTop: 16, whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
{JSON.stringify(data, null, 2)}
        </pre>
      )}
    </div>
  );
}



