# ECHO EDUCATIONAL RPG
## Claude Code Phased Master Execution Plan
### Repository-specific version: GitHub Pages — Deploy from a branch

> Repository: `https://github.com/Ernestyy52/RPG-O-NET-P.6.git`  
> Source branch: `main`  
> Published branch: `gh-pages`  
> GitHub Pages source: **Deploy from a branch → `gh-pages` → `/(root)`**  
> Expected public base path: `/RPG-O-NET-P.6/`  
> Expected site URL: `https://ernestyy52.github.io/RPG-O-NET-P.6/`

---

# 0. ROLE AND MISSION

คุณคือ:

- Lead RPG Systems Engineer
- Nuxt/Phaser Static-Web Architect
- Character Technical Artist
- Combat and Skill Designer
- World Designer
- Educational Game Designer
- Online Backend Architect
- Performance and Production QA
- Privacy and Child-Safety Designer

ภารกิจคือพัฒนา Repo ปัจจุบันต่อให้เป็น Educational Fantasy RPG ตัวเต็ม โดย:

- สนุกจนผู้เล่นอยากกลับมาเล่นด้วยความสมัครใจ
- สร้าง learning gain จริง
- มี exploration, story, build, collection และ progression ที่มีความหมาย
- เล่น Offline Single-player ได้ครบ แม้ Backend หรือ Internet ใช้งานไม่ได้
- ใช้ GitHub Pages เป็น Static Frontend
- ใช้ระบบ Online แบบ Server-authoritative เมื่อพร้อม
- ปลอดภัยสำหรับนักเรียน
- ไม่มี addiction design, punitive streak, FOMO, energy gate, loot box หรือ pay-to-win

ห้ามสร้างโปรเจกต์ใหม่ ห้าม restart Phase ที่ผ่าน Gate แล้ว และห้าม Audit งานเดิมซ้ำโดยไม่มีเหตุผลหรือหลักฐานว่าระบบเปลี่ยนไป

---

# 1. REPOSITORY FACTS — VERIFY, THEN PRESERVE

จาก Repo ปัจจุบันคาดว่าใช้:

- Nuxt 4 SPA: `ssr: false`
- Phaser 4
- Pinia persisted state
- Nitro static preset
- `npm run generate`
- GitHub Actions สร้าง `.output/public`
- Workflow Push Build Output ไป `gh-pages`
- GitHub Pages ใช้ Deploy from a branch
- Asset ต้องรองรับ Base Path `/RPG-O-NET-P.6/`
- Backend เดิมใช้ Google Sheets + Apps Script
- Offline save ใช้ Local Storage/Pinia
- Multiplayer client มี Colyseus dependency แต่ URL อาจยังว่าง

อย่าเชื่อรายการนี้โดยไม่ตรวจ Repo จริง แต่หากตรวจแล้วตรง ให้รักษา Architecture เดิมและแก้เฉพาะจุดที่ไม่ผ่าน Gate

ไฟล์สำคัญที่ต้องตรวจ:

- `package.json`
- `package-lock.json`
- `nuxt.config.ts`
- `.github/workflows/deploy.yml`
- `.claude/CLAUDE.md`
- `app/`
- `public/`
- `data/`
- `scripts/`
- `docs/`
- `app/game/systems/textures.ts`
- `app/game/scenes/`
- `app/stores/`
- `app/composables/useSheetsSync.ts`
- `scripts/apps-script/Code.gs`
- Asset indexes, atlas manifests และ animation manifests
- `git status`
- `git diff`
- `git log --oneline -20`

---

# 2. NON-DESTRUCTIVE EXECUTION PROTOCOL

ก่อนแก้ไฟล์ทุก Session:

1. รัน `git status --short --branch`
2. รัน `git diff --stat`
3. ตรวจ Branch ปัจจุบัน
4. ตรวจ Uncommitted Work
5. อ่าน:
   - `.claude/CLAUDE.md`
   - `docs/GAME_CONTRACT.md`
   - `docs/EXECUTION_STATE.md`
   - `docs/ASSET_MANIFEST.md`
6. หากเอกสารข้อ 5 ไม่มี ให้สร้างเฉพาะไฟล์ที่จำเป็นใน Phase 0
7. ตรวจ Tests/Build Scripts ที่มีจริง
8. ระบุ Current Phase และ Next Unpassed Gate
9. ทำงานเฉพาะ Phase ปัจจุบัน
10. แบ่งงานเป็น Batch เล็ก ย้อนกลับได้ และมี Verification

ห้าม:

- `git reset --hard`
- `git clean -fd`
- Force-push `main`
- Checkout ทับงานที่ยังไม่ Commit
- ลบไฟล์เพราะคิดว่าไม่ใช้โดยยังไม่ตรวจ Dynamic Consumer
- แก้ไฟล์ที่ไม่เกี่ยวข้อง
- ย้ายหรือลบ Asset ต้นฉบับโดยไม่มีหลักฐาน
- แก้ `gh-pages` ด้วยมือ
- Merge Source Code เข้า `gh-pages`
- Commit Secret หรือ Credential
- Deploy Cloud Resource ใหม่โดยไม่ได้รับ Credential/Approval
- เปลี่ยน Production Database โดยไม่มี Backup และ Rollback
- เปิด UI ที่ Backend หรือ Logic ยังไม่ทำงานจริง
- อ้างว่า “เสร็จ 100%” โดยไม่มี Test Evidence

หากพบ Uncommitted Work:

- รักษาไว้
- แยกงานใหม่ออกจากงานเดิมเท่าที่ทำได้
- ห้าม Stash หรือ Commit งานเดิมแทนผู้ใช้โดยไม่จำเป็น
- รายงาน Conflict เฉพาะเมื่อหยุด Gate จริง

---

# 3. PHASE AND BATCH RULES

ลำดับบังคับ:

`Phase 0 → 1 → 2 → 3 → 4 → 5 → 6 → 7 → 8 → 9 → 10 → 11`

ห้ามข้าม Phase หาก Dependency หรือ Gate ก่อนหน้ายังไม่ผ่าน

แต่ละ Phase ให้แบ่งเป็น Batch:

- **Batch A — Inspect:** ตรวจระบบจริงและกำหนดขอบเขตเล็กที่สุด
- **Batch B — Implement:** ทำ Vertical Slice ที่ใช้งานได้จริง
- **Batch C — Validate:** เพิ่ม Validator/Test และแก้ Root Cause
- **Batch D — Gate:** รัน Verification, อัปเดต State และสรุปผล

กฎ:

- ทำหนึ่ง Batch เล็กต่อครั้ง
- Batch ต้องมี Acceptance Criteria
- หลัง Batch ผ่าน ให้อัปเดต `docs/EXECUTION_STATE.md`
- หาก Context เหลือและไม่มี Blocker สามารถทำ Batch ถัดไปใน Phase เดิมต่อได้
- ห้ามเริ่ม Phase ใหม่จน Gate ของ Phase ปัจจุบันผ่าน
- หาก Asset/Service ขาด ให้ทำงานส่วนที่ไม่ติด Blocker ต่อ
- Placeholder ใช้ได้เฉพาะ Dev Flag
- Placeholder ไม่ถือว่า Gate Production ผ่าน

---

# 4. REQUIRED STATE FILES

## `docs/EXECUTION_STATE.md`

ใช้รูปแบบสั้น:

```md
# Execution State

CURRENT_PHASE:
CURRENT_BATCH:
PHASE_STATUS: NOT_STARTED | ACTIVE | PARTIAL | BLOCKED | PASSED

PASSED_PHASES:
PASSED_GATES:

ACTIVE_WORK:
ACTIVE_BLOCKERS:

LAST_VERIFICATION:
- command:
- result:

NEXT_3:
1.
2.
3.

LAST_UPDATED:
```

อัปเดตหลังทุก Batch แต่ห้ามเขียนประวัติยาว ให้เก็บเฉพาะสถานะล่าสุดและหลักฐานสำคัญ

## `docs/GAME_CONTRACT.md`

บันทึกเฉพาะกฎที่ห้ามละเมิด:

- Offline Single-player เล่นได้ครบ
- Learning Gate ห้ามถูกข้าม
- Server-authoritative Online
- No dark patterns/pay-to-win
- Student privacy and safety
- GitHub Pages Static Frontend
- Production Assets ต้องมี Provenance
- UI ที่เปิดต้องทำงานจริง

## `docs/ASSET_MANIFEST.md`

Asset Production ใหม่ทุกชิ้นต้องมี:

- ID
- Path
- Purpose
- Source
- Tool
- Prompt/Process
- License
- Modified date
- Runtime consumer
- Status

---

# 5. GLOBAL PRODUCT RULES

## Learning

- Correct answer สร้าง guaranteed strike และ Insight
- ห้าม Basic Attack หรือ Skill ข้าม Learning Gate
- Wrong answer ต้องหยุดหรือชะลอเพื่อให้อ่าน Explanation
- มี Relaxed Mode
- Difficulty ต้องปรับตาม mastery โดยไม่ประจานผู้เรียน
- Party/Guild ห้ามเห็นคำตอบผิดรายบุคคลโดยอัตโนมัติ
- Analytics เก็บข้อมูลเท่าที่จำเป็น
- แยก Public Profile ออกจาก Learning Record

## Ethical Engagement

ห้าม:

- Punitive streak
- FOMO
- Energy gate
- Loot box
- Paid random reward
- Pay-to-win
- Story ที่หายถาวร
- บังคับ Daily เพื่อผ่าน Campaign
- Reward Power สูงจากการเล่นหนักหรือจ่ายเงิน

## UI and Accessibility

ต้องรองรับ:

- Desktop
- Mobile 390×844
- Keyboard
- Touch
- Reduced Motion
- Sound/Music Mute
- Color-blind cues ที่ใช้ Shape/Icon/Audio ร่วมกับสี
- No console errors
- No dead button
- No fake feature
- No emoji เป็น Main Production Icon

## Assets

- Reuse Asset ที่ Provenance ชัดก่อน
- Asset ใหม่ต้อง Original
- ห้ามเลียนแบบเกม ศิลปิน UI Sprite หรือ Music เฉพาะ
- Transparent PNG เมื่อเหมาะสม
- Pixel Art ใช้ Nearest-neighbor
- ทุก Item/Skill ที่เปิดต้องมี Icon/Visual/Tooltip
- Skill Production ต้องมี VFX/SFX ที่สื่อความหมาย
- ห้ามใช้ Effect เดียวเปลี่ยนสีแทนทุก Skill

---

# PHASE 0 — REPOSITORY TRUTH AND BASELINE

## Goal

สร้างความจริงกลางของ Repo โดยไม่เปลี่ยน Behavior ก่อนรู้สถานะจริง

## Batch A — Inspect

ตรวจ:

- Framework/Version
- Source directory
- SPA/SSR mode
- Nitro preset
- Build/Generate commands
- Node version
- Existing GitHub Workflow
- Main and gh-pages branches
- GitHub Pages Base Path
- Current route strategy
- Asset path utilities
- Current backend endpoints
- Current save ownership
- Current reward/inventory authority
- Existing tests
- Existing feature flags
- Current production build size
- Asset count and size
- Initial scene requests
- Console errors
- Known broken UI
- Uncommitted work

ตรวจ Deploy branch:

```bash
git fetch origin --prune
git branch -a
git log --oneline --decorate -10 origin/main
git log --oneline --decorate -5 origin/gh-pages
```

ห้าม Checkout `gh-pages` ทับ Working Tree หากมี Uncommitted Work ใช้ `git show` หรือ Worktree ชั่วคราวแทน

## Batch B — Minimal Documents

สร้างหรือปรับแบบกระชับ:

- `docs/EXECUTION_STATE.md`
- `docs/GAME_CONTRACT.md`
- `docs/ARCHITECTURE_DECISION.md`
- `docs/BACKEND_MIGRATION.md`

แต่ละ Architecture Document ใช้หัวข้อ:

- KEEP
- REPLACE
- MIGRATE
- REMOVE
- BLOCKER
- ACCEPTANCE

## Batch C — Baseline Verification

รันตาม Scripts จริง:

```bash
npm ci
npm run generate
```

รัน Tests/Typecheck/Lint เฉพาะที่ Repo มีจริง ห้ามรายงานว่าผ่านหากไม่มี Script

วัด:

- `.output/public` size
- Largest assets
- Initial HTML paths
- Root-absolute URL ที่ผิด Base Path
- Missing runtime asset
- Build warnings
- Console/runtime error

## Phase 0 Gate

- รู้สถานะ Repo จริง
- รู้ Deployment Architecture จริง
- รู้ Data Ownership จริง
- Baseline Generate สำเร็จหรือมี Blocker ชัดเจน
- Uncommitted Work ปลอดภัย
- State Documents พร้อม
- ไม่มี Production Behavior ถูกเปลี่ยนโดยไม่จำเป็น

---

# PHASE 1 — GITHUB PAGES: DEPLOY FROM A BRANCH

## Fixed Deployment Decision

Repo นี้ต้องใช้รูปแบบ:

```text
Developer works on: main
        ↓
GitHub Actions runs on push to main
        ↓
Nuxt static generation
        ↓
Output: .output/public
        ↓
Workflow publishes generated files to gh-pages
        ↓
GitHub Pages source:
Deploy from a branch
Branch: gh-pages
Folder: /(root)
```

ห้ามเปลี่ยน Pages Source เป็น `GitHub Actions` โดยพลการ เพราะผู้ใช้เลือก **Deploy from a branch**

ห้ามใช้ `main /docs` เป็น Published Source

ห้าม Commit Build Output ลง `main`

## Repository-specific Target

```text
Repository: Ernestyy52/RPG-O-NET-P.6
Source branch: main
Publish branch: gh-pages
Base URL: /RPG-O-NET-P.6/
Output directory: .output/public
```

จนกว่าจะมี `CNAME` และผู้ใช้สั่งใช้ Custom Domain ให้ยึด Base URL นี้เท่านั้น

## Batch A — Audit Existing Deployment

ตรวจ:

- `.github/workflows/deploy.yml`
- `nuxt.config.ts`
- `package.json`
- `.output/public/index.html`
- `.output/public/404.html`
- `.output/public/.nojekyll`
- Existing `gh-pages/index.html`
- Existing `gh-pages/404.html`
- Existing `gh-pages/.nojekyll`
- Workflow permissions
- Node version
- `publish_dir`
- `publish_branch`
- Trigger branch
- Environment variables
- Secrets usage

หากระบบเดิมถูกต้อง ให้รักษาไว้ ห้าม Rewrite Workflow เพื่อความสวยงามอย่างเดียว

## Batch B — Static Build Contract

Production Frontend ต้องเป็น Static เท่านั้น:

- `ssr: false`
- Static Nitro/Nuxt output
- ไม่มี Production dependency กับ `server/api`
- ไม่มี Node runtime หลัง Deploy
- ไม่มี Filesystem access ใน Browser
- ไม่มี SSR-only middleware
- ไม่มี Secret API call จาก Client

ตรวจว่า `npm run generate` เป็น Build Command ที่เหมาะกับ Repo จริง

ห้ามเปลี่ยนเป็น Command อื่นเพียงเพราะ Documentation มีตัวอย่างต่างกัน หาก Output เดิมถูกต้องและ Test ผ่าน

## Batch C — Base Path Safety

Base Path ต้องมาจากจุดกลาง:

```ts
app: {
  baseURL: process.env.NUXT_APP_BASE_URL || '/'
}
```

Workflow ต้อง Build ด้วย:

```text
NUXT_APP_BASE_URL=/RPG-O-NET-P.6/
```

หรือ Equivalent ที่คำนวณจาก Repository Name แล้วได้ค่าเดียวกัน

Runtime Asset ทุกประเภทต้องใช้ Base-aware utility:

- Character sprites
- Atlases
- Atlas JSON
- Tilemaps
- Images
- UI icons
- Fonts
- BGM
- SFX
- VFX textures
- Question JSON
- Content manifest
- Save migrations
- Dynamic imports
- Workers
- Service worker
- Lazy-loaded zone bundle

ห้าม Hardcode:

```ts
'/assets/...'
'/character-sprites/...'
'/_nuxt/...'
```

ใน Runtime Code

ให้ใช้ `assetPath()` หรือ Utility กลางที่มีอยู่แล้ว ห้ามสร้าง Utility ซ้ำหลายตัว

ตรวจ Path Case-sensitive เพราะ GitHub Pages รันบน Linux

## Batch D — Route and Refresh Safety

GitHub Pages ไม่มี Server Rewrite แบบ Dynamic Server

ให้ตรวจว่าเกมใช้:

- Single App Shell
- Nuxt static routes
- Phaser Scene navigation

Direct refresh ต้องไม่พัง

ถ้ามี Client Routes หลาย Route:

- ใช้ Nuxt prerender เมื่อ Route แน่นอน
- หรือใช้ Tested `404.html` fallback
- หรือใช้ Hash Routing อย่างจงใจ
- ห้ามเพิ่ม SPA redirect hack โดยไม่ทดสอบ Query/Hash/Base Path

`404.html` ต้องโหลด App ด้วย `/RPG-O-NET-P.6/` ได้ และ Asset ต้องไม่ 404

## Batch E — `.nojekyll`

Published root ต้องมี `.nojekyll`

ต้องตรวจทั้ง:

- Generated output
- Published `gh-pages`

หาก Deploy Action สร้างให้อัตโนมัติอยู่แล้ว ให้เพิ่ม Test แทนการสร้างระบบซ้ำ

## Batch F — Workflow Contract

Workflow เป้าหมายต้องมีพฤติกรรมเทียบเท่า:

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]
  workflow_dispatch:

permissions:
  contents: write

concurrency:
  group: pages
  cancel-in-progress: true

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
      - run: npm ci
      - run: npm run generate
        env:
          NUXT_APP_BASE_URL: /RPG-O-NET-P.6/
          NUXT_PUBLIC_SHEETS_API_URL: ${{ secrets.SHEETS_API_URL }}
      - uses: peaceiris/actions-gh-pages@v4
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: .output/public
          publish_branch: gh-pages
          force_orphan: true
```

นี่เป็น Behavioral Contract ไม่ใช่คำสั่งให้ Replace File ทั้งหมด

รักษาสิ่งที่ถูกต้องอยู่แล้ว

เพิ่ม Verification ก่อน Publish เท่าที่เหมาะสม:

```text
npm ci
generate
typecheck ถ้ามี
unit tests ถ้ามี
asset validation
base-path validation
broken-reference validation
secret scan
```

ห้าม Deploy จาก Pull Request

ห้ามใช้ Third-party Action อื่นเพิ่มโดยไม่มีเหตุผล

Pin Action Version ให้ชัดเจน

## Batch G — Public Environment Safety

ตัวแปรที่ขึ้นต้นด้วย `NUXT_PUBLIC_` จะอยู่ใน Client Bundle และถือว่า Public

ดังนั้น:

- `NUXT_PUBLIC_SHEETS_API_URL` ต้องเป็น Public Endpoint ที่ไม่บรรจุ Secret
- ห้ามฝัง Admin Token ใน Query String
- ห้ามฝัง Service Account
- ห้ามฝัง Firebase Admin Credential
- ห้ามฝัง AI Provider Key
- ห้ามฝัง Moderation Secret
- Apps Script ต้อง Validate Input และห้ามเชื่อ Gold/Item/Floor จาก Client

หาก Endpoint ต้องการ Secret ให้ย้าย Logic ไป Server-side Backend ใน Phase 7

## Batch H — Local Pages Simulation

สร้าง Script/Test ที่จำลอง Hosting ใต้ Subpath:

```text
/RPG-O-NET-P.6/
```

Test ต้อง:

- Serve `.output/public`
- เปิด Exact Subpath
- ตรวจ HTTP status
- ตรวจ Console error
- ตรวจ Failed network request
- ตรวจ Asset 404
- ตรวจ Font/Audio/Atlas/JSON
- ตรวจ `404.html`
- ตรวจ Mobile viewport 390×844

ห้าม Test เฉพาะ `/` เพราะไม่จำลอง GitHub Pages จริง

## Batch I — Pages Settings Verification

ตรวจด้วย GitHub CLI หากมีสิทธิ์:

```bash
gh api repos/Ernestyy52/RPG-O-NET-P.6/pages
```

หากตรวจไม่ได้ ให้รายงาน Manual One-time Setting:

```text
Repository → Settings → Pages
Build and deployment
Source: Deploy from a branch
Branch: gh-pages
Folder: /(root)
Save
```

Branch `gh-pages` ต้องมีอยู่ก่อนเลือก

Claude Code ห้ามอ้างว่า Settings ถูกเปลี่ยนแล้ว หากไม่ได้ตรวจหรือเปลี่ยนจริง

## Batch J — Deployment Permission

Prompt นี้อนุญาตให้:

- แก้ Source Code
- แก้ Workflow
- รัน Generate/Test
- เตรียม Commit สำหรับ Deployment

ก่อน Push:

- Tests/Gates ต้องผ่าน
- ตรวจ `git diff`
- ห้ามรวม Unrelated Changes
- ห้าม Force-push
- ห้ามแก้ `gh-pages` ด้วยมือ

เมื่อผู้ใช้สั่งให้ Push/Deploy ใน Session นั้น:

1. Commit เฉพาะ Relevant Changes ไป `main`
2. Push `main`
3. Workflow ต้องเป็นผู้สร้าง `gh-pages`
4. ตรวจ Workflow Result
5. ตรวจ Published Branch
6. ตรวจ Site URL
7. หาก Fail ให้แก้ Root Cause บน `main` แล้วให้ Workflow Deploy ใหม่

ห้าม Commit ตรงไป `gh-pages`

## Phase 1 Gate

- `npm run generate` ผ่าน
- `.output/public/index.html` มี Base Path ถูกต้อง
- `.output/public/404.html` ทำงาน
- `.nojekyll` มีใน Published Root
- ไม่มี Root-absolute Runtime Asset Path ที่ผิด
- ไม่มี Asset/Atlas/Map/Font/Audio/JSON 404
- Direct refresh ไม่พัง
- Mobile page โหลดได้
- Workflow Deploy เฉพาะ Push `main` หรือ Manual Dispatch
- Workflow Publish `.output/public` ไป `gh-pages`
- Pages Source เป็น `gh-pages / (root)` หรือมี Manual Blocker ระบุชัด
- Production Bundle ไม่มี Secret
- Offline Game ยังเล่นได้
- ห้ามเริ่ม Phase 2 จน Gate นี้ผ่าน

---

# PHASE 2 — ASSET TRUTH PIPELINE AND ART BIBLE

## Goal

ทำให้ Asset ทุกชิ้นมีสถานะจริง มี Consumer มี Provenance และแสดงผลสอดคล้องกัน

## Batch A — Asset Registry

สร้าง Machine-readable registry:

```ts
type AssetRecord = {
  id: string
  path: string
  type: 'image' | 'atlas' | 'audio' | 'font' | 'map' | 'vfx'
  bytes: number
  dimensions?: [number, number]
  hash: string
  consumers: string[]
  biome?: string
  animationStates?: string[]
  license?: string
  source?: string
  status: 'used' | 'unused' | 'duplicate' | 'missing' | 'dev-only' | 'blocked'
}
```

## Batch B — Validators

ตรวจ:

- Duplicate content hash
- Missing file
- No consumer
- Dynamic consumer
- Path case mismatch
- GitHub Pages base-path misuse
- Atlas/frame mismatch
- Animation mismatch
- Equipment mapping
- Skill icon/VFX/SFX mapping
- License/provenance
- Oversized asset
- Source asset ที่ไม่ควร Ship
- Asset size ต่อ Scene/Biome

## Batch C — Structure and Optimization

แยก:

- Source files
- Production runtime files
- Shared bundle
- Biome bundle
- Zone bundle
- Lazy-loaded audio

Optimization:

- Crop transparent padding เมื่อ Visual QA ผ่าน
- Atlas เฉพาะไฟล์ที่ใช้ร่วมกันจริง
- Hashed output
- Lazy load ตาม Zone
- Unload เมื่อปลอดภัย
- Camera culling
- Mobile particle limit

ห้ามแปลงทุกไฟล์อัตโนมัติโดยไม่มี Visual QA

## Batch D — Dev-only Asset Gallery

รองรับ:

- Sprite/Atlas preview
- Animation playback
- Direction preview
- Equipment overlay preview
- VFX preview
- Audio preview
- Missing/misaligned marker

Gallery ห้ามเข้า Production Bundle

## Batch E — Art Bible

สร้าง `docs/ART_BIBLE.md` แบบกระชับ:

- Native sprite scale
- Integer display scale
- Palette ต่อ Biome
- Outline
- Lighting direction
- Shadow
- Prop perspective
- Character/door/building scale
- UI icon style
- Class VFX shape language
- Saturation/contrast
- Color-blind cues

## Phase 2 Gate

- Production Asset Registry ครบ
- Broken reference เป็นศูนย์
- Missing/Duplicate/Unused มีสถานะ
- Provenance ของ Production Asset ครบ
- Base-path/Case Validator ผ่าน
- Asset Gallery ใช้งานได้ใน Dev
- Initial/Zone Budgets ถูกวัด
- Desktop/Mobile Visual QA ผ่าน

---

# PHASE 3 — CHARACTER PAPER-DOLL EQUIPMENT VISUALS

## Goal

ทำให้ Character Creation และ Equipment เปลี่ยน Sprite จริง

## Layers

```text
1. body/base
2. skin/face
3. hair
4. armor/outfit
5. headgear
6. weapon
7. offhand/shield
8. back/cape
9. important accessory/aura
```

## Batch A — Atlas Truth

ตรวจจริง:

- Hero atlas
- Atlas manifest
- Frame sizes
- Pivot/origin
- Direction order
- Animation states
- Body variants
- Existing class/gender sprites
- Display scale
- Hitbox rules

## Batch B — Runtime Layering

ทุก Layer ต้อง:

- Frame layout ตรง Base
- Pivot ตรง Base
- Frame timing sync
- รองรับ idle/walk/attack/cast/hit/KO
- เปลี่ยน Render Order ตาม Direction
- Equipment เปลี่ยนแล้ว Update ทันที
- Face/Hair/Color แสดงจริง
- Body variant ไม่ทำให้ Armor ลอย

ห้าม Pre-generate ทุก Combination

ใช้ Runtime Layering หรือ Composite Cache ตาม Performance จริง

## Batch C — Registry

```ts
type EquipmentVisual = {
  itemId: string
  slot: VisualSlot
  atlasKey: string
  animations: AnimationMapping
  compatibleBodies: string[]
  layerRules: DirectionalLayerRules
  dyes?: DyeChannel[]
}
```

ทุก Equippable Item ต้องมี:

- Visual mapping
- หรือ `visual: hidden` พร้อมเหตุผล

## Batch D — Inventory Preview

- หมุน 4 ทิศ
- Compare Stat
- Compare Appearance
- Preview animation
- Save/load appearance

## Phase 3 Gate

- Face/Hair/Color ทำงาน
- Weapon/Shield/Cape/Headgear เปลี่ยนจริง
- มีตัวอย่างอย่างน้อยหนึ่งชุดต่อ Class และ Rarity
- Animation ทุก State/Direction Align
- Save/Load ถูกต้อง
- Validator/Tests/Build ผ่าน
- Mobile Performance ผ่าน

---

# PHASE 4 — DATA-DRIVEN SKILLS AND COMBO BUILDS

## Goal

ทำ Skill Engine ที่ขยายได้และมี Build หลากหลาย

## Target ต่อ Base Class

- 6 Active
- 3 Passive
- 1 Ultimate
- 2 Advanced Jobs
- Advanced Job ละ 4 Active + 2 Passive
- Loadout 5 Skills + 1 Ultimate
- Respec
- Save/Load Loadout
- อย่างน้อย 3 Viable Builds ต่อ Class

## Data Model

```ts
type SkillDefinition = {
  id: string
  classId: string
  jobId?: string
  role:
    | 'generator'
    | 'spender'
    | 'opener'
    | 'extender'
    | 'finisher'
    | 'defense'
    | 'support'
  insightCost: number
  cooldown: number
  tags: string[]
  applies?: StatusEffect[]
  consumes?: string[]
  effects: SkillEffect[]
  animationKey: string
  iconKey: string
  vfxKey: string
  sfxKey: string
}
```

Combo เกิดจาก Tags/Status/Applies/Consumes/Position/Defense/Party Synergy

ห้าม Hardcode คู่ Combo จำนวนมาก

## Combat Rules

- Correct answer = guaranteed strike + Insight
- Skill ไม่ข้าม Learning Gate
- Wrong answer เปิด Explanation
- Combo มี Telegraph
- Enemy มี Intent/Resistance/Counterplay
- Combo ไม่บังคับจำลำดับเดียว
- Mobile HUD ใช้จริง
- Relaxed Mode ใช้จริง

ทุก Skill ที่เปิดต้องมี:

- Icon
- Animation
- VFX
- SFX
- Exact tooltip
- Cooldown/resource state
- Combat log
- Unit test
- Balance simulation

## Phase 4 Gate

- 3 Builds ต่อ Class เล่นได้
- ไม่มี Build เดียวดีที่สุดทุกสถานการณ์
- Combo ทำงานจาก Data
- Class clear time ใกล้ Median
- Respec/Save/Loadout ผ่าน
- Visual/Audio ครบ
- Tests/Typecheck/Build ผ่าน

---

# PHASE 5 — AETHERGATE BRIGHT TOWN REDESIGN

## Goal

ทำเมืองกลางให้สว่าง อบอุ่น มีชีวิต และอ่านทางง่าย

รักษา `town-night` เป็น Night/Rain Variant

## Variants

ใช้ Geometry/Collision ร่วมกัน:

- Day
- Sunset
- Night/Rain

## Districts

- Central Plaza
- Adventure/Guild/Job/Tower
- Market/Crafting
- Learning/Library/Study
- Residential/Garden

## Prop Rule

ทุก Prop ต้องมี Role:

- Decorative
- Collision
- Interactable
- Landmark

ห้ามสุ่มวางเพื่อเติมพื้นที่

ต้องมี:

- Logical roads
- Water source
- Readable landmark
- NPC purpose
- Collision ตรงภาพ
- Main path กว้าง
- Mobile-safe density
- Ambient audio
- Reduced-motion support
- Progression variants
- Seasonal slots

## Phase 5 Gate

- ผู้เล่นใหม่หา Guild/Shop/Study/Exit ได้ง่าย
- บริการหลักเดินถึงกัน 30–60 วินาที
- ไม่มี Dead Space/Invisible Wall
- NPC/Pathfinding ไม่ชน Prop
- Day/Sunset/Night ทำงาน
- Story/Quest/Party/Guild hooks พร้อม
- Desktop/Mobile FPS ผ่าน

---

# PHASE 6 — ETHICAL RETURN LOOP AND CONTENT PIPELINE

## Ethical Return

เพิ่ม:

- Daily Adventure 10/20/30 นาที
- Personalized mastery quest
- Rested bonus
- Dynamic expedition
- Weekly chronicle
- Chronicle archive
- Monster codex
- Rare rune
- Job mastery
- Cosmetic/title/room decoration
- Tower weekly seed
- Save-and-exit
- Break reminder

ห้าม Dark Pattern ทุกชนิดตาม Global Rules

## Content Pipeline

```text
Teacher edits Sheet
→ schema validation
→ duplicate/answer balance/CEFR/explanation checks
→ human SME review
→ versioned JSON
→ checksum/manifest
→ static publication
→ offline client cache
→ server learning events
→ aggregate report back to Sheet
```

ต้องมี:

- Version
- Rollback
- Checksum
- Compatibility
- Review status
- Misconception
- Invalid content rejection
- Offline fallback

## Phase 6 Gate

- Session ทุกความยาวได้ Adventure + Learning progress
- กลับหลังหยุดหลายวันไม่เสียเปรียบรุนแรง
- Rewards เน้น Horizontal/Cosmetic
- Save/Exit/Resume ผ่าน
- Content Version/Rollback ผ่าน
- Invalid content ไม่เข้า Production
- Analytics minimal-data

---

# PHASE 7 — OFFLINE-FIRST AUTHORITATIVE BACKEND

## Goal

รักษา GitHub Pages เป็น Frontend และย้าย Authority ออกจาก Client/Sheets อย่างปลอดภัย

## Keep

GitHub:

- Repository
- CI
- `main` source
- `gh-pages` generated frontend

Sheets:

- Question authoring
- Content review
- Aggregate teacher reports

Apps Script:

- Validate Sheet schema
- Export versioned content
- Import aggregate reports

## Remove from Production Authority

- Player name as identity
- Client-authoritative Gold/Item/Floor
- Sheets as live inventory DB
- Sheets as reward ledger
- Public Apps Script save/reward authority
- Secrets in Client
- Direct client write to chat

## Target Backend

Firebase Auth:

- Identity/session

Firestore:

- Profile
- Character
- Inventory/equipment
- Quest/story
- Mastery summary
- Reward ledger
- Guild/roles
- Party metadata
- Moderation cases

Realtime Database:

- Presence
- Ephemeral party/room state
- Approved recent chat

Cloud Functions:

- Reward validation
- Inventory transaction
- Crafting
- Party/Guild mutation
- Leaderboard update
- Chat moderation
- Report aggregation

เพิ่ม:

- App Check
- Deny-by-default Rules
- Emulator tests
- Rate limiting
- Idempotency
- Backup/rollback
- Data retention

## Backend Adapter

```ts
interface BackendAdapter {
  loadSave(): Promise<GameSave>
  saveProgress(save: GameSave): Promise<void>
  claimReward(intent: RewardIntent): Promise<RewardResult>
  syncLearningEvents(events: LearningEvent[]): Promise<void>
}
```

Implement:

- LocalBackendAdapter
- LegacyBackendAdapter
- FirebaseBackendAdapter

Game Logic ห้ามผูก Vendor โดยตรง

## Migration Order

1. Local fallback
2. Emulator
3. Auth/schema/rules
4. Migration script
5. Staging import
6. Compare count/checksum
7. Shadow read
8. Cut over:
   - Auth
   - Profile
   - Save
   - Inventory
   - Learning
   - Party
   - Guild
   - Chat
9. ปิด Public Legacy Writes หลัง Approval

ห้าม Long-term Dual-write

## Phase 7 Gate

- Offline Campaign ยังเล่นครบ
- Client ปลอม Reward ไม่ได้
- Reconnect ไม่ให้ Reward ซ้ำ
- Idempotent ledger ผ่าน
- Emulator/Rules tests ผ่าน
- ไม่มี Secret ใน Frontend
- Migration/Backup/Rollback พร้อม
- ไม่มี Production Cutover โดยไม่ได้รับอนุญาต

---

# PHASE 8 — PARTY

## Features

- Create/invite/join/leave/kick/ready
- Leader transfer
- Reconnect
- Shared instance
- Role indicator
- Ping/preset emote
- Boss mechanics
- Player-count scaling
- Latency tolerance
- Individual/deterministic loot
- No loot stealing

## Learning Safety

- ทุกคนมี Contribution
- ไม่ให้คนเดียวตอบแทนทุกคนตลอด
- ไม่เปิดเผยคำตอบผิด
- แสดง Contribution เชิงบวก
- รองรับระดับภาษาต่างกัน
- Relaxed/cooperative mode
- ห้าม Vote-kick เพราะตอบผิด

## Phase 8 Gate

- Join/Leave/Reconnect ระหว่าง Dungeon ได้
- Reward ไม่ซ้ำ/หาย
- ระดับต่างกันเล่นร่วมได้
- No loot stealing
- No learning humiliation
- Authority/Latency/Failure tests ผ่าน

---

# PHASE 9 — GUILD

## Features

- Create/search/request/invite/join/leave
- Name/description/emblem
- Owner/officer/member
- Permission
- Announcement
- Guild quest
- Research
- Guild Hall
- Safe storage
- Contribution cap
- Audit log
- Rename/disband/ownership transfer

## Rules

- ห้ามเปิด Learning Record รายบุคคล
- Rewards เน้น Cosmetic
- No pay-to-win power
- Names/Profile ผ่าน Moderation
- Storage ใช้ Server Transaction

## Phase 9 Gate

- Permission/Ownership tests ผ่าน
- Race-condition tests ผ่าน
- Duplication tests ผ่าน
- Transfer ปลอดภัย
- Privacy ผ่าน
- Audit events ทำงาน

---

# PHASE 10 — CHAT AND CHILD SAFETY

## Rollout Order

1. System messages
2. Preset chat/emotes
3. Party chat
4. Guild chat
5. Moderated local/world chat

Private DM ปิดเป็นค่าเริ่มต้น

## Server Pipeline

1. NFKC normalization
2. Lowercase/canonicalization
3. Remove zero-width/control
4. Normalize spaces/punctuation/repetition
5. Mixed-script/leetspeak/obfuscation
6. Thai/English/romanized Thai
7. Context/phrase rules
8. URL/phone/email/social handle/PII
9. Spam/flood/repetition
10. Severity/action decision

Categories:

- Profanity
- Harassment
- Hate
- Sexual content
- Threat/violence
- Self-harm concern
- Personal information
- Scam/spam
- Impersonation

Actions:

- Allow
- Mask
- Warn
- Block
- Slow mode
- Temporary mute
- Report/escalate
- Moderator review

ต้องมี:

- Allowlist
- Rate limit
- Mute/block/report
- Dashboard
- Appeal path
- Teacher/admin controls
- Minimal retention
- Access control
- Audit trail
- Fail closed

Client ห้ามเขียน Chat DB โดยตรง

`sendChat` ต้องตรวจ Auth, App Check, Membership, Rate limit และ Moderation

## Phase 10 Gate

- Server-side filter ผ่าน
- Major bypass tests ผ่าน
- False-positive review มี
- Mute/block/report ใช้ได้
- Audit มี
- PII tests ผ่าน
- Thai/English/Romanized Thai ผ่าน
- No public DM/open chat ก่อน Safety Gate
- Security/Privacy/Child-safety review ก่อนใช้นักเรียนจริง

---

# PHASE 11 — PERFORMANCE, CI AND FINAL ACCEPTANCE

## Frontend

- Scene/code splitting
- Lazy-load Zone assets
- Hashed assets
- Lazy-load music
- Asset unload
- Camera culling
- Mobile particle limit
- Bounded listeners
- Unsubscribe on scene exit
- No source asset in Production
- Service worker scope Base-path safe
- Offline fallback

## Backend

- Batching
- Pagination
- Bounded realtime listeners
- Exponential backoff
- Idempotent offline queue only
- Transaction for inventory/guild/reward
- Load/rate/failure tests
- Cost monitoring

## CI Gates

- Lint เมื่อมี
- Unit tests
- Typecheck
- Nuxt generate
- Asset validation
- Equipment validation
- Skill mapping validation
- Base-path test
- Broken-link/reference test
- Rules tests
- Emulator integration
- Desktop E2E
- Mobile 390×844 E2E
- Keyboard/touch
- Dependency scan
- Secret scan
- Bundle budget
- No console error

## Final Acceptance

### Deployment

- `main` เป็น Source
- `gh-pages` เป็น Generated Build
- GitHub Pages ใช้ Deploy from a branch
- Branch `gh-pages`
- Folder `/(root)`
- Base Path `/RPG-O-NET-P.6/`
- Refresh/Direct navigation ผ่าน
- No Asset 404
- `.nojekyll` มี
- No Secret
- No server runtime dependency

### Character

- Face/Hair/Color ทำงาน
- Equipment เปลี่ยน Sprite
- Mapping/Hidden intentional ครบ
- Animation Align

### Skills

- 3 Viable Builds ต่อ Class
- Icon/VFX/SFX/Tooltip ครบ
- Data-driven combo tests ผ่าน

### Game Loop

- No dark pattern
- Offline Campaign เล่นครบ
- Save/Resume ผ่าน
- Learning gain tracked minimally

### Online

- Server-authoritative reward/inventory
- Save/reconnect/idempotency ผ่าน
- Party/Guild permission ผ่าน
- Server-side moderation ผ่าน
- No DM/Open Chat ก่อน Safety Gate

### Assets and Quality

- Provenance/license ครบ
- Asset budget ผ่าน
- Desktop/Mobile/Accessibility ผ่าน
- Tests/Build/E2E ผ่าน
- Human Security/Privacy/Child-safety review ก่อน Production Student Rollout

---

# 6. TOKEN-EFFICIENT WORK STYLE

- Repo คือ Source of Truth
- Search แบบเจาะจงก่อนอ่านไฟล์ใหญ่
- อย่าอธิบายโค้ดที่ไม่แก้
- อย่าสร้างเอกสารซ้ำ
- อย่าแสดง Diff ยาวทั้งหมด
- ใช้ Utility/Pattern เดิมก่อนสร้างใหม่
- แก้ Root Cause
- ทำ Batch เล็ก
- Update State หลัง Batch
- ห้ามถามสิ่งที่หาได้จาก Repo
- หาก Blocker ให้ทำส่วนอื่นที่ไม่ Blocked
- ห้ามเริ่ม Phase ถัดไปก่อน Gate
- ห้ามกล่าวว่า Pass หากไม่ได้รัน Command จริง

---

# 7. REQUIRED COMPACT REPORT

หลังทุก Batch ตอบเท่านี้:

```md
## Phase
- Current:
- Batch:
- Gate: PASS | PARTIAL | BLOCKED

## Changes
- file/system:
- file/system:

## Verification
- `command` → PASS/FAIL
- `command` → PASS/FAIL

## Blockers
- None
```

หากมี Blocker ให้ระบุเฉพาะ Blocker ที่หยุด Gate จริง

```md
## Next 3
1.
2.
3.
```

ห้าม:

- รายงานแผนยาว
- สรุปไฟล์ที่ไม่ได้แก้
- ถามว่าจะทำอะไรต่อเมื่อ `EXECUTION_STATE.md` ระบุชัด
- ทำ Phase ใหม่โดยไม่ได้ Update State

---

# 8. FIRST COMMAND FOR THIS SESSION

เริ่มตอนนี้:

1. ตรวจ Repo และ Uncommitted Work
2. อ่าน `.claude/CLAUDE.md`
3. อ่าน State Documents หากมี
4. ตรวจ `main`, `gh-pages`, `nuxt.config.ts`, `package.json` และ `.github/workflows/deploy.yml`
5. ตรวจว่า GitHub Pages Architecture เป็น:
   - Source: Deploy from a branch
   - Branch: `gh-pages`
   - Folder: `/(root)`
6. รัน Phase 0 Baseline
7. ทำ Phase 1 เฉพาะส่วนที่ยังไม่ผ่านจริง
8. ห้าม Rewrite ระบบ Deploy ที่ถูกต้องอยู่แล้ว
9. ห้ามข้าม Phase 1 Gate
10. อัปเดต `docs/EXECUTION_STATE.md`
11. รายงานตาม Compact Report เท่านั้น

เมื่อ Phase 1 ผ่านแล้ว ให้หยุดที่ Gate และระบุ Next 3 สำหรับ Phase 2 ห้ามเริ่ม Phase 2 ใน Batch เดียวกับ Deployment Fix เว้นแต่ไม่มี Code Change และผู้ใช้สั่งให้ดำเนินการต่อโดยตรง
