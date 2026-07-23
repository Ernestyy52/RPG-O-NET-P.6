// ================================================================================================
// Rested-bonus browser smoke — Phase 8 (ethical retention) gate evidence.
//
// Seeds a save whose lastSeenAt is 24 h old, loads the REAL game page (index), and asserts the
// store accrued the expected rested pool on mount (persisted back to localStorage) with zero
// page errors. Verifies the onMounted checkInRested wiring that unit tests can't reach.
//
// Usage:  node scripts/playtest-rested.mjs            (dev server must be running on :3000)
//         PLAYTEST_URL=... node scripts/playtest-rested.mjs
// Exit 0 = pool accrued exactly as the pure model predicts and zero browser errors.
// ================================================================================================
import { chromium } from 'playwright-core'

const BASE = process.env.PLAYTEST_URL ?? 'http://localhost:3000'
const errors = []
const browser = await chromium.launch({ channel: 'msedge' })
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } })
page.on('pageerror', (e) => errors.push(String(e)))
// Colyseus offline fallback noise is by design (see playtest-minimap) — filter it, keep the rest.
page.on('console', (m) => { if (m.type() === 'error' && !/ERR_CONNECTION_REFUSED/.test(m.text())) errors.push(m.text()) })

await page.goto(BASE, { waitUntil: 'networkidle' })
// Seed: created character, level 7, last played 24 h ago, empty pool.
await page.evaluate(() => {
  const now = Date.now()
  localStorage.setItem('player', JSON.stringify({
    isAuthenticated: true, accountName: 'RestedTester', characterCreated: true, name: 'RestedTester',
    gender: 'male', classId: 'warrior', appearance: { face: 'calm', hair: 'short', color: 'amber' },
    level: 7, exp: 0, gold: 100, gems: 0, currentFloor: 3, hp: 80, mp: 20, skillPoints: 0,
    learnedSkills: [], inventory: {}, equipment: {}, correctAnswers: 0, adventureLog: [],
    dailyDate: '', dailyQuests: [], restedExpPool: 0, lastSeenAt: now - 24 * 3_600_000,
  }))
})
await page.reload({ waitUntil: 'networkidle' })
await page.waitForTimeout(1500)

const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('player') ?? '{}'))
// Expected accrual per app/data/rested.ts: 24 h away ⇒ RESTED_RATE_PER_DAY (25%) of next-level EXP.
const expPerLevel = Math.round(30 * Math.pow(7, 1.45))
const expected = Math.round(expPerLevel * 0.25)
console.log(`pool=${saved.restedExpPool} expected=${expected} lastSeenAt-fresh=${Date.now() - saved.lastSeenAt < 60_000}`)
console.log(`log line: ${(saved.adventureLog ?? []).find((l) => /rested/i.test(l)) ?? '(none)'}`)

const ok = saved.restedExpPool === expected && Date.now() - saved.lastSeenAt < 60_000 && errors.length === 0
console.log(errors.length ? `browser errors: ${errors.join(' | ')}` : 'browser errors: 0')
console.log(ok ? 'RESTED SMOKE: PASS' : 'RESTED SMOKE: FAIL')
await browser.close()
process.exit(ok ? 0 : 1)
