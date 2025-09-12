import { createTool } from '@mastra/core/tools';
import { z } from 'zod';

type IngestResponse = {
  repo_url: string;
  short_repo_url?: string;
  summary?: string;
  digest_url?: string;
  tree?: string;
  content?: string;
};

function parseGitingestContent(raw: string) {
  const files: { path: string; content: string }[] = [];
  const blocks = raw.split('================================================\nFILE: ');
  for (const block of blocks.slice(1)) {
    const [headerPlus, ...rest] = block.split('\n================================================\n');
    const header = headerPlus.trim();
    const content = rest.join('\n================================================\n');
    if (header && content) files.push({ path: header, content });
  }
  return files;
}

export const githubIngestTool = createTool({
  id: 'github-ingest',
  description: 'Fetches repository content via gitingest (Solidity/web3 friendly)',
  inputSchema: z.object({
    repoUrl: z.string().url(),
    token: z.string().optional().default(''),
    maxFileSizeMb: z.number().optional().default(50),
    includePattern: z.string().optional().default('*.sol,*.vy,*.js,*.ts,*.json,*.toml,*.yaml,*.yml,*.md,*.txt,*.env'),
  }),
  outputSchema: z.object({
    repoUrl: z.string(),
    summary: z.string().optional(),
    digestUrl: z.string().optional(),
    files: z.array(z.object({ path: z.string(), content: z.string() })),
  }),
  execute: async ({ context }) => {
    const { repoUrl, token = '', maxFileSizeMb = 50, includePattern } = context;
    const resp = await fetch('https://gitingest.com/api/ingest', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        input_text: repoUrl,
        token,
        max_file_size: maxFileSizeMb,
        pattern_type: 'include',
        pattern: includePattern,
      }),
    });

    if (!resp.ok) {
      const text = await resp.text();
      throw new Error(`gitingest error: ${resp.status} ${text}`);
    }

    const data = (await resp.json()) as IngestResponse;
    let files: { path: string; content: string }[] = [];

    if (data.content && data.content.includes('================================================\nFILE:')) {
      files = parseGitingestContent(data.content);
    } else if (data.digest_url) {
      const digest = await fetch(data.digest_url);
      const digestText = await digest.text();
      files = parseGitingestContent(digestText);
    }

    return {
      repoUrl,
      summary: data.summary,
      digestUrl: data.digest_url,
      files,
    };
  },
});