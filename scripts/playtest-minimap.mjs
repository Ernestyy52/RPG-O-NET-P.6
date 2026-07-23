// ================================================================================================
// Minimap browser playtest — drives the REAL game page (title → create character → TownScene)
// and verifies the minimap HUD: appears, tracks player movement, toggle works, no console errors.
// Usage: node scripts/playtest-minimap.mjs  (dev server running; PLAYTEST_URL to override port)
// ================================================================================================
import { chromium } from 'playwright-core'
import { mkdirSync } from 'node:fs'
import { join } from 'node:path'

const BASE = process.env.PLAYTEST_URL ?? 'http://localhost:3000'
const SHOTS = process.env.PLAYTEST_SHOTS ?? '.playtest'
mkdirSync(SHOTS, { recursive: true })

const results = []
const pass = (n, m = '') => results.push({ ok: true, n, m })
const fail = (n, m = '') => results.push({ ok: false, n, m })

async function runPass(browser, { name, viewport, isMobile }) {
  const context = await browser.newContext({ viewport, isMobile, hasTouch: isMobile })
  const page = await context.newPage()
  const errors = []
  page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`))
  page.on('console', (m) => {
    if (m.type() !== 'error') return
    // ERR_CONNECTION_REFUSED = Colyseus multiplayer server ไม่ได้รัน — offline fallback ที่ออกแบบไว้
    // (joinTown/joinDungeon เป็น no-op เมื่อไม่มี server) ไม่ใช่ความผิดของหน้าเกม
    if (m.text().includes('ERR_CONNECTION_REFUSED')) return
    errors.push(`console: ${m.text()}`)
  })

  await page.goto(BASE + '/', { waitUntil: 'domcontentloaded' })

  // title → local profile → character creation → enter game
  // (force: หน้า title มี float/aurora animation ตลอดเวลา — ปุ่มไม่มีวัน "stable" ในสายตา Playwright)
  await page.getByPlaceholder(/Profile name/).fill('MiniMapTester')
  await page.getByRole('button', { name: /Start Adventure|Continue Adventure/ }).click({ force: true })
  await page.getByPlaceholder('Character name').waitFor({ timeout: 15000 })
  await page.getByPlaceholder('Character name').fill('Mapper')
  await page.getByRole('button', { name: 'Enter Game' }).click({ force: true })

  // TownScene boots → publishes minimap layout
  await page.getByTestId('minimap-toggle').waitFor({ timeout: 60000 })
  pass(`${name}: minimap appears when the town scene loads`)
  await page.waitForTimeout(1500) // let Phaser settle + first ticks land
  await page.screenshot({ path: join(SHOTS, `${name}-minimap-town.png`) })

  const snap = () => page.evaluate(() => {
    const c = document.querySelector('[data-testid="minimap-canvas"]')
    return c ? c.toDataURL() : ''
  })
  const before = await snap()
  // walk right for a bit — the player dot must move on the minimap
  await page.keyboard.down('ArrowRight')
  await page.waitForTimeout(1200)
  await page.keyboard.up('ArrowRight')
  await page.waitForTimeout(400)
  const after = await snap()
  if (before && after && before !== after) pass(`${name}: minimap tracks player movement`)
  else fail(`${name}: minimap tracks player movement`, 'canvas identical before/after walking')

  // toggle hide/show
  await page.getByTestId('minimap-toggle').click()
  const hidden = await page.getByTestId('minimap-canvas').isHidden()
  await page.getByTestId('minimap-toggle').click()
  const shown = await page.getByTestId('minimap-canvas').isVisible()
  if (hidden && shown) pass(`${name}: minimap toggle hides and shows`)
  else fail(`${name}: minimap toggle hides and shows`, `hidden=${hidden} shown=${shown}`)

  await context.close()
  return errors
}

const browser = await chromium.launch({ channel: 'msedge', headless: true })
const allErrors = []
allErrors.push(...await runPass(browser, { name: 'desktop', viewport: { width: 1280, height: 800 }, isMobile: false }))
allErrors.push(...await runPass(browser, { name: 'mobile', viewport: { width: 375, height: 667 }, isMobile: true }))
await browser.close()

let hard = 0
for (const r of results) {
  console.log(`${r.ok ? '  ok  ' : '  FAIL'}  ${r.n}${r.m ? ` — ${r.m}` : ''}`)
  if (!r.ok) hard++
}
// dev-server benign noise (favicon 404s ฯลฯ) ยังนับเป็น error จริง — อยากเห็นทั้งหมดก่อนตัดสิน
if (allErrors.length) {
  console.log('\nBrowser errors:')
  for (const e of allErrors) console.log('  ' + e)
}
console.log(`\nMINIMAP PLAYTEST: ${hard === 0 && allErrors.length === 0 ? 'PASS' : 'FAIL'} (${results.length - hard}/${results.length} checks, ${allErrors.length} browser errors)`)
process.exit(hard === 0 && allErrors.length === 0 ? 0 : 1)
