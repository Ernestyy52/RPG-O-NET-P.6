// ================================================================================================
// Stat allocation + menu-group playtest — drives the REAL game page with a seeded level-5 save:
//  - nav is grouped (Character/Journal/World) with every button still present
//  - Status shows 12 unspent points ((5-1)×3), +ATK/+VIT really raise the displayed stats,
//  - allocation persists across a full page reload (localStorage), Reset returns every point
//  - 0 console errors
// Usage: node scripts/playtest-stat-alloc.mjs  (dev server running; PLAYTEST_URL to override)
// ================================================================================================
import { chromium } from 'playwright-core'
import { mkdirSync } from 'node:fs'
import { join } from 'node:path'

const BASE = process.env.PLAYTEST_URL ?? 'http://localhost:3000'
const SHOTS = join(process.env.PLAYTEST_SHOTS ?? '.playtest', 'stat-alloc')
mkdirSync(SHOTS, { recursive: true })

const results = []
const pass = (n, m = '') => results.push({ ok: true, n, m })
const fail = (n, m = '') => results.push({ ok: false, n, m })
const check = (cond, n, m = '') => (cond ? pass(n) : fail(n, m))

// level-5 warrior seeded straight into the town (exercises ensurePlayerDefaults on hydration —
// the blob has NO statAlloc field, like every real pre-v7 save)
const SEED = {
  isAuthenticated: true, accountName: 'AllocTester', characterCreated: true,
  name: 'Alloc', gender: 'male', classId: 'warrior',
  appearance: { face: 'calm', hair: 'short', color: 'amber' },
  level: 5, exp: 0, gold: 90, gems: 0, currentFloor: 1, hp: 120, mp: 40,
  skillPoints: 4, learnedSkills: [], inventory: { potion_s: 2 }, equipment: {},
}

async function stat(page, id) { return Number(await page.getByTestId(id).textContent()) }
async function atkShown(page) {
  return page.evaluate(() => {
    for (const el of document.querySelectorAll('.status-stat')) {
      if (el.textContent?.includes('ATK')) return Number(el.querySelector('.font-bold')?.textContent)
    }
    return -1
  })
}

const browser = await chromium.launch({ channel: 'msedge', headless: true })
const context = await browser.newContext({ viewport: { width: 1280, height: 800 } })
const page = await context.newPage()
const errors = []
page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`))
page.on('console', (m) => {
  if (m.type() !== 'error') return
  if (m.text().includes('ERR_CONNECTION_REFUSED')) return // Colyseus offline fallback (by design)
  errors.push(`console: ${m.text()}`)
})
await context.addInitScript((seed) => {
  if (!localStorage.getItem('player')) localStorage.setItem('player', JSON.stringify(seed))
}, SEED)

await page.goto(BASE + '/', { waitUntil: 'domcontentloaded' })
await page.getByTestId('minimap-toggle').waitFor({ timeout: 60000 })
pass('seeded level-5 save boots straight into town (pre-v7 blob hydrates cleanly)')

// grouped nav — every group + the Status badge with unspent points
for (const g of ['character', 'journal', 'world']) {
  check(await page.getByTestId(`nav-group-${g}`).isVisible(), `nav group "${g}" visible`)
}
check((await page.getByTestId('nav-group-character').textContent())?.includes('12'),
  'Status button badges the 12 unspent points (level 5 → 4×3)')

await page.getByRole('button', { name: /^👤?\s*Status/ }).first().click()
await page.getByTestId('stat-points').waitFor({ timeout: 10000 })
check(await stat(page, 'stat-points') === 12, 'Status shows 12 unspent points', `got ${await stat(page, 'stat-points')}`)
await page.screenshot({ path: join(SHOTS, 'status-before.png') })

const atkBefore = await atkShown(page)
await page.getByTestId('alloc-atk').click()
check(await stat(page, 'alloc-count-atk') === 1, '+ATK allocates a point')
const atkAfter = await atkShown(page)
check(atkAfter === atkBefore + 1, 'displayed ATK actually rises by 1', `${atkBefore} → ${atkAfter}`)

await page.getByTestId('alloc-vit').click()
await page.getByTestId('alloc-vit').click()
check(await stat(page, 'alloc-count-vit') === 2, '+VIT twice allocates 2 points')
check(await stat(page, 'stat-points') === 9, 'points drop to 9 after spending 3')
await page.screenshot({ path: join(SHOTS, 'status-allocated.png') })

// persistence: full reload, reopen Status — allocation must survive
await page.reload({ waitUntil: 'domcontentloaded' })
await page.getByTestId('minimap-toggle').waitFor({ timeout: 60000 })
await page.getByRole('button', { name: /^👤?\s*Status/ }).first().click()
await page.getByTestId('stat-points').waitFor({ timeout: 10000 })
check(await stat(page, 'alloc-count-atk') === 1 && await stat(page, 'alloc-count-vit') === 2,
  'allocation persists across reload (localStorage)')
check(await stat(page, 'stat-points') === 9, 'unspent points persist too')

// free reset returns everything
await page.getByTestId('stat-reset').click()
check(await stat(page, 'stat-points') === 12 && await stat(page, 'alloc-count-atk') === 0,
  'Reset (free) returns all 12 points')
await page.screenshot({ path: join(SHOTS, 'status-reset.png') })

await context.close()
await browser.close()

let hard = 0
for (const r of results) {
  console.log(`${r.ok ? '  ok  ' : '  FAIL'}  ${r.n}${r.m ? ` — ${r.m}` : ''}`)
  if (!r.ok) hard++
}
if (errors.length) {
  console.log('\nBrowser errors:')
  for (const e of errors) console.log('  ' + e)
}
console.log(`\nSTAT-ALLOC PLAYTEST: ${hard === 0 && errors.length === 0 ? 'PASS' : 'FAIL'} (${results.length - hard}/${results.length} checks, ${errors.length} browser errors)`)
process.exit(hard === 0 && errors.length === 0 ? 0 : 1)
