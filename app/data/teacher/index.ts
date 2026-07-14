// ================================================================================================
// Teacher domain barrel (Phase 16) — progress reports + gradebook export.
//
// Reads ONLY learning data (mastery + subskill taxonomy). No questions/answer keys, no player save /
// personal data. Gated by TEACHER_ENABLED. Pure + tested (test/teacher.spec.ts).
// ================================================================================================
export * from './reports'
export * from './export'
