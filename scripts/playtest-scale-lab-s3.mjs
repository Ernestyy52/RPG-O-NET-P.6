// ================================================================================================
// S3 objective-comparison matrix — identical screenshots for every finalist (hero P0 48px locked
// by S2) across the scale prompt's scenario list, plus hard-gate measurements:
//   full matrix : desktop 1280×800 (V0, V1) · mobile 390×844 (V0 control, MZ, MA)
//   smoke gates : 1440×900, 1024×768 (desktop views) · 360×640 (mobile presets)
// Scenarios: spawn, plaza+NPC stand-ins, 2-tile side lane, main door, night plaza/lane,
// narrowest/widest class at the door, small shop interior, large guild interior.
// Every screenshot self-documents (in-scene overlay: map/tile/hero/zoom/night/class/fps/pos).
// Hard gates checked per view: hero on-screen ≥28px (mobile finalists), fps ≥50, 0 console errors.
// Usage: node scripts/playtest-scale-lab-s3.mjs   (dev server running; PLAYTEST_URL to override)
// ================================================================================================
import { chromium } from 'playwright-core'
import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const BASE = process.env.PLAYTEST_URL ?? 'http://localhost:3000'
const SHOTS = join(process.env.PLAYTEST_SHOTS ?? '.playtest', 's3-matrix')
mkdirSync(SHOTS, { recursive: true })

const results = []
const measurements = []
const pass = (n, m = '') => results.push({ ok: true, n, m })
const fail = (n, m = '') => results.push({ ok: false, n, m })
const check = (cond, n, m = '') => (cond ? pass(n) : fail(n, m))

async function ready(page, timeout = 30000) {
  await page.waitForFunction(
    () => document.querySelector('[data-testid="lab-status"]')?.textContent?.startsWith('ready:'),
    undefined, { timeout },
  )
  await page.waitForTimeout(700)
}

async function click(page, id) { await page.getByTestId(id).click(); await ready(page) }
async function teleport(page, anchor) {
  const ok = await page.evaluate((a) => window.__scaleLab?.teleport(a) ?? false, anchor)
  await page.waitForTimeout(300)
  return ok
}
async function shot(page, name) { await page.screenshot({ path: join(SHOTS, `${name}.png`) }) }
const onScreen = async (page) => Number(await page.getByTestId('hero-onscreen').textContent())
const fpsOf = async (page) => page.evaluate(() => window.__scaleLab?.fps() ?? -1)

/** Full scenario battery for the current view preset (assumes M1 + P0 + warrior_male + day). */
async function scenarios(page, tag, { full }) {
  await shot(page, `${tag}-1-spawn`)
  check(await teleport(page, 'plaza'), `${tag}: teleport plaza`)
  await page.waitForTimeout(700)
  const fps = await fpsOf(page)
  const px = await onScreen(page)
  measurements.push({ tag, heroOnScreenPx: px, fps })
  check(fps >= 50, `${tag}: fps ≥50 at plaza`, `fps=${fps}`)
  await shot(page, `${tag}-2-plaza-npcs`)
  if (!full) return
  check(await teleport(page, 'lane'), `${tag}: teleport lane`)
  await shot(page, `${tag}-3-lane`)
  check(await teleport(page, 'door:guild'), `${tag}: teleport main door`)
  await shot(page, `${tag}-4-door-guild`)
  // night readability (lamp shape cues at doors, not color only)
  await click(page, 'night-toggle')
  await teleport(page, 'plaza')
  await shot(page, `${tag}-5-night-plaza`)
  await teleport(page, 'lane')
  await shot(page, `${tag}-6-night-lane`)
  await click(page, 'night-toggle')
  // narrowest / widest class at the main door
  await click(page, 'class-warrior_female')
  await teleport(page, 'door:guild')
  await shot(page, `${tag}-7-class-narrowest`)
  await click(page, 'class-guardian_male')
  await teleport(page, 'door:guild')
  await shot(page, `${tag}-8-class-widest`)
  await click(page, 'class-warrior_male')
  // interiors (small shop / large guild) — S0 letterbox issue judged per view preset
  await click(page, 'profile-shop')
  await shot(page, `${tag}-9-interior-shop`)
  await click(page, 'profile-guild')
  await teleport(page, 'center')
  await shot(page, `${tag}-10-interior-guild`)
  await click(page, 'profile-M1')
}

async function runPass(browser, { name, viewport, isMobile, views, full }) {
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
  await ready(page, 60000)
  check((await page.getByTestId('hero-tex').textContent())?.trim() === 'ok', `${name}: hero atlas loaded`)

  for (const view of views) {
    if (view !== 'V0') await click(page, `view-${view}`)
    const tag = `${name}-${view}`
    const px = await onScreen(page)
    // mobile finalists must clear the 28px physical hero gate; V0 mobile is the documented control
    if (isMobile && (view === 'MZ' || view === 'MA')) check(px >= 28, `${tag}: hero on-screen ≥28px`, `${px}px`)
    if (!isMobile) check(px >= 28, `${tag}: hero on-screen ≥28px`, `${px}px`)
    await scenarios(page, tag, { full })
    if (view !== 'V0') await click(page, 'view-V0')
  }

  await context.close()
  return errors
}

const browser = await chromium.launch({ channel: 'msedge', headless: true })
const allErrors = []
const passes = [
  { name: 'desktop-1280x800', viewport: { width: 1280, height: 800 }, isMobile: false, views: ['V0', 'V1'], full: true },
  { name: 'mobile-390x844', viewport: { width: 390, height: 844 }, isMobile: true, views: ['V0', 'MZ', 'MA'], full: true },
  { name: 'desktop-1440x900', viewport: { width: 1440, height: 900 }, isMobile: false, views: ['V0', 'V1'], full: false },
  { name: 'desktop-1024x768', viewport: { width: 1024, height: 768 }, isMobile: false, views: ['V0', 'V1'], full: false },
  { name: 'mobile-360x640', viewport: { width: 360, height: 640 }, isMobile: true, views: ['MZ', 'MA'], full: false },
]
for (const p of passes) allErrors.push(...await runPass(browser, p))
await browser.close()

writeFileSync(join(SHOTS, 'measurements.json'), JSON.stringify(measurements, null, 2))
console.log('\n[S3] hero on-screen px + fps per finalist:')
for (const m of measurements) console.log(`  ${m.tag}: hero ${m.heroOnScreenPx}px, fps ${m.fps}`)

let hard = 0
for (const r of results) {
  console.log(`${r.ok ? '  ok  ' : '  FAIL'}  ${r.n}${r.m ? ` — ${r.m}` : ''}`)
  if (!r.ok) hard++
}
if (allErrors.length) {
  console.log('\nBrowser errors:')
  for (const e of allErrors) console.log('  ' + e)
}
console.log(`\nSCALE-LAB S3 MATRIX: ${hard === 0 && allErrors.length === 0 ? 'PASS' : 'FAIL'} (${results.length - hard}/${results.length} checks, ${allErrors.length} browser errors)`)
process.exit(hard === 0 && allErrors.length === 0 ? 0 : 1)
