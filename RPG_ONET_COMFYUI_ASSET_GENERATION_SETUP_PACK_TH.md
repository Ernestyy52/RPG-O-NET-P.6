# RPG-O-NET P.6 — ComfyUI Asset Generation Setup Pack
## คู่มือติดตั้ง เชื่อม Claude Code และสร้าง Asset เกมอัตโนมัติอย่างปลอดภัย

> Repository: `Ernestyy52/RPG-O-NET-P.6`  
> ระบบเป้าหมาย: Windows + ComfyUI Local API + Claude Code  
> รูปแบบเกม: Original fantasy, 16-bit inspired, top-down, 32×32 world grid  
> วันที่จัดทำ: 12 กรกฎาคม 2026

---

# 1. เป้าหมาย

หลังติดตั้ง Workflow ต้องเป็น:

```text
Claude Code ตรวจ Asset Index และไฟล์จริง
→ ยืนยันว่า Asset ขาด
→ สร้าง Generation Specification
→ เลือก Workflow และโมเดลที่ได้รับอนุมัติ
→ เรียก ComfyUI Local API
→ ตรวจ Output และ Provenance
→ เก็บใน Staging
→ สร้าง Contact Sheet
→ Art/Human Review
→ ย้ายเฉพาะภาพที่ Approved เข้าเกม
→ อัปเดต Asset Manifest และ Asset Index
→ Build และ Visual Smoke Test
```

สถานะ Output:

```text
CONCEPT   ใช้ออกแบบเท่านั้น
CANDIDATE ผ่าน Technical Validation แต่ยังไม่ผ่าน Art Review
APPROVED  ผ่าน Technical + Art + Integration Review
```

ComfyUI เหมาะมากกับ UI icon, item icon, prop, VFX concept, monster/boss concept และ character reference แต่ sprite หลายทิศ, layered equipment, animation หลายเฟรม และ autotile ยังต้องตรวจและเก็บรายละเอียดด้วยคนหรือ Pixel Art QA

---

# 2. กฎความปลอดภัย

## 2.1 เปิดเฉพาะ Localhost

ใช้:

```text
http://127.0.0.1:8188
```

ห้ามเปิด `--listen 0.0.0.0` หรือ Port สู่ Internet โดยตรง

## 2.2 Custom Nodes คือโค้ดที่รันบนเครื่อง

ก่อนติดตั้ง:

- ใช้ Repository ทางการหรือผู้ดูแลที่ตรวจสอบได้
- ตรวจ License และ Dependencies
- Pin version/commit หลังทดสอบ
- สำรอง Workflow
- ห้ามติดตั้ง Custom Node จากไฟล์ไม่ทราบแหล่ง

## 2.3 ห้าม Commit โมเดลและ Local output

เพิ่มใน `.gitignore`:

```gitignore
.local/comfyui/
models/
*.ckpt
*.safetensors
*.pt
*.pth
*.bin
*.gguf

generated_assets/staging/
generated_assets/rejected/
generated_assets/jobs/
generated_assets/contact_sheets/

config/comfyui/comfyui.local.json
.env.comfyui
```

## 2.4 ห้ามเลียนแบบ IP

ห้าม Prompt ให้ลอก:

- ตัวละครเฉพาะ
- UI ของเกมอื่น
- แผนที่หรือ Logo
- Trademark
- Sprite หรือ Boss ที่ระบุผลงานเดิมได้

ใช้คำอธิบายทั่วไป เช่น:

```text
original fantasy
16-bit inspired pixel-art readability
top-down action RPG
classic MMORPG clarity
```

---

# 3. ตำแหน่งติดตั้ง

ไม่ควรติดตั้ง ComfyUI และโมเดลใน OneDrive เพราะไฟล์ใหญ่, Sync ช้า และอาจเกิด File lock

แนะนำ:

```text
C:\AI\ComfyUI_windows_portable
```

หรือ:

```text
D:\AI\ComfyUI_windows_portable
```

---

# 4. ตรวจเครื่อง

```powershell
nvidia-smi
```

ตรวจพื้นที่:

```powershell
Get-PSDrive C, D -ErrorAction SilentlyContinue |
  Select-Object Name,
    @{Name="FreeGB";Expression={[math]::Round($_.Free/1GB,2)}},
    @{Name="UsedGB";Expression={[math]::Round($_.Used/1GB,2)}}
```

แนวทางทั่วไป:

| VRAM | งานเริ่มต้น |
|---:|---|
| 4–6 GB | Icon/prop ขนาดเล็ก, batch 1 |
| 8 GB | Concept และ icon workflow ขนาดกลาง |
| 12–16 GB | Reference workflow และโมเดลหนักขึ้น |
| 24 GB+ | Workflow หลายขั้นและ batch สูงขึ้น |

ต้องวัดกับโมเดลและ Workflow จริง

---

# 5. ติดตั้ง ComfyUI Portable

เอกสารทางการ:

```text
https://docs.comfy.org/installation/comfyui_portable_windows
```

1. ดาวน์โหลด Package ให้ตรง GPU
2. แตกด้วย 7-Zip ไปที่ `C:\AI\ComfyUI_windows_portable`
3. สำหรับ NVIDIA เปิด:

```powershell
cd C:\AI\ComfyUI_windows_portable
.\run_nvidia_gpu.bat
```

4. เปิด:

```text
http://127.0.0.1:8188
```

โครงสร้างควรคล้าย:

```text
ComfyUI_windows_portable/
├─ ComfyUI/
├─ python_embeded/
├─ update/
├─ run_cpu.bat
└─ run_nvidia_gpu.bat
```

ตรวจ API:

```powershell
Invoke-RestMethod http://127.0.0.1:8188/system_stats |
  ConvertTo-Json -Depth 10

Invoke-RestMethod http://127.0.0.1:8188/queue |
  ConvertTo-Json -Depth 10
```

---

# 6. ติดตั้ง ComfyUI Manager

เอกสารทางการ:

```text
https://docs.comfy.org/manager/install
```

Portable วิธีทางการ:

1. ติดตั้ง Git for Windows
2. ดาวน์โหลด `install-manager-for-portable-version.bat`
3. วางใน Root ของ Portable
4. Double-click
5. Restart ComfyUI

หรือ Git clone:

```powershell
cd C:\AI\ComfyUI_windows_portable\ComfyUI\custom_nodes

git clone https://github.com/Comfy-Org/ComfyUI-Manager.git comfyui-manager

cd comfyui-manager

C:\AI\ComfyUI_windows_portable\python_embeded\python.exe `
  -m pip install -r requirements.txt
```

Path ต้องเป็น:

```text
ComfyUI\custom_nodes\comfyui-manager\
```

---

# 7. สำรองและอัปเดต

ก่อน Update:

```powershell
$stamp = Get-Date -Format yyyyMMdd_HHmmss
New-Item "C:\AI\ComfyUI_BACKUPS\$stamp" -ItemType Directory -Force

Copy-Item `
  C:\AI\ComfyUI_windows_portable\ComfyUI\user `
  "C:\AI\ComfyUI_BACKUPS\$stamp\user" `
  -Recurse -Force
```

บันทึก Custom nodes:

```powershell
Get-ChildItem `
  C:\AI\ComfyUI_windows_portable\ComfyUI\custom_nodes `
  -Directory |
  Select-Object Name |
  Export-Csv `
  "C:\AI\ComfyUI_BACKUPS\$stamp\custom_nodes.csv" `
  -NoTypeInformation
```

หลัง Update ต้อง:

- เปิด Workflow smoke test
- Generate ด้วย Seed เดิม
- ตรวจ Missing node
- ตรวจ API
- ไม่ Update กลาง Phase สำคัญโดยไม่มี Backup

---

# 8. จัดการโมเดล

โฟลเดอร์หลัก:

```text
ComfyUI\models\
├─ checkpoints\
├─ diffusion_models\
├─ clip\
├─ text_encoders\
├─ vae\
├─ loras\
├─ controlnet\
├─ upscale_models\
└─ embeddings\
```

Claude Code ห้ามดาวน์โหลด Model เองโดยไม่มี Approval

สร้าง Registry:

```yaml
id: approved-model-id
displayName: Model name
sourceUrl: official-or-author-page
downloadedAt: ISO-8601
license: license name
commercialUse: allowed | restricted | unknown
redistribution: allowed | restricted | unknown
sha256: file hash
comfyFolder: checkpoints
purpose:
  - ui_icon
  - concept
approvedBy: human name
```

ตรวจ Hash:

```powershell
Get-FileHash `
  "C:\AI\ComfyUI_windows_portable\ComfyUI\models\checkpoints\MODEL.safetensors" `
  -Algorithm SHA256
```

---

# 9. สร้าง Workflow แรก

เริ่มจาก Core nodes:

```text
Model Loader
→ Positive Text Encode
→ Negative Text Encode
→ Empty Latent
→ Sampler
→ VAE Decode
→ Save Image
```

Prompt ทดสอบ:

```text
original fantasy RPG potion icon,
16-bit inspired pixel-art readability,
single centered object,
clean silhouette,
plain background,
no text,
no logo
```

Negative:

```text
photorealistic,
3D render,
text,
watermark,
logo,
multiple objects,
cropped object,
blur,
complex background
```

Prompt `transparent background` ไม่รับประกัน Alpha จริง ต้องมี Background removal หรือ Post-process

---

# 10. Export Workflow สำหรับ API

ComfyUI ใช้สองรูปแบบ:

```text
Save Format  เปิดใน UI และเก็บ Layout
API Format   ใช้ส่ง API และใช้ Numeric node IDs
```

Export:

```text
File → Export Workflow (API)
```

บันทึกคู่:

```text
workflows/comfyui/ui/ui_icon_v1.workflow.json
workflows/comfyui/api/ui_icon_v1.api.json
```

ห้ามเดา Node ID จากตัวอย่าง ต้องอ่านจาก API JSON จริง

---

# 11. Local API

Routes ที่ Pipeline ใช้:

```text
GET  /system_stats
GET  /models
GET  /models/{folder}
GET  /object_info
GET  /queue
POST /prompt
GET  /history/{prompt_id}
GET  /view
POST /upload/image
WS   /ws
```

แนะนำเริ่มแบบ Poll:

```text
POST /prompt
→ รับ prompt_id
→ GET /history/{prompt_id}
→ อ่าน output metadata
→ GET /view
```

เมื่อเสถียรค่อยเพิ่ม `/ws` สำหรับ Progress

---

# 12. โครงสร้างใน Repository

```text
.claude/agents/asset-generation-engineer.md

config/comfyui/
├─ comfyui.example.json
├─ model-registry.example.yaml
├─ prompt-style-guide.yaml
└─ workflow-registry.yaml

scripts/comfyui/
├─ health_check.py
├─ api_client.py
├─ queue_asset_job.py
├─ wait_for_job.py
├─ download_outputs.py
├─ patch_workflow.py
├─ validate_asset.py
├─ build_contact_sheet.py
├─ approve_asset.py
├─ reject_asset.py
├─ update_generated_manifest.py
└─ update_asset_index.py

workflows/comfyui/
├─ ui/
├─ api/
└─ schemas/

generated_assets/
├─ jobs/
├─ staging/
├─ approved/
├─ rejected/
├─ contact_sheets/
└─ manifests/

docs/assets/
├─ COMFYUI_PIPELINE.md
├─ ASSET_GAPS.md
├─ GENERATED_ASSET_QUALITY_GATE.md
├─ GENERATED_ASSET_LICENSE_POLICY.md
└─ COMFYUI_TROUBLESHOOTING.md
```

Claude ต้องปรับ Path ให้เข้ากับ Repository จริง โดยไม่ย้าย Asset เดิมทั้งก้อน

---

# 13. Local Config

`config/comfyui/comfyui.example.json`

```json
{
  "baseUrl": "http://127.0.0.1:8188",
  "timeoutSeconds": 900,
  "pollIntervalSeconds": 2,
  "maxConcurrentJobs": 1,
  "maxRetries": 2,
  "stagingDirectory": "generated_assets/staging",
  "jobDirectory": "generated_assets/jobs",
  "approvedDirectory": "generated_assets/approved",
  "rejectedDirectory": "generated_assets/rejected",
  "contactSheetDirectory": "generated_assets/contact_sheets",
  "requireHumanApproval": true,
  "allowAutoProductionImport": false
}
```

สร้าง Local file:

```powershell
Copy-Item `
  .\config\comfyui\comfyui.example.json `
  .\config\comfyui\comfyui.local.json
```

Optional environment:

```powershell
$env:COMFYUI_BASE_URL = "http://127.0.0.1:8188"
$env:COMFYUI_CONFIG = "config/comfyui/comfyui.local.json"
```


---

# 14. Asset Job Schema

```json
{
  "schemaVersion": 1,
  "jobId": "asset-ui-skill-fireball-001",
  "assetType": "ui_icon",
  "purpose": "Fireball active skill icon",
  "status": "draft",
  "workflowId": "ui_icon_v1",
  "seedPolicy": {
    "mode": "fixed",
    "seed": 123456789
  },
  "output": {
    "canvasWidth": 512,
    "canvasHeight": 512,
    "targetWidth": 64,
    "targetHeight": 64,
    "format": "png",
    "transparentBackground": true,
    "fileStem": "skill_fireball"
  },
  "artDirection": {
    "perspective": "icon",
    "style": "original 16-bit inspired fantasy pixel art",
    "paletteId": "world1-ui",
    "outline": "dark readable outline",
    "lighting": "upper-left",
    "mustMatch": [
      "small-size readability",
      "single centered silhouette"
    ],
    "mustAvoid": [
      "text",
      "logo",
      "photorealism",
      "copyrighted character identity"
    ]
  },
  "prompt": {
    "positive": "original fantasy fireball skill icon...",
    "negative": "text, watermark..."
  },
  "sourceReferences": [],
  "modelId": "approved-model-id",
  "loraIds": [],
  "requestedVariants": 4,
  "approval": {
    "required": true,
    "approvedBy": null,
    "approvedAt": null
  }
}
```

---

# 15. Generated Asset Manifest

ทุก Output ต้องมี Sidecar JSON:

```json
{
  "assetId": "generated.ui.skill.fireball.v1",
  "jobId": "asset-ui-skill-fireball-001",
  "status": "candidate",
  "assetType": "ui_icon",
  "files": {
    "source": "generated_assets/staging/asset-ui-skill-fireball-001/source_01.png",
    "processed": "generated_assets/staging/asset-ui-skill-fireball-001/skill_fireball_64.png"
  },
  "generation": {
    "workflowId": "ui_icon_v1",
    "workflowHash": "sha256",
    "modelId": "approved-model-id",
    "modelHash": "sha256",
    "seed": 123456789,
    "positivePromptHash": "sha256",
    "negativePromptHash": "sha256",
    "generatedAt": "ISO-8601"
  },
  "validation": {
    "technicalPassed": true,
    "artPassed": false,
    "integrationPassed": false,
    "issues": []
  },
  "license": {
    "modelLicense": "recorded in registry",
    "commercialUseChecked": true,
    "redistributionChecked": true
  }
}
```

---

# 16. Workflow Registry

```yaml
workflows:
  ui_icon_v1:
    uiFile: workflows/comfyui/ui/ui_icon_v1.workflow.json
    apiFile: workflows/comfyui/api/ui_icon_v1.api.json
    assetTypes:
      - ui_icon
      - skill_icon
      - item_icon
    requiredModels:
      - approved-model-id
    patchPoints:
      positivePrompt:
        nodeId: "6"
        input: text
      negativePrompt:
        nodeId: "7"
        input: text
      seed:
        nodeId: "3"
        input: seed
      width:
        nodeId: "5"
        input: width
      height:
        nodeId: "5"
        input: height
      filenamePrefix:
        nodeId: "9"
        input: filename_prefix
```

Node IDs ด้านบนเป็นเพียงตัวอย่าง Claude ต้องอ่านจาก API JSON จริง

---

# 17. Workflow Templates

## Priority 1

```text
ui_icon_v1
item_icon_v1
prop_isolated_v1
monster_concept_v1
character_concept_v1
```

## Priority 2

```text
reference_to_variant_v1
background_remove_v1
pixel_downscale_v1
vfx_icon_v1
portrait_v1
```

## Priority 3

```text
sprite_pose_candidate_v1
tileset_concept_v1
building_concept_v1
boss_concept_v1
```

ห้ามเริ่ม Production sprite sheet ก่อน Workflow Priority 1 ผ่านครบ

---

# 18. Prompt Style Guide

Shared positive:

```text
original fantasy game asset,
top-down RPG visual language where applicable,
16-bit inspired pixel-art readability,
clean silhouette,
consistent dark outline,
limited harmonious palette,
no text,
no logo
```

Shared negative:

```text
photorealistic,
3D render,
watermark,
signature,
logo,
letters,
numbers,
multiple unrelated objects,
cropped subject,
blur,
compression artifact,
irregular perspective,
copyrighted character,
recognizable commercial game UI
```

UI Icon:

```text
single centered object,
strong silhouette at 32 to 64 pixels,
pixel-safe margin,
simple background or isolated object,
clear selected and disabled state potential
```

Prop:

```text
isolated top-down fantasy prop,
consistent camera angle,
ground-contact readable,
transparent-background candidate,
suitable for 32x32 world grid integration
```

Monster:

```text
original fantasy creature,
readable silhouette,
clear attack anatomy,
top-down action RPG readability,
no gore,
age-appropriate
```

Character:

```text
original fantasy adventurer,
clear class silhouette,
front/back/left/right reference intent,
equipment readable at game scale,
neutral pose,
consistent proportions
```

Tileset:

```text
orthographic top-down tile concept,
32x32 grid language,
seamless ground intent,
edges corners inner corners and transitions,
no perspective drift
```

Tileset output ถือเป็น Concept จนกว่าจะผ่าน Seam test

---

# 19. Technical Quality Gate

ทุก Asset:

- PNG เปิดได้
- Dimension ตรง Spec
- Alpha ถูกต้องเมื่อกำหนด
- ไม่มี Text/Watermark
- Naming ถูกต้อง
- SHA256 บันทึก
- Provenance ครบ
- Model license ผ่าน
- Prompt และ Seed ถูกบันทึก

UI Icon:

- อ่านออกที่ 32×32 และ 64×64
- Silhouette ไม่ติดขอบ
- ไม่มีรายละเอียดเล็กเกินไป
- ทำ Selected/Disabled state ได้

Sprite Candidate:

- Anchor ที่เท้า
- Canvas เท่ากันทุกเฟรม
- Silhouette คงที่
- สีผม/ชุด/อาวุธไม่เปลี่ยนโดยไม่ตั้งใจ
- ไม่มี Ghost pixel

Tile Candidate:

- Seam test 3×3
- Edge/corner ครบ
- Perspective ตรง
- ไม่มี Object ถูกตัดขอบโดยไม่ตั้งใจ

---

# 20. Art Quality Gate

`world-art-engineer` หรือ Human reviewer ต้องตรวจ:

- ตรง Style Spine
- ไม่เลียนแบบ IP
- Palette เข้ากับ World
- อ่านได้ที่ขนาดจริง
- สื่อหน้าที่ชัด
- ไม่มี Anatomy artifact
- ไม่มีอาวุธหรือชิ้นส่วนเกิน
- เหมาะกับเด็ก
- เข้ากับ Asset เดิม
- ไม่สร้างทดแทน Asset เดิมที่คุณภาพสูงกว่า

---

# 21. Approval Flow เป้าหมาย

Generate:

```powershell
python scripts/comfyui/queue_asset_job.py `
  --job generated_assets/jobs/asset-ui-skill-fireball-001.json
```

Validate:

```powershell
python scripts/comfyui/validate_asset.py `
  --job-id asset-ui-skill-fireball-001
```

Contact sheet:

```powershell
python scripts/comfyui/build_contact_sheet.py `
  --job-id asset-ui-skill-fireball-001
```

Approve:

```powershell
python scripts/comfyui/approve_asset.py `
  --job-id asset-ui-skill-fireball-001 `
  --variant 2 `
  --approved-by "Thanabordin"
```

Reject:

```powershell
python scripts/comfyui/reject_asset.py `
  --job-id asset-ui-skill-fireball-001 `
  --reason "Perspective and silhouette do not match the game"
```

Scripts เหล่านี้จะถูกสร้างโดย Master Setup Prompt

---

# 22. Production Import Policy

เมื่อ `requireHumanApproval=true` Agent ห้ามนำเข้าเกมอัตโนมัติ

หลัง Approval:

1. Copy เฉพาะไฟล์ที่เลือก
2. ตั้ง Filename ตาม Convention
3. อัปเดต Manifest
4. อัปเดต `ASSET_MASTER_INDEX.md`
5. เพิ่ม Phaser config
6. รัน Asset path validator
7. Build
8. เปิด Diagnostic scene
9. ทำ Visual smoke
10. Commit Asset + Metadata

---

# 23. Agent ใหม่สำหรับ Claude Code

สร้าง `.claude/agents/asset-generation-engineer.md`

```md
---
name: asset-generation-engineer
description: Use when a required map, character, animation, monster, boss, prop, UI icon, VFX, portrait, or visual asset is genuinely missing after searching the approved asset index and real asset directories.
model: sonnet
effort: high
permissionMode: acceptEdits
maxTurns: 50
isolation: worktree
---

You own the missing-asset generation pipeline, not final art approval.

Before generation:

1. Read the asset index, quality reports, pipeline docs, workflow registry,
   model registry, and current art direction.
2. Search the index and actual folders using multiple names and synonyms.
3. Confirm the asset is genuinely absent or unusable.
4. Prefer:
   - approved existing asset
   - safe recomposition of compatible licensed layers
   - approved generation workflow
   - clearly marked temporary placeholder

Rules:

- Use only approved models and workflows.
- Use only local ComfyUI from configuration.
- Never expose ComfyUI publicly.
- Do not install custom nodes without approval.
- Do not download model weights without license approval.
- Do not imitate protected characters, maps, logos, or commercial UI.
- Record model, workflow, seed, prompt hashes, output hashes, and license.
- Keep generated output in staging.
- Never mark production-ready without technical, art, and integration approval.
- Never overwrite an existing approved asset.
- Retry only up to configured limit.
- Do not claim success until output files exist and pass validation.

Completion report:

- evidence the asset was missing
- workflow/model selected
- job files
- generated variants
- validation
- contact sheet
- recommended variant
- approval status
- changed files
- rollback
```

ถ้า Frontmatter บาง field ไม่รองรับ ให้ Claude ลบเฉพาะ field นั้นและบันทึกในรายงาน

---

# 24. Routing Rule สำหรับ CLAUDE.md

```md
## Generated Asset Routing

When a required visual asset is missing:

1. Delegate search and art review to `world-art-engineer`.
2. Only after it confirms the asset is missing, delegate generation to
   `asset-generation-engineer`.
3. Generated files remain in staging until approval.
4. Never import generated assets into production automatically.
5. Character, animation, and tileset candidates require manual art review.
6. Record provenance, model license, workflow version, seed, prompt hash,
   and output hash.
7. Do not install custom nodes or download models without explicit approval.
8. Never replace a higher-quality approved asset because generation exists.
9. Track TEMP placeholders in `ASSET_GAPS.md`.
```

---

# 25. ตำแหน่งใน Roadmap เกม

อย่าแทรก Pipeline กลาง Atomic gameplay phase

```text
ทำ Phase ปัจจุบันให้ผ่านและ Push
→ สร้าง tooling/comfyui-asset-pipeline
→ ติดตั้งและทดสอบ UI icon 1 ชิ้น
→ Merge Pipeline
→ ใช้จริงก่อน Phase 12–14
```

ควรพร้อมก่อน:

- Phase 12 Four Class Kits
- Phase 13 Loot/Sigil
- Phase 14 World 1

ห้าม Mass generate ก่อน:

- Art direction ล็อก
- Workflow smoke test ผ่าน
- License registry พร้อม
- Approval flow ใช้งานได้


---

# 26. ComfyUI Pipeline Phases

## A0 — Preflight

- ตรวจ GPU
- ComfyUI health
- Git clean
- Backup
- ไม่มี Gameplay change

## A1 — Repository Scaffold

- สร้าง Config/Script/Workflow/Docs
- ปรับ `.gitignore`
- สร้าง Schemas
- ยังไม่ Generate

## A2 — Local API Client

- Health check
- Queue prompt
- Poll history
- Download output
- Timeout/retry
- Mock tests

## A3 — Workflow Registry

- Export UI/API workflow
- ระบุ Patch points
- ตรวจ Required node/model
- Version และ Hash

## A4 — Asset QA

- PNG/dimension/alpha
- Naming
- Provenance
- Contact sheet
- Approve/reject

## A5 — Claude Integration

- Agent
- Routing
- Asset gap tracking
- Install report

## A6 — First Production Trial

สร้างเพียง:

```text
UI skill icon 1 ชิ้น
Prop 1 ชิ้น
Monster concept 1 ชิ้น
```

ตรวจครบ:

```text
Generate
→ Validate
→ Contact sheet
→ Approve
→ Import
→ Build
→ Visual smoke
→ Rollback
```

---

# 27. MASTER SETUP PROMPT สำหรับ Claude Code

ใช้หลังจาก:

- ComfyUI เปิดที่ `127.0.0.1:8188`
- Generate ภาพใน UI ได้แล้วอย่างน้อย 1 ภาพ
- Phase เกมปัจจุบัน Commit และ Push แล้ว
- Working tree สะอาด

```text
You are installing the ComfyUI asset-generation pipeline for RPG-O-NET P.6.

READ FIRST:

- CLAUDE.md
- .claude/CLAUDE.md if present
- every file under .claude/agents/
- RPG_ONET_NEW_GAME_FOUNDATION_MASTER_PLAN_TH.md
- RPG_ONET_COMFYUI_ASSET_GENERATION_SETUP_PACK_TH.md
- ASSET_MASTER_INDEX.md
- ASSET_QUALITY_REPORT.md
- S_GRADE_VISUAL_REVIEW.md
- MAP_ASSET_USAGE.md
- MONSTER_BOSS_PLACEMENT.md
- MISSING_OR_WEAK_ASSETS.md
- package.json
- current Git status
- execution-state and handoff documents

SCOPE:

Install the ComfyUI integration foundation only.
Do not generate a large asset batch.
Do not redesign gameplay.
Do not alter combat, saves, multiplayer, learning, economy, or current maps.
Do not download model weights.
Do not install custom nodes.
Do not expose ComfyUI beyond localhost.
Do not overwrite approved assets.

PREFLIGHT:

1. Verify the current gameplay phase is committed, pushed, and clean.
2. If not clean, preserve user work and stop with exact normalization commands.
3. Create or switch to:
   tooling/comfyui-asset-pipeline
4. Verify:
   - http://127.0.0.1:8188/system_stats
   - http://127.0.0.1:8188/queue
5. Detect repository Python.
6. Inspect existing asset folders and naming conventions.
7. Detect supported Claude subagent frontmatter.

IMPLEMENT A0-A5:

A0:
- create docs/assets/COMFYUI_PREFLIGHT_REPORT.md
- record ComfyUI health, device, exposed VRAM, Git state, and blockers

A1:
- create the repository scaffold described in this Setup Pack
- update .gitignore safely
- create example configuration only
- never commit absolute local paths or secrets

A2:
- implement a local ComfyUI API client using:
  - GET /system_stats
  - GET /queue
  - POST /prompt
  - GET /history/{prompt_id}
  - GET /view
  - POST /upload/image when needed
- support timeout, retry, structured errors, and testable dependency injection
- prefer Python standard library and Pillow
- add websocket-client only if progress WebSocket is implemented
- do not add a large framework

A3:
- implement workflow registry and patch-point validation
- never guess node IDs
- require workflows exported through File → Export Workflow (API)
- create placeholder registry entries if workflow files are absent
- validate model names through ComfyUI endpoints when possible
- compute workflow hashes

A4:
- implement:
  - job schema validation
  - PNG validation
  - dimensions
  - alpha checks
  - filename checks
  - SHA256
  - provenance sidecars
  - contact sheets
  - approve/reject flow
  - generated manifest update
- requireHumanApproval defaults to true
- allowAutoProductionImport defaults to false

A5:
- create .claude/agents/asset-generation-engineer.md
- merge Generated Asset Routing into active CLAUDE.md
- create:
  - docs/assets/COMFYUI_PIPELINE.md
  - docs/assets/ASSET_GAPS.md
  - docs/assets/GENERATED_ASSET_QUALITY_GATE.md
  - docs/assets/GENERATED_ASSET_LICENSE_POLICY.md
  - docs/assets/COMFYUI_TROUBLESHOOTING.md
- preserve existing project rules

TEST:

- mocked API health/queue/prompt/history/view
- workflow patch success/failure
- invalid job rejection
- invalid PNG rejection
- dimension mismatch
- missing alpha
- naming violation
- duplicate asset id
- approval required
- provenance/hash
- no production import before approval
- retry limit
- timeout

LOCAL SMOKE:

If ComfyUI is healthy and an API workflow exists:
- submit one harmless test job
- download it into staging
- validate it
- build a contact sheet
- do not import it into production

If no API workflow exists:
- do not fabricate one
- write exact export and registration instructions
- finish installation without generation

VALIDATE:

- tests
- production build
- Git diff scope
- no model files staged
- no generated staging files staged
- no local absolute paths committed
- no gameplay source changed unless a tiny non-runtime adapter is explicitly required and documented

CREATE:

- docs/assets/COMFYUI_INSTALL_REPORT.md

Report:
- agents/models/effort used
- files created
- dependencies added
- API health
- workflows registered
- tests/build
- limitations
- manual steps remaining
- rollback
- whether Claude Code restart is required

Commit after validation:

chore: add ComfyUI asset generation pipeline

Push the tooling branch.
Stop after A5.
Do not begin A6 or mass generation.
```

---

# 28. PROMPT ลงทะเบียน Workflow แรก

หลังสร้าง Workflow ใน ComfyUI UI และ Export API JSON:

```text
Use asset-generation-engineer with world-art-engineer as reviewer.

Register:

- UI workflow: [PATH]
- API workflow: [PATH]
- workflow id: ui_icon_v1
- asset types:
  - ui_icon
  - skill_icon
  - item_icon

Tasks:

1. Validate both JSON files.
2. Inspect actual node IDs and class types.
3. Identify patch points:
   - positive prompt
   - negative prompt
   - seed
   - width
   - height
   - batch size
   - model name when configurable
   - filename prefix
4. Never guess node IDs.
5. Add the workflow to the registry.
6. Record required models and custom nodes.
7. Confirm every model is approved in the model registry.
8. Run one API smoke job into staging.
9. Validate output and build a contact sheet.
10. Do not import into production.
11. Update docs and tests.
12. Commit and push after review.
```

---

# 29. PROMPT สร้าง Asset แรก

```text
Use world-art-engineer to search the approved asset index and real folders for:

[DESCRIBE THE ASSET]

If a suitable approved asset exists:
- use it
- do not generate a replacement

If the asset is genuinely missing:
- use asset-generation-engineer
- create an Asset Job from an approved workflow
- generate 4 variants
- keep outputs in staging
- validate each variant
- create a contact sheet
- recommend the best variant with reasons
- do not approve or import automatically
- report the exact approval command

The asset must:
- be original
- match the approved fantasy visual style
- match the required perspective and dimensions
- contain no text, logo, watermark, or protected identity
- include complete provenance
```

---

# 30. PROMPT อนุมัติและนำเข้าเกม

```text
Approve variant [NUMBER] from job [JOB_ID].

Use world-art-engineer for art review and
asset-generation-engineer for pipeline actions.

Before approval:

- confirm technical validation passed
- confirm model and workflow licenses are recorded
- confirm the asset does not imitate protected IP
- verify readability at final in-game size

Then:

1. mark the variant approved
2. move only the required source and processed files
3. update generated manifest
4. update ASSET_MASTER_INDEX.md
5. integrate into the correct Phaser/Nuxt asset path
6. preserve pixel-perfect rendering
7. run asset path validation
8. run production build
9. perform visual smoke test
10. report changed files and rollback
11. commit and push

Do not delete rejected variants until the retention policy permits it.
```

---

# 31. Batch Generation Policy

ห้ามสั่ง:

```text
สร้าง Asset ที่ขาดทั้งหมด
```

ก่อน A6 ผ่าน

Batch แรก:

```text
สูงสุด 10 jobs
4 variants ต่อ job
1 concurrent job
```

หยุด Batch เมื่อ:

- Technical failure >20%
- Style rejection >50%
- ComfyUI error 2 ครั้งติด
- VRAM error
- Disk ต่ำกว่า Threshold
- Model/License mismatch
- Workflow hash เปลี่ยนโดยไม่ตั้งใจ

---

# 32. Character Sprite Pipeline

## รอบ 1 — Concept Lock

- Character silhouette
- Palette
- Equipment
- Proportion
- Front/back/left/right reference

## รอบ 2 — Base Sprite

- Idle front
- Pixel cleanup
- Foot anchor
- Final canvas

## รอบ 3 — Directions

- down
- up
- left
- right
- Mirror เฉพาะเมื่อ Art direction อนุญาต

## รอบ 4 — Animations

- idle
- walk
- attack
- hurt
- death

## รอบ 5 — Layering

- body
- hair
- outfit
- pants
- shoes
- weapon
- accessory

ทุก Layer ต้องใช้:

- Canvas เดียวกัน
- Anchor เดียวกัน
- Frame count เดียวกัน
- State/direction order เดียวกัน

ComfyUI ช่วยสร้าง Candidate และ Reference ได้ แต่ Final pixel cleanup และ frame alignment ต้องผ่าน Review

---

# 33. Tileset Pipeline

AI-generated tileset ต้องมี:

```text
ground center
top/bottom/left/right edge
outer corners
inner corners
transition
wall
wall top
door
stairs
decal
prop
foreground
collision intent
```

Seam test:

```text
วาง Tile เป็น 3×3
สลับ Edge/Corner
ตรวจเส้นขาด
ตรวจ Perspective
ตรวจ Repetition
```

ห้ามนำภาพฉากรวมไปใช้เป็น Tile โดยตรง

---

# 34. UI Icon Pipeline

ขนาด:

```text
Source: 256–512 px ตาม Workflow
Processed: 32, 48, 64 หรือขนาดที่ UI จริงใช้
```

ขั้นตอน:

```text
Generate
→ Background cleanup
→ Crop with safe margin
→ Pixel-aware downscale
→ Palette/contrast review
→ 32/64 preview
→ Selected/disabled/cooldown state test
```

ห้ามใช้ Bilinear resize สำหรับ Pixel output สุดท้าย  
ใช้ Nearest-neighbor หรือ Pixel-art-aware process ตาม Art direction

---

# 35. Missing Asset Decision Tree

```text
Asset required
│
├─ พบใน Asset Index และ License ใช้ได้
│  └─ ใช้ Asset เดิม
│
├─ มีชิ้นส่วนเดิมที่ประกอบได้
│  └─ Recompose โดยไม่ทำลาย Style
│
├─ ไม่มีจริง และมี Workflow/Model ที่ Approved
│  └─ Generate เป็น Candidate
│
├─ ไม่มี Workflow ที่ Approved
│  └─ สร้าง Generation Spec + ASSET_GAPS entry
│
└─ Code ถูก Block
   └─ ใช้ TEMP_ placeholder ชั่วคราวและห้ามถือว่า Production-ready
```

---

# 36. Troubleshooting

## API ไม่ตอบ

```powershell
Test-NetConnection 127.0.0.1 -Port 8188
Invoke-RestMethod http://127.0.0.1:8188/system_stats
```

ตรวจ Console ของ ComfyUI

## Model ไม่พบ

```powershell
Invoke-RestMethod http://127.0.0.1:8188/models/checkpoints
```

หรือ Folder ที่ Workflow ใช้ แล้ว Restart ComfyUI หลังวาง Model

## Workflow API Error

ตรวจ:

- Export เป็น API format
- Node IDs
- Model name
- Custom nodes
- Required inputs
- `node_errors` จาก `/prompt`

## Out of Memory

- ลด Width/Height
- Batch = 1
- ปิดโปรแกรมที่ใช้ GPU
- ใช้ Workflow เบากว่า
- ตรวจว่ามี Upscale/Preview ซ้ำหรือไม่
- Restart ComfyUI

## ภาพไม่โปร่งใส

Prompt ไม่รับประกัน Alpha

ใช้:

- Background removal workflow
- Solid chroma background + removal
- Post-processing
- Alpha validation

## Style ไม่ตรง

- Lock model/workflow
- Lock seed สำหรับ Comparison
- เพิ่ม Reference
- ลด Prompt ที่ขัดกัน
- ใช้ Palette guide
- สร้าง Contact sheet
- ปรับทีละตัวแปร

## Claude บอก Generate สำเร็จแต่ไม่พบไฟล์

ตรวจ:

- `/history/{prompt_id}`
- Output node
- filename/subfolder/type
- `/view` parameters
- ComfyUI output directory
- Manifest path

ห้ามถือว่าสำเร็จจนไฟล์มีอยู่จริงและคำนวณ Hash ได้

---

# 37. Definition of Done

Pipeline พร้อมเมื่อ:

- ComfyUI Local API health ผ่าน
- API client tests ผ่าน
- Workflow registry ใช้งานได้
- API workflow ถูก Export จริง
- Job schema ผ่าน
- Generate UI icon 1 ชิ้นเข้า Staging ได้
- Validate ได้
- Contact sheet ได้
- Approval gate บังคับใช้
- Import ก่อน Approval ถูกปฏิเสธ
- Provenance ครบ
- License registry มีข้อมูล
- Asset index อัปเดตหลัง Approval
- Production build ผ่าน
- Staging/model/local config ไม่ถูก Commit
- Rollback ถูกทดสอบ
- Agent เรียกใช้งานได้
- ไม่มี Gameplay regression

---

# 38. Quick Start Checklist

```text
[ ] ติดตั้ง ComfyUI ที่ C:\AI หรือ D:\AI ไม่ใช่ OneDrive
[ ] เปิดที่ 127.0.0.1:8188
[ ] /system_stats ตอบ JSON
[ ] ติดตั้ง Manager จากแหล่งทางการ
[ ] เลือกและอนุมัติโมเดลพร้อม License
[ ] Generate ภาพแรกใน UI
[ ] Export Workflow (API)
[ ] วาง Setup Pack ใน Root เกม
[ ] Commit/Push Phase เกมปัจจุบัน
[ ] สร้าง tooling/comfyui-asset-pipeline
[ ] รัน MASTER SETUP PROMPT
[ ] Register workflow
[ ] Generate UI icon 1 ชิ้น
[ ] Validate + Contact sheet
[ ] Approve ด้วยมนุษย์
[ ] Import + Build + Visual smoke
[ ] จึงค่อยเพิ่ม Prop และ Monster concept
```

---

# 39. Official References

ComfyUI:

```text
https://docs.comfy.org/
https://docs.comfy.org/installation/system_requirements
https://docs.comfy.org/installation/comfyui_portable_windows
https://docs.comfy.org/manager/install
https://docs.comfy.org/development/comfyui-server/comms_routes
https://docs.comfy.org/development/comfyui-server/api-examples
```

Claude Code:

```text
https://code.claude.com/docs/en/sub-agents
https://code.claude.com/docs/en/agents
https://code.claude.com/docs/en/best-practices
```

---

# 40. คำสั่งเริ่มต้นหลังดาวน์โหลดไฟล์

วางไฟล์นี้ใน Root ของโปรเจกต์ แล้วเมื่อ ComfyUI พร้อม ให้เปิด Claude Code และสั่ง:

```text
Read RPG_ONET_COMFYUI_ASSET_GENERATION_SETUP_PACK_TH.md completely.

Execute only the MASTER SETUP PROMPT in section 27.

Do not mass-generate assets.
Do not modify gameplay.
Stop after A5 is installed, tested, documented, committed, and pushed.
```
