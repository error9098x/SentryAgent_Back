export interface CodeSnippet {
  file: string;
  lineStart: number;
  lineEnd: number;
  code: string;
  language: string;
}

export interface VulnerabilityFinding {
  id: string;
  type: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  title: string;
  description: string;
  codeSnippet: CodeSnippet;
  problem: string;
  recommendation: string;
  references?: string[];
}

export interface AgentOutput {
  agentName: string;
  findings: VulnerabilityFinding[];
  scanDuration: number;
  filesAnalyzed: number;
}


