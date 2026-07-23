import fs from 'node:fs'
import { describe, expect, it } from 'vitest'

describe('animated fantasy title screen', () => {
  const page = fs.readFileSync('app/pages/index.vue', 'utf8')
  const css = fs.readFileSync('app/assets/css/main.css', 'utf8')

  it('uses the optimized generated title artwork and animated logo', () => {
    expect(page).toContain('branding/title-background-v2.webp')
    expect(page).toContain('title-logo-lockup')
    expect(css).toContain('@keyframes logoSummon')
    expect(css).toContain('@media (prefers-reduced-motion: reduce)')
  })
})
