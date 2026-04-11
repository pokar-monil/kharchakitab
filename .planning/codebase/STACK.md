# Technology Stack

**Analysis Date:** 2026-04-12

## Languages

**Primary:**
- TypeScript 6.0.2 - Type-safe JavaScript for all application code
- CSS (Tailwind CSS v4) - Utility-first styling with custom design system

**Target Environment:**
- ES2022 - Modern JavaScript compilation target

## Runtime

**Server:**
- Node.js - Custom `server.ts` WebSocket server runs on Node.js
- Next.js Runtime - API routes use Node.js runtime (`export const runtime = "nodejs"`)

**Client:**
- Browser - Progressive Web App (PWA) targeting modern browsers

**Build:**
- Next.js 16.2.1 - Full-stack React framework
- Bundler resolution: `bundler` mode in TypeScript

## Frameworks

**Core:**
- Next.js 16.2.1 - React framework with App Router
- React 19.2.4 - UI library

**Styling:**
- Tailwind CSS v4 with `@tailwindcss/postcss` - Utility-first CSS
- Custom design system "Ink & Ember" in `app/globals.css`

**Animation:**
- Framer Motion 12.38.0 - Declarative animations
- CSS animations - Performance-critical animations (GPU-accelerated)

**Icons:**
- Lucide React 1.6.0 - Icon library

**UI Components:**
- Headless UI React 2.2.9 - Accessible UI primitives
- Driver.js 1.4.0 - Onboarding tooltips

**PWA:**
- `@tanstack/react-virtual` 3.13.23 - Virtual scrolling for lists
- `idb` 8.0.3 - IndexedDB wrapper for offline storage

**AI Integration:**
- `ai` 6.0.138 - AI SDK for streaming responses
- `@ai-sdk/google` 3.0.53 - Google AI provider

## Key Dependencies

**Core Infrastructure:**
- `ws` 8.20.0 - WebSocket server for real-time sync
- `dotenv` 17.4.0 - Environment variable loading

**Data Processing:**
- `zod` 4.3.6 - Schema validation
- `browser-image-compression` 2.0.2 - Image compression for uploads
- `heic2any` 0.0.4 - HEIC image format conversion

**Rate Limiting:**
- `@upstash/ratelimit` 2.0.8 - Rate limiting middleware
- `@upstash/redis` 1.37.0 - Redis client for Upstash

**Analytics:**
- `posthog-js` 1.363.4 - Client-side analytics
- `posthog-node` 5.28.5 - Server-side analytics

**Content:**
- `@mdx-js/mdx` 3.1.0 - Markdown processing
- `gray-matter` 4.0.3 - Frontmatter parsing
- `reading-time` 1.5.0 - Reading time calculation

**Identity:**
- `@fingerprintjs/fingerprintjs` 5.1.0 - Device fingerprinting

**Utilities:**
- `concurrently` 9.2.1 - Run multiple processes
- `tsx` 4.21.0 - TypeScript execution for server

## Dev Tools

**Build:**
- `tsx` 4.21.0 - TypeScript runner for server scripts
- `postcss` 8 - CSS processing

**Type Checking:**
- TypeScript 6.0.2 (strict mode, noUnusedLocals, noUnusedParameters)
- `@types/ws` 8.18.1 - TypeScript types for WebSocket

**Linting:**
- ESLint 10 with `eslint-config-next/core-web-vitals` and `eslint-config-next/typescript`
- `knip` 6.0.5 - Unused code detection

**Video:**
- `@remotion/cli` 4.0.438 - Video rendering with Remotion

## Scripts

| Command | Purpose |
|---------|---------|
| `npm run dev` | Start dev mode with `concurrently` running WebSocket server + Next.js |
| `npm run build` | Production build with `next build` |
| `npm run start` | Start production Next.js server |
| `npm run server` | Start WebSocket server with `tsx server.ts` |
| `npm run lint` | Run ESLint |
| `npm run knip` | Run unused code detection |
| `npm run remotion:preview` | Preview Remotion video |
| `npm run remotion:render` | Render Remotion video |

## Configuration Files

- `tsconfig.json` - TypeScript config (strict mode, ES2022 target, bundler resolution)
- `next.config.ts` - Next.js config with security headers and PostHog rewrites
- `postcss.config.mjs` - PostCSS with Tailwind CSS v4
- `eslint.config.mjs` - ESLint with Next.js core web vitals
- `.env` - Environment variables (not committed, contains secrets)

## Path Aliases

- `@/*` maps to project root (e.g., `@/src/lib` → `src/lib`)

---

*Stack analysis: 2026-04-12*
