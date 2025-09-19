# Web3 Security Audit Tool

A JavaScript tool to run Web3 security audits using Mastra workflows on deployed smart contract repositories.

## Features

- 🔍 **Comprehensive Security Analysis** - Scans for reentrancy, access control, and oracle manipulation vulnerabilities
- 🚀 **Easy to Use** - Simple command-line interface
- 📊 **Detailed Reports** - Structured output with severity levels and remediation advice
- 🎨 **Color-coded Output** - Easy to read console output with status indicators
- ⚡ **Real-time Monitoring** - Live progress tracking during audit execution

## Quick Start

### Basic Usage

```bash
# Run audit on default repository (YieldNest)
node run-audit.js

# Run advanced audit with colored output
node run-audit-advanced.js
```

### Advanced Usage

```bash
# Audit a specific repository
node run-audit-advanced.js --repo https://github.com/user/repo

# Use custom scan ID
node run-audit-advanced.js --scan-id my-custom-scan

# Use GitHub token for private repositories
node run-audit-advanced.js --token ghp_your_token_here

# Skip security analysis (structure only)
node run-audit-advanced.js --no-security

# Show help
node run-audit-advanced.js --help
```

## What It Does

The audit tool performs a comprehensive security analysis of Web3 smart contracts:

1. **Repository Fetching** - Downloads and analyzes the codebase
2. **Structure Analysis** - Identifies languages, frameworks, and file types
3. **Vulnerability Scanning** - Uses specialized AI agents to detect:
   - Reentrancy vulnerabilities
   - Access control issues
   - Oracle manipulation risks
   - Common smart contract security flaws
4. **Report Generation** - Creates detailed findings with:
   - Severity levels (Critical, High, Medium, Low)
   - File locations and line numbers
   - Code snippets
   - Remediation recommendations
   - Confidence scores

## Output Example

```
🔍 WEB3 SECURITY AUDIT TOOL
================================

Repository: https://github.com/error9098x/yieldnest
Workflow: web3AuditWorkflow
Scan ID: audit-1757656029123
---

📝 Creating workflow run...
✅ Run created successfully
Run ID: abc123-def456-ghi789

🚀 Starting workflow execution...
✅ Workflow started successfully

⏳ Monitoring workflow progress...
Status: running
.....................
✅ Workflow completed successfully!

📋 Fetching audit report...

================================================================================
🎯 WEB3 SECURITY AUDIT REPORT
================================================================================

Summary: Scanned 45 files (12 Solidity). Found 3 vulnerabilities (crit:0, high:1, med:1, low:1).

Statistics:
Files Scanned: 45
Solidity Files: 12
Total Vulnerabilities: 3

Vulnerabilities by Severity:
  Critical: 0
  High: 1
  Medium: 1
  Low: 1

Languages Detected:
  Solidity: 12 files
  TypeScript: 25 files
  JavaScript: 8 files

Security Issues:

1. [HIGH] Missing Access Control
   File: contracts/YieldNest.sol:45
   Description: Function can be called by any address
   Code: function withdraw() public {
   Remediation: Add onlyOwner modifier
   Confidence: 95.0%

2. [MEDIUM] Potential Reentrancy
   File: contracts/Strategy.sol:78
   Description: External call before state update
   Code: token.transfer(msg.sender, amount);
   Remediation: Use checks-effects-interactions pattern
   Confidence: 80.0%

General Recommendations:
1. Add ReentrancyGuard and follow CEI (checks-effects-interactions).
2. Replace tx.origin-based auth with msg.sender + Ownable/AccessControl.
3. Restrict delegatecall/strategy setters with onlyOwner and validation.
```

## Requirements

- Node.js 14.0.0 or higher
- Internet connection
- Valid repository URL

## Files

- `run-audit.js` - Basic audit script
- `run-audit-advanced.js` - Advanced script with colored output and options
- `package.json` - Node.js package configuration

## API Endpoints

The tool uses the following Mastra API endpoints:

- `POST /api/workflows/web3AuditWorkflow/create-run` - Create workflow run
- `POST /api/workflows/web3AuditWorkflow/start` - Start workflow execution
- `GET /api/workflows/web3AuditWorkflow/runs/{runId}` - Check status
- `GET /api/workflows/web3AuditWorkflow/runs/{runId}/execution-result` - Get results

## Troubleshooting

### Common Issues

1. **"runId required to start run"** - Make sure to create a run first, then start it
2. **Connection timeout** - Check your internet connection and the Mastra server status
3. **Repository not found** - Verify the repository URL is correct and accessible
4. **Authentication failed** - For private repos, provide a valid GitHub token

### Debug Mode

For detailed debugging, you can modify the scripts to add more verbose logging:

```javascript
// Add this to see raw API responses
console.log('API Response:', JSON.stringify(response, null, 2));
```

## Contributing

Feel free to submit issues and enhancement requests!

## License

MIT License - see LICENSE file for details.

