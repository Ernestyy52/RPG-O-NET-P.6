// ================================================================================================
// Teacher export (Phase 16)
//
// Serializes teacher reports to CSV/JSON for a gradebook. By construction it can only emit report data
// (aggregate learning metrics + subskill names) — there is NO path from here to a question's answer key
// or a player's save/personal data, because the reports themselves never carry them (see reports.ts).
// ================================================================================================
import type { LearnerReport, ClassReport } from './reports'

function csvCell(v: string | number): string {
  const s = String(v)
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

/** One learner → a CSV: a summary row + a per-domain row each. Header-first, RFC-4180-ish quoting. */
export function learnerReportToCsv(r: LearnerReport): string {
  const lines: string[] = []
  lines.push(['label', 'metric', 'domain', 'attempts', 'correct', 'accuracy'].join(','))
  lines.push([csvCell(r.label), 'overall', '', r.totalAnswered, r.totalCorrect, r.accuracy].join(','))
  for (const d of r.byDomain) {
    lines.push([csvCell(r.label), 'domain', csvCell(d.domain), d.attempts, d.correct, d.accuracy].join(','))
  }
  return lines.join('\n')
}

/** A class → a CSV: one row per learner (label, answered, correct, accuracy, coverage, due). */
export function classRosterToCsv(reports: LearnerReport[]): string {
  const lines: string[] = []
  lines.push(['label', 'answered', 'correct', 'accuracy', 'coverage', 'dueForReview'].join(','))
  for (const r of reports) {
    lines.push([csvCell(r.label), r.totalAnswered, r.totalCorrect, r.accuracy, r.coverage, r.dueForReview].join(','))
  }
  return lines.join('\n')
}

/** Whole class report as pretty JSON (aggregate only — no answer keys, no personal save data). */
export function classReportToJson(report: ClassReport): string {
  return JSON.stringify(report, null, 2)
}
