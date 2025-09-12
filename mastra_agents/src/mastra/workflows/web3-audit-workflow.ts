import { createWorkflow, createStep } from '@mastra/core/workflows';
import { Agent } from '@mastra/core/agent';
import { z } from 'zod';
import { githubIngestTool } from '../tools/github-tool';
import { cerebras } from '@ai-sdk/cerebras';

// Pluggable model
const MODEL_ID = process.env.AI_MODEL_ID || 'qwen-3-coder-480b';
const getModel = () => cerebras(MODEL_ID);

// 1) Fetcher agent
const fetcherAgent = new Agent({
  name: 'FetcherAgent',
  instructions: `You fetch codebases via the github-ingest tool.`,
  model: getModel(),
  tools: { githubIngestTool },
});

// 2) Structure analyzer agent (LLM aided, but returns structured data)
const structureAgent = new Agent({
  name: 'StructureAgent',
  instructions: `You are a codebase structure analyzer. Focus on web3 stacks (Solidity/Foundry/Hardhat, Next.js, wagmi, RainbowKit, etc.). Return concise structured insights.`,
  model: getModel(),
});

// 3) Vuln analyzer agent (web3-focused)
const vulnAgent = new Agent({
  name: 'SolidityVulnAgent',
  instructions: `You are a senior smart-contract auditor. Analyze Solidity for:
- Reentrancy (external calls before state update; missing nonReentrant)
- tx.origin for auth
- delegatecall to arbitrary target; upgradeability abuse
- selfdestruct kill-switch
- timestamp/block-based randomness
- missing ACL (functions that should be onlyOwner)
- balance-based accounting exploitable by flash loans
- unchecked low-level call returns / call.value
- improper initialization / owner can be changed
Report issues as structured findings with: id, title, severity (critical/high/medium/low), file, line, snippet, description, remediation, confidence (0-1).`,
  model: getModel(),
});

// 4) Reporter agent (formats final JSON summary)
const reporterAgent = new Agent({
  name: 'ReporterAgent',
  instructions: `You assemble a final structured JSON report for a web3 audit. Include counts, categorized issues, and a clear executive summary.`,
  model: getModel(),
});

// Schemas
const inputSchema = z.object({
  scanId: z.string().default(() => String(Date.now())),
  repoUrl: z.string().url(),
  token: z.string().optional(),
  includeSecurityAnalysis: z.boolean().default(true),
});

const fileSchema = z.object({ path: z.string(), content: z.string() });
const findingSchema = z.object({
  id: z.string(),
  title: z.string(),
  severity: z.enum(['critical','high','medium','low']),
  file: z.string(),
  line: z.number().optional(),
  snippet: z.string().optional(),
  description: z.string(),
  remediation: z.string(),
  confidence: z.number().min(0).max(1),
});

const outputSchema = z.object({
  scanId: z.string(),
  repoUrl: z.string(),
  summary: z.string(),
  counts: z.object({
    filesScanned: z.number(),
    solidityFiles: z.number(),
    vulnerabilities: z.number(),
    bySeverity: z.object({
      critical: z.number(),
      high: z.number(),
      medium: z.number(),
      low: z.number(),
    }),
  }),
  languages: z.array(z.object({ name: z.string(), files: z.number() })),
  issues: z.array(findingSchema),
  recommendations: z.array(z.string()),
});

// Step 1: Fetch code
const fetchCode = createStep({
  id: 'fetch-code',
  description: 'Fetch repo via gitingest',
  inputSchema: inputSchema,
  outputSchema: z.object({
    repoUrl: z.string(),
    files: z.array(fileSchema),
    summary: z.string().optional(),
    digestUrl: z.string().optional(),
  }),
  execute: async ({ inputData }) => {
    const { repoUrl, token } = inputData!;
    const result = await githubIngestTool.execute({
      context: {
        repoUrl,
        token: token ?? '',
        maxFileSizeMb: 50,
        includePattern: '*.sol,*.vy,*.js,*.ts,*.json,*.toml,*.yaml,*.yml,*.md,*.txt,*.env',
      },
      runtimeContext: { set() {}, get() { return undefined; }, has() { return false; }, registry: new Map(), delete() { return false; } } as any,
    });
    return result as any;
  },
});

// Step 2: Structure
const analyzeStructure = createStep({
  id: 'analyze-structure',
  description: 'Detect languages, frameworks, and layout',
  inputSchema: z.object({
    repoUrl: z.string(),
    files: z.array(fileSchema),
    summary: z.string().optional(),
    digestUrl: z.string().optional(),
  }),
  outputSchema: z.object({
    repoUrl: z.string(),
    files: z.array(fileSchema),
    languages: z.array(z.object({ name: z.string(), files: z.number() })),
    solidityFiles: z.array(fileSchema),
  }),
  execute: async ({ inputData }) => {
    const files = inputData!.files;
    const byLang: Record<string, number> = {};
    const solidityFiles = files.filter(f => f.path.endsWith('.sol'));
    for (const f of files) {
      const name = f.path.endsWith('.sol') ? 'Solidity'
        : f.path.endsWith('.ts') || f.path.endsWith('.tsx') ? 'TypeScript'
        : f.path.endsWith('.js') || f.path.endsWith('.jsx') ? 'JavaScript'
        : f.path.endsWith('.md') ? 'Markdown'
        : 'Other';
      byLang[name] = (byLang[name] || 0) + 1;
    }
    const languages = Object.entries(byLang).map(([name, files]) => ({ name, files }));
    return {
      repoUrl: inputData!.repoUrl,
      files,
      languages,
      solidityFiles,
    };
  },
});

// Step 3: Vuln scan (LLM + heuristics prompt; returns structured findings)
const analyzeVulns = createStep({
  id: 'analyze-vulns',
  description: 'Scan Solidity for common web3 vulns',
  inputSchema: z.object({
    repoUrl: z.string(),
    files: z.array(fileSchema),
    languages: z.array(z.object({ name: z.string(), files: z.number() })),
    solidityFiles: z.array(fileSchema),
  }),
  outputSchema: z.object({
    repoUrl: z.string(),
    findings: z.array(findingSchema),
    files: z.array(fileSchema),
    languages: z.array(z.object({ name: z.string(), files: z.number() })),
  }),
  execute: async ({ inputData, mastra }) => {
    const sol = inputData!.solidityFiles.slice(0, 20); // cap to avoid huge prompts
    const codebaseText = sol.map(f => `FILE: ${f.path}\n${f.content}`).join('\n\n');
    
    let allFindings: any[] = [];
    
    // Run specialized agents in parallel
    const agents = [
      { name: 'reentrancyAgent', type: 'reentrancy' },
      { name: 'accessControlAgent', type: 'access-control' },
      { name: 'oracleManipulationAgent', type: 'oracle-manipulation' }
    ];
    
    const agentPromises = agents.map(async ({ name, type }) => {
      try {
        const agent = mastra?.getAgent(name);
        if (!agent) return [];
        
        const prompt = `Analyze the following Solidity codebase for ${type} vulnerabilities:

${codebaseText}

Follow your instructions exactly and return findings in the specified JSON format.`;
        
        const res = await agent.generate(prompt);
        const json = res.text.trim().replace(/```json|```/g, '');
        return JSON.parse(json);
      } catch (error) {
        console.warn(`Agent ${name} failed:`, error);
        return [];
      }
    });
    
    // Collect all findings
    const agentResults = await Promise.all(agentPromises);
    for (const findings of agentResults) {
      if (Array.isArray(findings)) {
        allFindings.push(...findings);
      }
    }
    
    // Fallback to general agent if no specialized findings
    if (allFindings.length === 0) {
      const fallbackAgent = mastra?.getAgent('SolidityVulnAgent') ?? vulnAgent;
      const prompt = `Audit the following Solidity files for the listed vulnerability classes.
Return ONLY JSON array of findings with fields: id,title,severity,file,line,snippet,description,remediation,confidence.
Files:
${codebaseText}`;

      try {
        const res = await fallbackAgent.generate(prompt);
        const json = res.text.trim().replace(/```json|```/g, '');
        allFindings = JSON.parse(json);
      } catch {
        allFindings = [];
      }
    }
    
    return { repoUrl: inputData!.repoUrl, findings: allFindings, files: inputData!.files, languages: inputData!.languages };
  },
});

// Step 4: Report
const buildReport = createStep({
  id: 'build-report',
  description: 'Assemble structured report',
  inputSchema: z.object({
    repoUrl: z.string(),
    files: z.array(fileSchema),
    languages: z.array(z.object({ name: z.string(), files: z.number() })),
    findings: z.array(findingSchema),
  }),
  outputSchema: outputSchema,
  execute: async ({ inputData }) => {
    const filesScanned = inputData!.files.length;
    const solidityCount = inputData!.languages.find(l => l.name === 'Solidity')?.files ?? 0;
    const bySeverity = { critical: 0, high: 0, medium: 0, low: 0 };
    for (const f of inputData!.findings) bySeverity[f.severity]++;
    const total = inputData!.findings.length;

    const recommendations = [
      'Add ReentrancyGuard and follow CEI (checks-effects-interactions).',
      'Replace tx.origin-based auth with msg.sender + Ownable/AccessControl.',
      'Restrict delegatecall/strategy setters with onlyOwner and validation.',
      'Remove selfdestruct or gate behind timelock/multisig with clear policy.',
      'Avoid timestamp randomness; use Chainlink VRF or commit-reveal.',
      'Avoid balance-based accounting susceptible to flash loans.',
    ];

    const summary = `Scanned ${filesScanned} files (${solidityCount} Solidity).
Found ${total} vulnerabilities (crit:${bySeverity.critical}, high:${bySeverity.high}, med:${bySeverity.medium}, low:${bySeverity.low}).`;

    return {
      scanId: String(Date.now()),
      repoUrl: inputData!.repoUrl,
      summary,
      counts: {
        filesScanned,
        solidityFiles: solidityCount,
        vulnerabilities: total,
        bySeverity,
      },
      languages: inputData!.languages,
      issues: inputData!.findings,
      recommendations,
    };
  },
});

export const web3AuditWorkflow = createWorkflow({
  id: 'web3-audit-workflow',
  inputSchema,
  outputSchema,
})
  .then(fetchCode)
  .then(analyzeStructure)
  .then(analyzeVulns)
  .then(buildReport);

web3AuditWorkflow.commit();