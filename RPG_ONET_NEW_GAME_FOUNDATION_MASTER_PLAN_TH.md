# RPG-O-NET P.6 — NEW GAME FOUNDATION & DAILY LEARNING MASTER PLAN
## แผนยกเครื่องรากฐานเกมให้เป็น Fantasy 16-bit Educational RPG ที่นักเรียนอยากเล่นและเรียนรู้ได้ทุกวัน

> Repository: `https://github.com/Ernestyy52/RPG-O-NET-P.6`  
> จัดทำสำหรับการพัฒนาด้วย Claude Code  
> วันที่: 12 กรกฎาคม 2026  
> เป้าหมาย: **เกมต้องสนุกได้ด้วยตัวเอง และการเล่นทุกวันต้องทำให้นักเรียนพร้อมสอบ O-NET มากขึ้นอย่างวัดผลได้**

---

# 0. ข้อสรุปเชิงบริหาร

โปรเจกต์นี้ **ไม่ควรถูกลบทิ้งและสร้างใหม่ทั้งก้อน** เพราะมีฐานที่มีคุณค่าอยู่แล้ว:

- Nuxt + Vue สำหรับ UI
- Phaser สำหรับโลกเกม
- Pinia สำหรับสถานะผู้เล่น
- Colyseus สำหรับ Multiplayer
- ระบบชั้น ไบโอม เมือง มอนสเตอร์ บอส อาชีพ ไอเทม Craft และ Daily Quest
- คลัง Asset มากกว่า 14,000 PNG พร้อม Asset Index
- ระบบคำถามและบทเรียน O-NET เบื้องต้น
- Offline fallback
- ระบบห้องเมืองและดันเจี้ยนออนไลน์

แต่ควร **ยกเครื่องแกนกลาง** เพราะระบบปัจจุบันยังมีลักษณะเป็น “ชุดฟีเจอร์ที่ต่อกัน” มากกว่า “เกม RPG ที่มีวงจรเล่นซ้ำและเรียนรู้ต่อเนื่อง”

## คำตัดสินหลัก

### เก็บ

- Technology stack หลัก
- Asset index และ Style Spine แบบ Craftpix top-down
- 4 อาชีพเดิม
- Floor/Biome concept
- Item/Crafting data บางส่วน
- Multiplayer room foundation
- Offline fallback
- Existing question bank และ Study lessons ในฐานะข้อมูลตั้งต้น
- Save เดิมในฐานะ Legacy Save ที่ต้อง Migration

### ปรับโครงสร้าง

- Pinia player store
- Skill Tree
- Equipment generation
- Quest system
- Question selection
- TowerScene และ TownScene
- Vue ↔ Phaser communication
- Multiplayer validation
- Daily content
- Progression และ Economy

### แทนที่ในระยะยาว

- Modal-only battle
- การสุ่มคำถามจาก CEFR อย่างเดียว
- Skill ที่เพิ่มแต่ตัวเลข
- Daily Quest ที่มีเพียงตอบคำถาม/ฆ่ามอนสเตอร์/ขึ้นชั้น
- Client-authoritative rewards
- แผนที่ที่ปู Tile ซ้ำและวาดอาคารด้วย primitive
- Save state ก้อนเดียวที่ผสมตัวละคร การเรียน และ Economy
- ระบบ “ตอบถูก = ได้พลัง” ที่ไม่มี Mastery หรือคำอธิบายตัวลวง

---

# 1. หลักฐานจาก Repository ปัจจุบัน

## 1.1 Stack

`package.json` แสดงการใช้:

- Nuxt 4
- Vue 3
- Phaser 4
- Pinia 3
- persisted state
- Colyseus client
- mitt event bus

นี่เป็น Stack ที่สามารถทำเกมเว็บ Top-down RPG ได้ ไม่จำเป็นต้องเปลี่ยน Engine ก่อนพิสูจน์ Gameplay

## 1.2 TowerScene รับผิดชอบมากเกินไป

`app/game/scenes/TowerScene.ts` มีหน้าที่รวมกันหลายเรื่อง:

- สร้างพื้นและกำแพง
- สร้างต้นไม้
- สร้างผู้เล่น
- จัดกล้องและ Collision
- Spawn/เดินมอนสเตอร์
- Boss door และ Boss
- Multiplayer join/sync
- Encounter
- Weather/BGM
- UI plaque
- Battle event
- Scene lifecycle

ผลคือ:

- แก้ Combat แล้วกระทบ World
- แก้ Multiplayer แล้วกระทบ Spawn
- ทดสอบยาก
- เพิ่ม Zone ใหม่ต้องคัดลอก Logic
- Claude Code มีโอกาสแก้เกินขอบเขตและสร้าง Regression

## 1.3 BattleModal เป็นทั้ง UI และกฎการต่อสู้

`BattleModal.vue` เป็นจุดสำคัญของการต่อสู้เดิม ทำให้:

- โลกหยุดเมื่อเริ่มศึก
- การสำรวจและการต่อสู้ไม่ต่อเนื่อง
- Logic มีโอกาสผูกกับ Component state
- Real-time combat ขยายยาก
- Multiplayer combat validation ทำยาก
- การใช้ Animation/Position/Telegraph บนแผนที่มีข้อจำกัด

## 1.4 Player store ผสมหลาย Domain

`app/stores/player.ts` เก็บ:

- Login
- Character creation
- Appearance
- Stats
- HP/MP
- Level/EXP
- Gold/Gems
- Inventory
- Equipment
- Skill tree
- Daily quest
- Correct answer total
- Adventure log
- Shop
- Craft
- Hospital
- Floor progression

Store นี้ใช้งานได้ดีใน Prototype แต่ไม่ควรเป็น Source of Truth เดียวของเกมระยะยาว

## 1.5 Skill Tree เป็น Stat Tree

`app/data/skills.ts` มี 4 อาชีพ × 3 สาย × 4 Rank แต่เกือบทุก Node เป็น:

- +ATK
- +DEF
- +HP
- +MAG
- +Speed
- +Knowledge

ชื่อสกิลดูเหมือน Active Skill แต่ผลจริงส่วนใหญ่เป็น Stat เพิ่ม ทำให้ Build ไม่เปลี่ยนวิธีเล่น

## 1.6 Question selection ยังไม่ Adaptive

`app/data/questions.ts` มีข้อดี:

- CEFR ตามชั้น
- Shuffle bag ลดการซ้ำ
- Difficulty matching

แต่ยังไม่มี:

- Subskill mastery
- Misconception
- Spaced repetition
- ความมั่นใจ
- ความเร็วในการอ่านที่เหมาะสม
- การอธิบายตัวลวง
- การเลือกข้อจากข้อที่เคยผิด
- Teacher focus
- Session learning objective

## 1.7 Daily Quest ยังตื้น

Daily Quest มี 3 รูปแบบ:

- ตอบถูก
- ฆ่ามอนสเตอร์
- ขึ้นชั้น

ข้อดีคือ deterministic และทำให้กลับมาเล่น แต่ข้อเสียคือ:

- วันหนึ่งกับอีกวันต่างกันแค่จำนวน
- ไม่สร้างเรื่องราว
- ไม่ฝึก Subskill ที่ผู้เรียนอ่อน
- ชวน Grind
- ไม่ใช้ระบบโลกและ NPC
- ไม่มีภารกิจอ่านป้าย สนทนา แผนที่ Puzzle Craft หรือช่วยเพื่อน

## 1.8 Asset Foundation ดีมาก

Asset index ระบุ:

- 14,449 PNG
- Craftpix top-down เป็น Style Spine
- Grid หลัก 32×32
- มี Hero, Monster, Boss, Village, Bush, Dungeon, Ruin, UI, VFX และ BGM
- มี Asset ระดับ A/S จำนวนมาก

ปัญหาหลักจึงไม่ใช่ “ไม่มี Asset” แต่คือ:

- Selection
- Normalization
- Animation slicing
- Composition
- Map authoring
- Runtime loading
- Consistency

## 1.9 Multiplayer เป็น Prototype ที่ต่อยอดได้

ระบบเดิมมี:

- Town room
- Dungeon room ต่อชั้น
- Shared monster positions
- Instanced battle lock
- Offline fallback

แต่ Server ยังเชื่อ Client หลายส่วน และ Persistence ยังอยู่ฝั่ง Local จึงควรเก็บ Protocol foundation แต่ย้าย Authority ทีละระบบ

---

# 2. วิสัยทัศน์เกมใหม่

## Working Title

**Spiral’s Echo: O-NET Adventures**

ชื่อสามารถเปลี่ยนได้ แต่ Identity ควรเป็นต้นฉบับ ไม่ใช้ชื่อ UI ตัวละคร เนื้อเรื่อง หรือแผนที่จากผลงานอื่น

## Fantasy

ผู้เล่นคือ `Echo Seeker` ผู้ฟื้นฟู “Archive Heart” ที่แตกออกเป็นเศษความรู้ในโลกหอคอย 100 ชั้น

โลกไม่ได้กักผู้เล่นและไม่มี Perma Death แต่ “The Silence” กำลังลบภาษา ความทรงจำ เส้นทาง และตัวตนของ NPC ออกจากโลก

ผู้เล่นต้อง:

- สำรวจ
- ช่วย NPC
- อ่านเบาะแส
- ต่อสู้
- แก้ Rune
- สร้าง Build
- ร่วมทีม
- ฟื้นฟูความรู้
- พิชิต Guardian ของแต่ละ World

## Product Promise

> เล่นวันละ 15–30 นาที ได้ทั้งการผจญภัยที่สนุก ความก้าวหน้าของตัวละคร และการฝึก O-NET ที่ปรับตามจุดอ่อนของนักเรียน

## กฎเหล็ก

1. เกมต้องยังสนุกเมื่อไม่มีคำถามต่อเนื่องทุกวินาที
2. การเรียนต้องเกิดจริง ไม่ใช่เพียงแจก Reward เมื่อกดคำตอบถูก
3. การตอบผิดต้องสร้างความเข้าใจ ไม่ใช่สร้างความอับอาย
4. ไม่มี Pay-to-win, Loot box หรือ Streak ที่ลงโทษเด็ก
5. ครูต้องตรวจสอบเนื้อหาได้
6. AI-generated question ห้ามเข้าระบบจริงโดยไม่มี Review
7. ทุกระบบต้องเล่นได้บนมือถือ
8. World 1 ต้องสมบูรณ์ก่อนทำครบ 100 ชั้น

---

# 3. แกนการเล่นใหม่

# 3.1 วงจรหลัก 30–90 วินาที

```text
สำรวจ
→ พบศัตรู/ปริศนา/NPC/สิ่งลับ
→ ตัดสินใจและลงมือ
→ รับ Feedback ชัดเจน
→ ได้รางวัลหรือข้อมูลใหม่
→ เปลี่ยนเส้นทาง/Build/กลยุทธ์
```

# 3.2 วงจร Session 15–30 นาที

```text
รับ Daily Expedition
→ Warm-up สั้นจากเรื่องที่เคยผิด
→ สำรวจพื้นที่เป้าหมาย
→ ต่อสู้และทำกิจกรรมภาษาในโลก
→ Knowledge Break/Elite
→ Mini-boss หรือ Objective
→ สรุปสิ่งที่เรียน
→ รับรางวัลและตั้งเป้าทบทวนครั้งถัดไป
```

# 3.3 วงจรรายสัปดาห์

```text
ฝึก Subskill หลายวัน
→ เปิด Weekly Memory Dungeon
→ ใช้ความรู้ผสมหลายหัวข้อ
→ Boss เปลี่ยนกลไกตามหัวข้อที่ฝึก
→ รับ Named Item / Sigil / Story Memory
```

# 3.4 วงจรระยะยาว

```text
Mastery เพิ่ม
→ Job/Build เติบโต
→ World ใหม่เปิด
→ เนื้อเรื่องคลี่คลาย
→ ความยาก O-NET เพิ่มอย่างมีขั้น
→ Mock Expedition ก่อนสอบ
```

---

# 4. ระบบเล่นทุกวันโดยไม่ทำร้ายแรงจูงใจ

## 4.1 Daily Expedition

ทุกวันระบบสร้าง Mission 1 ชุดจาก:

- World ที่ผู้เล่นกำลังเล่น
- Subskill ที่ควรฝึก
- เนื้อหาที่เคยผิด
- เนื้อหาทบทวน
- Activity ที่ยังไม่ได้เล่นบ่อย
- เวลา Session ที่เลือก

### รูปแบบ 10 นาที

- Warm-up 2 ข้อ
- Field objective 1 อย่าง
- Elite หรือ Puzzle 1 อย่าง
- สรุป 1 นาที

### รูปแบบ 20 นาที

- Warm-up
- Main field objective
- Side encounter
- Knowledge Break
- Mini-boss
- Review

### รูปแบบ 30 นาที

- Warm-up
- Quest chain สั้น
- Dungeon
- Boss
- Review + Build upgrade

## 4.2 ไม่ใช้ Daily Streak แบบลงโทษ

ใช้ระบบ:

### Adventure Rhythm

- เป้าหมาย 5 วันจาก 7 วัน
- ขาดวันไม่รีเซ็ตทั้งหมด
- มี Rested Learning Bonus
- มี Catch-up Expedition
- ไม่มีการทำให้นักเรียนรู้สึกผิด
- ไม่ล็อกเนื้อเรื่องสำคัญไว้หลัง Streak ยาว

## 4.3 Daily Variety Matrix

ระบบต้องหมุนกิจกรรม:

| หมวด | ตัวอย่าง |
|---|---|
| Combat | ปราบ Elite, ปกป้อง NPC, Survive |
| Exploration | หา Landmark, เปิดแผนที่, ตามรอย |
| Reading | อ่านป้าย, จดหมาย,ประกาศ |
| Conversation | เลือกคำตอบให้เหมาะกับสถานการณ์ |
| Grammar | ซ่อม Rune sentence |
| Vocabulary | จับคู่ของกับคำอธิบาย |
| Directions | เดินตามคำสั่งภาษาอังกฤษ |
| Craft | อ่านสูตรและเลือกวัตถุดิบ |
| Social | ช่วยเพื่อน, Revive, Team puzzle |
| Reflection | อธิบายว่าทำไมคำตอบหนึ่งจึงผิด |

ห้ามสุ่ม Daily จาก Counter เพียงอย่างเดียว

---

# 5. Learning Engine ใหม่

# 5.1 Learning Loop

```text
Diagnose
→ Select
→ Practice
→ Apply in context
→ Explain feedback
→ Retrieve later
→ Mastery update
```

## 5.2 Curriculum Graph

สร้าง Graph ของ O-NET English ป.6

```text
Domain
└─ Skill
   └─ Subskill
      ├─ Prerequisites
      ├─ Common misconceptions
      ├─ Difficulty band
      ├─ Example contexts
      └─ Question templates
```

ตัวอย่าง:

```text
Grammar
└─ Present Simple
   ├─ subject-verb agreement
   ├─ do/does questions
   ├─ negative forms
   └─ time expressions
```

## 5.3 Question Schema ใหม่

```ts
export interface LearningQuestion {
  id: string
  version: number
  status: 'draft' | 'reviewed' | 'retired'

  sourceType: 'official-pattern' | 'teacher-authored' | 'reviewed-generated'
  sourceYear?: number

  grade: 6
  domain:
    | 'vocabulary'
    | 'grammar'
    | 'reading'
    | 'conversation'
    | 'functional-language'
    | 'signs-and-notices'
    | 'integrated'

  skill: string
  subskill: string
  prerequisiteTags: string[]
  misconceptionTags: string[]

  cefr: 'Pre-A1' | 'A1' | 'A2'
  difficulty: 1 | 2 | 3 | 4 | 5
  estimatedSeconds: number

  prompt: string
  choices: string[]
  correctIndex: number

  explanationTh: string
  explanationEn?: string
  distractorReasons: string[]

  contextTags: string[]
  media?: {
    type: 'image' | 'map' | 'sign' | 'dialogue'
    assetId: string
    altTh: string
  }

  review: {
    reviewedBy: string
    reviewedAt: string
    contentHash: string
  }
}
```

## 5.4 Mastery Model

Mastery ห้ามคำนวณจาก Accuracy อย่างเดียว

```ts
export interface SubskillMastery {
  subskillId: string
  attempts: number
  correct: number
  recentAccuracy: number
  hintRate: number
  averageResponseMs: number
  misconceptionCounts: Record<string, number>
  stability: number
  difficultyCeiling: number
  lastSeenAt: number
  nextReviewAt: number
  state: 'new' | 'learning' | 'developing' | 'stable' | 'mastered'
}
```

## 5.5 Question Selector

ค่าเริ่มต้น:

- 35% หัวข้อเป้าหมายของวัน
- 25% จุดอ่อน
- 20% Spaced review
- 10% Transfer/context ใหม่
- 10% เรื่องที่ทำได้ดีเพื่อความมั่นใจ

ปรับตาม:

- อายุ
- Session length
- Accuracy
- Reading time
- ความเหนื่อย
- Teacher focus
- จำนวนครั้งที่เจอคำถาม
- Answer position balance

## 5.6 Feedback Loop

ตอบผิดต้องแสดง:

1. คำตอบที่ถูก
2. เหตุผลหนึ่งหรือสองบรรทัด
3. ตัวเลือกที่เลือกผิดเพราะอะไร
4. ตัวอย่างใหม่
5. การลองซ้ำแบบเปลี่ยนบริบทในอนาคต
6. ห้ามแสดงข้อความตำหนิ

## 5.7 Knowledge Break

คำถามเกิดเมื่อ:

- Elite กำลังร่ายท่าใหญ่
- Boss เปิดเกราะ
- Rune door
- หีบพิเศษ
- ต่อรองกับ NPC
- เปิดทางลับ
- Ultimate
- ช่วยเพื่อน
- วิเคราะห์ Weakness

ไม่เกิดทุก Hit

## 5.8 Knowledge Actions ตามอาชีพ

### Warrior

`Tactical Read`  
ตอบคำถามบริบทถูก เปิด Weak Point และ Armor Break

### Mage

`Rune Chain`  
เรียง Grammar/Vocabulary เพื่อสร้าง Element combo

### Archer

`Context Scan`  
อ่านเบาะแสสั้นเพื่อเผย Hit zone หรือกับดัก

### Guardian

`Guided Shield`  
ตัดตัวเลือกผิดหนึ่งตัวหรือเพิ่มเวลาให้ทีม แต่ไม่เฉลย

---

# 6. Combat Foundation ใหม่

## 6.1 แนวทาง

ใช้ **Real-time Action-lite** ไม่ใช่ Action เร็วจัด

เหมาะกับเด็กและมือถือ:

- เดิน 8 ทิศหรือ 4 ทิศ
- Basic attack
- Active skill 4 ช่อง
- Utility/Potion
- Dodge/Guard
- Lock target
- Telegraph ชัด
- Cooldown อ่านง่าย
- Global pace ช้าพอให้คิด
- Boss pattern มีช่วงพัก
- ลดความเร็วชั่วคราวเมื่อ Knowledge overlay เปิด

## 6.2 Combat Pillars

1. Position
2. Timing
3. Class identity
4. Readable enemy intent
5. Build choice
6. Knowledge opportunity
7. Fair failure

## 6.3 Enemy AI

State machine:

```text
Idle
Patrol
Alert
Pursue
Aim/Windup
Attack
Recover
Hurt
Stagger
Special
Retreat optional
Dead
Respawn
```

## 6.4 Boss Design

Boss ทุกตัวต้องมี:

- Theme
- Arena mechanic
- Telegraph
- 3 Phase หรือตรรกะที่เปลี่ยน
- Knowledge interaction
- Solo scaling
- Party scaling
- Retry
- ไม่มี Unavoidable damage
- ไม่มีคำถามที่ไม่เคยฝึกเป็นเงื่อนไขตายทันที

## 6.5 Failure

`Echo Fracture`

- กลับ Sanctuary
- ไม่ลด Level
- ไม่ลบของถาวร
- Echo Orb คืนทรัพยากรบางส่วน
- Party revive
- First-loss protection
- แสดงสาเหตุแพ้
- แนะนำ Skill/Knowledge ที่ควรฝึก

---

# 7. อาชีพและ Build

# 7.1 เก็บ Class IDs เดิม

- warrior
- mage
- archer
- guardian

เพื่อรักษา Save และ Asset mapping

## 7.2 เปลี่ยนจาก Stat Identity เป็น Gameplay Identity

### Warrior

- Combo meter
- Parry
- Cleave
- Armor break
- Tactical knowledge

### Mage

- Element resource
- Area control
- Rune sequence
- Barrier
- Grammar chain

### Archer

- Distance bonus
- Trap
- Dash
- Weak point
- Context clue

### Guardian

- Guard meter
- Threat
- Zone shield
- Revive support
- Guided knowledge support

## 7.3 Skill Tree ใหม่

Node ประเภท:

- Unlock active skill
- Change skill behavior
- Add conditional effect
- Unlock combo
- Add utility
- Knowledge interaction
- Party synergy
- Minor stat

Flat stats ไม่เกินประมาณ 25–35% ของ Node ทั้งหมด

## 7.4 Advanced Jobs

ทำหลัง Base Job ผ่าน Playtest

- Warrior → Vanguard / Spellblade
- Mage → Elementalist / Rune Scholar
- Archer → Wind Ranger / Beast Trapper
- Guardian → Holy Bastion / Nature Warden

---

# 8. Progression และ Economy

## 8.1 แยก Progression 4 แกน

### Character Level

พลังพื้นฐานและ Content access

### Job Level

Skill และความชำนาญอาชีพ

### Learning Mastery

ความสามารถราย Subskill

### World Reputation

Story, NPC, Shop และ Secret

ห้ามรวมทั้ง 4 อย่างเป็น Level เดียว

## 8.2 ไอเทม

### Generated Gear

ของทั่วไปสำหรับ Progression

### Named Gear

มี Effect เปลี่ยนวิธีเล่น

### Monster Sigil

มอนสเตอร์แต่ละชนิดมีของสะสมเฉพาะ

### Cosmetic

ไม่เพิ่มพลังหรือเพิ่มเล็กน้อยแบบไม่มีผลต่อความยุติธรรม

## 8.3 Anti-grind

- Pity progress
- Collection progress
- First-clear reward
- Weekly targeted reward
- Craft alternative
- Salvage
- Duplicate conversion
- ไม่มี Drop rate ต่ำจนเด็กต้องเล่นหลายร้อยครั้ง

---

# 9. โลกและเนื้อหา

## 9.1 100 ชั้น แบ่ง 10 World

โลกละ 10 ชั้น แต่สร้างจริงทีละ World

## 9.2 World 1 Vertical Slice

- Town 1
- Field 2
- Mini dungeon 1
- Main dungeon 1
- Regular monsters 6–8
- Elite 2
- Boss 1
- Main quest 10–15
- Side quest 8
- Language puzzle 5 แบบ
- Named gear 12
- Sigil 8
- 4 Class kits
- Daily expedition
- Weekly memory dungeon
- Learning report
- Desktop + mobile
- Offline + co-op foundation

## 9.3 Map Rules

- 32×32 Grid
- Real autotile
- Ground variation
- Foot collision
- Y-sort
- Shadow
- Foreground occlusion
- Landmark ทุก Zone
- Biome audio
- Secret path
- Interaction density ที่พอดี
- ห้ามเปลี่ยนสีแผนที่เดิมแล้วเรียก World ใหม่

---

# 10. ระบบที่ควรเก็บ ปรับ และเลิกใช้

| ระบบ | การตัดสิน | เหตุผล | แนวทาง |
|---|---|---|---|
| Nuxt/Vue | เก็บ | เหมาะกับ UI และ Teacher mode | แยก UI domain ให้ชัด |
| Phaser | เก็บ | เหมาะกับ Top-down web RPG | แยก Scene/System |
| Pinia | เก็บแต่แยก Store | Prototype store ใหญ่เกิน | profile, character, learning, session, ui |
| Colyseus | เก็บ | มี Room foundation แล้ว | ย้าย Authority ทีละระบบ |
| mitt event bus | เก็บชั่วคราว | ใช้ง่าย | สร้าง Typed Game Bridge |
| TowerScene | Refactor ใหญ่ | God Scene | Zone shell + systems |
| TownScene | Refactor | ผูก map/online/UI | data-driven zone |
| BattleModal | Deprecate | ขัด Flow | Knowledge overlay + real-time combat |
| Classes | เก็บ IDs | Save compatible | เพิ่ม runtime class kit |
| Skill Tree | Rewrite data | Stat-only | behavior nodes |
| Equipment | เก็บ generator บางส่วน | มี 200+ item | เพิ่ม named/affix/sigil |
| Daily Quest | แทนระบบ | ตื้น | Daily Expedition generator |
| Question shuffle bag | เก็บเป็น fallback | ลดซ้ำได้ | Mastery selector เป็นหลัก |
| Study lessons | เก็บ | เนื้อหาดี | ทำเป็น Codex/Micro lesson |
| CorrectAnswers total | Deprecate | ไม่สะท้อนการเรียน | mastery/subskill |
| Adventure log | เก็บ | Feedback ดี | structured event log |
| localStorage save | เก็บชั่วคราว | Offline | versioned save + server sync |
| Client reward | ย้ายออก | โกง/ซ้ำได้ | server validation |
| Asset index | เก็บเป็น Source of Truth | มีคุณค่ามาก | manifest/validator |
| Primitive map art | เลิกใช้ Production | Prototype look | real tiles/buildings |
| Offline fallback | เก็บ | เหมาะโรงเรียน | deterministic local authority |

---

# 11. Architecture ใหม่

```text
app/
├─ game/
│  ├─ scenes/
│  │  ├─ BootScene.ts
│  │  ├─ ZoneScene.ts
│  │  ├─ TownScene.ts
│  │  ├─ DungeonScene.ts
│  │  └─ BossScene.ts
│  ├─ core/
│  │  ├─ GameRuntime.ts
│  │  ├─ GameClock.ts
│  │  ├─ GameEvent.ts
│  │  ├─ FeatureFlags.ts
│  │  └─ RuntimeConfig.ts
│  ├─ systems/
│  │  ├─ movement/
│  │  ├─ combat/
│  │  ├─ enemy/
│  │  ├─ boss/
│  │  ├─ interaction/
│  │  ├─ quest/
│  │  ├─ learning/
│  │  ├─ rewards/
│  │  ├─ world/
│  │  ├─ audio/
│  │  └─ network/
│  ├─ entities/
│  ├─ factories/
│  ├─ adapters/
│  └─ diagnostics/
├─ stores/
│  ├─ profile.ts
│  ├─ character.ts
│  ├─ learning.ts
│  ├─ session.ts
│  ├─ inventory.ts
│  ├─ quest.ts
│  └─ ui.ts
├─ domain/
│  ├─ combat/
│  ├─ learning/
│  ├─ progression/
│  ├─ economy/
│  ├─ quest/
│  └─ shared/
├─ data/
│  ├─ content/
│  ├─ schemas/
│  ├─ migrations/
│  └─ validators/
└─ components/
   ├─ hud/
   ├─ learning/
   ├─ inventory/
   ├─ quest/
   ├─ teacher/
   └─ common/
```

## 11.1 ห้ามเริ่มด้วย ECS Rewrite

โปรเจกต์ขนาดนี้ไม่จำเป็นต้องย้ายเป็น ECS เต็มรูปแบบทันที

ใช้:

- Data-driven definitions
- Explicit systems
- Typed interfaces
- Entity wrappers
- State machines

พอสำหรับ Vertical Slice และลดความเสี่ยง

## 11.2 Typed Game Bridge

แทน Event string กระจัดกระจาย:

```ts
interface GameEventMap {
  'combat:started': CombatStartedPayload
  'combat:ended': CombatEndedPayload
  'learning:requested': LearningRequest
  'learning:resolved': LearningResult
  'reward:granted': RewardGrant
  'quest:progressed': QuestProgress
  'zone:changed': ZoneChange
}
```

## 11.3 State แยก

```text
ProfileState     = account/settings/accessibility
CharacterState   = class/level/stats/equipment
LearningState    = mastery/review/misconceptions
SessionState     = current run/combat/zone
EconomyState     = inventory/currency/craft
QuestState       = quest graph/daily expedition
```

## 11.4 Save Version

```ts
interface SaveEnvelope<T> {
  schemaVersion: number
  createdAt: string
  updatedAt: string
  checksum?: string
  payload: T
}
```

ทุก Migration ต้อง:

- idempotent
- tested
- backup ก่อนแปลง
- recover ได้
- ไม่ลบ Legacy save จนกว่าจะตรวจสำเร็จ

---

# 12. Migration Strategy

ใช้ **Strangler Pattern**

ระบบใหม่อยู่ข้างระบบเก่าและเปิดด้วย Feature Flag

```text
legacyBattle
realtimeCombatV1
learningEngineV2
dailyExpeditionV1
newWorldRuntime
serverRewardsV1
```

## กฎ

- ห้ามลบระบบเก่าก่อนระบบใหม่ผ่าน
- ทุก Phase มี Rollback
- Save migration แยกจาก Gameplay migration
- ทำ World 1 เท่านั้น
- เปลี่ยนครั้งละ Domain
- Build/Test/Smoke ทุก Phase
- Commit ต่อ Phase

---

# 13. Claude Code Model และ Effort ที่แนะนำ

> ข้อมูลรุ่นและ effort ในส่วนนี้อิงเอกสาร Anthropic ณ วันที่ 12 กรกฎาคม 2026  
> Availability ขึ้นกับ Plan, Organization และ Claude Code version

## 13.1 รุ่นหลัก

### Claude Fable 5

เหมาะกับ:

- วิเคราะห์ Repository ทั้งก้อน
- Architecture ใหม่
- Root-cause ซับซ้อน
- Refactor หลาย Domain
- งานยาวข้ามหลายขั้น
- Final integration audit

คำสั่ง:

```text
/model fable
/effort xhigh
```

หรือสำหรับงานใหญ่ครั้งเดียว:

```text
/model fable
/effort ultracode
```

`ultracode` เป็นโหมด Claude Code ที่ใช้ xhigh และวาง Dynamic workflow สำหรับงาน substantive ไม่ใช่ effort level ของโมเดลโดยตรง

### Claude Opus 4.8

เหมาะกับ:

- Architecture
- Combat design implementation
- Migration
- Debugging ยาก
- Multiplayer authority
- Save corruption
- Independent review

คำสั่ง:

```text
/model opus
/effort xhigh
```

Anthropic ระบุว่า xhigh เหมาะกับ coding และ agentic use case ส่วนใหญ่ของ Opus 4.8

### Claude Sonnet 5

เหมาะกับ:

- งานพัฒนารายวัน
- Implement ตาม Architecture ที่ชัด
- UI
- Tests
- Content pipeline
- Data validators
- Refactor ขอบเขตกลาง
- Bug fix ทั่วไป

คำสั่ง:

```text
/model sonnet
/effort high
```

ลดเป็น medium เมื่อ:

- งานชัด
- ไฟล์น้อย
- ไม่มี Architecture decision
- ทำข้อมูล/เอกสาร/rename/validator เล็ก

### Claude Haiku 4.5

ใช้เฉพาะ:

- งาน Mechanical ง่าย
- ค้นชื่อไฟล์
- เปลี่ยนข้อความ
- Generate report จากข้อมูลที่ชัด
- Rename แบบมี Test

ไม่ใช้กับ:

- Combat
- Learning logic
- Economy
- Save migration
- Multiplayer
- Architecture

## 13.2 Workflow ที่แนะนำที่สุด

### ทางเลือก A — คุณภาพสูงสุด

```text
Fable 5 xhigh       → Audit/Architecture/Integration
Opus 4.8 xhigh      → Hard design/refactor/review
Sonnet 5 high       → Daily implementation
Sonnet 5 medium     → Small scoped work
```

### ทางเลือก B — ประหยัดและดี

ใช้ `opusplan`

```text
/model opusplan
/effort high
```

พฤติกรรม:

- Plan mode ใช้ Opus
- Execution ใช้ Sonnet

เหมาะมากเมื่อ Prompt มี Scope และ Acceptance Criteria ชัด

### ทางเลือก C — มี Sonnet เป็นหลัก

```text
/model sonnet
/effort high
```

ก่อนเริ่มงานใหญ่:

```text
/plan
```

และใช้คำว่า:

```text
ultrathink
```

เฉพาะ Turn ที่ต้องตัดสินใจยาก

## 13.3 Effort Matrix

| งาน | รุ่น | Effort |
|---|---|---|
| Whole-repo audit | Fable 5 | xhigh/ultracode |
| Game architecture | Fable 5 หรือ Opus 4.8 | xhigh |
| Combat migration | Opus 4.8 | xhigh |
| Learning engine | Opus 4.8 | xhigh |
| Daily expedition | Sonnet 5 | high |
| UI/Mobile | Sonnet 5 | high |
| Asset integration | Sonnet 5 | high |
| Data validation | Sonnet 5 | medium/high |
| Routine tests | Sonnet 5 | medium |
| Simple rename | Haiku/Sonnet | low/medium |
| Hard bug | Fable/Opus | xhigh |
| Final release audit | Fable 5 | xhigh |
| Max effort | Fable/Opus | เฉพาะปัญหาเฉพาะจุดที่ xhigh ยังไม่พอ |

## 13.4 ไม่แนะนำใช้ max เป็นค่า Default

เหตุผล:

- ใช้ Token มาก
- อาจคิดเกินจำเป็น
- ผลตอบแทนลดลงในงานทั่วไป
- ทำให้ Session ยาวและ Context บวม

ใช้ `max` เฉพาะ:

- Save corruption ที่หา Root cause ไม่เจอ
- Race condition
- Network duplication
- Final architecture deadlock
- Bug ที่ reproduces ยากมาก

## 13.5 Version ที่ควรตรวจ

```bash
claude --version
claude update
```

ตามเอกสารปัจจุบัน:

- Fable 5 ต้อง Claude Code 2.1.170+
- Opus 4.8 ต้อง 2.1.154+
- Sonnet 5 ต้อง 2.1.197+
- `--effort ultracode` ต้อง 2.1.203+

## 13.6 คำสั่งที่ควรใช้ระหว่างงาน

```text
/status
/model
/effort
/plan
/context
/compact
/diff
/code-review
/security-review
/usage
```

### กฎ Context

- 1 Session = 1 Phase หรือ 1 Domain
- หลังจบ Phase ให้ `/clear`
- ใช้ `/context` เมื่อ Session ยาว
- ใช้ `/compact` ก่อน Context เต็ม
- อย่าให้ Claude อ่าน Asset ทั้ง 14,000 ไฟล์ทุกครั้ง
- ใช้ Asset manifest และ index ที่กรองแล้ว

---

# 14. Claude Code Configuration แนะนำ

## 14.1 Personal settings

ใช้ `.claude/settings.local.json` หรือ User settings แทนการบังคับทีม

```json
{
  "model": "opusplan",
  "effortLevel": "high",
  "fallbackModel": [
    "claude-sonnet-5",
    "claude-haiku-4-5"
  ]
}
```

สำหรับ Phase ใหญ่ เปลี่ยน Session:

```bash
claude --model fable --effort xhigh
```

หรือ:

```bash
claude --model opus --effort xhigh
```

## 14.2 Specialist agents

```text
.claude/agents/
├─ game-architect.md
├─ learning-architect.md
├─ combat-engineer.md
├─ content-designer.md
├─ world-art-director.md
├─ multiplayer-engineer.md
└─ qa-release.md
```

### ตัวอย่าง game-architect

```md
---
name: game-architect
description: Owns architecture, boundaries, migrations, and cross-domain design.
model: opus
effort: xhigh
---

Preserve working behavior.
Never rewrite the repository without a migration plan.
Map dependencies before edits.
Prefer typed interfaces, feature flags, adapters, and tests.
Do not implement content or visuals unless explicitly assigned.
```

### ตัวอย่าง learning-architect

```md
---
name: learning-architect
description: Owns O-NET taxonomy, mastery, question validity, feedback, and teacher reporting.
model: opus
effort: xhigh
---

Educational correctness is mandatory.
No unreviewed generated question may be used in production.
Keep learning state separate from combat power.
Every question needs explanation and distractor reasoning.
```

### ตัวอย่าง implementation agent

```md
---
name: implementation-engineer
description: Implements approved scoped tasks and tests.
model: sonnet
effort: high
---

Follow existing plans and acceptance criteria.
Do not redesign architecture.
Keep edits scoped.
Build and test before completion.
```

---

# 15. Roadmap ยกเครื่องรากฐาน

# Phase 0 — Baseline และ Freeze

ผลลัพธ์:

- Build baseline
- Known issues
- Save backup
- Feature flag shell
- Git branches
- Test command
- Runtime diagnostic
- No gameplay change

# Phase 1 — Architecture Map

ผลลัพธ์:

- Dependency map
- Domain boundaries
- Keep/Refactor/Replace list
- Typed event map
- Migration plan
- Acceptance matrix

# Phase 2 — State และ Save Foundation

ผลลัพธ์:

- Split stores
- Save envelope
- Migrations
- Legacy adapter
- Corruption recovery
- No gameplay redesign yet

# Phase 3 — Learning Foundation

ผลลัพธ์:

- Curriculum graph
- Question schema
- Validator
- Mastery
- Review scheduler
- Question selector
- Learning log

# Phase 4 — Combat Core Extraction

ผลลัพธ์:

- Pure combat domain
- Damage
- Skill
- Status
- Cooldown
- Reward request
- Legacy adapter

# Phase 5 — New World Runtime

ผลลัพธ์:

- ZoneScene
- Player controller
- Enemy state machine
- Interaction
- Spawn
- Typed Phaser/Vue bridge
- TowerScene no longer owns everything

# Phase 6 — Real-time Combat

ผลลัพธ์:

- 4 class runtime support
- Basic/skills
- Dodge/guard
- Telegraph
- Elite
- Death/retry
- Feature flag

# Phase 7 — Knowledge Break

ผลลัพธ์:

- Context triggers
- Mastery selection
- Feedback
- Adventure/Learning mode
- Rune/treasure
- Learning state update

# Phase 8 — Daily Expedition

ผลลัพธ์:

- Adaptive daily plan
- Activity rotation
- Catch-up
- 10/20/30-minute mode
- Daily story wrapper
- End-session review

# Phase 9 — Progression & Economy

ผลลัพธ์:

- Character/Job/Learning/Reputation split
- Named gear
- Sigil
- Craft
- Pity
- Anti-grind
- Reward validation

# Phase 10 — World 1 Content

ผลลัพธ์:

- Town/field/dungeon/boss
- Story
- Quest variety
- Visual rebuild
- Audio
- Secret
- Codex

# Phase 11 — Co-op & Server Authority

ผลลัพธ์:

- Party
- Boss sync
- Reward authority
- Reconnect
- Individual learning accountability
- Offline deterministic path

# Phase 12 — Teacher Mode

ผลลัพธ์:

- Session setup
- Skill focus
- Report
- Export
- Privacy boundary
- Review queue

# Phase 13 — S-grade Hardening

ผลลัพธ์:

- Mobile
- Accessibility
- Performance
- Save integrity
- Security
- Full audit
- Release gate

---

# 16. ลำดับ Prompt สำหรับ Claude Code

> ใช้ทีละ Prompt  
> แต่ละ Prompt ต้องอยู่คนละ Branch หรือ Commit ที่ Rollback ได้  
> ห้ามสั่งทุก Prompt พร้อมกัน

---

## PROMPT 00 — Baseline Foundation

**Model:** Sonnet 5 high  
**กรณี Build ซับซ้อน:** Opus 4.8 high

```text
You are establishing a safe baseline for a major game-foundation migration.

Do not redesign gameplay.

Read the complete repository structure, package scripts, Nuxt configuration, Phaser boot flow, Pinia persistence, Colyseus server, current docs, and Git status.

Create:
- docs/foundation/BASELINE.md
- docs/foundation/CURRENT_RUNTIME_FLOW.md
- docs/foundation/KNOWN_EXISTING_ISSUES.md
- docs/foundation/ROLLBACK_GUIDE.md

Document:
- install/dev/build/generate/server commands
- current routes and game startup
- scene flow
- Vue/Phaser/Pinia event flow
- save keys and state schema
- multiplayer startup and offline fallback
- current warnings/errors
- asset loading strategy
- production deployment assumptions

Add no gameplay feature.
Do not upgrade dependencies.
Do not hide pre-existing failures.

Run all available validation.
Report exact commands, results, files changed, risks, and safe next step.
```

---

## PROMPT 01 — Deep Architecture Audit

**Model:** Fable 5 xhigh/ultracode  
**Fallback:** Opus 4.8 xhigh

```text
ultrathink

Act as lead game architect, educational systems architect, Phaser/Nuxt engineer, and migration reviewer.

AUDIT AND PLAN ONLY.

The product goal is:
A 16-bit fantasy action-lite RPG that students can enjoy for 15-30 minutes daily while improving measurable Grade 6 English O-NET mastery.

Read:
- all current architecture and data files
- TowerScene, TownScene, BattleModal
- player/settings stores
- questions, study, quests, classes, skills, equipment, loot, floors, world, biomes
- network client and server
- all asset and visual reports
- multiplayer documentation
- existing Claude/project docs

Create:
- docs/foundation/KEEP_REFACTOR_REPLACE_MATRIX.md
- docs/foundation/DOMAIN_BOUNDARIES.md
- docs/foundation/DEPENDENCY_MAP.md
- docs/foundation/NEW_RUNTIME_ARCHITECTURE.md
- docs/foundation/MIGRATION_SEQUENCE.md
- docs/foundation/ACCEPTANCE_GATES.md
- docs/foundation/ADR/ initial architecture decision records

Required decisions:
- what must be preserved
- what must be adapted
- what must be deprecated
- where current code is tightly coupled
- state ownership
- Vue/Phaser boundary
- client/server authority
- save migration
- offline behavior
- feature flags
- testing seams

Do not edit gameplay code.
Do not propose a full rewrite.
End with the first implementation slice that has minimal regression risk.
```

---

## PROMPT 02 — Project Constitution and Agents

**Model:** Opus 4.8 high

```text
Create a concise project constitution for the new game foundation.

Update or create:
- CLAUDE.md
- .claude/agents/game-architect.md
- .claude/agents/learning-architect.md
- .claude/agents/combat-engineer.md
- .claude/agents/world-art-director.md
- .claude/agents/multiplayer-engineer.md
- .claude/agents/qa-release.md

Rules:
- no full rewrite
- one domain per change
- plan before editing
- preserve legacy save through migration
- use feature flags
- no unreviewed generated questions
- no client-trusted rewards
- use asset index before selecting art
- 32x32 pixel grid
- mobile and accessibility mandatory
- build/test/manual smoke required
- completion report format
- stop when scope is complete

Keep CLAUDE.md short enough to avoid wasting context.
Move detailed procedures into docs or skills.
No gameplay change.
```

---

## PROMPT 03 — Test and Diagnostic Foundation

**Model:** Sonnet 5 high

```text
Implement the smallest compatible testing and diagnostic foundation.

Inspect compatibility before choosing dependencies.

Required tests:
- stat calculation
- damage calculation seam
- skill prerequisite
- quest progression
- reward claim idempotency
- question validation
- daily generation determinism
- save migration
- item transaction

Create a development-only diagnostic mode:
- choose zone/floor
- choose class
- grant equipment
- spawn enemy
- trigger battle
- trigger learning event
- trigger boss phase
- inspect FPS/entity/listener counts
- reset without touching the normal save

Create:
- docs/testing/TEST_STRATEGY.md
- docs/testing/MANUAL_SMOKE_MATRIX.md

Do not change product gameplay.
Build and run tests.
```

---

## PROMPT 04 — Split State and Version Saves

**Model:** Opus 4.8 xhigh

```text
Refactor application state behind compatibility adapters.

Target stores:
- profile
- character
- learning
- session
- inventory/economy
- quest
- ui/settings

Introduce:
- versioned SaveEnvelope
- migration registry
- legacy player-store adapter
- pre-migration backup
- corruption recovery
- idempotent migrations
- feature flag for new stores

Do not remove the current player store yet.
Current screens and legacy battle must continue working.

Add migration tests for:
- fresh player
- existing character
- equipment
- learned skills
- daily quests
- HP/MP clamp
- partially missing save
- repeated migration

Document state ownership and rollback.
```

---

## PROMPT 05 — O-NET Curriculum and Question Pipeline

**Model:** Opus 4.8 xhigh  
**Implementation:** Sonnet 5 high

```text
Build the educational content foundation.

Create:
- O-NET domain/skill/subskill taxonomy
- typed question schema
- misconception schema
- explanation/distractor schema
- content status draft/reviewed/retired
- import adapter for current questions
- validator
- duplicate and answer-position analysis
- content report
- teacher review queue format

Hard rule:
Production selectors may only use reviewed content.

Preserve existing source data.
Do not automatically rewrite official source material.
Do not publish AI-generated questions without review.

Add tests and documentation.
No combat redesign in this phase.
```

---

## PROMPT 06 — Mastery and Daily Learning Planner

**Model:** Opus 4.8 xhigh  
**Implementation:** Sonnet 5 high

```text
Implement a deterministic adaptive learning domain.

Required:
- mastery per subskill
- recent performance
- misconception counts
- hint usage
- response-time summary
- stability and next review
- spaced review
- anti-repeat
- answer-position balance
- teacher focus
- session time budget

Create:
- QuestionSelector
- MasteryUpdater
- ReviewScheduler
- DailyLearningPlanGenerator
- LearningSessionSummary

Keep learning mastery independent from character combat stats.

The planner must support:
- 10-minute
- 20-minute
- 30-minute sessions
- Adventure Mode
- Learning Focus Mode
- catch-up after missed days
- no punitive streak reset

Unit test deterministic selection with fixed seeds.
```

---

## PROMPT 07 — Extract Combat Domain

**Model:** Opus 4.8 xhigh

```text
Extract combat rules from BattleModal and scene code into pure domain modules.

Create typed concepts:
- CombatActor
- RuntimeStats
- DamageRequest/Result
- SkillDefinition
- SkillExecution
- Cooldown
- Resource
- StatusEffect
- CombatEvent
- EncounterResult
- RewardRequest

Requirements:
- current modal battle continues through an adapter
- no duplicate formulas
- pure deterministic tests
- UI does not own rules
- rewards are requested, not directly trusted
- no full real-time implementation yet

Create a deprecation plan for BattleModal.
Build and compare legacy results.
```

---

## PROMPT 08 — New Zone Runtime

**Model:** Opus 4.8 xhigh  
**Implementation:** Sonnet 5 high

```text
Create the new Phaser world runtime behind a feature flag.

Refactor responsibilities from TowerScene into:
- ZoneLoader
- PlayerController
- CollisionSystem
- SpawnSystem
- EnemyController
- InteractionSystem
- CameraSystem
- AtmosphereSystem
- AudioSystem
- NetworkAdapter
- TypedGameBridge

Implement one test zone only.

Do not rebuild all floors.
Do not remove TowerScene.
Use existing assets.
Provide shutdown cleanup for every listener, timer, tween, physics object, and network binding.

Add lifecycle diagnostics and tests for pure systems.
```

---

## PROMPT 09 — Real-time Combat Slice

**Model:** Opus 4.8 xhigh  
**Implementation continuation:** Sonnet 5 high

```text
Implement real-time action-lite combat in the new test zone.

Scope:
- all four class ids supported by architecture
- one complete Warrior kit for first playable proof
- basic attack
- target selection
- four skill slots
- two initial active skills
- dodge or guard
- cooldown/resource
- enemy telegraph
- hurt/stagger/death
- win/lose/reset
- reward request
- touch-ready input abstraction

Keep legacy battle as rollback.
No multiplayer combat yet.

Acceptance:
- no frame-rate dependent damage
- no reward duplication
- no dead/stunned attack
- no listener leak after repeated encounters
- diagnostic reset works
```

---

## PROMPT 10 — Knowledge Break

**Model:** Opus 4.8 xhigh

```text
Integrate learning into the new runtime as Knowledge Break.

Implement:
- elite interrupt
- armor break
- rune door
- treasure challenge
- mastery-based selection
- correct/incorrect/timeout
- concise explanation
- distractor feedback
- retry scheduling
- extended reading time
- Adventure/Learning frequency
- learning event logging

Questions must not appear on every attack.
One wrong answer must not instantly kill the player.

Add no-question fallback and scene-change safety.
Test every resolution path.
```

---

## PROMPT 11 — Daily Expedition System

**Model:** Sonnet 5 high  
**Design review:** Opus 4.8 high

```text
Replace shallow daily counters with an adaptive Daily Expedition system while preserving old quest data through an adapter.

Generate one daily expedition from:
- current world progress
- learning plan
- weak/review subskills
- unplayed activity types
- selected session duration
- player class
- offline/online availability

Activity types:
- combat
- exploration
- reading
- conversation
- grammar rune
- vocabulary matching
- directions
- crafting
- rescue/defense
- reflection

Implement:
- 10/20/30-minute plans
- 5-of-7 Adventure Rhythm
- Rested Learning Bonus
- Catch-up expedition
- no streak loss punishment
- end-session learning summary
- deterministic generation
- anti-repeat

Do not create filler objectives that differ only by target count.
```

---

## PROMPT 12 — Four Class Kits

**Model:** Opus 4.8 high  
**Implementation:** Sonnet 5 high

```text
Create the first complete runtime kit for Warrior, Mage, Archer, and Guardian.

Each class needs:
- unique basic attack
- four active skills
- defensive/mobility action
- class resource or rhythm
- solo viability
- party role
- Knowledge interaction
- readable child-friendly tooltips
- animation hooks
- data-driven balance

Refactor skill tree:
- behavior nodes
- modifiers
- conditionals
- party synergy
- knowledge utility
- limited flat stats

Preserve class ids and migrate learned skill data.
Do not implement Advanced Jobs yet.
```

---

## PROMPT 13 — Progression, Loot and Sigils

**Model:** Opus 4.8 high  
**Economy simulation:** Sonnet 5 high

```text
Separate progression into:
- character level
- job level
- learning mastery
- world reputation

Extend equipment:
- regular generated gear
- named gear
- affixes
- sockets
- Monster Sigils
- duplicate conversion
- pity/collection progress
- salvage/craft alternative

World 1 target:
- 12 named items
- 8 sigils
- boss material
- visible source hints

Prevent:
- duplicate claims
- negative currency
- client-trusted grants
- extreme grind
- mandatory rare drops

Run seeded economy simulations and report outliers.
```

---

## PROMPT 14 — World 1 Content and Visual Foundation

**Model:** Sonnet 5 high  
**Art direction review:** Opus 4.8 high

```text
Build only the World 1 vertical slice using the approved new runtime.

Use the asset index before every selection.
Craftpix top-down is the style spine.

Create:
- complete town
- two fields
- mini dungeon
- main dungeon
- 6-8 monsters
- 2 elites
- one 3-phase boss
- landmarks
- secret paths
- NPCs
- environmental language interactions
- main and side quests
- biome audio
- asset manifest

Replace:
- flat repeated ground
- primitive walls/stairs/buildings
- shadowless vegetation
- tint-only biome identity

Preserve 32x32 grid and pixel-perfect rendering.
Measure asset load and FPS.
```

---

## PROMPT 15 — Co-op and Server Authority

**Model:** Fable 5 or Opus 4.8 xhigh

```text
Upgrade World 1 to safe 2-4 player co-op.

Implement in stages:
- party
- ready check
- shared encounter
- boss synchronization
- revive
- contribution-aware rewards
- reconnect
- encounter cleanup
- server-validated cooldown/damage/result/reward
- protocol versioning

Knowledge co-op:
- individual accountability
- rotating answer ownership
- related sub-questions
- support actions
- one student cannot answer everything for the group

Preserve offline deterministic play.
Do not attempt MMO scale.
Test disconnect and duplication attacks.
```

---

## PROMPT 16 — Teacher Mode

**Model:** Sonnet 5 high  
**Privacy review:** Opus 4.8 high

```text
Create a minimal privacy-conscious Teacher Mode.

Features:
- create class session
- assign anonymous/student codes
- choose O-NET domain/subskill
- choose Adventure/Learning mode
- choose 10/20/30-minute activity scope
- view mastery movement
- view common misconceptions
- view review recommendation
- export CSV/JSON
- optional Google Sheets report export

Do not use Google Sheets as combat/inventory authority.
Do not reveal answer keys during active play.
Separate personal data, learning data, and game data.
```

---

## PROMPT 17 — Mobile, Accessibility and Reliability

**Model:** Sonnet 5 high  
**Hard bugs:** Opus 4.8 xhigh

```text
Harden World 1 for daily student use.

Audit and fix:
- every button
- keyboard/mouse/touch
- mobile safe area
- touch target size
- clipped text
- pause/resume
- scene reload
- save/load
- offline
- reconnect
- reduced motion
- reduced flash
- screen shake
- color-only indicators
- reading-time option
- audio controls
- onboarding

Add repeatable manual smoke tests and viewport matrix.
No major new feature.
```

---

## PROMPT 18 — Independent Release Audit

**Model:** Fable 5 xhigh/ultracode  
**Fallback:** Opus 4.8 xhigh

```text
Act as an independent S-grade release board.

Do not add major features.

Review:
- architecture
- gameplay
- learning validity
- daily engagement
- all four classes
- World 1
- boss
- offline
- co-op
- teacher mode
- mobile
- accessibility
- performance
- save migration
- reward security

Run:
- tests
- production build
- repeated scene lifecycle
- repeated save migration
- new player flow
- returning player flow
- correct/incorrect/timeout learning
- reward duplication attempts
- disconnect/reconnect
- asset path scan
- console error scan

Grade each pillar with evidence:
- Fun
- Learning
- World
- Progression
- Visual/Audio
- Reliability
- Safety/Teacher usability

Fix only blockers and critical issues.
Do not call the game S-grade unless every mandatory gate passes.
```

---

# 17. Prompt ตรวจ Diff หลังทุก Phase

```text
Review the current Git diff as a skeptical senior engineer and game designer.

Verify:
- scope was respected
- no unrelated edits
- legacy compatibility
- save migration safety
- deterministic behavior
- reward idempotency
- listener/timer/network cleanup
- mobile impact
- learning correctness
- asset path validity
- tests and build

Run the relevant checks.
Fix only defects introduced by this phase.

Report:
- pass/fail per acceptance criterion
- commands and results
- files changed
- behavior changed
- unresolved risks
- rollback
- safe/not safe to commit
```

---

# 18. Acceptance Gates

## Foundation Gate

- Build baseline known
- Tests run
- Feature flags work
- Legacy save backup/migration tested
- Typed boundaries documented

## Fun Gate

- Movement and combat feel responsive
- Class identity visible in under 5 minutes
- Enemy intent readable
- Boss has decision-making
- No excessive modal interruption

## Learning Gate

- Questions reviewed
- Feedback explains mistakes
- Mastery changes correctly
- Weak skill reappears later
- Learning state separate from power
- Daily plan has clear objective

## Daily Gate

- 10/20/30-minute session works
- Activities rotate
- Missed day does not punish
- Review summary is useful
- Student can stop safely after one session

## Technical Gate

- No console blocker
- No broken primary button
- Save/load repeated
- No duplicate reward
- Scene cleanup stable
- Mobile flow works
- Offline fallback works

## Teacher Gate

- Skill focus selectable
- Report understandable
- Export works
- No answer leakage
- Privacy boundaries documented

---

# 19. ตัวชี้วัดที่ควรวัด

## Gameplay

- Session completion
- Time to first meaningful action
- Encounter completion
- Death cause
- Skill usage diversity
- Boss retry
- Return rateแบบไม่ใช้ dark pattern

## Learning

- Mastery gain
- Retention after 1/3/7 days
- Misconception reduction
- Explanation viewed
- Review success
- Transfer to new context
- Mock test improvement

## Technical

- FPS
- Load time
- Crash/soft lock
- Save recovery
- Asset failure
- Network disconnect
- Duplicate transaction prevention

## Classroom

- Time to create session
- Students joining successfully
- Teacher comprehension of report
- Completion within class period
- Device compatibility

---

# 20. สิ่งที่ไม่ควรทำ

- ไม่สร้าง 100 ชั้นพร้อมกัน
- ไม่ Rewrite Engine
- ไม่ให้ Claude แก้ทุกระบบใน Session เดียว
- ไม่ใช้ max effort ทุกงาน
- ไม่สร้างข้อสอบ AI แล้วปล่อยทันที
- ไม่ผูกความรู้กับ Damage ทุก Hit
- ไม่ใช้ Streak ลงโทษ
- ไม่เพิ่มระบบ Gacha
- ไม่ใช้ Sheets เป็นฐานข้อมูลเกม
- ไม่สร้างไอเทมหลายพันชิ้นที่ต่างเพียงตัวเลข
- ไม่ทำ PvP ก่อน Co-op เสถียร
- ไม่ใช้ Asset ทุกไฟล์เพียงเพราะมี
- ไม่ปล่อย TowerScene กลายเป็น God Scene ต่อ
- ไม่ลบ BattleModal ก่อนระบบใหม่ผ่าน
- ไม่เรียก S-grade โดยไม่มี Playtest

---

# 21. แผน 30/60/90 วันเชิงลำดับงาน

> ไม่ใช่การรับประกันเวลา แต่เป็นการจัดลำดับ Scope

## ช่วงที่ 1 — Foundation

- Baseline
- Audit
- CLAUDE.md
- Tests
- State split
- Save migration
- Question schema
- Mastery

## ช่วงที่ 2 — Playable Core

- Combat extraction
- New zone runtime
- Real-time combat
- Knowledge Break
- One elite
- One boss
- Daily expedition

## ช่วงที่ 3 — Product Slice

- 4 classes
- Loot/Sigil
- World 1 content
- Visual/audio
- Mobile
- Teacher report
- Co-op validation
- Release audit

---

# 22. ค่า Default ที่แนะนำให้ผู้พัฒนาใช้จริง

## Session วางระบบใหญ่

```bash
claude --model fable --effort xhigh
```

หากไม่มี Fable:

```bash
claude --model opus --effort xhigh
```

## Session พัฒนาทั่วไป

```bash
claude --model sonnet --effort high
```

## Session Hybrid ประหยัด

```bash
claude --model opusplan --effort high
```

## Session งานเล็ก

```bash
claude --model sonnet --effort medium
```

## Final audit

```bash
claude --model fable --effort ultracode
```

ใช้หลัง Scope และ Test ชัดแล้วเท่านั้น

---

# 23. Prompt เริ่มต้นที่ควรใช้ทันที

ใช้ Prompt 00 ก่อน แล้วตามด้วย Prompt 01

```text
Read CLAUDE.md if present, then execute only PROMPT 00 from:
RPG_ONET_NEW_GAME_FOUNDATION_MASTER_PLAN_TH.md

Do not begin gameplay redesign.
Establish the baseline, document the existing runtime, run validation, and stop with a completion report.
```

หลัง Commit:

```text
/model fable
/effort xhigh
/plan

Read the baseline and execute only PROMPT 01 from:
RPG_ONET_NEW_GAME_FOUNDATION_MASTER_PLAN_TH.md

Audit and plan only.
Do not edit gameplay code.
```

---

# 24. แหล่งข้อมูล

## Repository

- `https://github.com/Ernestyy52/RPG-O-NET-P.6`
- `app/game/scenes/TowerScene.ts`
- `app/components/game/BattleModal.vue`
- `app/stores/player.ts`
- `app/data/classes.ts`
- `app/data/skills.ts`
- `app/data/questions.ts`
- `app/data/quests.ts`
- `app/data/study.ts`
- `app/data/equipment.ts`
- `docs/multiplayer.md`
- `ASSET_MASTER_INDEX.md`
- `S_GRADE_VISUAL_REVIEW.md`
- `MISSING_OR_WEAK_ASSETS.md`

## Claude Code official documentation

- `https://code.claude.com/docs/en/model-config`
- `https://code.claude.com/docs/en/commands`
- `https://code.claude.com/docs/en/costs`
- `https://platform.claude.com/docs/en/about-claude/models/choosing-a-model`

---

# 25. ข้อสรุปสุดท้าย

รากฐานใหม่ไม่ควรเริ่มจากการเพิ่มภาพหรือเพิ่มจำนวนชั้น แต่ต้องเริ่มจาก:

```text
State + Save ที่ปลอดภัย
→ Learning Engine ที่วัดได้
→ Combat Domain ที่ทดสอบได้
→ New World Runtime ที่ไม่ผูกกับ God Scene
→ Knowledge Break ที่ไม่ขัดจังหวะ
→ Daily Expedition ที่หลากหลาย
→ World 1 ที่สมบูรณ์
```

สูตรสำคัญของเกมนี้คือ:

> **Adventure gives the reason to play.  
> Knowledge gives the power to progress.  
> Feedback makes the learning stick.  
> Daily variety makes students return.**

เมื่อผู้เล่นกลับมาเพราะอยากรู้ว่าโลกมีอะไรต่อ และออกจากเกมพร้อมเข้าใจภาษาอังกฤษมากขึ้น เกมจึงจะบรรลุเป้าหมายจริง
---

# 26. AUTO MODEL & EFFORT ROUTER สำหรับ Claude Code

## 26.1 สิ่งที่ระบบนี้ทำได้จริง

Claude Code สามารถเลือกใช้โมเดลและระดับ Effort ตามชนิดงานได้ผ่าน 4 กลไก:

1. `opusplan` ใช้ Opus ใน Plan Mode และเปลี่ยนเป็น Sonnet ใน Execution Mode
2. Custom Subagents ใน `.claude/agents/*.md` กำหนด `model` และ `effort` แยกตามหน้าที่
3. Main Claude เลือก Subagent อัตโนมัติจาก `description`
4. Advisor ช่วยให้โมเดลหลักปรึกษาโมเดลที่แข็งแรงกว่าในจุดตัดสินใจสำคัญ

ข้อจำกัดสำคัญ:

- ไฟล์ Markdown ธรรมดาไม่สามารถบังคับ `/model` หรือ `/effort` ของ Main Session ได้เอง
- การเปลี่ยน Main Session บ่อยทำให้ Prompt Cache ขาดช่วงและอาจใช้ Token เพิ่ม
- วิธีที่แนะนำคือให้ Main Session คงที่ แล้วส่งงานไปยัง Subagent ที่กำหนดโมเดลและ Effort ไว้
- การเลือก Subagent อัตโนมัติเป็นการตัดสินใจของ Claude ตาม `description` จึงต้องเขียน Routing Rule ชัดเจน
- งานสำคัญมากควรเรียก Agent ด้วย `@agent-name` เพื่อรับประกันว่า Agent นั้นถูกใช้

เอกสารอ้างอิง:

- https://code.claude.com/docs/en/sub-agents
- https://code.claude.com/docs/en/model-config
- https://code.claude.com/docs/en/advisor
- https://code.claude.com/docs/en/prompt-caching

---

## 26.2 สถาปัตยกรรมการเลือกโมเดล

```text
Main Session: opusplan + high
│
├─ Plan Mode
│  └─ Opus: วางแผนและตัดสินใจ
│
├─ Execution Mode
│  └─ Sonnet: ลงมือ Implement
│
├─ Auto-delegated Subagents
│  ├─ Fable xhigh: งานใหญ่/ข้ามระบบ/Release audit
│  ├─ Opus xhigh: Learning, Combat, Save, Network
│  ├─ Sonnet high: งานพัฒนาที่มีแบบแผนชัด
│  ├─ Sonnet medium: Test, Data, Docs, Mechanical refactor
│  └─ Haiku medium: งานเล็กและไม่เสี่ยง
│
└─ Optional Advisor
   └─ Fable หรือ Opus: ปรึกษาเมื่อเจอการตัดสินใจยาก
```

---

## 26.3 Model Routing Matrix

| ประเภทงาน | Agent | Model | Effort | เหตุผล |
|---|---|---|---|---|
| วิเคราะห์ทั้ง Repository | game-architect | fable | xhigh | ต้องรักษาบริบทยาวและตรวจหลายระบบ |
| Architecture/ADR | game-architect | fable | xhigh | การตัดสินใจผิดกระทบระยะยาว |
| Final release audit | qa-release | fable | xhigh | ต้องตรวจข้ามระบบอย่างอิสระ |
| O-NET taxonomy/mastery | learning-architect | opus | xhigh | ต้องแม่นยำเชิงการศึกษา |
| Combat/Boss/AI | combat-engineer | opus | xhigh | State และ Interaction ซับซ้อน |
| Save migration | save-migration-engineer | opus | xhigh | ความเสียหายอาจย้อนกลับไม่ได้ |
| Multiplayer authority | multiplayer-engineer | opus | xhigh | Race condition และ duplication |
| Economy/Reward security | economy-engineer | opus | high/xhigh | ต้องป้องกัน Exploit |
| UI/Mobile/Quest | implementation-engineer | sonnet | high | Scope ชัดและต้องเขียนโค้ดมาก |
| Asset integration | world-art-engineer | sonnet | high | ต้องอ่าน Manifest และปรับโค้ด |
| Tests/Validator/Data | test-data-engineer | sonnet | medium | งานเชิงโครงสร้างชัดเจน |
| Docs/Rename/Small config | routine-worker | haiku | medium | งานไม่ต้องใช้เหตุผลสูง |
| Bug ไม่ทราบสาเหตุ | game-architect หรือ domain agent | fable/opus | xhigh | ต้องหา Root cause |
| Bug ที่รู้ Root cause | implementation-engineer | sonnet | high | Implement และ Regression test |

---

## 26.4 Main Session Settings

สร้าง `.claude/settings.json`:

```json
{
  "model": "opusplan",
  "effortLevel": "high",
  "fallbackModel": [
    "opus",
    "sonnet",
    "haiku"
  ]
}
```

### Optional Advisor

ถ้าใช้ Anthropic API โดยตรงและบัญชีรองรับ Advisor:

```json
{
  "model": "opusplan",
  "effortLevel": "high",
  "advisorModel": "fable",
  "fallbackModel": [
    "opus",
    "sonnet",
    "haiku"
  ]
}
```

ถ้าไม่มี Fable:

```json
{
  "model": "opusplan",
  "effortLevel": "high",
  "advisorModel": "opus",
  "fallbackModel": [
    "sonnet",
    "haiku"
  ]
}
```

หมายเหตุ:

- Advisor เป็น Experimental
- Advisor ใช้ได้เมื่อเชื่อม Anthropic API ตามข้อกำหนดของ Claude Code
- Bedrock, Google Cloud Agent Platform และ Microsoft Foundry อาจไม่รองรับ
- หากไม่แน่ใจให้ตัด `advisorModel` ออก ระบบ Subagent ยังทำงานได้

---

## 26.5 Routing Rules ที่ต้องเพิ่มใน CLAUDE.md

เพิ่มส่วนนี้ลงใน `CLAUDE.md`:

```md
## Automatic Model and Agent Routing

For every substantive request, classify the work before editing.

### Mandatory routing

Delegate automatically:

- Whole-repository analysis, architecture, cross-domain refactors, unknown root-cause bugs, and final release decisions:
  use `game-architect`.

- O-NET taxonomy, question validation, mastery, spaced review, misconceptions, adaptive learning, and teacher analytics:
  use `learning-architect`.

- Phaser combat, skills, targeting, enemy AI, boss phases, status effects, Knowledge Break combat behavior:
  use `combat-engineer`.

- Save schema, persistence, migration, backup, recovery, and compatibility:
  use `save-migration-engineer`.

- Colyseus rooms, synchronization, server authority, reconnect, anti-duplication, and party state:
  use `multiplayer-engineer`.

- Loot, inventory transactions, crafting, prices, rewards, drop tables, Sigils, and economy exploits:
  use `economy-engineer`.

- Approved scoped implementation, UI, mobile controls, quests, adapters, and normal fixes:
  use `implementation-engineer`.

- Asset manifests, Phaser asset loading, map composition, animation slicing, Y-sort, collision, VFX and audio integration:
  use `world-art-engineer`.

- Tests, validators, fixtures, deterministic simulation, data cleanup, reports, and safe mechanical refactors:
  use `test-data-engineer`.

- Trivial documentation, exact renames, comments, and tiny configuration edits:
  use `routine-worker`.

- Independent completion review:
  use `qa-release`.

### Escalation rules

Escalate from Sonnet/Haiku to Opus/Fable when any condition is true:

- more than two domains are affected
- save compatibility is uncertain
- multiplayer state or rewards are involved
- the root cause remains unknown after one reproduction attempt
- the same fix failed twice
- architecture must change
- security, privacy, or educational correctness is at risk
- the task may remove or migrate data
- the task changes core combat or learning formulas
- release approval is requested

### De-escalation rules

Use Sonnet medium or Haiku only when:

- the expected files are already known
- behavior is fully specified
- no schema or architecture decision is needed
- rollback is trivial
- tests already cover the behavior
- no student data, rewards, save, combat, or network authority is involved

### Execution discipline

1. Classify the request.
2. Name the selected agent and why.
3. Delegate rather than changing the main session model repeatedly.
4. Do not delegate overlapping write ownership in parallel.
5. Use worktree isolation for risky implementation agents.
6. Require tests, build, changed-file report, risks, and rollback.
7. If an agent cannot access its configured model, use the strongest allowed model and disclose the fallback.
8. Do not claim completion until `qa-release` or a phase-specific reviewer passes the acceptance criteria.
```

---

# 27. Subagent Files

สร้างโฟลเดอร์:

```text
.claude/agents/
```

หลังสร้าง Agent ครั้งแรกระหว่าง Session อาจต้อง Restart Claude Code เพื่อให้ตรวจพบโฟลเดอร์ใหม่

---

## 27.1 `.claude/agents/game-architect.md`

```md
---
name: game-architect
description: Use automatically for whole-repository analysis, architecture decisions, cross-domain refactors, unknown root-cause bugs, migration sequencing, technical direction, and final integration planning.
model: fable
effort: xhigh
permissionMode: plan
maxTurns: 60
memory: project
---

You are the lead game architect for RPG-O-NET P.6.

Own:
- architecture
- domain boundaries
- dependency analysis
- migration strategy
- feature flags
- technical ADRs
- cross-system risk
- integration planning

Before proposing changes:
1. inspect the repository and relevant Git diff
2. map affected systems and state ownership
3. identify compatibility risks
4. define measurable acceptance criteria
5. provide rollback

Never:
- rewrite the repository without a staged migration
- edit gameplay before the plan is approved
- mix unrelated domains
- remove a legacy path before the replacement passes

Prefer:
- typed interfaces
- adapters
- feature flags
- incremental migration
- deterministic tests
- evidence over assumptions

Update project memory with concise architecture decisions and important code paths.
```

Fallback when Fable is unavailable:

```yaml
model: opus
effort: xhigh
```

---

## 27.2 `.claude/agents/learning-architect.md`

```md
---
name: learning-architect
description: Use automatically for Grade 6 O-NET English taxonomy, question schemas, validation, mastery, spaced review, misconceptions, adaptive selection, educational feedback, learning analytics, and teacher mode.
model: opus
effort: xhigh
permissionMode: plan
maxTurns: 50
memory: project
---

You own educational correctness.

Non-negotiable rules:
- learning mastery is separate from combat power
- no unreviewed generated question enters production
- every question has a correct answer, explanation, and distractor reasoning
- preserve source provenance
- feedback must be age-appropriate and non-punitive
- daily learning adapts to subskill mastery and spaced review
- do not optimize only for answer speed
- teacher reports must not expose active answer keys
- collect no unnecessary personal data

Always define:
- learning objective
- O-NET domain/subskill
- misconception handling
- mastery update
- review schedule
- validation
- teacher review requirement
- tests
```

---

## 27.3 `.claude/agents/combat-engineer.md`

```md
---
name: combat-engineer
description: Use automatically for Phaser combat, targeting, skills, damage, cooldowns, status effects, enemy AI, boss phases, combat animation hooks, encounter state machines, and Knowledge Break combat integration.
model: opus
effort: xhigh
permissionMode: acceptEdits
maxTurns: 60
isolation: worktree
memory: project
---

Implement only approved combat architecture.

Rules:
- combat formulas live outside Vue components
- no frame-rate-dependent damage
- explicit state machines
- no attacks while dead, stunned, or invalid
- rewards are requested and validated, not trusted from UI
- encounters must reset safely
- listeners, timers, tweens, physics bodies, and network bindings must clean up
- legacy combat remains behind a feature flag until acceptance passes
- keyboard and touch abstractions are mandatory
- boss attacks must be readable and avoid unavoidable damage

Required output:
- files changed
- behavior changed
- tests
- diagnostic reproduction
- performance/lifecycle risk
- rollback
```

---

## 27.4 `.claude/agents/save-migration-engineer.md`

```md
---
name: save-migration-engineer
description: Use automatically for Pinia persistence, save schemas, state splitting, migrations, backups, corruption recovery, localStorage compatibility, server synchronization, and rollback.
model: opus
effort: xhigh
permissionMode: acceptEdits
maxTurns: 50
isolation: worktree
memory: project
---

Protect player data above implementation convenience.

Requirements:
- version every schema
- backup before migration
- migrations are idempotent
- preserve unknown compatible fields where safe
- validate before replacing the active save
- retain legacy data until successful verification
- recover from partial and corrupted saves
- never silently reset a player
- test repeated migration
- test downgrade/rollback assumptions
- separate profile, character, learning, economy, quest, and session state

Do not modify combat or content unless required by an approved schema adapter.
```

---

## 27.5 `.claude/agents/multiplayer-engineer.md`

```md
---
name: multiplayer-engineer
description: Use automatically for Colyseus rooms, networking, synchronization, party systems, reconnect, server authority, reward validation, anti-duplication, protocol changes, and offline-online compatibility.
model: opus
effort: xhigh
permissionMode: acceptEdits
maxTurns: 60
isolation: worktree
memory: project
---

Treat clients as untrusted.

Own:
- room lifecycle
- authoritative state
- protocol versioning
- reconnect
- party and encounter synchronization
- duplicate prevention
- reward validation
- rate/input validation
- offline compatibility interfaces

Required tests:
- join/leave
- disconnect/reconnect
- duplicate messages
- out-of-order messages
- repeated reward claim
- boss reset
- room disposal
- incompatible protocol version

Do not attempt MMO scale.
Keep the first production target at 2-4 player co-op.
```

---

## 27.6 `.claude/agents/economy-engineer.md`

```md
---
name: economy-engineer
description: Use automatically for inventory transactions, currency, crafting, shops, drops, named equipment, item affixes, Monster Sigils, pity systems, reward security, and economy simulations.
model: opus
effort: high
permissionMode: acceptEdits
maxTurns: 45
isolation: worktree
memory: project
---

Design a fair child-appropriate economy.

Rules:
- no paid loot boxes
- no negative price or duplication exploit
- no client-trusted grant
- reward claims are idempotent
- rare rewards include pity, collection progress, craft alternative, or duplicate conversion
- avoid extreme grind
- named items must change play decisions, not only numbers
- use seeded simulations
- report outliers and assumptions
```

Escalate this Agent to `effort: xhigh` for transaction redesign or exploit investigation.

---

## 27.7 `.claude/agents/implementation-engineer.md`

```md
---
name: implementation-engineer
description: Use automatically for approved scoped implementation, Vue UI, Pinia adapters, quests, mobile controls, HUD, settings, content wiring, and normal bug fixes with a known root cause.
model: sonnet
effort: high
permissionMode: acceptEdits
maxTurns: 45
isolation: worktree
---

Follow approved architecture and acceptance criteria.

Do not:
- redesign architecture
- change unrelated files
- change save schemas without the save agent
- change learning formulas without the learning agent
- change combat formulas without the combat agent

Always:
- inspect existing patterns
- implement the smallest robust change
- add regression tests
- run build
- perform relevant manual smoke checks
- report changed files, risks, and rollback
```

---

## 27.8 `.claude/agents/world-art-engineer.md`

```md
---
name: world-art-engineer
description: Use automatically for asset selection, asset manifests, Phaser loading, sprite slicing, map composition, 32x32 tiles, Y-sort, collision, animation configuration, VFX, lighting, ambience, and audio integration.
model: sonnet
effort: high
permissionMode: acceptEdits
maxTurns: 50
isolation: worktree
memory: project
---

Read the asset index and quality reports before selecting files.

Rules:
- Craftpix top-down is the default style spine
- preserve 32x32 world grid
- nearest-neighbor rendering
- never guess frame dimensions
- validate transparency, dimensions, frame order, direction, anchor, and license metadata
- use foot-position collision and Y-sort
- create an explicit asset manifest
- load by zone
- do not use every asset merely because it exists
- do not generate placeholders when a suitable indexed asset exists
- measure load/FPS impact
```

---

## 27.9 `.claude/agents/test-data-engineer.md`

```md
---
name: test-data-engineer
description: Use automatically for unit tests, integration tests, validators, fixtures, deterministic simulations, data migrations, reports, safe data cleanup, and mechanical refactors with fully specified behavior.
model: sonnet
effort: medium
permissionMode: acceptEdits
maxTurns: 35
isolation: worktree
---

Prefer deterministic, small, maintainable tests.

Own:
- test fixtures
- validators
- seeded simulations
- regression coverage
- data reports
- non-behavioral cleanup

Do not make architecture decisions.
Escalate when tests reveal ambiguous behavior, data loss, reward exploits, or schema conflict.
```

---

## 27.10 `.claude/agents/routine-worker.md`

```md
---
name: routine-worker
description: Use only for trivial documentation edits, exact renames, comments, formatting, simple configuration changes, and other low-risk tasks with completely specified output.
model: haiku
effort: medium
permissionMode: acceptEdits
maxTurns: 20
---

This agent is for low-risk mechanical work only.

Stop and escalate if:
- more than three source files require behavioral changes
- any test fails unexpectedly
- schema, architecture, save, combat, learning, reward, or network behavior is involved
- requirements are ambiguous
- a dependency must be added

Do not make design decisions.
```

---

## 27.11 `.claude/agents/qa-release.md`

```md
---
name: qa-release
description: Use automatically for independent phase review, release audits, acceptance-gate verification, regression analysis, performance checks, security review, and final S-grade assessment.
model: fable
effort: xhigh
permissionMode: plan
maxTurns: 60
memory: project
---

Act as an independent reviewer.

Do not trust completion claims.

Verify with evidence:
- Git diff
- scope
- tests
- production build
- manual smoke flow
- save migration
- mobile
- offline
- reconnect
- reward duplication
- learning correctness
- asset paths
- console errors
- lifecycle cleanup
- performance measurements

Grade findings:
- blocker
- critical
- major
- minor
- polish

Do not approve S-grade unless every mandatory gate passes.
Do not implement new features during release review.
```

Fallback when Fable is unavailable:

```yaml
model: opus
effort: xhigh
```

---

# 28. Automatic Routing Bootstrap Prompt

วางไฟล์นี้ไว้ที่ Root ของ Repository แล้วเริ่ม Claude Code ด้วย:

```bash
claude --model opusplan --effort high
```

จากนั้นสั่ง:

```text
Read RPG_ONET_NEW_GAME_FOUNDATION_MASTER_PLAN_V2_AUTO_ROUTER_TH.md.

Install only the Automatic Model and Effort Router described in sections 26-29.

Tasks:
1. Check the current Claude Code version and document whether fable, opus, sonnet, haiku, effort frontmatter, worktree isolation, advisor, and opusplan are available.
2. Back up existing CLAUDE.md, .claude/settings.json, and .claude/agents before modification.
3. Merge the routing rules into CLAUDE.md without deleting useful existing project rules.
4. Create or update the agent files exactly as specified, adapting only unsupported fields.
5. Create .claude/settings.json with opusplan/high and safe fallback models.
6. Do not enable advisor automatically unless the current provider supports it; document the optional command/settings instead.
7. Validate YAML frontmatter and agent discovery.
8. Run /agents-equivalent inspection or the available Claude Code validation workflow.
9. Do not change gameplay, dependencies, assets, saves, or server code.
10. Create docs/claude/AUTO_MODEL_ROUTER_INSTALL_REPORT.md containing:
   - version
   - provider limitations
   - files installed
   - model/effort routing table
   - fallbacks
   - manual invocation examples
   - rollback
11. Stop after installation and validation.

Report exact files changed and whether a Claude Code restart is required.
```

---

# 29. การใช้งานหลังติดตั้ง

## ปล่อยให้เลือกอัตโนมัติ

```text
Analyze and fix the current boss encounter soft lock.
Follow CLAUDE.md automatic routing.
```

ระบบควรเลือก `combat-engineer` หรือยกระดับไป `game-architect`

## บังคับ Agent เมื่องานสำคัญ

```text
@game-architect Audit the migration plan before implementation.
```

```text
@learning-architect Review the O-NET mastery algorithm.
```

```text
@combat-engineer Implement the approved boss phase state machine.
```

```text
@qa-release Audit Phase 7 against its acceptance criteria.
```

## ใช้ Main Session แบบ Hybrid

```text
/model opusplan
/effort high
```

เข้า Plan Mode เพื่อใช้ Opus และออกจาก Plan Modeเพื่อให้ Sonnetลงมืออัตโนมัติ

## งานยากครั้งเดียว

เพิ่มคำว่า:

```text
ultrathink
```

ใน Prompt เพื่อขอการวิเคราะห์ลึกเฉพาะ Turn โดยไม่เปลี่ยน Session effort

## งานใหญ่มาก

เริ่ม Session ใหม่:

```bash
claude --model fable --effort ultracode
```

ใช้เฉพาะ:

- Whole-repo transformation
- Hard integration
- Unknown root cause ข้ามหลายระบบ
- Independent final audit

---

# 30. Cost และ Cache Rules

- อย่าเปลี่ยน Main model ทุกไม่กี่ข้อความ
- อย่าเปลี่ยน Effort ระหว่าง Session ยาวโดยไม่จำเป็น
- การเปลี่ยน Model หรือ Effort ทำให้ Prompt Cache miss ใน Turn ถัดไป
- ให้ Main Session อยู่ที่ `opusplan/high`
- ใช้ Subagent เพื่อเปลี่ยนโมเดลเฉพาะงาน
- ใช้ Haiku เฉพาะงาน trivial
- ใช้ Sonnet เป็นผู้ลงมือหลัก
- ใช้ Opus สำหรับระบบเสี่ยง
- ใช้ Fable สำหรับภาพรวมและ Audit
- ใช้ `max` หรือ `ultracode` เฉพาะจุด ไม่เป็นค่า Default
- หลังจบ Phase ใช้ `/clear` หรือเริ่ม Session ใหม่ เพื่อไม่ให้ Context จากงานก่อนรบกวนงานถัดไป

---

# 31. Router Acceptance Criteria

ระบบ Router ถือว่าติดตั้งสำเร็จเมื่อ:

- `.claude/agents/` มี Agent ครบ
- Frontmatter ผ่านการตรวจ
- `/agents` หรือ Agent discovery แสดง Agent
- งาน Architecture ถูกส่งไป Fable/Opus
- งาน Learning ถูกส่งไป Opus xhigh
- งาน Implementation ถูกส่งไป Sonnet high
- งาน trivial ถูกส่งไป Haiku โดยไม่แตะระบบเสี่ยง
- Agent ที่มี Write ownership ไม่ทำงานทับไฟล์เดียวกันพร้อมกัน
- Fallback ทำงานเมื่อโมเดลไม่พร้อม
- Main Session ไม่สลับโมเดลถี่โดยไม่จำเป็น
- Build/Gameplay ไม่เปลี่ยนจากการติดตั้ง Router
- มีรายงานและ Rollback
