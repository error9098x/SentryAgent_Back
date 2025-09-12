import { Mastra } from '@mastra/core/mastra';
import { PinoLogger } from '@mastra/loggers';
import { LibSQLStore } from '@mastra/libsql';
import { weatherWorkflow } from './workflows/weather-workflow';
import { weatherAgent } from './agents/weather-agent';
import { web3AuditWorkflow } from './workflows/web3-audit-workflow';
import { Agent } from '@mastra/core/agent';
import { cerebras } from '@ai-sdk/cerebras';
import { reentrancyAgent } from './agents/reentrancy-agent';
import { accessControlAgent } from './agents/access-control-agent';
import { oracleManipulationAgent } from './agents/oracle-agent';

// Create the SolidityVulnAgent (legacy fallback)
const MODEL_ID = process.env.AI_MODEL_ID || 'qwen-3-coder-480b';
const getModel = () => cerebras(MODEL_ID);

const solidityVulnAgent = new Agent({
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

export const mastra = new Mastra({
  workflows: { weatherWorkflow, web3AuditWorkflow },
  agents: { 
    weatherAgent, 
    solidityVulnAgent,
    reentrancyAgent,
    accessControlAgent,
    oracleManipulationAgent
  },
  storage: new LibSQLStore({ url: ':memory:' }),
  logger: new PinoLogger({ name: 'Mastra', level: 'info' }),
});
