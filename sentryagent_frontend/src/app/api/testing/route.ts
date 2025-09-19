export const dynamic = "force-dynamic";

const BASE_URL = "https://sparse-incalculable-house.mastra.cloud";
const WORKFLOW_ID = "web3AuditWorkflow";

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function GET() {
  try {
    // 1) Create run
    // try createRun (camelCase) first per docs; fallback to kebab-case if needed
    let createRes = await fetch(
      `${BASE_URL}/api/workflows/${WORKFLOW_ID}/createRun`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      }
    );
    if (createRes.status === 404) {
      createRes = await fetch(
        `${BASE_URL}/api/workflows/${WORKFLOW_ID}/create-run`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    if (!createRes.ok) {
      const errText = await createRes.text();
      return new Response(
        JSON.stringify({ error: "create-run failed", status: createRes.status, body: errText }),
        { status: 502, headers: { "Content-Type": "application/json" } }
      );
    }

    const createJson = await createRes.json();
    const runId: string = createJson.runId;
    if (!runId) {
      return new Response(
        JSON.stringify({ error: "create-run missing runId", body: createJson }),
        { status: 502, headers: { "Content-Type": "application/json" } }
      );
    }

    // 2) Start async
    const inputData = {
      scanId: `yieldnest-audit-${Date.now()}`,
      repoUrl: "https://github.com/error9098x/yieldnest",
      token: "",
      includeSecurityAnalysis: true,
    };

    const startRes = await fetch(
      `${BASE_URL}/api/workflows/${WORKFLOW_ID}/start-async`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ runId, inputData }),
      }
    );

    if (!startRes.ok) {
      const errText = await startRes.text();
      return new Response(
        JSON.stringify({ error: "start-async failed", status: startRes.status, body: errText }),
        { status: 502, headers: { "Content-Type": "application/json" } }
      );
    }

    // 3) Poll status until success/failed
    let status = "running";
    for (let i = 0; i < 60; i++) {
      const statusRes = await fetch(
        `${BASE_URL}/api/workflows/${WORKFLOW_ID}/runs/${runId}`,
        { cache: "no-store" }
      );
      if (!statusRes.ok) {
        const errText = await statusRes.text();
        return new Response(
          JSON.stringify({ error: "status failed", status: statusRes.status, body: errText }),
          { status: 502, headers: { "Content-Type": "application/json" } }
        );
      }
      const statusJson = await statusRes.json();
      status = statusJson.status || statusJson?.payload?.workflowState?.status || "running";
      if (status === "success" || status === "failed") break;
      await sleep(3000);
    }

    if (status !== "success") {
      return new Response(
        JSON.stringify({ error: "workflow did not succeed", runId, status }),
        { status: 502, headers: { "Content-Type": "application/json" } }
      );
    }

    // 4) Fetch execution result
    const resultRes = await fetch(
      `${BASE_URL}/api/workflows/${WORKFLOW_ID}/runs/${runId}/execution-result`,
      { cache: "no-store" }
    );
    if (!resultRes.ok) {
      const errText = await resultRes.text();
      return new Response(
        JSON.stringify({ error: "execution-result failed", status: resultRes.status, body: errText }),
        { status: 502, headers: { "Content-Type": "application/json" } }
      );
    }
    const resultJson = await resultRes.json();

    return new Response(JSON.stringify(resultJson), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (e: any) {
    return new Response(
      JSON.stringify({ error: e?.message || "unexpected error" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}


