// ================================================================================================
// เนื้อหาติวสอบ O-NET ป.6 ภาษาอังกฤษ — เรียบเรียงใหม่ทั้งหมดจาก "แพตเทิร์น" ใน knowledge/knowledge_base.json
// (grammar_frequency, vocabulary_topics, question_type_catalog, dialogue_patterns, distractor_patterns)
// เป็นบทเรียนต้นฉบับสำหรับให้นักเรียนอ่านก่อนไปสู้มอนสเตอร์ที่ห้องเรียน Guild Hall ชั้น 2
// *ไม่มีข้อสอบจริง* — สอดคล้องกติกาใน knowledge/README.md (เก็บเฉพาะแพตเทิร์น ห้ามคัดลอกข้อสอบ)
// ================================================================================================

export type StudyCategory = 'grammar' | 'vocabulary' | 'reading' | 'conversation' | 'strategy'

export interface StudyExample { en: string; th: string }
export interface StudyLesson {
  id: string
  category: StudyCategory
  title: string
  titleTh: string
  cefr: 'Pre-A1' | 'A1' | 'A2' | 'B1'
  summary: string        // อธิบายสั้นๆ (ไทย) ว่าเรื่องนี้ออกบ่อยแค่ไหน/ต้องดูอะไร
  points: string[]       // หัวข้อย่อยที่ต้องจำ
  examples: StudyExample[]
  tip: string            // เคล็ดลับ/กับดักที่ข้อสอบชอบใช้ (จาก distractor_patterns)
}

export const STUDY_LESSONS: StudyLesson[] = [
  // ---------- GRAMMAR (grammar_frequency: high) ----------
  {
    id: 'g_wh', category: 'grammar', title: 'Wh- Questions', titleTh: 'คำถาม Wh-', cefr: 'A1',
    summary: 'ออกบ่อยมาก (high) ต้องเลือกคำถามให้ตรงกับคำตอบ และเลือกคำตอบให้ตรงหน่วยของคำถาม',
    points: [
      'What = อะไร, Where = ที่ไหน, When = เมื่อไหร่, Who = ใคร, Why = ทำไม, How = อย่างไร/เท่าไหร่',
      'How much = ราคา/ปริมาณนับไม่ได้, How many = จำนวนนับได้, How old = อายุ',
      'คำตอบต้องตรง "หน่วย": ถามเวลาตอบเวลา, ถามราคาตอบเงิน, ถามระยะทางตอบ กม./เมตร',
    ],
    examples: [
      { en: 'A: How much is the pencil?  B: It is ten baht.', th: 'ถามราคา → ตอบเป็นเงิน' },
      { en: 'A: Why are you late?  B: Because I missed the bus.', th: 'Why → ตอบด้วย Because' },
    ],
    tip: 'กับดัก: ตัวเลือกที่หัวข้อถูกแต่ "หน่วยผิด" เช่น ถาม When แต่ตอบสถานที่',
  },
  {
    id: 'g_present', category: 'grammar', title: 'Present Simple', titleTh: 'ปัจจุบันกาลปกติ', cefr: 'Pre-A1',
    summary: 'ออกบ่อยมาก (high) เรื่องหลักคือการเติม -s/-es กับประธานเอกพจน์บุรุษที่ 3',
    points: [
      'He / She / It + กริยาเติม -s/-es (goes, watches, studies)',
      'I / You / We / They + กริยาช่องที่ 1 ธรรมดา (go, watch)',
      'ประโยคปฏิเสธ/คำถามใช้ does กับ he/she/it, do กับที่เหลือ',
    ],
    examples: [
      { en: 'She goes to school every day.', th: 'she → เติม -es' },
      { en: 'They play football on Sunday.', th: 'they → ไม่เติม s' },
    ],
    tip: 'กับดัก: ประโยคที่ถูกทุกอย่างยกเว้นลืมเติม -s กับประธานเอกพจน์',
  },
  {
    id: 'g_modal', category: 'grammar', title: 'Modal Verbs', titleTh: 'กริยาช่วย (should/could/can/may)', cefr: 'A2',
    summary: 'ออกบ่อยมาก (high) ใช้แสดง คำแนะนำ/ขออนุญาต/ความสามารถ/ความสุภาพ',
    points: [
      'can/could = สามารถ, ขออนุญาต (could สุภาพกว่า)',
      'should = ควรจะ (ให้คำแนะนำ), may = อาจจะ / ขออนุญาตแบบสุภาพ',
      'หลัง modal ใช้กริยาช่องที่ 1 เสมอ (should go ไม่ใช่ should goes)',
    ],
    examples: [
      { en: 'You should see a doctor.', th: 'แนะนำเมื่อเพื่อนป่วย' },
      { en: 'Could you help me, please?', th: 'ขอความช่วยเหลืออย่างสุภาพ' },
    ],
    tip: 'จับคู่ modal กับ "สถานการณ์": ป่วย→should, ขอร้อง→could/can you',
  },
  {
    id: 'g_compare', category: 'grammar', title: 'Comparatives & Superlatives', titleTh: 'ขั้นกว่า–ขั้นสุด', cefr: 'A2',
    summary: 'ออกบ่อยมาก (high) มักมากับตาราง/กราฟ ให้เทียบ 2+ ค่า และเรียงลำดับ',
    points: [
      'สั้น: + -er / -est (taller, tallest)',
      'ยาว: more / most (more beautiful, most beautiful)',
      'ทิศทางต้องถูก: bigger = ใหญ่กว่า, smaller = เล็กกว่า',
    ],
    examples: [
      { en: 'A cheetah is faster than a dog.', th: 'เทียบ 2 สิ่ง → -er + than' },
      { en: 'Mount Everest is the highest mountain.', th: 'สูงที่สุด → the + -est' },
    ],
    tip: 'กับดักยอดฮิต: สลับทิศเปรียบเทียบ (faster↔slower, more↔less) หรือเชนเปรียบเทียบผิด 1 จุด',
  },
  // ---------- VOCABULARY (vocabulary_topics_frequency: high) ----------
  {
    id: 'v_school', category: 'vocabulary', title: 'School & Classroom', titleTh: 'โรงเรียน–ห้องเรียน', cefr: 'Pre-A1',
    summary: 'หัวข้อที่ออกบ่อยที่สุด (high) — คำศัพท์ในโรงเรียนและสถานการณ์ห้องเรียน',
    points: [
      'teacher, student, classroom, blackboard, notebook, ruler, eraser',
      'subjects: Math, English, Science, Art, P.E.',
      'กริยา: study, read, write, draw, listen, raise your hand',
    ],
    examples: [
      { en: 'A person who teaches students is a teacher.', th: 'นิยาม → อาชีพ' },
      { en: 'We use a ruler to draw straight lines.', th: 'หน้าที่ของสิ่งของ' },
    ],
    tip: 'ฝึกอ่าน "นิยาม" แล้วเดาคำ เช่น a place where we learn = school',
  },
  {
    id: 'v_food', category: 'vocabulary', title: 'Food & Nutrition', titleTh: 'อาหาร–โภชนาการ', cefr: 'A1',
    summary: 'ออกบ่อย (high) ทั้งคำศัพท์อาหารและเมนู/การสั่งอาหารในบทสนทนา',
    points: [
      'fruit: apple, banana, mango, orange · vegetable: carrot, tomato',
      'meal: breakfast, lunch, dinner · taste: sweet, sour, spicy, salty',
      'ร้านอาหาร: menu, order, bill, waiter',
    ],
    examples: [
      { en: 'A: What would you like?  B: I would like fried rice.', th: 'สั่งอาหารแบบสุภาพ' },
      { en: 'A lemon tastes sour.', th: 'จับคู่รสชาติกับของ' },
    ],
    tip: 'ระวังกับดัก "หมวดที่ถูกตัดออก" เช่น โจทย์บอก no meat แล้วตัวเลือกดันมีเนื้อ',
  },
  {
    id: 'v_festival', category: 'vocabulary', title: 'Festivals & Holidays', titleTh: 'เทศกาล–วันหยุด', cefr: 'A2',
    summary: 'ออกบ่อย (high) ทั้งของไทยและตะวันตก มักถามวันที่/กิจกรรมประจำเทศกาล',
    points: [
      'Songkran (เม.ย., สาดน้ำ), Loy Krathong (ลอยกระทง), New Year',
      'Christmas (25 Dec), Halloween (31 Oct), Thanksgiving (พฤหัสที่ 4 พ.ย.)',
      'กิจกรรม: give gifts, make merit, wear costumes, watch fireworks',
    ],
    examples: [
      { en: 'People pour water on each other during Songkran.', th: 'กิจกรรมประจำเทศกาล' },
      { en: 'Thanksgiving is on the fourth Thursday of November.', th: 'วันที่ "เปลี่ยนได้" ไม่ใช่วันตายตัว' },
    ],
    tip: 'กับดัก: เปลี่ยน "วันที่ยืดหยุ่น" (พฤหัสที่ 4) เป็นวันตายตัวในปฏิทิน',
  },
  {
    id: 'v_directions', category: 'vocabulary', title: 'Places & Directions', titleTh: 'สถานที่–ทิศทาง', cefr: 'A1',
    summary: 'ออกบ่อย (high) มักมากับแผนที่ ให้เดินตามคำสั่งและนับทางเลี้ยว',
    points: [
      'go straight, turn left/right, next to, between, opposite, near, on the corner',
      'สถานที่: hospital, bank, post office, market, school, park',
      'นับลำดับการเลี้ยว: first, second, third turn',
    ],
    examples: [
      { en: 'Go straight and turn left. The bank is on your right.', th: 'อ่านคำสั่งทีละก้าว' },
      { en: 'The library is between the school and the park.', th: 'between A and B' },
    ],
    tip: 'ลากนิ้วตามแผนที่จริงทีละคำสั่ง อย่าเดา—ข้อสอบชอบสลับซ้าย/ขวา',
  },
  {
    id: 'v_signs', category: 'vocabulary', title: 'Signs & Public Notices', titleTh: 'ป้าย–ประกาศสาธารณะ', cefr: 'A2',
    summary: 'ออกบ่อย (high) ให้ตีความป้าย/ประกาศ และแยกป้ายที่หน้าตาคล้ายกัน',
    points: [
      'No entry, No parking, Keep quiet, Push/Pull, Exit, Danger, Do not litter',
      'ป้ายห้าม (prohibition) มักมีเครื่องหมายกากบาท/วงกลมขีด',
      'อ่านทั้ง "ข้อความ + บริบทสถานที่" ประกอบกัน',
    ],
    examples: [
      { en: '"No littering" means you must not drop trash.', th: 'ป้ายห้าม → ต้องไม่ทำ' },
      { en: '"Silence, please" is seen in a library.', th: 'จับคู่ป้ายกับสถานที่' },
    ],
    tip: 'กับดัก: ป้ายไอคอนคล้ายกันมาก—อ่านคำประกอบเสมอ',
  },
  {
    id: 'v_weather', category: 'vocabulary', title: 'Weather & Seasons', titleTh: 'สภาพอากาศ–ฤดูกาล', cefr: 'A1',
    summary: 'ออกบ่อย (high) จับคู่สภาพอากาศกับกิจกรรม/การแต่งกาย',
    points: [
      'sunny, rainy, cloudy, windy, stormy, hot, cold, cool',
      'seasons: summer, rainy season, winter',
      'จับคู่: rainy → umbrella, cold → jacket, hot → drink water',
    ],
    examples: [
      { en: 'It is raining, so take an umbrella.', th: 'อากาศ → การเตรียมตัว' },
      { en: 'In winter, we wear a warm coat.', th: 'ฤดู → เสื้อผ้า' },
    ],
    tip: 'โยงเหตุ-ผล: อากาศแบบนี้ควรทำ/ใส่อะไร',
  },
  {
    id: 'v_environment', category: 'vocabulary', title: 'Environment & Nature', titleTh: 'สิ่งแวดล้อม', cefr: 'A2',
    summary: 'มาแรงตั้งแต่ปี 2563 (PM2.5, recycling, littering) — คำศัพท์รักษ์โลก',
    points: [
      'recycle, reuse, reduce, pollution, PM2.5, mask, plant trees',
      'ปัญหา: air pollution, garbage, plastic waste',
      'วิธีแก้: separate trash, save water/energy, use cloth bags',
    ],
    examples: [
      { en: 'We should recycle bottles to reduce waste.', th: 'ปัญหา → วิธีแก้' },
      { en: 'People wear masks when there is a lot of PM2.5.', th: 'เหตุการณ์จริงในไทย' },
    ],
    tip: 'จำคู่ปัญหา–วิธีแก้ มักถามว่า "ควรทำอะไรเพื่อลด..."',
  },
  // ---------- CONVERSATION (dialogue_patterns) ----------
  {
    id: 'c_functional', category: 'conversation', title: 'Everyday Responses', titleTh: 'ตอบบทสนทนาในชีวิตประจำวัน', cefr: 'A1',
    summary: 'ออกเยอะมาก (functional_language_response = 30) เลือกคำตอบให้ตรงทั้ง "ไวยากรณ์และอารมณ์"',
    points: [
      'ทักทาย: How are you? → I\'m fine, thanks. / Not so good.',
      'ขอบคุณ–ขอโทษ: Thank you → You\'re welcome. Sorry → That\'s OK.',
      'เสนอ/ขอ: Would you like...? Can I have...?',
    ],
    examples: [
      { en: 'A: I failed the test.  B: I\'m sorry to hear that.', th: 'ตอบให้ตรง "อารมณ์" (เห็นใจ)' },
      { en: 'A: Thank you very much.  B: You\'re welcome.', th: 'มารยาทการตอบ' },
    ],
    tip: 'กับดัก: ตัวเลือกที่หัวข้อถูกแต่ "อารมณ์/มารยาทผิด" เช่น เพื่อนเศร้าแต่ตอบร่าเริง',
  },
  {
    id: 'c_reverse', category: 'conversation', title: 'Reverse Questions', titleTh: 'หาคำถามจากคำตอบ', cefr: 'B1',
    summary: 'ข้อสอบใหม่ (2567+) ให้ "คำตอบ" มา แล้วเลือก "คำถาม" ที่ถูกต้อง',
    points: [
      'ดูหน่วยของคำตอบก่อน แล้วย้อนหาคำถาม',
      'ตอบเป็นเวลา → คำถามขึ้นด้วย What time / When',
      'ตอบ Yes/No → คำถามขึ้นด้วยกริยาช่วย (Do/Does/Are/Can)',
    ],
    examples: [
      { en: 'Q: ______?  A: It takes 20 minutes.  → How long does it take?', th: 'คำตอบเป็นระยะเวลา' },
      { en: 'Q: ______?  A: Yes, I do.  → Do you like it?', th: 'คำตอบ Yes/No → กริยาช่วย' },
    ],
    tip: 'อ่านคำตอบให้ขาด แล้วตัดคำถามที่จะได้คำตอบ "คนละแบบ" ออก',
  },
  // ---------- STRATEGY (question_type_catalog + answer_logic + distractor) ----------
  {
    id: 's_reading', category: 'strategy', title: 'Reading Passages', titleTh: 'กลยุทธ์อ่านเรื่อง', cefr: 'A2',
    summary: 'ข้อสอบอ่านมักต้อง "รวม 2 เบาะแส" (เช่น การกระทำ + เวลา) ไม่ใช่หาคำตรงๆ',
    points: [
      'อ่านคำถามก่อน แล้วค่อยกวาดหาข้อมูลในเรื่อง',
      'main idea = ใจความหลัก, detail = รายละเอียด, inference = อนุมานจากที่บอกเป็นนัย',
      'ระวังข้อ NOT mentioned / NOT true — ต้องเช็คทีละตัวเลือก',
    ],
    examples: [
      { en: 'Nina saved money because she wanted a dictionary. → Why did she save? To buy a dictionary.', th: 'เหตุผลต้องตรงกับที่ระบุจริง' },
    ],
    tip: 'ตัวลวงยอดฮิต: รายละเอียดที่ "มีในเรื่องแต่คนละจุด" (ผิดตัวละคร/สถานที่/จำนวน)',
  },
  {
    id: 's_data', category: 'strategy', title: 'Charts, Tables & Maps', titleTh: 'อ่านกราฟ–ตาราง–แผนที่', cefr: 'B1',
    summary: 'ต้องเทียบข้อมูล ≥2 จุด และคุมทิศเปรียบเทียบให้ถูก (มาก/น้อย เร็ว/ช้า)',
    points: [
      'อ่านหัวตาราง/แกนกราฟก่อนเสมอ',
      'ขั้นสุด (most/least, fastest/slowest) ต้องกวาดดูทุกค่า',
      'แผนที่: ทำตามคำสั่งทีละก้าว นับทางเลี้ยว',
    ],
    examples: [
      { en: 'If A > B and B > C, then A is the biggest.', th: 'เชนเปรียบเทียบ (transitive)' },
    ],
    tip: 'ตัวลวง: สลับทิศ (มาก↔น้อย) หรือทำเชนเปรียบเทียบพังไป 1 จุด',
  },
]

export const STUDY_CATEGORIES: { id: StudyCategory | 'all'; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'grammar', label: 'Grammar' },
  { id: 'vocabulary', label: 'Vocabulary' },
  { id: 'reading', label: 'Reading' },
  { id: 'conversation', label: 'Conversation' },
  { id: 'strategy', label: 'Strategy' },
]
