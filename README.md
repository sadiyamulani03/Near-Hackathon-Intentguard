# IntentGuard

IntentGuard is a Next.js frontend for Web3 transaction and smart-contract risk assessment. It helps users understand potential risks before interacting with blockchain contracts, wallet addresses, and transactions.

## Implemented features

- **Smart contract security scanner** (`/scan`)
  - Paste Solidity source code into the contract tab.
  - Submits source code to `POST /api/scan` for AI-assisted vulnerability analysis.
  - Displays overall risk level, summary, findings (with severity, evidence, confidence, recommendation), positive signals, limitations, and a disclaimer.
  - Input validation: rejects empty, oversized (>64 KB), or non-object request bodies; 413/400/405/500 error handling.
- **API route** (`/api/scan`, POST)
  - Validates incoming source code, calls the NEAR AI inference endpoint, parses and schema-validates the model JSON output, and returns a sanitized analysis result.
  - Never leaks internal stack traces, provider details, or API keys to the client.
- **Dashboard** (`/dashboard`) — security overview, recent scans, threat breakdown, security analysis, protection features, cross-chain identity widgets.
- **Cross-chain identity page** (`/identity`) — NEAR account ID input, derived-address display, and signature request/verify UI flow (placeholder states).
- **Documentation page** (`/docs`) — routes, implementation status, security disclaimer, and no-endorsements notice.
- **UI components** — header, footer, sidebar, buttons, cards, inputs, scanner panel, finding lists, badges, loading/empty states.
- **Tests** — Vitest unit tests for the scan library and the scan page.

## Unfinished / pending integrations

- **Live AI analysis service** — not connected. `analyzeContract` requires `NEAR_AI_KEY` (set in `.env.local`, never committed) and calls `https://cloud-api.near.ai/v1`. Without a configured key the service returns a `NOT_CONFIGURED` error.
- **Wallet-address intelligence** — the wallet tab validates format but returns a "not connected yet" message; no live RPC or address assessment is wired up.
- **Transaction intelligence** — the transaction tab validates format but returns a "not connected yet" message; no transaction simulation or analysis is implemented.
- **Wallet connection** — the "Connect Wallet" button in the dashboard header is a placeholder; no wallet adapter is integrated.
- **NEAR Chain Signatures** — cross-chain address derivation and signature request/verify are UI-only simulations; no cryptographic derivation or verification is performed.
- **Real blockchain data** — balances, recent scans, and threat scores shown in the dashboard are illustrative/placeholder states.

## Getting Started

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser.

### Environment setup

Create a `.env.local` file (git-ignored, never commit it) with:

```
NEAR_AI_KEY=your_near_ai_api_key
```

The `NEAR_AI_KEY` is required for the AI analysis service to work. Without it, scans return a configuration error.

## Scripts

| Script | Purpose |
|--------|---------|
| `npm run dev` | Start the Next.js dev server (Turbopack) |
| `npm run build` | Production build (includes TypeScript type-checking) |
| `npm run start` | Start the production server |
| `npm run lint` | Run ESLint |
| `npm run test` | Run Vitest tests |

## Security

- `.env*`, `*.pem`, and credential files are excluded from version control via `.gitignore`.
- API keys and private keys must never be committed.
- AI-assisted analysis is not a formal security audit. Do not rely on this platform for financial or security decisions.

## Tech stack

- Next.js 16 (App Router, Turbopack)
- React 19
- Tailwind CSS 4
- TypeScript
- OpenAI SDK (NEAR AI endpoint)
- Vitest + Testing Library
- ESLint
