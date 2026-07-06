# Spotter Claude Code Kit — how this is organized and why

**Problem this solves:** CLAUDE.md is auto-loaded into EVERY Claude Code session.
A monolithic spec there burns ~15k tokens per session before any work happens.
This kit uses progressive disclosure: a ~55-line CLAUDE.md that is always loaded,
plus topic files Claude Code reads only when a task needs them.

## Layout
- CLAUDE.md            — always loaded. Rules + commands + current-sprint pointer. KEEP UNDER ~80 LINES.
- docs/00-index.md     — map of all topic files
- docs/01..08          — the spec, split by topic (product, architecture, data model x2, API, auth, screens, risks)
- docs/09..12          — engineering rules, condensed (security, testing, decisions, ops)
- docs/BACKLOG.md      — scope-creep parking lot
- sprints/sprint-N.md  — entry point per sprint: goal, deliverables, MINIMAL reading list, verify steps

## Usage per sprint
1. Edit the "Current sprint" line in CLAUDE.md.
2. Open Claude Code: "Read sprints/sprint-N.md and ONLY the files it lists.
   Propose a task plan in dependency order. Plan only."
3. Approve → implement ONE task at a time → it runs verify → you review
   (personally read every migration / security definer diff).
4. /clear between unrelated tasks. Keep sessions single-purpose.

## Token habits that matter most
- Reference paths, don't paste content into prompts.
- One task per session where possible; /clear or /compact when context grows.
- When Claude Code wants broad context, point it at docs/00-index.md, not the folder.
- CLAUDE.md is a rules file, not a knowledge base — resist letting it grow.

Full-detail originals (spotter-spec.md, spotter-engineering-review.md) stay
OUTSIDE the repo or in docs/archive/ — they're for humans; the split files are for the agent.
