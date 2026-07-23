// Aethergate Town smoke playtest — boots the real game into TownScene, walks spawn→plaza, grabs a
// zoomed-out full-map overview, and captures console/page errors.  node scripts/playtest-town.mjs
import { chromium } from 'playwright-core'
import { mkdirSync } from 'node:fs'
import { join } from 'node:path'
const BASE = process.env.PLAYTEST_URL ?? 'http://localhost:3000'
const SHOTS = process.env.PLAYTEST_SHOTS ?? 'docs/map-rebuild/screenshots'
mkdirSync(SHOTS, { recursive: true })

async function boot(page) {
  await page.goto(BASE, { waitUntil: 'networkidle' })
  await page.fill('input[placeholder^="Profile name"]', 'Mapper')
  await page.getByRole('button', { name: /Start Adventure|Continue Adventure/ }).click()
  await page.getByRole('button', { name: 'Enter Game' }).click().catch(() => {})
  await page.waitForSelector('canvas', { timeout: 60000 })
  await page.waitForTimeout(2600)
}
const shot = (page, name) => page.locator('canvas').first().screenshot({ path: join(SHOTS, name) })
async function walk(page, key, ms) { await page.keyboard.down(key); await page.waitForTimeout(ms); await page.keyboard.up(key); await page.waitForTimeout(250) }

async function run({ name, viewport, isMobile, full }) {
  const browser = await chromium.launch({ channel: 'msedge', headless: true })
  const ctx = await browser.newContext({ viewport, isMobile, hasTouch: isMobile, deviceScaleFactor: 1 })
  const page = await ctx.newPage()
  const errors = []
  page.on('pageerror', (e) => errors.push('pageerror: ' + e.message))
  page.on('console', (m) => { if (m.type() === 'error' && !m.text().includes('ERR_CONNECTION')) errors.push('console: ' + m.text()) })
  await boot(page)
  await page.mouse.click(viewport.width / 2, viewport.height / 2) // focus canvas
  await shot(page, `town-${name}-spawn.png`)
  await walk(page, 'ArrowUp', 3200)
  await shot(page, `town-${name}-north.png`)
  await walk(page, 'ArrowUp', 2600)
  await shot(page, `town-${name}-plaza.png`)
  if (full) {
    // zoom the town camera out to fit the whole world for a single overview frame, then restore
    await page.evaluate(() => {
      const t = window.__game.scene.getScene('TownScene')
      t.cameras.main.setZoom(Math.min(t.scale.width / 2304, t.scale.height / 1536))
      t.cameras.main.centerOn(1152, 768)
    })
    await page.waitForTimeout(500)
    await shot(page, `town-overview.png`)
  }
  await browser.close()
  return errors
}
const errs = []
errs.push(...await run({ name: 'desktop', viewport: { width: 1000, height: 750 }, isMobile: false, full: true }))
errs.push(...await run({ name: 'mobile', viewport: { width: 390, height: 844 }, isMobile: true }))
console.log('\nTOWN PLAYTEST:', errs.length === 0 ? 'PASS (0 errors)' : `FAIL (${errs.length})`)
for (const e of errs) console.log('  ' + e)
process.exit(errs.length ? 1 : 0)
