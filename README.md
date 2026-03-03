# Avalon

Mobile-first, real-time web implementation of *The Resistance: Avalon* using Next.js 14 and PartyKit.

## Stack

- Next.js 14 App Router
- React + TypeScript
- PartyKit room server for authoritative game state
- Zustand for client-side room/session state
- Tailwind CSS for styling
- Vitest + Playwright for tests

## Getting Started

1. Install dependencies with your preferred npm-compatible package manager.
2. Copy `.env.example` to `.env.local` and adjust the PartyKit host if needed.
3. Run the web app and PartyKit server in separate terminals:

```bash
npm run dev:web
npm run dev:party
```

The original implementation plan targeted `pnpm`, but the scripts are plain npm scripts and work with `npm`, `pnpm`, or `yarn`.

## Commands

```bash
npm run dev
npm run dev:web
npm run dev:party
npm run build
npm run lint
npm run test:unit
npm run test:e2e
```

## Environment Variables

| Variable | Purpose |
| --- | --- |
| `NEXT_PUBLIC_PARTYKIT_HOST` | PartyKit host and port |
| `NEXT_PUBLIC_PARTYKIT_PROTOCOL` | `ws` for local, `wss` for production |
| `NEXT_PUBLIC_ENABLE_DEV_CONTROLS` | Enables local-only room debug tools |

## Architecture Notes

- PartyKit owns all authoritative room state and broadcasts sanitized per-player snapshots.
- The web app stores only room connection state, ephemeral UI state, and reconnect identity.
- Rooms are ephemeral. There is no persistence, account system, or match history in v1.
- Team votes are public. Quest votes are anonymous and only revealed as counts.

## Deployment

- Deploy the Next.js app to Vercel.
- Deploy `party/game.ts` with PartyKit.
- Set the public PartyKit host in the frontend environment.

## Known Limitations

- The room server is purely in-memory.
- Placeholder role art is used by default.
- Development in this workspace could not install dependencies because outbound package registry access was unavailable during implementation.

