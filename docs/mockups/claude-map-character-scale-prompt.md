# Map & Character Scale Analysis Prompt for Claude Code

คุณคือ Senior 2D Game Technical Artist, Level Designer และ Phaser Game Engineer

ให้ตรวจสอบ Mockup และ Asset ใน:

`C:\Users\MONSTER\OneDrive\Desktop\Onet-newproject\docs\mockups`

แล้วนำมาใช้ปรับปรุงแผนที่ของเกม โดยต้องวิเคราะห์สเกลจากข้อมูลจริงและสร้าง Greybox ก่อน ห้ามนำภาพ Mockup ไปย่อแล้วใช้เป็นแผนที่โดยตรง

## ข้อมูลปัจจุบัน

- Tile size: `32×32 px`
- Character frame: สูงประมาณ `48 px`
- Camera viewport: `640×480 px`
- เมืองเดิม: ประมาณ `1199×608 px`
- Mockup ใหม่: `1536×1024 px`
- มุมมองของ Mockup เป็น Top-Down ที่เห็นพื้นที่กว้างมาก

ตัวละครสูง 48px บน Tile 32px เท่ากับประมาณ 1.5 Tile ซึ่งไม่ถือว่าใหญ่ผิดปกติโดยอัตโนมัติ

ปัญหาที่ต้องตรวจสอบจริงคือ:

- อาคาร ถนน และสิ่งแวดล้อมใน Mockup ถูกย่อเล็กเกินไปหรือไม่
- Camera zoom ทำให้เห็นพื้นที่มากเกินไปหรือไม่
- แผนที่มีจำนวน Tile น้อยเกินไปเมื่อเทียบกับรายละเอียดใน Mockupหรือไม่
- Character visual scale และ collision footprint สัมพันธ์กับประตู ถนน และอาคารหรือไม่
- Mockup เป็นภาพ Concept ที่ต้องแปลงเป็น Tilemap ไม่ใช่ภาพพื้นหลังที่พร้อมใช้หรือไม่

## เป้าหมาย

นำ Art Direction, Layout และองค์ประกอบจาก Mockup มาสร้างเป็นแผนที่ที่เล่นได้จริง โดย:

- ตัวละครไม่ดูใหญ่เกินเมือง
- อาคารมีขนาดเหมาะสมกับตัวละคร
- ถนนและทางเดินรองรับการเดินและ NPC
- ประตูและทางเข้ามีขนาดสมเหตุผล
- กล้องไม่สูงหรือซูมออกจนเหมือนมองเมืองจำลอง
- ตัวละครยังมองเห็นรายละเอียดและ Animation ได้ชัด
- รักษา Pixel Art ให้คมชัด
- Collision และ Depth Sorting ทำงานถูกต้อง

## กฎสำคัญ

1. ห้ามย่อภาพ Mockup 1536×1024 แล้วใช้เป็นพื้นหลังของแผนที่ทันที
2. ห้ามลด Character Sprite เป็นคำตอบแรก
3. ต้องสร้าง Greybox จาก Tile 32px ก่อน
4. ต้องเปรียบเทียบหลายแนวทางจากภาพ Runtime จริง
5. เลือกค่าจากหลักฐาน ไม่ใช้ความรู้สึกเพียงอย่างเดียว
6. ห้ามแก้ Gameplay Logic ที่ไม่เกี่ยวข้อง
7. ใช้ Asset เดิมก่อนสร้าง Asset ใหม่
8. หากใช้ Layered Character ทุก Layer ต้องมี Scale, Origin และ Animation Sync เดียวกัน

## Phase 1 — สำรวจโปรเจกต์

ตรวจสอบ:

- Mockup ทุกไฟล์
- Asset index หรือ Asset manifest
- Tileset และ Tilemap
- Character Sprite และ Sprite Sheet
- Scene ที่ใช้เมืองเดิม
- Camera configuration
- Player scale
- Physics body และ collision
- อาคาร ประตู ถนน ต้นไม้ และ Object
- Depth sorting
- Rendering และ texture filtering

ระบุให้ได้ว่า:

- Character 48px หมายถึงความสูงทั้งเฟรมหรือความสูงภาพตัวละครจริง
- จุด Anchor อยู่ที่ใด
- Collision body กว้างและสูงเท่าใด
- เมืองเดิมมีขนาดกี่ Tile
- Camera ใช้ Zoom เท่าใด
- Canvas หรือ Game Resolution เท่าใด
- Asset แต่ละชุดออกแบบมาสำหรับ Tile ขนาดใด

ห้ามสมมติชื่อไฟล์ ให้ค้นหาจากโครงสร้างจริง

## Phase 2 — วิเคราะห์ Mockup

แยก Mockup ออกเป็นองค์ประกอบ เช่น:

- เขตเมือง
- ถนนหลัก
- ถนนรอง
- อาคารสำคัญ
- บ้าน
- โรงเรียน
- ร้านค้า
- ลานกลางเมือง
- พื้นที่ธรรมชาติ
- ทางเข้าสู่พื้นที่อื่น
- จุดเกิดผู้เล่น
- NPC และจุดโต้ตอบ

วิเคราะห์ว่าองค์ประกอบใดเป็น:

- Layout reference
- Scale reference
- Art direction reference
- Asset ที่ใช้จริงได้
- Concept ที่ต้องสร้างใหม่เป็น Tilemap
- ฉากตกแต่งที่ไม่ควรมี Collision
- พื้นที่ Gameplay สำคัญ

อย่าพยายามรักษาทุก Pixel ของ Mockup ให้รักษาโครงสร้าง การจัดองค์ประกอบ และบรรยากาศแทน

## Phase 3 — สร้าง Greybox

สร้าง Greybox ด้วย Tile ขนาด 32px ก่อนใส่รายละเอียดจริง

ทดสอบแผนที่อย่างน้อย 3 ขนาด:

### Option A — Compact

เหมาะสำหรับเมืองขนาดเล็กและการเดินทางเร็ว

ตัวอย่างช่วงเริ่มต้น:

- ประมาณ `50×35 tiles`
- ขนาดประมาณ `1600×1120 px`

### Option B — Balanced

เหมาะสำหรับเมืองหลักที่มี NPC และอาคารหลายแห่ง

ตัวอย่างช่วงเริ่มต้น:

- ประมาณ `64×44 tiles`
- ขนาดประมาณ `2048×1408 px`

### Option C — Spacious

เหมาะกับเมืองที่ต้องการพื้นที่สำรวจและมุมมองใกล้ Mockup

ตัวอย่างช่วงเริ่มต้น:

- ประมาณ `80×54 tiles`
- ขนาดประมาณ `2560×1728 px`

ตัวเลขเหล่านี้เป็นเพียงค่าทดสอบ ให้ปรับตาม Layout และ Asset จริง

Greybox ต้องมี:

- Player spawn
- ถนนหลัก
- ถนนรอง
- อาคารตัวอย่างอย่างน้อย 3 ขนาด
- ประตู
- ทางเดิน
- NPC
- Object ขนาดเล็ก
- Collision
- Camera bounds
- Scene transition อย่างน้อยหนึ่งจุด

## Phase 4 — สัดส่วนอ้างอิง

ใช้เกณฑ์เบื้องต้นต่อไปนี้ แต่สามารถปรับตาม Asset จริง:

### Character

- Visual height: เริ่มทดสอบที่ `48px`
- Collision ต้องอยู่บริเวณเท้า ไม่ครอบคลุมทั้งตัว
- Collision width ควรประมาณ `14–22px`
- Collision height ควรประมาณ `10–18px`
- Anchor ควรอยู่กึ่งกลางเท้าด้านล่าง

### ประตูและทางเข้า

- ประตูเล็ก: กว้างอย่างน้อย `1.5–2 tiles`
- ทางเข้าอาคารหลัก: กว้างประมาณ `2–3 tiles`
- Collision opening ต้องกว้างกว่า Player body อย่างชัดเจน

### ถนน

- ทางเดินเล็ก: อย่างน้อย `2 tiles`
- ถนนรอง: ประมาณ `3–4 tiles`
- ถนนหลัก: ประมาณ `5–8 tiles`
- ลานกลางเมืองต้องกว้างพอสำหรับ Player, NPC และ Object พร้อมกัน

### อาคาร

อย่าวัดจากภาพด้านหน้าเพียงอย่างเดียว ให้แยก:

- Visual height
- Walkable footprint
- Entrance position
- Roof overlap
- Collision footprint
- Depth sorting point

อาคารหลักควรมี Footprint ใหญ่พอจนตัวละครไม่ดูสูงใกล้เคียงกับทั้งอาคาร

## Phase 5 — ทดสอบ 3 แนวทาง

สร้าง Runtime comparison อย่างน้อย 3 แบบ

### Test 1 — รักษาตัวละคร 48px

- Character scale: `1.0`
- ปรับขนาด Map และ Environment ให้เหมาะสม
- ใช้ Camera zoom ปัจจุบันเป็นจุดเริ่มต้น

### Test 2 — ลดตัวละครเล็กน้อย

ทดลองเฉพาะค่าที่ไม่ทำลาย Pixel Art เช่น:

- `0.875`
- `0.75`

ตรวจสอบว่าการแสดง Pixel ยังคมชัดหรือไม่

ห้ามใช้ Scale ทศนิยมที่ทำให้ Pixel สั่นหรือเบลอ หาก Renderer ไม่รองรับอย่างถูกต้อง

### Test 3 — ปรับ Camera และ Layout

- รักษา Character ที่ `1.0`
- ขยายแผนที่หรือพื้นที่ระหว่างอาคาร
- ปรับ Camera zoom เข้าเล็กน้อย
- ตรวจความรู้สึกขณะเดินจริง

สามารถสร้าง Test 4 แบบผสมได้ หากจำเป็น:

- Character `0.875`
- Map ใหญ่ขึ้น
- Camera zoom เข้าเล็กน้อย

## เกณฑ์การตัดสิน

ให้ให้คะแนนแต่ละแบบ 1–5 ในหัวข้อต่อไปนี้:

- Character readability
- Environment proportion
- Navigation
- Pixel clarity
- Camera visibility
- Combat readability
- NPC interaction
- อาคารและประตูดูสมจริง
- รองรับ Mobile/Desktop
- รองรับ Asset เพิ่มเติมในอนาคต

เลือกแบบที่มีคะแนนรวมดีที่สุด ไม่ใช่แบบที่ใกล้ Mockup ในเชิงภาพมากที่สุดเพียงอย่างเดียว

## Phase 6 — Camera

ตรวจสอบ Camera ปัจจุบันที่ `640×480`

วิเคราะห์ว่า:

- Resolution นี้เป็น Internal Resolution หรือ CSS Display Size
- มีการ Scale Canvas เพิ่มหรือไม่
- Camera zoom ปัจจุบันเท่าใด
- จำนวน Tile ที่เห็นในหน้าจอจริงเท่าใด
- Player กินพื้นที่หน้าจอกี่เปอร์เซ็นต์
- บน Mobile และ Desktop แสดงผลต่างกันหรือไม่

ทดสอบ Camera โดยหลีกเลี่ยงค่าที่ทำให้ Pixel เบลอ

ต้องมี:

- Smooth follow ที่ไม่หน่วงมาก
- Camera bounds ตรงกับ Map
- Dead zone ที่เหมาะสม
- ไม่เห็นพื้นที่นอก Map
- Player ไม่อยู่ชิดขอบหน้าจอขณะเดิน
- รองรับ Scene ภายในและภายนอก

หากจำเป็น ให้กำหนด Camera profile แยก:

- Outdoor
- Indoor
- Combat
- Boss
- Cutscene

แต่ห้ามสร้างระบบซับซ้อนเกินความจำเป็น

## Phase 7 — นำ Asset มาใช้จริง

หลังเลือก Greybox ที่ดีที่สุดแล้ว:

1. แทน Greybox ด้วย Asset จริง
2. รักษา Layout ที่ผ่านการทดสอบ
3. ใช้ Asset จากโปรเจกต์ก่อน
4. ปรับ Scale อย่างเป็นระบบ
5. ตั้ง Origin และ Depth ให้ถูกต้อง
6. สร้าง Collision จาก Footprint
7. ตรวจสอบการเดินหน้าและหลัง Object
8. ตรวจสอบประตูและ Scene transition
9. ตรวจสอบ Animation ทุกทิศทาง
10. ตรวจสอบ Layered Equipment

ห้ามวาง Asset ตาม Mockup แบบสุ่มหรือคัดลอกตำแหน่ง Pixel ตรง ๆ

## ระบบ Configuration

ค้นหา Configuration เดิมก่อน หากยังไม่มีจึงสร้างค่ากลาง เช่น:

- `TILE_SIZE`
- `PLAYER_VISUAL_SCALE`
- `PLAYER_BODY_WIDTH`
- `PLAYER_BODY_HEIGHT`
- `PLAYER_BODY_OFFSET_X`
- `PLAYER_BODY_OFFSET_Y`
- `PLAYER_FEET_OFFSET`
- `OUTDOOR_CAMERA_ZOOM`
- `INDOOR_CAMERA_ZOOM`
- `CAMERA_LERP`
- `INTERACTION_RANGE`
- `DEPTH_SORT_OFFSET`

ห้าม Hardcode ค่าเดียวกันซ้ำหลาย Scene

## Runtime Validation

เปิดเกมและตรวจสอบด้วยภาพจริงอย่างน้อย:

- Player ยืนข้างบ้าน
- Player ยืนหน้าประตู
- Player เดินผ่านทางเดินแคบ
- Player เดินบนถนนหลัก
- Player ยืนข้าง NPC
- Player ยืนข้างต้นไม้ โต๊ะ ป้าย และ Object
- Player เดินด้านหน้าและด้านหลังอาคารหรือวัตถุ
- Camera follow
- Camera bounds
- Idle animation
- Walk animation
- Equipment layers
- Collision ตามกำแพงและมุม
- Scene transition

สร้าง Screenshot เปรียบเทียบแต่ละ Scale Test หากเครื่องมือในโปรเจกต์รองรับ

ห้ามถือว่าเสร็จเพียงเพราะ Build ผ่าน ต้องตรวจ Runtime Visual จริงด้วย

## เอกสารผลวิเคราะห์

สร้างไฟล์:

`docs/map-character-scale-analysis.md`

ใช้โครงสร้าง:

### Current State

- Tile size:
- Character frame size:
- Character rendered size:
- Collision size:
- Camera internal resolution:
- Camera zoom:
- Existing map dimensions:
- Existing map tile count:
- Mockup dimensions:

### Root Cause

ระบุว่าปัญหามาจาก:

- Character scale
- Map dimensions
- Environment proportions
- Camera zoom
- Mockup conversion
- หรือหลายปัจจัยร่วมกัน

### Greybox Tests

สำหรับแต่ละแบบระบุ:

- Map size in tiles:
- Map size in pixels:
- Character scale:
- Camera zoom:
- Tiles visible:
- Strengths:
- Problems:
- Score:

### Final Decision

- Selected option:
- Character scale before/after:
- Camera zoom before/after:
- Map size before/after:
- Collision before/after:
- เหตุผลที่เลือก:

### Mockup Integration

- Mockups used:
- Layout elements used:
- Assets used:
- Assets modified:
- Missing assets:
- Placeholders:

### Validation

- Build:
- Tests:
- Runtime:
- Collision:
- Animation:
- Camera:
- Remaining issues:

### Changed Files

แสดงรายชื่อไฟล์ทั้งหมดที่แก้ไข

## ลำดับการทำงาน

1. ตรวจ Git status
2. สำรวจ Mockup, Asset และโค้ดจริง
3. บันทึกค่าปัจจุบัน
4. หาสาเหตุหลัก
5. สร้าง Greybox อย่างน้อย 3 แบบ
6. ทดสอบ Character scale, Map scale และ Camera
7. เปรียบเทียบจาก Runtime
8. เลือกแบบที่ดีที่สุด
9. นำ Asset จริงมาแทน Greybox
10. ปรับ Collision, Origin และ Depth
11. รัน Test, Lint และ Build
12. ตรวจภาพในเกมจริง
13. บันทึกผลในเอกสาร
14. สรุปสิ่งที่แก้และปัญหาที่ยังเหลือ

เริ่มดำเนินงานได้ทันที

อย่าถามให้ผู้ใช้เลือกระหว่าง Scale ก่อนทดลอง ให้ตรวจสอบไฟล์จริง สร้าง Greybox เปรียบเทียบ และเลือกแนวทางที่ดีที่สุดจากหลักฐาน

อย่าลด Character เพียงเพราะ Mockup ดูกว้าง ให้พิจารณาการขยาย Map, ปรับระยะอาคาร, ปรับ Environment footprint และ Camera ก่อนเสมอ
