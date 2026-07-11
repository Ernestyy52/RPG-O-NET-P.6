# O-NET Exam Knowledge Base — Rules

This folder is the **only** source used to generate new O-NET Grade 6 English
questions for the game (`data/questions.json`). It contains extracted
**patterns only** — never the original exam questions themselves.

## Rules (do not break these)

1. **Analyze all exams in `knowledge/`.** When asked to update the knowledge
   base, read every file already here (`manifest.json`, `analyzed/*.json`,
   `knowledge_base.json`) before touching anything else.
2. **Extract only reusable exam patterns** — skills tested, grammar points,
   vocabulary topics, question types, reading/dialogue patterns, distractor
   patterns, difficulty distribution, answer logic, topic frequency. Never
   copy a question's exact wording, exact choices, or exact passage text into
   this folder.
3. **Update `knowledge/` in place** — `analyzed/<year_be>.json` per exam year,
   merged into the aggregate `knowledge_base.json`, with `manifest.json`
   tracking which source files have been processed (status/mtime/size).
4. **Never store original questions.** Nothing under `knowledge/` may contain
   verbatim exam text. If a new source PDF needs analyzing, extract patterns
   directly into `analyzed/<year>.json` and discard any raw transcription —
   do not add a "sources/" dump of raw exam text to this repo.
5. **Incremental updates.** When a new exam is added to the original source
   directory (`D:\ข้อสอบ O-net`, outside this repo), only re-analyze files
   whose `mtime`/`size` in `manifest.json` don't match the current file —
   skip everything already marked `"status": "analyzed"` and unchanged.
6. **Never read `D:\ข้อสอบ O-net` unless `knowledge/` is missing or a
   `manifest.json` entry is stale/absent for a file that exists there.**
   All day-to-day question generation must use only what's in this folder.

## Generating new questions

Command: **"Generate N new O-NET Grade 6 English questions using only
knowledge/."**

When this command is run:
- Read `knowledge/knowledge_base.json` (aggregate patterns/frequencies) and
  the relevant `knowledge/analyzed/<year>.json` files for detail.
- Write brand-new questions: new names/places/numbers/contexts/wording,
  matching authentic O-NET style, difficulty, and topic/skill distribution
  from the knowledge base. Never reproduce or lightly paraphrase a real exam
  item.
- Never duplicate a question already present in `data/questions.json` — check
  existing prompts before adding new ones.
- Output must match the schema documented in `data/README.md` /
  `app/data/questions.ts`.
- Return valid JSON only for the generated batch (no extra prose in that
  response).

## Files

- `manifest.json` — tracks which source exam files have been analyzed
  (year, status, mtime, size, extraction method). No exam text.
- `analyzed/<year_be>.json` — one file per exam year with extracted patterns
  only (skills, grammar, vocabulary topics, question types, reading/dialogue
  patterns, distractor patterns, difficulty distribution, answer logic).
- `knowledge_base.json` — the merged/aggregated view across all analyzed
  years, used as the primary input for question generation.
