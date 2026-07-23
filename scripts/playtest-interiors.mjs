// Live smoke for the four playable Aethergate interiors.
// Requires the dev server. Captures each room and verifies click-to-walk + attached shadow alignment.
import { chromium } from 'playwright-core'
import { mkdirSync } from 'node:fs'
import { join } from 'node:path'

const BASE = process.env.PLAYTEST_URL ?? 'http://127.0.0.1:3000'
const SHOTS = process.env.PLAYTEST_SHOTS ?? '.playtest/interiors'
mkdirSync(SHOTS, { recursive: true })

const browser = await chromium.launch({ channel: 'msedge', headless: true })
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } })
const errors = []
page.on('pageerror', (error) => errors.push(`pageerror: ${error.message}`))
page.on('console', (message) => {
  if (message.type() === 'error' && !message.text().includes('ERR_CONNECTION')) errors.push(`console: ${message.text()}`)
})

await page.goto(BASE, { waitUntil: 'domcontentloaded' })
await page.getByPlaceholder(/Profile name/).fill('InteriorTester')
await page.getByRole('button', { name: /Start Adventure|Continue Adventure/ }).click({ force: true })
await page.getByPlaceholder('Character name').waitFor({ timeout: 15000 })
await page.getByPlaceholder('Character name').fill('InteriorTester')
await page.getByRole('button', { name: 'Enter Game' }).click({ force: true })
await page.waitForSelector('.game-canvas canvas', { timeout: 60000 })
await page.waitForTimeout(1600)

const results = []
for (const building of ['guild', 'hospital', 'item-shop', 'equipment-shop']) {
  await page.evaluate((id) => {
    const game = window.__game
    game.scene.start('InteriorScene', { building: id, floor: 1, classId: 'warrior' })
  }, building)
  await page.waitForTimeout(900)
  const before = await page.evaluate(() => {
    const scene = window.__game.scene.getScene('InteriorScene')
    return { x: scene.player.x, y: scene.player.y }
  })
  const canvas = await page.locator('.game-canvas canvas').boundingBox()
  if (!canvas) throw new Error('Game canvas has no bounding box')
  await page.mouse.click(canvas.x + canvas.width / 2, canvas.y + canvas.height * 0.43)
  await page.waitForTimeout(650)
  const after = await page.evaluate(() => {
    const scene = window.__game.scene.getScene('InteriorScene')
    return {
      x: scene.player.x, y: scene.player.y,
      shadowX: scene.playerShadow.x, shadowY: scene.playerShadow.y,
      active: scene.scene.isActive(),
    }
  })
  const distance = Math.hypot(after.x - before.x, after.y - before.y)
  const shadowError = Math.hypot(after.shadowX - after.x, after.shadowY - (after.y + 7))
  results.push({ building, active: after.active, clickWalkPx: Number(distance.toFixed(1)), shadowError: Number(shadowError.toFixed(2)) })
  await page.locator('.game-canvas canvas').screenshot({ path: join(SHOTS, `${building}.png`) })
}

await browser.close()
const failed = results.filter((result) => !result.active || result.clickWalkPx < 18 || result.shadowError > 3)
console.table(results)
console.log(`INTERIOR PLAYTEST: ${failed.length || errors.length ? 'FAIL' : 'PASS'} (${errors.length} runtime errors)`)
for (const error of errors) console.log(error)
process.exit(failed.length || errors.length ? 1 : 0)
