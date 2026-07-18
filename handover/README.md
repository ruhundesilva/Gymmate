# Handover notes

One file per work session, named `YYYY-MM-DD.md` (append `-2`, `-3`, ... if
there's more than one session in a day). The most recent file by date is the
current state of the world — start there.

**Starting a session:** give Claude the most recent file in this folder
before asking for anything else. It should read it before touching code.

**Ending a session:** when the user signals they're done for now ("I'm done
for today", "let's wrap up", etc.), or when asked directly, write a new
dated file here covering:
- What changed this session (brief, link to commits — don't repeat full diffs)
- Current state: what's confirmed working, what's untested, what's known-broken
- Outstanding action items, especially anything blocked on the user (dashboard
  config, external accounts, decisions)
- Anything that was true at the time but might drift (test account states,
  temporary config) — flag it as temporary so it doesn't get treated as fact
  in a future session

Keep it tight — a status report, not a transcript. Full detail lives in git
history and commit messages; this file is the "what do I need to know before
I start" summary.
