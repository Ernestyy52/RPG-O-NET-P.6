// ตรวจสอบ data/questions.json ก่อนใช้งานจริง: schema ถูกต้อง + ไม่มี id/คำถามซ้ำ
// รัน: node scripts/validate-questions.cjs
const fs = require('fs')
const path = require('path')

const FILE = path.join(__dirname, '..', 'data', 'questions.json')
const CATEGORIES = new Set(['vocabulary', 'grammar', 'reading', 'conversation'])
const CEFR = new Set(['Pre-A1', 'A1', 'A2', 'B1'])

function normalize(text) {
  return text.toLowerCase().replace(/\s+/g, ' ').trim()
}

function main() {
  if (!fs.existsSync(FILE)) {
    console.error(`Missing ${FILE}`)
    process.exit(1)
  }
  const questions = JSON.parse(fs.readFileSync(FILE, 'utf8'))
  if (!Array.isArray(questions)) {
    console.error('data/questions.json must be a JSON array')
    process.exit(1)
  }

  const errors = []
  const seenIds = new Set()
  const seenPrompts = new Set()

  questions.forEach((q, i) => {
    const tag = `#${i} (${q.id ?? 'no-id'})`
    if (!q.id || typeof q.id !== 'string') errors.push(`${tag}: missing/invalid id`)
    else if (seenIds.has(q.id)) errors.push(`${tag}: duplicate id "${q.id}"`)
    else seenIds.add(q.id)

    if (!CATEGORIES.has(q.category)) errors.push(`${tag}: invalid category "${q.category}"`)
    if (!CEFR.has(q.cefr)) errors.push(`${tag}: invalid cefr "${q.cefr}"`)
    if (!Number.isInteger(q.difficulty) || q.difficulty < 1 || q.difficulty > 5) errors.push(`${tag}: difficulty must be an integer 1-5`)
    if (!q.prompt || typeof q.prompt !== 'string') errors.push(`${tag}: missing/invalid prompt`)
    if (!Array.isArray(q.choices) || q.choices.length !== 4) errors.push(`${tag}: choices must be an array of exactly 4 strings`)
    if (!Number.isInteger(q.answerIndex) || q.answerIndex < 0 || q.answerIndex > 3) errors.push(`${tag}: answerIndex must be an integer 0-3`)

    if (q.prompt) {
      const norm = normalize(q.prompt)
      if (seenPrompts.has(norm)) errors.push(`${tag}: duplicate/near-duplicate prompt text`)
      else seenPrompts.add(norm)
    }
  })

  console.log(`Checked ${questions.length} questions.`)
  if (errors.length) {
    console.error(`\n${errors.length} problem(s) found:`)
    errors.forEach((e) => console.error(` - ${e}`))
    process.exit(1)
  }
  console.log('All good — no schema errors, no duplicate ids/prompts.')
}

main()
