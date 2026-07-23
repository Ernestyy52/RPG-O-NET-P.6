// ================================================================================================
// S1 scale-lab browser playtest — drives /dev/scale-lab: renders greybox M0/M1/M2, walks with the
// keyboard (movement must actually move), auto-runs timed routes and checks the measured wall-clock
// seconds against the analytical routeSec table (tolerance: max(0.6s, 15%)). Screenshots every
// profile at desktop 1280×800 + mobile 390×844 (the matrix MAP_BUILD_STATE NEXT ACTION #2 asks for).
// Usage: node scripts/playtest-scale-lab.mjs  (dev server running; PLAYTEST_URL to override)
// ================================================================================================
import { chromium } from 'playwright-core'
import { mkdirSync } from 'node:fs'
import { join } from 'node:path'

const BASE = process.env.PLAYTEST_URL ?? 'http://localhost:3000'
const SHOTS = join(process.env.PLAYTEST_SHOTS ?? '.playtest', 's1-greybox')
mkdirSync(SHOTS, { recursive: true })

const results = []
const pass = (n, m = '') => results.push({ ok: true, n, m })
const fail = (n, m = '') => results.push({ ok: false, n, m })

async function waitStatus(page, text, timeout = 30000) {
  await page.waitForFunction(
    (t) => document.querySelector('[data-testid="lab-status"]')?.textContent?.trim() === t,
    text, { timeout },
  )
}

async function readRows(page) {
  return page.$$eval('[data-testid="route-row"]', (els) => els.map((el) => ({
    route: el.dataset.route,
    measured: Number(el.dataset.measured),
    analytic: Number(el.dataset.analytic),
    inBand: el.dataset.inband === '1',
  })))
}

async function runRoutesAndCheck(page, name, profile, which, expectedCount) {
  await page.getByTestId(which).click()
  // longest full set ≈ 75s of real walking — wait generously
  await waitStatus(page, `queue-done:${profile}`, 180000)
  const rows = await readRows(page)
  if (rows.length === expectedCount) pass(`${name}/${profile}: ${which} completed ${expectedCount} routes`)
  else fail(`${name}/${profile}: ${which} completed ${expectedCount} routes`, `got ${rows.length}`)
  let bad = 0
  for (const r of rows) {
    const tol = Math.max(0.6, r.analytic * 0.15)
    if (r.measured < 0 || Math.abs(r.measured - r.analytic) > tol) {
      bad++
      fail(`${name}/${profile}: ${r.route} measured≈analytic`, `measured ${r.measured}s vs analytic ${r.analytic}s (tol ${tol.toFixed(1)})`)
    }
  }
  if (bad === 0) pass(`${name}/${profile}: all measured times match analytic table (±max(0.6s,15%))`)
  const inBand = rows.filter((r) => r.inBand).length
  console.log(`  [${name}/${profile}] in-band ${inBand}/${rows.length}: ` + rows.map((r) => `${r.route}=${r.measured}s${r.inBand ? '✓' : '✗'}`).join('  '))
  return rows
}

async function runPass(browser, { name, viewport, isMobile }) {
  const context = await browser.newContext({ viewport, isMobile, hasTouch: isMobile })
  const page = await context.newPage()
  const errors = []
  page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`))
  page.on('console', (m) => {
    if (m.type() !== 'error') return
    if (m.text().includes('ERR_CONNECTION_REFUSED')) return // Colyseus offline fallback (by design)
    errors.push(`console: ${m.text()}`)
  })

  await page.goto(BASE + '/dev/scale-lab', { waitUntil: 'domcontentloaded' })
  await waitStatus(page, 'ready:M1', 60000)
  pass(`${name}: scale-lab boots to greybox M1`)

  for (const profile of ['M0', 'M1', 'M2']) {
    await page.getByTestId(`profile-${profile}`).click()
    await waitStatus(page, `ready:${profile}`, 30000)
    await page.waitForTimeout(500)
    await page.screenshot({ path: join(SHOTS, `${name}-${profile}-spawn.png`) })

    // manual walk: up from the south gate into town — pos readout must change
    const before = await page.getByTestId('player-pos').textContent()
    await page.keyboard.down('ArrowUp')
    await page.waitForTimeout(800)
    await page.keyboard.up('ArrowUp')
    await page.waitForTimeout(300)
    const after = await page.getByTestId('player-pos').textContent()
    if (before !== after) pass(`${name}/${profile}: keyboard walk moves the hero`)
    else fail(`${name}/${profile}: keyboard walk moves the hero`, `pos stuck at ${before}`)

    // desktop: full 8-route matrix on candidate M1, key routes elsewhere; mobile: key routes on M1 only
    if (!isMobile && profile === 'M1') await runRoutesAndCheck(page, name, profile, 'run-all', 8)
    else if (!isMobile) await runRoutesAndCheck(page, name, profile, 'run-key', 2)
    else if (profile === 'M1') await runRoutesAndCheck(page, name, profile, 'run-key', 2)

    await page.screenshot({ path: join(SHOTS, `${name}-${profile}-after.png`) })
  }

  await context.close()
  return errors
}

const browser = await chromium.launch({ channel: 'msedge', headless: true })
const allErrors = []
allErrors.push(...await runPass(browser, { name: 'desktop-1280x800', viewport: { width: 1280, height: 800 }, isMobile: false }))
allErrors.push(...await runPass(browser, { name: 'mobile-390x844', viewport: { width: 390, height: 844 }, isMobile: true }))
await browser.close()

let hard = 0
for (const r of results) {
  console.log(`${r.ok ? '  ok  ' : '  FAIL'}  ${r.n}${r.m ? ` — ${r.m}` : ''}`)
  if (!r.ok) hard++
}
if (allErrors.length) {
  console.log('\nBrowser errors:')
  for (const e of allErrors) console.log('  ' + e)
}
console.log(`\nSCALE-LAB PLAYTEST: ${hard === 0 && allErrors.length === 0 ? 'PASS' : 'FAIL'} (${results.length - hard}/${results.length} checks, ${allErrors.length} browser errors)`)
process.exit(hard === 0 && allErrors.length === 0 ? 0 : 1)
