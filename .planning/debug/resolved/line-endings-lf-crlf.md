---
slug: line-endings-lf-crlf
status: resolved
trigger: "my project has problems with whitespaces and LFs. Check the files and git etc. and fix that problem completely"
created: 2026-06-14
updated: 2026-06-14
---

# Debug: whitespace & LF/CRLF line endings

## Symptoms
- Git emitted `warning: ... LF will be replaced by CRLF the next time Git touches it` on diff/add.
- Inconsistent line endings; perceived "whitespace" noise.

## Root Cause
Local repo had `core.autocrlf=true` (Windows) with **no `.gitattributes`** to make
line-ending handling deterministic.
- Index (history): all 263 text files stored as **LF**.
- Working tree: **mixed** — 22 source files (`.svelte`/`.ts`) were **CRLF**, 241 were LF.
- `autocrlf=true` perpetually wanted LF→CRLF on checkout → constant churn + warnings.
- 357 binary files (351 `.mp3`, 5 `.png`, 1 `.ico`) correctly auto-detected as binary.

## Evidence
- `git diff --stat` == `git diff --ignore-cr-at-eol --stat` → the 10 uncommitted
  modifications are REAL content changes, NOT line-ending noise (preserved untouched).
- `git ls-files --eol`: 22× `i/lf w/crlf`, 241× `i/lf w/lf` before fix.
- Trailing whitespace existed only in `.planning/*.md` (intentional Markdown `<br>`),
  not in source — left as-is.

## Fix (policy chosen: LF everywhere)
1. Added `.gitattributes`: `* text=auto eol=lf` + `*.mp3 *.png *.ico binary`.
2. `git config core.autocrlf false` (local) so it no longer fights `.gitattributes`.
3. Normalized the 22 stray CRLF working-tree files to LF in place (content preserved).
4. `git add --renormalize .` (index already LF — no content change), then unstaged
   the user's 10 in-progress edits so they remain under the user's control.

Committed as `a7b46ac` (`.gitattributes` only).

## Verification
- `git ls-files --eol`: 263× `i/lf w/lf`, 0× `w/crlf`.
- `git diff` → no "LF will be replaced by CRLF" warnings.
- `git check-attr` → source files `text=auto eol=lf`; `.mp3` `binary` set.
- `git diff --check` on working changes → clean.
- User's 10 real edits intact (414 insertions / 211 deletions, unchanged).

## files_changed
- `.gitattributes` (new)
- local git config `core.autocrlf=false`
- 22 working-tree source files normalized CRLF→LF (no content change)
