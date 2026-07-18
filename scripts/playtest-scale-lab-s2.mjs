// ================================================================================================
// S2 scale-lab browser playtest — hero/camera profiles on the REAL hero atlas sprite.
// Proves in a live browser (desktop 1280×800 + mobile 390×844):
//  - hero atlas loads in the lab (no rectangle stand-in, no missing texture)
//  - P0/P1/P2 render + 8-direction cadence walk (screenshot crops per direction for motion
//    inspection — the shimmer judgment evidence MAP_SCALE_DECISION §S2 needs)
//  - hero visual profile does NOT change physics: routes on P2 still measure = analytic table
//  - view presets: V1 (hero 48, 800×600) internal viewport really switches; MZ/MA lift the
//    physical on-screen hero size above the 28px mobile hard gate (values read from the page)
// Usage: node scripts/playtest-scale-lab-s2.mjs   (dev server running; PLAYTEST_URL to override)
// ================================================================================================
import { chromium } from 'playwright-core'
import { mkdirSync } from 'node:fs'
import { join } from 'node:path'

const BASE = process.env.PLAYTEST_URL ?? 'http://localhost:3000'
const SHOTS = join(process.env.PLAYTEST_SHOTS ?? '.playtest', 's2-hero')
mkdirSync(SHOTS, { recursive: true })

const results = []
const pass = (n, m = '') => results.push({ ok: true, n, m })
const fail = (n, m = '') => results.push({ ok: false, n, m })
const note = (n) => console.log('  ' + n)

const text = (page, id) => page.getByTestId(id).textContent()

async function waitStatus(page, t, timeout = 30000) {
  await page.waitForFunction(
    (x) => document.querySelector('[data-testid="lab-status"]')?.textContent?.trim() === x,
    t, { timeout },
  )
}

/** click a hero/view/profile button then wait for the scene (or new game) to come back ready. */
async function switchAndReady(page, buttonId, timeout = 30000) {
  await page.getByTestId(buttonId).click()
  await page.waitForFunction(
    () => document.querySelector('[data-testid="lab-status"]')?.textContent?.startsWith('ready:'),
    undefined, { timeout },
  )
  await page.waitForTimeout(900) // FIT sizing + on-screen readout settle (page re-measures at 600ms)
}

async function heroOnScreen(page) {
  return Number(await text(page, 'hero-onscreen'))
}

/** crop around the canvas center — the camera follows the hero, so the hero is centered. */
async function heroCrop(page, file, w = 200, h = 240) {
  const box = await page.getByTestId('lab-canvas-host').locator('canvas').boundingBox()
  if (!box) { fail(`crop ${file}`, 'canvas not found'); return }
  const clip = {
    x: Math.max(0, box.x + box.width / 2 - w / 2),
    y: Math.max(0, box.y + box.height / 2 - h / 2),
    width: w, height: h,
  }
  await page.screenshot({ path: join(SHOTS, file), clip })
}

async function canvasInternalWidth(page) {
  return page.$eval('[data-testid="lab-canvas-host"] canvas', (c) => c.width)
}

const CADENCE_DIRS = ['E', 'W', 'N', 'S', 'NE', 'NW', 'SE', 'SW']

async function runCadenceWithCrops(page, name, heroId) {
  await page.getByTestId('run-cadence').click()
  for (const dir of CADENCE_DIRS) {
    try {
      await page.waitForFunction(
        (d) => document.querySelector('[data-testid="lab-status"]')?.textContent?.trim() === `cadence:${d}`,
        dir, { timeout: 15000 },
      )
      await page.waitForTimeout(350) // mid-walk of the 0.8s out leg
      await heroCrop(page, `${name}-${heroId}-cadence-${dir}.png`)
    } catch {
      fail(`${name}/${heroId}: cadence direction ${dir} reached`, 'status never showed')
      return
    }
  }
  await page.waitForFunction(
    () => document.querySelector('[data-testid="lab-status"]')?.textContent?.startsWith('cadence-done'),
    undefined, { timeout: 15000 },
  )
  pass(`${name}/${heroId}: cadence walk completed all 8 directions (crops saved)`)
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
  await page.waitForTimeout(900)
  pass(`${name}: scale-lab boots to greybox M1`)

  const tex = (await text(page, 'hero-tex'))?.trim()
  if (tex === 'ok') pass(`${name}: REAL hero atlas loaded (no stand-in)`)
  else fail(`${name}: REAL hero atlas loaded (no stand-in)`, `hero-tex=${tex}`)

  // ---- hero profiles at V0 (current view): on-screen size + spawn screenshot ----
  const sizes = {}
  for (const heroId of ['P0', 'P1', 'P2']) {
    if (heroId !== 'P0') await switchAndReady(page, `hero-${heroId}`)
    sizes[heroId] = await heroOnScreen(page)
    await page.screenshot({ path: join(SHOTS, `${name}-${heroId}-V0-spawn.png`) })
    await heroCrop(page, `${name}-${heroId}-V0-hero.png`)
  }
  note(`[${name}] on-screen hero px @V0: P0=${sizes.P0} P1=${sizes.P1} P2=${sizes.P2} (gate ≥28)`)
  if (sizes.P0 > sizes.P1 && sizes.P1 > sizes.P2) pass(`${name}: hero profiles really change display size`)
  else fail(`${name}: hero profiles really change display size`, JSON.stringify(sizes))
  if (isMobile) {
    // documented hard-gate evidence: on the current view only P0 may survive; P1/P2 must fail
    if (sizes.P1 < 28 && sizes.P2 < 28) pass(`${name}: V0 mobile P1/P2 below 28px gate (documented analytic expectation)`)
    else fail(`${name}: V0 mobile P1/P2 below 28px gate (documented analytic expectation)`, JSON.stringify(sizes))
    note(`[${name}] V0 P0 mobile gate ${sizes.P0 >= 28 ? 'PASS' : 'FAIL'} at ${sizes.P0}px (analytic 29.3 on bare 390px)`)
  }

  if (!isMobile) {
    // ---- physics invariance: on the smallest hero (still P2 selected) routes must match analytic ----
    await page.getByTestId('run-key').click()
    await page.waitForFunction(
      () => document.querySelector('[data-testid="lab-status"]')?.textContent?.startsWith('queue-done'),
      undefined, { timeout: 180000 },
    )
    const rows = await page.$$eval('[data-testid="route-row"]', (els) => els.map((el) => ({
      route: el.dataset.route, measured: Number(el.dataset.measured), analytic: Number(el.dataset.analytic),
    })))
    let bad = 0
    for (const r of rows) {
      const tol = Math.max(0.6, r.analytic * 0.15)
      if (r.measured < 0 || Math.abs(r.measured - r.analytic) > tol) {
        bad++
        fail(`${name}: P2 route ${r.route} time unchanged by visual profile`, `${r.measured}s vs ${r.analytic}s`)
      }
    }
    if (rows.length && bad === 0) pass(`${name}: hero visual profile does NOT change walk physics (P2 routes = analytic)`)
    note(`[${name}] P2 routes: ` + rows.map((r) => `${r.route}=${r.measured}s/${r.analytic}s`).join('  '))

    // ---- cadence walk crops for every hero profile (motion inspection evidence) ----
    for (const heroId of ['P0', 'P1', 'P2']) {
      await switchAndReady(page, `hero-${heroId}`)
      await runCadenceWithCrops(page, name, heroId)
    }
    await switchAndReady(page, 'hero-P0')

    // ---- V1: keep hero 48, larger internal viewport 800×600 ----
    await switchAndReady(page, 'view-V1')
    const w = await canvasInternalWidth(page)
    if (w === 800) pass(`${name}: V1 internal viewport really 800×600`)
    else fail(`${name}: V1 internal viewport really 800×600`, `canvas.width=${w}`)
    const v1 = await heroOnScreen(page)
    note(`[${name}] V1 on-screen hero: ${v1}px (analytic 64 @ full 1280×800 container)`)
    if (v1 >= 28) pass(`${name}: V1 hero stays readable (≥28px)`)
    else fail(`${name}: V1 hero stays readable (≥28px)`, `${v1}px`)
    await page.screenshot({ path: join(SHOTS, `${name}-P0-V1-spawn.png`) })
    await heroCrop(page, `${name}-P0-V1-hero.png`)
    await switchAndReady(page, 'view-V0')
  } else {
    // ---- P3-adaptive mobile presets (P0 hero): MZ zoom + MA portrait viewport ----
    await switchAndReady(page, 'hero-P0')
    for (const [viewId, minPx] of [['MZ', 30], ['MA', 30]]) {
      await switchAndReady(page, `view-${viewId}`)
      const px = await heroOnScreen(page)
      note(`[${name}] ${viewId} on-screen hero: ${px}px`)
      if (px >= minPx) pass(`${name}: ${viewId} clears the mobile readability gate (≥${minPx}px)`)
      else fail(`${name}: ${viewId} clears the mobile readability gate (≥${minPx}px)`, `${px}px`)
      await page.screenshot({ path: join(SHOTS, `${name}-P0-${viewId}-spawn.png`) })
      await heroCrop(page, `${name}-P0-${viewId}-hero.png`)
    }
    const w = await canvasInternalWidth(page)
    if (w === 480) pass(`${name}: MA portrait-adaptive internal viewport really 480×(fit)`)
    else fail(`${name}: MA portrait-adaptive internal viewport really 480×(fit)`, `canvas.width=${w}`)
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
console.log(`\nSCALE-LAB S2 PLAYTEST: ${hard === 0 && allErrors.length === 0 ? 'PASS' : 'FAIL'} (${results.length - hard}/${results.length} checks, ${allErrors.length} browser errors)`)
process.exit(hard === 0 && allErrors.length === 0 ? 0 : 1)
