# ENVIRONMENT REQUIREMENTS (Phase 00)

## Toolchain

- **Node.js:** 20 LTS or newer (Nuxt 4 / Nitro 2.13 / Vite 7 require Node ≥ 20.19 or ≥ 22.12). Verified building on the maintainer's Windows 11 machine.
- **Package manager:** npm (repo ships `package-lock.json`). `postinstall` runs `nuxt prepare`.
- **OS:** developed on Windows 11 (PowerShell primary shell; Git Bash also available). CRLF/LF autocrlf warnings are expected and cosmetic.

## Commands

| Purpose | Command | Notes |
|---|---|---|
| Install | `npm install` | root app deps |
| Dev server | `npm run dev` | Nuxt dev (Phaser HMR) |
| Production build | `npm run build` | static, `.output/public` (~24 MB) |
| Static site | `npm run generate` | GitHub Pages export |
| Preview build | `npm run preview` / `npx serve .output/public` | |
| Tests | *(none yet)* | added in Phase 03 (Vitest planned) |

### Realtime server (optional)
```bash
cd server && npm install && npm start   # ws://localhost:2567 (Colyseus)
```
Point the web app at it via `NUXT_PUBLIC_COLYSEUS_URL=ws://localhost:2567` (empty ⇒ offline).

## Environment variables (`.env`, not committed — `.env.example` is)

| Var | Purpose | Default |
|---|---|---|
| `NUXT_APP_BASE_URL` | GitHub Pages subpath (e.g. `/RPG-O-NET-P.6/`) | `/` |
| `NUXT_PUBLIC_SHEETS_API_URL` | Google Apps Script save/leaderboard endpoint | `''` (sync disabled) |
| `NUXT_PUBLIC_COLYSEUS_URL` | Colyseus realtime server URL | `''` (offline) |

> `.env` and `.env.*` are gitignored (except `.env.example`). **Do not commit secrets, `node_modules`, `.output`, `.nuxt`, or local backups.** Verified: `git check-ignore` confirms `.env`, `node_modules`, `server/node_modules`, `.output`, `.nuxt` are ignored.

## Hosting / deploy

- Static export to GitHub Pages; deploy via GitHub Actions pushing to branch `gh-pages` (Pages source = "Deploy from a branch"). Asset paths **must** go through `assetPath()` / `app.baseURL` — never hardcode a leading `/` (breaks under the Pages subpath).

## External services / credentials status

- **None required to build or run offline single-player.** Google Sheets sync and Colyseus multiplayer are optional and degrade gracefully when their env vars are empty. Any real account DB / hosted realtime infra is deferred to MMORPG Phases 19–24 and would be an owner-decision blocker (payment/credentials).
