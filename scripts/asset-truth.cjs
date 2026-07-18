#!/usr/bin/env node
// Asset Truth Pipeline (Master Plan Phase 2) — สร้าง machine-readable registry ของทุกไฟล์ใน public/
// พร้อม validate: broken reference, case mismatch, duplicate hash, unused, root-absolute misuse
// ใช้: node scripts/asset-truth.cjs   → เขียน docs/ASSET_REGISTRY.json, exit 1 เมื่อพบ error จริง
const fs = require('fs')
const path = require('path')
const crypto = require('crypto')

const ROOT = path.join(__dirname, '..')
const PUBLIC = path.join(ROOT, 'public')

// provenance ต่อโฟลเดอร์บนสุด — ตรงกับ docs/ASSET_MANIFEST.md
const PROVENANCE = {
  'tiny-town': { source: 'Kenney Tiny Town', license: 'CC0' },
  'tiny-dungeon': { source: 'Kenney Tiny Dungeon', license: 'CC0' },
  'dungeon-assets': { source: 'Kenney', license: 'CC0' },
  'character-sprites': { source: 'inherited onet-game-2569 (reviewed)', license: 'project' },
  'character-icons': { source: 'inherited onet-game-2569 (reviewed)', license: 'project' },
  'character-assets': { source: 'inherited onet-game-2569 (reviewed)', license: 'project' },
  'mob-sprites': { source: 'Main Character Asset pack (licensed)', license: 'licensed' },
  'npc-sprites': { source: 'Craftpix (licensed, curated)', license: 'licensed' },
  'npc': { source: 'Craftpix (licensed)', license: 'licensed' },
  'world1-props': { source: 'Craftpix (licensed)', license: 'licensed' },
  'exterior-props': { source: 'Craftpix (licensed)', license: 'licensed' },
  'interior-props': { source: 'Craftpix (licensed)', license: 'licensed' },
  'guildhall-props': { source: 'Craftpix (licensed)', license: 'licensed' },
  'town-art': { source: 'user-provided', license: 'project' },
  'branding': { source: 'user-provided', license: 'project' },
  'ui-pack': { source: 'Kenney UI Pack', license: 'CC0' },
  'item-icons': { source: 'Kenney/Craftpix (curated)', license: 'licensed' },
  'skill-icons': { source: 'Kenney/Craftpix (curated)', license: 'licensed' },
  'skill-assets': { source: 'Kenney/Craftpix (curated)', license: 'licensed' },
  'quest-icons': { source: 'Kenney/Craftpix (curated)', license: 'licensed' },
  'audio': { source: 'see folder provenance', license: 'licensed' },
  'lpc-poc': { source: 'LPC (see CREDITS.md)', license: 'CC-BY-SA/GPL — dev PoC only' },
}
const DEV_ONLY_DIRS = new Set(['lpc-poc'])
// ไฟล์ที่ framework/hosting ใช้เองโดยไม่มี reference ในโค้ด
const IMPLICIT = new Set(['favicon.ico', 'robots.txt', '.nojekyll'])
const ROOT_PROVENANCE = { source: 'framework default (Nuxt/GitHub Pages)', license: 'project' }

const TYPE_BY_EXT = {
  '.png': 'image', '.jpg': 'image', '.jpeg': 'image', '.webp': 'image', '.gif': 'image',
  '.svg': 'image', '.ico': 'image', '.json': 'atlas', '.mp3': 'audio', '.ogg': 'audio',
  '.wav': 'audio', '.ttf': 'font', '.woff': 'font', '.woff2': 'font', '.md': 'doc', '.txt': 'doc',
}

function walk(dir) {
  const out = []
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name)
    if (e.isDirectory()) out.push(...walk(p))
    else out.push(p)
  }
  return out
}

function pngDims(file) {
  try {
    const fd = fs.openSync(file, 'r')
    const buf = Buffer.alloc(24)
    fs.readSync(fd, buf, 0, 24, 0)
    fs.closeSync(fd)
    if (buf.readUInt32BE(0) !== 0x89504e47) return undefined
    return [buf.readUInt32BE(16), buf.readUInt32BE(20)]
  } catch { return undefined }
}

// --- 1) รวบรวมไฟล์ asset ---
const assetFiles = walk(PUBLIC).map((f) => path.relative(PUBLIC, f).replace(/\\/g, '/'))
const topDirs = [...new Set(assetFiles.filter((f) => f.includes('/')).map((f) => f.split('/')[0]))]

// --- 2) สแกน source หา reference ---
const SRC_DIRS = ['app', 'scripts']
const SRC_FILES = []
for (const d of SRC_DIRS) {
  for (const f of walk(path.join(ROOT, d))) {
    if (/\.(ts|vue|js|cjs|mjs|css)$/.test(f) && !f.includes('node_modules')) SRC_FILES.push(f)
  }
}
SRC_FILES.push(path.join(ROOT, 'nuxt.config.ts'))

const dirAlt = topDirs.join('|')
const exactRx = new RegExp(`(?:${dirAlt})/[A-Za-z0-9_\\-./]+\\.[a-z0-9]{2,5}`, 'g')
const dynamicRx = new RegExp(`(?:${dirAlt})/[A-Za-z0-9_\\-./]*(?=\\$\\{)`, 'g')

const exactRefs = new Map() // ref -> [consumerFile]
const dynamicPrefixes = new Map() // prefix -> [consumerFile]
for (const f of SRC_FILES) {
  const src = fs.readFileSync(f, 'utf8')
  const rel = path.relative(ROOT, f).replace(/\\/g, '/')
  for (const m of src.match(exactRx) || []) {
    if (!exactRefs.has(m)) exactRefs.set(m, [])
    if (!exactRefs.get(m).includes(rel)) exactRefs.get(m).push(rel)
  }
  for (const m of src.match(dynamicRx) || []) {
    if (!dynamicPrefixes.has(m)) dynamicPrefixes.set(m, [])
    if (!dynamicPrefixes.get(m).includes(rel)) dynamicPrefixes.get(m).push(rel)
  }
}

// --- 3) จับคู่ + validate ---
const errors = []
const warnings = []
const lowerToActual = new Map(assetFiles.map((f) => [f.toLowerCase(), f]))
const fileSet = new Set(assetFiles)

for (const [ref, consumers] of exactRefs) {
  if (fileSet.has(ref)) continue
  const ci = lowerToActual.get(ref.toLowerCase())
  if (ci) errors.push(`CASE MISMATCH: code refs "${ref}" but file is "${ci}" (${consumers.join(', ')})`)
  else errors.push(`BROKEN REF: "${ref}" not in public/ (${consumers.join(', ')})`)
}

// root-absolute misuse ใน runtime source (app/ เท่านั้น — scripts เป็น build-time)
const rootAbsRx = new RegExp(`['"\`]/(?:${dirAlt})/`)
for (const f of SRC_FILES.filter((f) => path.relative(ROOT, f).replace(/\\/g, '/').startsWith('app/'))) {
  const src = fs.readFileSync(f, 'utf8')
  const m = src.match(rootAbsRx)
  if (m) errors.push(`ROOT-ABSOLUTE PATH in ${path.relative(ROOT, f)}: ${m[0]}... (ต้องผ่าน assetPath())`)
}

// --- 4) สร้าง registry ---
const hashGroups = new Map()
const registry = assetFiles.map((rel) => {
  const abs = path.join(PUBLIC, rel)
  const bytes = fs.statSync(abs).size
  const hash = crypto.createHash('sha1').update(fs.readFileSync(abs)).digest('hex').slice(0, 12)
  if (!hashGroups.has(hash)) hashGroups.set(hash, [])
  hashGroups.get(hash).push(rel)
  const top = rel.includes('/') ? rel.split('/')[0] : '(root)'
  const consumers = [
    ...(exactRefs.get(rel) || []),
    ...[...dynamicPrefixes.entries()].filter(([p]) => rel.startsWith(p)).flatMap(([, c]) => c),
  ]
  const ext = path.extname(rel).toLowerCase()
  let status
  if (DEV_ONLY_DIRS.has(top)) status = 'dev-only'
  else if (consumers.length > 0 || IMPLICIT.has(rel)) status = 'used'
  else if (TYPE_BY_EXT[ext] === 'doc') status = 'dev-only' // provenance/credits docs
  else status = 'unused'
  return {
    id: rel.replace(/[^A-Za-z0-9]+/g, '-').replace(/^-|-$/g, ''),
    path: rel,
    type: TYPE_BY_EXT[ext] === 'atlas' && !rel.endsWith('.json') ? 'image' : (TYPE_BY_EXT[ext] || 'other'),
    bytes,
    dimensions: ext === '.png' ? pngDims(abs) : undefined,
    hash,
    consumers: [...new Set(consumers)],
    ...(top === '(root)' ? ROOT_PROVENANCE : (PROVENANCE[top] || { source: 'unknown', license: 'unknown' })),
    status,
  }
})

// duplicate hash (นับเฉพาะไฟล์ production ที่ไม่ dev-only)
for (const [hash, files] of hashGroups) {
  const prod = files.filter((f) => !DEV_ONLY_DIRS.has(f.split('/')[0]))
  if (prod.length > 1) {
    warnings.push(`DUPLICATE CONTENT (${hash}): ${prod.join(' == ')}`)
    for (const rec of registry) if (rec.hash === hash && rec.status === 'unused') rec.status = 'duplicate'
  }
}

const unused = registry.filter((r) => r.status === 'unused')
for (const r of unused) warnings.push(`UNUSED: ${r.path} (${(r.bytes / 1024).toFixed(0)} KB)`)
const unknownProv = registry.filter((r) => r.license === 'unknown' && r.status === 'used')
for (const r of unknownProv) errors.push(`NO PROVENANCE: ${r.path}`)

// budget ต่อโฟลเดอร์
const budget = {}
for (const r of registry) {
  const top = r.path.includes('/') ? r.path.split('/')[0] : '(root)'
  budget[top] = (budget[top] || 0) + r.bytes
}

const out = {
  generated: new Date().toISOString(),
  totals: {
    files: registry.length,
    bytes: registry.reduce((s, r) => s + r.bytes, 0),
    used: registry.filter((r) => r.status === 'used').length,
    unused: unused.length,
    devOnly: registry.filter((r) => r.status === 'dev-only').length,
    duplicate: registry.filter((r) => r.status === 'duplicate').length,
  },
  budgetByDir: Object.fromEntries(Object.entries(budget).sort((a, b) => b[1] - a[1])),
  errors, warnings,
  assets: registry,
}
fs.writeFileSync(path.join(ROOT, 'docs', 'ASSET_REGISTRY.json'), JSON.stringify(out, null, 1))

console.log(`Assets: ${out.totals.files} files, ${(out.totals.bytes / 1048576).toFixed(1)} MB`)
console.log(`  used=${out.totals.used} unused=${out.totals.unused} dev-only=${out.totals.devOnly} duplicate=${out.totals.duplicate}`)
for (const w of warnings) console.log(`  warn  ${w}`)
for (const e of errors) console.error(`  FAIL  ${e}`)
console.log(errors.length === 0 ? 'ASSET TRUTH: PASS' : `ASSET TRUTH: ${errors.length} ERROR(S)`)
process.exit(errors.length === 0 ? 0 : 1)
