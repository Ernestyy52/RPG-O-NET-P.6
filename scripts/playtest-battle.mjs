// ================================================================================================
// Automated browser playtest — Phase 3 Batch D gate evidence (loadout combat + loadout UI)
//
// Drives the dev-only harness page /dev/battle in a real browser (Edge via playwright-core,
// no browser download needed on Windows). Not a unit test: it answers real questions (stochastic —
// correctness is unknown to the script, exactly like a player guessing), fires real skills, and
// asserts on observable outcomes only.
//
// Usage:  node scripts/playtest-battle.mjs            (dev server must be running on :3000)
//         PLAYTEST_URL=... PLAYTEST_SHOTS=dir node scripts/playtest-battle.mjs
// Exit 0 = all passes green and zero console/page errors.
// ================================================================================================
import { chromium } from 'playwright-core'
import { mkdirSync } from 'node:fs'
import { join } from 'node:path'

const BASE = process.env.PLAYTEST_URL ?? 'http://localhost:3000'
const SHOTS = process.env.PLAYTEST_SHOTS ?? '.playtest'
mkdirSync(SHOTS, { recursive: true })

const results = []
const fail = (name, msg) => results.push({ name, ok: false, msg })
const pass = (name, msg = '') => results.push({ name, ok: true, msg })

async function dismissKnowledgeBreak(page) {
  // Knowledge Break pauses combat behind a centered modal — answer it and continue.
  const breakChoice = page.getByTestId('break-choice').first()
  if (await breakChoice.isVisible().catch(() => false)) {
    await breakChoice.click().catch(() => {})
    await page.getByTestId('break-continue').click({ timeout: 3000 }).catch(() => {})
    return true
  }
  return false
}

/** Fight one battle to the end. Returns observed flags. */
async function fightBattle(page, { clickSkills = true, maxSteps = 160 } = {}) {
  const seen = { correct: false, combo: false, comboGlow: false, statusBadge: false, manualSkill: false, outcome: '' }
  for (let i = 0; i < maxSteps; i++) {
    const outcome = await page.getByTestId('last-outcome').textContent().catch(() => '')
    if (outcome && outcome.trim()) { seen.outcome = outcome.trim(); break }
    if (await dismissKnowledgeBreak(page)) continue

    const log = (await page.getByTestId('battle-log').textContent().catch(() => '')) ?? ''
    if (/Correct/.test(log)) seen.correct = true
    if (/COMBO!/.test(log)) seen.combo = true
    if ((await page.locator('.combo-ready').count()) > 0) seen.comboGlow = true
    if ((await page.locator('.status-badge').count()) > 0) seen.statusBadge = true

    // Occasionally press an enabled skill button manually (players do this too).
    if (clickSkills && i % 6 === 3) {
      const usable = page.locator('[data-testid="skill-btn"]:enabled').first()
      if (await usable.isVisible().catch(() => false)) {
        await usable.click().catch(() => {})
        seen.manualSkill = true
      }
    }

    const choice = page.locator('[data-testid="answer-choice"]:enabled').first()
    if (await choice.isVisible().catch(() => false)) await choice.click().catch(() => {})
    // sample the log right after answering — a killing blow unmounts the HUD before the next loop
    for (let s = 0; s < 4; s++) {
      await page.waitForTimeout(125)
      const l = (await page.getByTestId('battle-log').textContent().catch(() => '')) ?? ''
      if (/Correct/.test(l)) seen.correct = true
      if (/COMBO!/.test(l)) seen.combo = true
    }
  }
  return seen
}

async function runPass(browser, { name, viewport, isMobile }) {
  const context = await browser.newContext({ viewport, isMobile, hasTouch: isMobile })
  const page = await context.newPage()
  const errors = []
  page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`))
  page.on('console', (m) => { if (m.type() === 'error') errors.push(`console: ${m.text()}`) })

  await page.goto(`${BASE}/dev/battle`, { waitUntil: 'domcontentloaded' })
  await page.getByTestId('pick-class').first().waitFor({ timeout: 30000 })

  // ---- Battle playthrough (warrior default loadout) ----
  await page.getByTestId('pick-class').first().click()
  await page.getByTestId('start-battle').click()
  await page.getByTestId('skill-btn').first().waitFor({ timeout: 10000 })
  const skillCount = await page.getByTestId('skill-btn').count()
  if (skillCount === 6) pass(`${name}: loadout bar shows 5+1 buttons`)
  else fail(`${name}: loadout bar shows 5+1 buttons`, `got ${skillCount}`)

  await page.screenshot({ path: join(SHOTS, `${name}-battle-start.png`) })
  const seen = await fightBattle(page)
  await page.screenshot({ path: join(SHOTS, `${name}-battle-end.png`) })

  if (seen.outcome === 'outcome:victory') pass(`${name}: battle reaches victory`)
  else fail(`${name}: battle reaches victory`, `outcome="${seen.outcome}" (correct=${seen.correct})`)
  if (seen.correct) pass(`${name}: correct answer produced a strike log`)
  else fail(`${name}: correct answer produced a strike log`)
  if (seen.combo || seen.comboGlow) pass(`${name}: data-driven combo observed (log=${seen.combo}, glow=${seen.comboGlow})`)
  else fail(`${name}: data-driven combo observed`, 'no COMBO! log and no combo-ready glow during the whole fight')
  if (seen.statusBadge) pass(`${name}: status badges rendered`)
  else fail(`${name}: status badges rendered`)

  // HUD must not overflow horizontally (mobile gate)
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
  if (overflow <= 1) pass(`${name}: no horizontal overflow`)
  else fail(`${name}: no horizontal overflow`, `scrollWidth exceeds viewport by ${overflow}px`)

  // ---- Loadout modal (desktop pass only: same Vue component on mobile) ----
  if (!isMobile) {
    await page.getByTestId('open-skills').click()
    await page.getByText('Preset Builds').waitFor({ timeout: 5000 })

    const equips = page.getByTestId('preset-equip')
    await equips.nth(1).click()
    if ((await equips.nth(1).textContent())?.includes('Equipped')) pass(`${name}: preset equip works`)
    else fail(`${name}: preset equip works`)

    await page.getByTestId('loadout-respec').click()
    if ((await equips.nth(0).textContent())?.includes('Equipped')) pass(`${name}: respec returns to class default`)
    else fail(`${name}: respec returns to class default`)

    // custom edit: toggle one active chip off + another on, then Apply
    const onChip = page.locator('[data-testid="active-chip"].chip-on').first()
    const offChip = page.locator('[data-testid="active-chip"]:not(.chip-on)').first()
    await onChip.click()
    await offChip.click()
    const apply = page.getByTestId('loadout-apply')
    if (await apply.isEnabled()) {
      await apply.click()
      if ((await apply.textContent())?.includes('Saved')) pass(`${name}: custom loadout apply persists`)
      else fail(`${name}: custom loadout apply persists`, 'apply clicked but not marked Saved')
    } else fail(`${name}: custom loadout apply persists`, 'apply button stayed disabled after a valid edit')

    // job unlock at Lv15 expands the pool with job (◆) skills — the harness buttons sit behind the
    // fixed-overlay modal, so close it first, level up, then reopen.
    const poolBefore = await page.getByTestId('active-chip').count()
    await page.getByRole('button', { name: 'Close' }).click()
    await page.getByTestId('set-lv15').click()
    await page.getByTestId('open-skills').click()
    await page.getByTestId('job-pick').first().waitFor({ timeout: 5000 })
    await page.getByTestId('job-pick').first().click()
    const poolAfter = await page.getByTestId('active-chip').count()
    if (poolAfter > poolBefore) pass(`${name}: job choice expands skill pool (${poolBefore} → ${poolAfter})`)
    else fail(`${name}: job choice expands skill pool`, `${poolBefore} → ${poolAfter}`)
    await page.screenshot({ path: join(SHOTS, `${name}-loadout-modal.png`) })
    await page.getByRole('button', { name: 'Close' }).click() // modal has no Escape handler (known a11y gap → Phase 11)

    // ---- Boss smoke: phase banner + Flee disabled + telegraph loop stays alive ----
    await page.getByTestId('heal-full').click()
    await page.getByTestId('start-boss').click()
    await page.getByText(/Phase 1/).waitFor({ timeout: 10000 })
    pass(`${name}: boss fight shows phase banner`)
    const flee = page.getByRole('button', { name: 'Flee' })
    if (await flee.isDisabled()) pass(`${name}: Flee disabled on boss`)
    else fail(`${name}: Flee disabled on boss`)
    for (let i = 0; i < 10; i++) {
      if (await dismissKnowledgeBreak(page)) continue
      const c = page.locator('[data-testid="answer-choice"]:enabled').first()
      if (await c.isVisible().catch(() => false)) await c.click().catch(() => {})
      await page.waitForTimeout(500)
    }
    await page.screenshot({ path: join(SHOTS, `${name}-boss.png`) })
  }

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
  console.log(`${r.ok ? '  ok  ' : '  FAIL'}  ${r.name}${r.msg ? ` — ${r.msg}` : ''}`)
  if (!r.ok) hard++
}
if (allErrors.length) {
  console.log('\nBrowser errors:')
  for (const e of allErrors) console.log('  ' + e)
}
console.log(`\nPLAYTEST: ${hard === 0 && allErrors.length === 0 ? 'PASS' : 'FAIL'} (${results.length - hard}/${results.length} checks, ${allErrors.length} browser errors)`)
process.exit(hard === 0 && allErrors.length === 0 ? 0 : 1)
