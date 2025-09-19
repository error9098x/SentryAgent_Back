# SentryAgent Frontend

A modern Next.js frontend for the SentryAgent AI-powered Web3 security auditing platform.

## Features

🤖 **Multi-Agent Analysis**: Specialized AI agents for different vulnerability types
- **Reentrancy Detection Agent**: CEI pattern violations, missing guards
- **Access Control Agent**: Missing modifiers, unprotected functions  
- **Oracle Manipulation Agent**: Price manipulation, flash loan attacks

🎯 **Web3 Focused**: Designed specifically for smart contract security
- Solidity vulnerability detection
- DeFi protocol analysis
- Real-time scanning progress
- Comprehensive audit reports

⚡ **Modern Stack**: Built with the latest technologies
- Next.js 15 with App Router
- TypeScript for type safety
- Tailwind CSS for styling
- Radix UI components

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm/yarn/pnpm
- Running SentryAgent backend (Mastra agents)

### Installation

1. **Clone and install dependencies:**
```bash
cd sentryagent_frontend
npm install
```

2. **Configure environment:**
```bash
# Create .env.local file
echo "NEXT_PUBLIC_API_URL=http://localhost:4112/api" > .env.local
```

3. **Start development server:**
```bash
npm run dev
```

4. **Open in browser:**
```
http://localhost:3000
```

## Usage

### Starting a Scan

1. **Enter Repository URL**: Provide a GitHub repository URL
2. **Optional Token**: Add GitHub token for private repos or higher rate limits
3. **Select AI Model**: Choose from available models (default: qwen-3-coder-480b)
4. **Start Audit**: Click to begin comprehensive security analysis

### Monitoring Progress

- **Real-time Progress**: Watch scan progress with detailed steps
- **Agent Status**: See which agents are running
- **Time Tracking**: Monitor scan duration

### Viewing Results

- **Executive Summary**: High-level overview of findings
- **Vulnerability Details**: Detailed findings with code snippets
- **Severity Classification**: Critical, High, Medium, Low
- **Recommendations**: Actionable security improvements
- **Export Options**: Download JSON reports

## Architecture

```
src/
├── app/                    # Next.js App Router
│   ├── globals.css        # Global styles
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Main dashboard
├── components/            # React components
│   ├── ui/               # Base UI components
│   ├── ScanForm.tsx      # Repository input form
│   ├── ScanProgress.tsx  # Progress tracking
│   └── AuditReport.tsx   # Results display
├── services/             # API services
│   └── auditService.ts   # Backend communication
├── types/                # TypeScript definitions
│   └── audit.ts          # Audit-related types
└── lib/                  # Utilities
    └── utils.ts          # Helper functions
```

## API Integration

The frontend communicates with the Mastra backend via REST API:

```typescript
// Start scan
POST /api/scan/start
{
  "repoUrl": "https://github.com/owner/repo",
  "token": "optional_github_token",
  "model": "qwen-3-coder-480b"
}

// Check progress  
GET /api/scan/status/{scanId}

// Get report
GET /api/scan/report/{scanId}
```

## Customization

### Adding New Vulnerability Types

1. Update `VulnerabilityFinding` type in `types/audit.ts`
2. Add severity colors in `lib/utils.ts` 
3. Update report display in `AuditReport.tsx`

### Styling

- Uses Tailwind CSS with custom design system
- Dark mode support via CSS variables
- Responsive design for all screen sizes
- Consistent component styling with Radix UI

### Environment Variables

```bash
# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:4112/api

# Development
NODE_ENV=development
```

## Production Deployment

### Build for Production

```bash
npm run build
npm start
```

### Docker Deployment

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

### Vercel Deployment

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

## Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## License

MIT License - see LICENSE file for details

## Support

- 📧 Email: support@sentryagent.dev
- 🐛 Issues: [GitHub Issues](https://github.com/your-org/sentryagent/issues)
- 💬 Discord: [Join our community](https://discord.gg/sentryagent)

---

**Built with ❤️ by the SentryAgent team**