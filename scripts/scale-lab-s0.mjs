// ================================================================================================
// Scale S0 — measured baseline capture (CLAUDE_CODE_MOCKUP_SCALE_INTEGRATION_PROMPT Phase S0)
//
// Drives the REAL game (title → create character → TownScene) and records the current-scale
// evidence set: screenshots at spawn / plaza / narrow lane / main (guild) door / one interior,
// on desktop 1280×800 and mobile 390×844, plus measured boot time, FPS sample and JS heap.
// Walk timings derive from TownScene constants (speed 130 px/s, world 1199×608) — approximate
// checkpoints are fine: the purpose is documenting how the CURRENT scale reads, not precision.
//
// Usage: node scripts/scale-lab-s0.mjs   (dev server on :3000; PLAYTEST_URL/PLAYTEST_SHOTS override)
// ================================================================================================
import { chromium } from 'playwright-core'
import { mkdirSync } from 'node:fs'
import { join } from 'node:path'

const BASE = process.env.PLAYTEST_URL ?? 'http://localhost:3000'
const SHOTS = process.env.PLAYTEST_SHOTS ?? '.playtest/s0-baseline'
mkdirSync(SHOTS, { recursive: true })

async function walk(page, key, ms) {
  await page.keyboard.down(key)
  await page.waitForTimeout(ms)
  await page.keyboard.up(key)
  await page.waitForTimeout(250)
}

async function closeAnyDialog(page) {
  // portal/notice dialogs sit above the canvas — Escape or a visible close button dismisses them
  await page.keyboard.press('Escape').catch(() => {})
  const close = page.getByRole('button', { name: /close|ปิด|×|Cancel|ยกเลิก|Not yet|ไว้ก่อน/i }).first()
  if (await close.isVisible().catch(() => false)) await close.click({ force: true }).catch(() => {})
  await page.waitForTimeout(200)
}

async function runPass(browser, { name, viewport, isMobile }) {
  const context = await browser.newContext({ viewport, isMobile, hasTouch: isMobile })
  const page = await context.newPage()
  const errors = []
  page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`))
  page.on('console', (m) => {
    if (m.type() !== 'error' || m.text().includes('ERR_CONNECTION_REFUSED')) return
    errors.push(`console: ${m.text()}`)
  })

  const t0 = Date.now()
  await page.goto(BASE + '/', { waitUntil: 'domcontentloaded' })
  await page.getByPlaceholder(/Profile name/).fill('ScaleLab')
  await page.getByRole('button', { name: /Start Adventure|Continue Adventure/ }).click({ force: true })
  await page.getByPlaceholder('Character name').waitFor({ timeout: 15000 })
  await page.getByPlaceholder('Character name').fill('Surveyor')
  await page.getByRole('button', { name: 'Enter Game' }).click({ force: true })
  await page.getByTestId('minimap-toggle').waitFor({ timeout: 60000 })
  const bootMs = Date.now() - t0
  await page.waitForTimeout(1500)

  // 1) spawn (ART 697,430 → world ≈595,367)
  await page.screenshot({ path: join(SHOTS, `${name}-1-spawn.png`) })

  // 2) plaza — walk up ~0.8 s (stop short of the portal trigger at world y≈164)
  await walk(page, 'ArrowUp', 800)
  await closeAnyDialog(page)
  await page.screenshot({ path: join(SHOTS, `${name}-2-plaza.png`) })

  // 3) narrow lane — walk west toward the item-shop/hospital gap
  await walk(page, 'ArrowLeft', 2000)
  await page.screenshot({ path: join(SHOTS, `${name}-3-lane.png`) })

  // 4) main door — approach the Guild door (world ≈944,176): east then north
  await walk(page, 'ArrowRight', 4800)
  await page.screenshot({ path: join(SHOTS, `${name}-4-guild-door.png`) })
  await walk(page, 'ArrowUp', 900)
  await page.waitForTimeout(2200) // interior scene boot if the trigger caught

  // 5) interior (best effort — if the walk missed the trigger this shows the near-door view instead)
  await page.screenshot({ path: join(SHOTS, `${name}-5-interior.png`) })

  // measured performance sample: rAF FPS over 2 s + JS heap where the browser exposes it
  const perf = await page.evaluate(() => new Promise((resolve) => {
    let frames = 0
    const start = performance.now()
    const tick = () => {
      frames++
      if (performance.now() - start < 2000) requestAnimationFrame(tick)
      else resolve({
        fps: Math.round(frames / ((performance.now() - start) / 1000)),
        heapMB: performance.memory ? Math.round(performance.memory.usedJSHeapSize / 1048576) : null,
      })
    }
    requestAnimationFrame(tick)
  }))

  await context.close()
  return { bootMs, perf, errors }
}

const browser = await chromium.launch({ channel: 'msedge', headless: true })
const desktop = await runPass(browser, { name: 'desktop-1280x800', viewport: { width: 1280, height: 800 }, isMobile: false })
const mobile = await runPass(browser, { name: 'mobile-390x844', viewport: { width: 390, height: 844 }, isMobile: true })
await browser.close()

for (const [label, r] of [['desktop 1280×800', desktop], ['mobile 390×844', mobile]]) {
  console.log(`${label}: boot→town ${r.bootMs}ms, fps ${r.perf.fps}, heap ${r.perf.heapMB ?? 'n/a'}MB, browser errors ${r.errors.length}`)
  for (const e of r.errors) console.log('  ' + e)
}
console.log(`shots in ${SHOTS}`)
const ok = desktop.errors.length === 0 && mobile.errors.length === 0
console.log(ok ? 'S0 BASELINE: PASS' : 'S0 BASELINE: FAIL')
process.exit(ok ? 0 : 1)
