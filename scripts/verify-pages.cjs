#!/usr/bin/env node
// จำลอง GitHub Pages: serve .output/public ใต้ subpath /RPG-O-NET-P.6/ แล้วตรวจว่า
// หน้าเว็บ + asset ทั้งหมดโหลดได้จริงใต้ base path (ห้ามทดสอบแค่ '/' เพราะไม่เหมือน production)
// ใช้: node scripts/verify-pages.cjs   (ต้อง `npm run generate` ด้วย NUXT_APP_BASE_URL=/RPG-O-NET-P.6/ ก่อน)
const http = require('http')
const fs = require('fs')
const path = require('path')

const BASE = '/RPG-O-NET-P.6/'
const ROOT = path.join(__dirname, '..', '.output', 'public')
const PORT = 4173

const MIME = {
  '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript',
  '.css': 'text/css', '.json': 'application/json', '.png': 'image/png',
  '.jpg': 'image/jpeg', '.webp': 'image/webp', '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon', '.mp3': 'audio/mpeg', '.ogg': 'audio/ogg',
  '.wav': 'audio/wav', '.woff': 'font/woff', '.woff2': 'font/woff2', '.ttf': 'font/ttf',
}

let failures = 0
const fail = (msg) => { failures++; console.error(`  FAIL  ${msg}`) }
const pass = (msg) => console.log(`  ok    ${msg}`)

// GitHub Pages semantics: ไฟล์ตรง path → 200, ไม่พบ → เสิร์ฟ 404.html ด้วย status 404
const server = http.createServer((req, res) => {
  const url = decodeURIComponent(req.url.split('?')[0])
  if (!url.startsWith(BASE) && url !== BASE.slice(0, -1)) {
    res.writeHead(404); res.end('outside base'); return
  }
  let rel = url === BASE.slice(0, -1) ? '' : url.slice(BASE.length)
  let file = path.join(ROOT, rel)
  if (rel === '' || rel.endsWith('/')) file = path.join(file, 'index.html')
  if (!fs.existsSync(file) || !fs.statSync(file).isFile()) {
    const nf = path.join(ROOT, '404.html')
    res.writeHead(404, { 'content-type': 'text/html' })
    res.end(fs.existsSync(nf) ? fs.readFileSync(nf) : 'not found')
    return
  }
  res.writeHead(200, { 'content-type': MIME[path.extname(file).toLowerCase()] || 'application/octet-stream' })
  res.end(fs.readFileSync(file))
})

function get(pathname) {
  return new Promise((resolve, reject) => {
    http.get({ host: '127.0.0.1', port: PORT, path: encodeURI(pathname) }, (res) => {
      const chunks = []
      res.on('data', (c) => chunks.push(c))
      res.on('end', () => resolve({ status: res.statusCode, body: Buffer.concat(chunks).toString('utf8') }))
    }).on('error', reject)
  })
}

function extractRefs(html) {
  const refs = new Set()
  for (const m of html.matchAll(/(?:href|src)="([^"]+)"/g)) refs.add(m[1])
  return [...refs].filter((r) => !r.startsWith('http') && !r.startsWith('data:') && !r.startsWith('#'))
}

async function main() {
  // 0) โครงไฟล์บังคับใน published root
  for (const f of ['index.html', '404.html', '200.html', '.nojekyll']) {
    if (fs.existsSync(path.join(ROOT, f))) pass(`${f} exists`)
    else fail(`${f} missing from .output/public`)
  }

  // 1) index.html ต้องเป็น SPA shell จริง ไม่ใช่ redirect stub และอ้าง asset ใต้ base
  const indexHtml = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8')
  if (!indexHtml.includes('id="__nuxt"')) fail('index.html is not the SPA shell (no #__nuxt)')
  else pass('index.html is SPA shell')

  await new Promise((r) => server.listen(PORT, '127.0.0.1', r))

  // 2) เปิด exact subpath
  const home = await get(BASE)
  home.status === 200 ? pass(`GET ${BASE} → 200`) : fail(`GET ${BASE} → ${home.status}`)

  // 3) ทุก asset ที่ HTML อ้าง ต้องอยู่ใต้ base และโหลดได้ (200)
  for (const page of ['index.html', '404.html', '200.html']) {
    const html = fs.readFileSync(path.join(ROOT, page), 'utf8')
    for (const ref of extractRefs(html)) {
      if (ref.startsWith('/') && !ref.startsWith(BASE)) { fail(`${page} references outside base: ${ref}`); continue }
      const target = ref.startsWith('/') ? ref : BASE + ref
      const res = await get(target)
      if (res.status !== 200) fail(`${page} → ${ref} → HTTP ${res.status}`)
    }
    pass(`${page} asset refs resolve under ${BASE}`)
  }

  // 4) Direct refresh ที่ route ลึก → GitHub Pages เสิร์ฟ 404.html ซึ่งต้องบูตแอปได้
  const deep = await get(BASE + 'some/deep/route')
  if (deep.status === 404 && deep.body.includes('id="__nuxt"')) pass('deep-route refresh serves app shell via 404.html')
  else fail(`deep-route refresh: status ${deep.status}, shell=${deep.body.includes('id="__nuxt"')}`)

  // 5) JS bundle ห้ามมี hardcoded root-absolute path ไปยังโฟลเดอร์ asset ใน public/
  const assetDirs = fs.readdirSync(ROOT).filter((d) => fs.statSync(path.join(ROOT, d)).isDirectory() && d !== '_nuxt')
  const nuxtDir = path.join(ROOT, '_nuxt')
  const rx = new RegExp(`["'\`]/(${assetDirs.join('|')})/`, 'm')
  let bundleHits = 0
  for (const f of fs.readdirSync(nuxtDir)) {
    if (!f.endsWith('.js') && !f.endsWith('.css')) continue
    const src = fs.readFileSync(path.join(nuxtDir, f), 'utf8')
    const m = src.match(rx)
    if (m) { bundleHits++; fail(`_nuxt/${f} hardcodes root-absolute asset path: "${m[0].slice(1)}..."`) }
  }
  if (bundleHits === 0) pass('no hardcoded root-absolute asset paths in _nuxt bundle')

  // 6) sample asset จริงใต้ base (ตัวแทน font/audio/atlas/json/sprite)
  const samples = ['character-sprites/hero-atlas.png', 'favicon.ico']
  for (const s of samples) {
    if (!fs.existsSync(path.join(ROOT, s))) { console.log(`  skip  ${s} (not in output)`); continue }
    const res = await get(BASE + s)
    res.status === 200 ? pass(`GET ${BASE}${s} → 200`) : fail(`GET ${BASE}${s} → ${res.status}`)
  }

  server.close()
  console.log(failures === 0 ? '\nPAGES SIMULATION: PASS' : `\nPAGES SIMULATION: ${failures} FAILURE(S)`)
  process.exit(failures === 0 ? 0 : 1)
}

main().catch((e) => { console.error(e); process.exit(1) })
