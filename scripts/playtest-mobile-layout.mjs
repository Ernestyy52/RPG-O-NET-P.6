// ================================================================================================
// Mobile layout playtest — proves the S0 problem #1 fix on the REAL game page (title → create →
// TownScene): on 390×844 the canvas gets the full screen width, the compact HUD leaves the
// canvas most of the viewport, the minimap floats INSIDE the canvas frame (no HUD overlap),
// every HUD action stays reachable, and the desktop layout is unchanged.
// Usage: node scripts/playtest-mobile-layout.mjs  (dev server running; PLAYTEST_URL to override)
// ================================================================================================
import { chromium } from 'playwright-core'
import { mkdirSync } from 'node:fs'
import { join } from 'node:path'

const BASE = process.env.PLAYTEST_URL ?? 'http://localhost:3000'
const SHOTS = join(process.env.PLAYTEST_SHOTS ?? '.playtest', 'mobile-layout')
mkdirSync(SHOTS, { recursive: true })

const results = []
const pass = (n, m = '') => results.push({ ok: true, n, m })
const fail = (n, m = '') => results.push({ ok: false, n, m })
const check = (cond, n, m = '') => (cond ? pass(n) : fail(n, m))

async function bootToTown(page, name) {
  await page.goto(BASE + '/', { waitUntil: 'domcontentloaded' })
  await page.getByPlaceholder(/Profile name/).fill('LayoutTester')
  await page.getByRole('button', { name: /Start Adventure|Continue Adventure/ }).click({ force: true })
  await page.getByPlaceholder('Character name').waitFor({ timeout: 15000 })
  await page.getByPlaceholder('Character name').fill('Layout')
  await page.getByRole('button', { name: 'Enter Game' }).click({ force: true })
  await page.getByTestId('minimap-toggle').waitFor({ timeout: 60000 })
  await page.waitForTimeout(1500)
  pass(`${name}: boots to TownScene (minimap up)`)
}

const inside = (a, b) => a && b
  && a.x >= b.x - 1 && a.y >= b.y - 1
  && a.x + a.width <= b.x + b.width + 1 && a.y + a.height <= b.y + b.height + 1

const browser = await chromium.launch({ channel: 'msedge', headless: true })
const allErrors = []

for (const cfg of [
  { name: 'mobile-390x844', viewport: { width: 390, height: 844 }, isMobile: true },
  { name: 'desktop-1280x800', viewport: { width: 1280, height: 800 }, isMobile: false },
]) {
  const context = await browser.newContext({ viewport: cfg.viewport, isMobile: cfg.isMobile, hasTouch: cfg.isMobile })
  const page = await context.newPage()
  page.on('pageerror', (e) => allErrors.push(`pageerror: ${e.message}`))
  page.on('console', (m) => {
    if (m.type() !== 'error') return
    if (m.text().includes('ERR_CONNECTION_REFUSED')) return // Colyseus offline fallback (by design)
    allErrors.push(`console: ${m.text()}`)
  })

  await bootToTown(page, cfg.name)
  const canvas = await page.locator('.game-canvas canvas').boundingBox()
  const mapToggle = await page.getByTestId('minimap-toggle').boundingBox()
  const frame = await page.locator('.game-canvas').boundingBox()

  const internalW = await page.$eval('.game-canvas canvas', (c) => c.width)
  if (cfg.isMobile) {
    // S4 contract: mobile portrait internal viewport = 480×640
    check(internalW === 480, `${cfg.name}: internal viewport is portrait 480×640 (S4)`, `canvas.width=${internalW}`)
    // canvas full-bleed width (390 minus the 1px pixel-window borders)
    check(canvas && canvas.width >= 380, `${cfg.name}: canvas gets full screen width (≥380)`, `width=${canvas?.width}`)
    const heroPx = canvas ? (48 * canvas.width) / internalW : 0
    check(heroPx >= 38, `${cfg.name}: hero on-screen ≥38px (26.8 pre-fix → 29.1 layout fix → S4 portrait viewport)`, `${heroPx.toFixed(1)}px`)
    // compact HUD: the game view starts high on the screen
    check(canvas && canvas.y <= 160, `${cfg.name}: compact HUD — canvas starts ≤160px from top`, `y=${canvas?.y}`)
    // whole canvas visible without scrolling
    check(canvas && canvas.y + canvas.height <= 844, `${cfg.name}: canvas fully on screen (no scroll needed)`, `bottom=${canvas ? canvas.y + canvas.height : '—'}`)
    const scrollW = await page.evaluate(() => document.documentElement.scrollWidth)
    check(scrollW <= 391, `${cfg.name}: no horizontal overflow`, `scrollWidth=${scrollW}`)
    // banner hidden on mobile, but every action still reachable
    check(await page.locator('.banner-title').isHidden(), `${cfg.name}: big title banner hidden in compact HUD`)
    for (const label of ['Recreate Character', 'Reset Save', 'Settings']) {
      const el = label === 'Settings' ? page.getByRole('button', { name: 'Settings' }) : page.getByRole('button', { name: label })
      check(await el.first().isVisible(), `${cfg.name}: "${label}" still visible/reachable`)
    }
  } else {
    check(await page.locator('.banner-title').isVisible(), `${cfg.name}: desktop keeps full ornate banner`)
    // S4 contract: desktop internal viewport = 800×600, CSS cap 1000px (hero on screen ~57–60px)
    check(internalW === 800, `${cfg.name}: internal viewport is desktop 800×600 (S4)`, `canvas.width=${internalW}`)
    check(canvas && canvas.width <= 1002, `${cfg.name}: desktop canvas respects the 1000px cap`, `width=${canvas?.width}`)
    const heroPx = canvas ? (48 * canvas.width) / internalW : 0
    check(heroPx >= 28, `${cfg.name}: desktop hero on-screen ≥28px`, `${heroPx.toFixed(1)}px`)
  }

  // minimap floats INSIDE the canvas frame — the S0 "overlaps the title bar" fix, both viewports
  check(inside(mapToggle, frame), `${cfg.name}: minimap sits inside the canvas frame (no HUD overlap)`,
    `toggle=${JSON.stringify(mapToggle)} frame=${JSON.stringify(frame)}`)

  // movement still works with the new layout (canvas keyboard input intact)
  const posBefore = await page.evaluate(() => {
    const c = document.querySelector('[data-testid="minimap-canvas"]')
    return c ? c.toDataURL() : ''
  })
  await page.keyboard.down('ArrowRight')
  await page.waitForTimeout(1000)
  await page.keyboard.up('ArrowRight')
  await page.waitForTimeout(400)
  const posAfter = await page.evaluate(() => {
    const c = document.querySelector('[data-testid="minimap-canvas"]')
    return c ? c.toDataURL() : ''
  })
  check(posBefore && posAfter && posBefore !== posAfter, `${cfg.name}: keyboard movement still works`)

  await page.screenshot({ path: join(SHOTS, `${cfg.name}-town.png`) })
  await context.close()
}

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
console.log(`\nMOBILE LAYOUT PLAYTEST: ${hard === 0 && allErrors.length === 0 ? 'PASS' : 'FAIL'} (${results.length - hard}/${results.length} checks, ${allErrors.length} browser errors)`)
process.exit(hard === 0 && allErrors.length === 0 ? 0 : 1)
