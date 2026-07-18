// ================================================================================================
// Aethergate zone preview playtest — proves the committed CampaignZone data renders into a walkable
// town at the scale contract and every key destination is actually reachable by walking there in a
// live browser (BFS tour), with the real hero atlas, on desktop + mobile, 0 console errors.
// Usage: node scripts/playtest-aethergate.mjs  (dev server running; PLAYTEST_URL to override)
// ================================================================================================
import { chromium } from 'playwright-core'
import { mkdirSync } from 'node:fs'
import { join } from 'node:path'

const BASE = process.env.PLAYTEST_URL ?? 'http://localhost:3000'
const SHOTS = join(process.env.PLAYTEST_SHOTS ?? '.playtest', 'aethergate')
mkdirSync(SHOTS, { recursive: true })

const results = []
const pass = (n, m = '') => results.push({ ok: true, n, m })
const fail = (n, m = '') => results.push({ ok: false, n, m })
const check = (cond, n, m = '') => (cond ? pass(n) : fail(n, m))

const text = (page, id) => page.getByTestId(id).textContent()

async function tour(page, id, name) {
  const started = await page.evaluate((t) => window.__aeth?.tour(t) ?? false, id)
  if (!started) { fail(`${name}: tour ${id} path exists`, 'no BFS path'); return }
  await page.waitForFunction(
    () => document.querySelector('[data-testid="aeth-status"]')?.textContent?.trim() === 'tour-done',
    undefined, { timeout: 20000 },
  ).catch(() => fail(`${name}: tour ${id} completed`, 'timeout'))
  pass(`${name}: walked spawn → ${id} (reachable in-browser)`)
  await page.screenshot({ path: join(SHOTS, `${name}-${id}.png`) })
}

async function runPass(browser, { name, viewport, isMobile }) {
  const context = await browser.newContext({ viewport, isMobile, hasTouch: isMobile })
  const page = await context.newPage()
  const errors = []
  page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`))
  page.on('console', (m) => {
    if (m.type() !== 'error') return
    if (m.text().includes('ERR_CONNECTION_REFUSED')) return
    errors.push(`console: ${m.text()}`)
  })

  await page.goto(BASE + '/dev/aethergate', { waitUntil: 'domcontentloaded' })
  await page.waitForFunction(
    () => document.querySelector('[data-testid="aeth-status"]')?.textContent?.trim() === 'ready',
    undefined, { timeout: 60000 },
  )
  await page.waitForTimeout(600)
  pass(`${name}: zone renders to a walkable town`)

  check((await text(page, 'aeth-buildings')) === '12', `${name}: all 12 buildings drawn`, `got ${await text(page, 'aeth-buildings')}`)
  check((await text(page, 'aeth-portals')) === '6', `${name}: 6 live portals`, `got ${await text(page, 'aeth-portals')}`)
  check((await text(page, 'aeth-herotex')) === 'ok', `${name}: real hero atlas loaded`)
  await page.screenshot({ path: join(SHOTS, `${name}-spawn.png`) })

  if (!isMobile) {
    for (const id of ['landmark', 'door-guild', 'door-hospital', 'door-item-shop', 'gate-tower', 'secret']) {
      await tour(page, id, name)
    }
  } else {
    await tour(page, 'landmark', name)
    await tour(page, 'door-guild', name)
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
console.log(`\nAETHERGATE PREVIEW PLAYTEST: ${hard === 0 && allErrors.length === 0 ? 'PASS' : 'FAIL'} (${results.length - hard}/${results.length} checks, ${allErrors.length} browser errors)`)
process.exit(hard === 0 && allErrors.length === 0 ? 0 : 1)
