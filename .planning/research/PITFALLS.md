# Pitfalls Research

**Domain:** Touch-based X01 darts scoring PWA (offline-first, GitHub Pages, multi-window spectator display)
**Researched:** 2026-06-10
**Confidence:** HIGH (X01 rules, PWA/storage/Wake Lock, BroadcastChannel verified against current MDN/WebKit/community sources; darts UX from reference apps DartCounter/Scory/ScoreApp)

> Scope note: This project has no backend, no server, no cross-device sync, and no user accounts (all data is on-device). Classic "Security Mistakes" and "Performance Traps at scale" are largely N/A; the real risk surface is **rule correctness, touch input accuracy, local data durability, PWA update/offline behavior, and spectator readability.** Pitfalls below are weighted accordingly.

## Critical Pitfalls

### Pitfall 1: Bust handling implemented as "score < 0" only

**What goes wrong:**
The engine treats a turn as a bust only when the remaining score goes below zero. But in Double-Out X01 there are **three** distinct bust conditions: (a) score would go below 0, (b) score lands on exactly 1 (cannot finish — lowest double is D1 = 2), and (c) score reaches exactly 0 but the **final dart was not a double / bull**. Missing (b) and (c) lets players "win" or continue on impossible positions.

**Why it happens:**
Developers model X01 as simple subtraction. The double-out constraint is a separate rule layer that's easy to forget, and the "left on 1" case is non-obvious unless you know darts.

**How to avoid:**
Model a turn as: evaluate after **each dart**. Bust if `newRemaining < 0` OR (`newRemaining == 1` AND double-out) OR (`newRemaining == 0` AND last dart was not a double/bull AND double-out). On bust, **revert the entire visit** to the score at the start of the turn (not just the last dart) and end the turn. Single-Out mode drops conditions (b) and (c). Write a pure rules module with a truth table of these cases before any UI exists.

**Warning signs:**
A test throw of S20 S20 from 40 in double-out "wins"; a player on 50 (bull) is flagged bust; leaving 1 is allowed without bust; reverting a bust only undoes the last dart instead of the whole turn.

**Phase to address:**
Game-engine phase (first — before UI). This is the correctness core of the whole app.

---

### Pitfall 2: Turn reversion on bust restores the wrong state

**What goes wrong:**
On bust the score is restored, but darts thrown this visit are mis-counted, the active-player pointer or leg/set state is corrupted, or a personal-record/achievement fires on the busted throw. The leg average then drifts because the busted darts aren't counted correctly.

**Why it happens:**
Mutable game state. The code subtracts as darts are entered, then tries to "add back" on bust — and the add-back is off by one or forgets a side effect (stats, achievements, checkout suggestion).

**How to avoid:**
Use **immutable turn snapshots**: capture full state at the start of each visit; on bust, replace current state with the snapshot rather than computing a reversal. Compute averages/achievements only on **committed** (non-busted) turns. Crucially, per PDC convention a **busted visit still counts as 3 darts thrown** for average purposes (see Pitfall 3) — so reverting the score must NOT also un-count the darts.

**Warning signs:**
Average changes after a bust in a way that doesn't match hand calculation; "highest checkout" achievement triggers on a busted finish; undoing a bust leaves stale checkout suggestion on screen.

**Phase to address:**
Game-engine phase (same module as Pitfall 1), with stats wired in the statistics phase.

---

### Pitfall 3: 3-dart average computed with the wrong dart count

**What goes wrong:**
Average is computed as `points / turns * 3` (assuming 3 darts every turn) instead of `points / actual_darts_thrown * 3`. This is wrong specifically on **checkout legs** (winner uses 1–2 darts) and produces an average that's too low — the most visible stat in the app, shown live on the spectator display, is subtly incorrect.

**Why it happens:**
"3-dart average" sounds like "average per turn," so devs divide by turns. The PDC definition is **points scored ÷ darts actually thrown × 3**.

**How to avoid:**
Track darts thrown explicitly. On a successful checkout, count only the darts used to finish (1, 2, or 3). On a **bust**, count the full 3 darts even if fewer were physically thrown (standard convention). On a normal scoring turn, count 3. Validate against worked examples: 501 in 15 darts ⇒ 100.2 avg; a 9-darter ⇒ 167.0 (theoretical max). Separate "leg average" (this leg) from "match average" (cumulative across all legs).

**Warning signs:**
Theoretical max average comes out as 180 instead of 167; a leg won on the first dart of the final visit shows the same average as one won on the third dart; averages drop after a bust by more than expected.

**Phase to address:**
Statistics phase, but the dart-counting must be emitted by the game-engine phase from day one.

---

### Pitfall 4: Checkout suggestions that recommend impossible or bogey finishes

**What goes wrong:**
The checkout helper suggests a finish for a **bogey number** (no 3-dart out exists) or proposes a route that isn't actually a valid double-out, or shows a checkout for scores > 170. The 7 bogey numbers are exactly **169, 168, 166, 165, 163, 162, 159** (note: 156 and 157 are NOT bogey — they have valid outs). Showing "no checkout" for 156/157, or a fake route for 162, erodes trust instantly with darts players.

**Why it happens:**
Hand-rolled checkout logic with an incomplete or copied-wrong table; failing to special-case bogey numbers and the >170 range; not enforcing that the last dart of every suggested route is a double or bull.

**How to avoid:**
Use a **verified checkout table** (e.g. darts501-style) as data, not generated logic, OR generate routes algorithmically and validate every route ends on a double/bull. Explicitly handle: score > 170 ⇒ no suggestion; the 7 bogey numbers ⇒ show "kein Finish" (no checkout); odd scores ⇒ suggest setting up an even number. Respect Double-Out vs Single-Out mode (Single-Out has different valid finishes). Unit-test the full table 2–170 against a trusted reference.

**Warning signs:**
App suggests a finish for 162; app says 156 has no checkout; a suggested route's last dart is a single; bull (50) not offered as a finish; suggestions appear above 170.

**Phase to address:**
Checkout-suggestion phase (after engine). Flag as needing dedicated verification — small but error-prone.

---

### Pitfall 5: Service worker serves a stale app version forever (cache invalidation)

**What goes wrong:**
A bad service worker caches `index.html` / JS with a fixed cache name and `cache-first` strategy. After deploying a fix to GitHub Pages, devices keep running the **old version indefinitely** — including old, buggy rules logic. Users have no way to force an update short of clearing site data, which on a PWA is hard for non-technical home users.

**Why it happens:**
SW caching is "set and forget." GitHub Pages also serves assets with caching headers, compounding staleness. Devs don't bump the cache version or don't handle the SW update lifecycle (`skipWaiting`/`clients.claim`).

**How to avoid:**
Use a **build-time content hash or version string** in the cache name so each deploy invalidates the old cache. Implement the update flow: detect a waiting worker, prompt the user ("Neue Version verfügbar – neu laden?"), then `skipWaiting` + reload. Use `network-first` (or stale-while-revalidate) for the HTML/app shell so a live device can pick up updates; cache-first only for hashed static assets. Prefer a generator (Workbox / vite-plugin-pwa) over hand-written SW to get this right.

**Warning signs:**
A deployed fix doesn't appear on the tablet after reload; cache name is a hardcoded constant never changed; no "update available" UI; DevTools shows a stuck "waiting" service worker.

**Phase to address:**
PWA / deployment phase. Build the update-prompt flow in the same phase that introduces the service worker — retrofitting it later is painful.

---

### Pitfall 6: PWA paths broken by the GitHub Pages subpath

**What goes wrong:**
On GitHub Pages a project site lives at `https://user.github.io/neverman-darts-app/`, not root. If `start_url`, `scope`, the SW registration path, manifest link, and asset URLs assume `/`, you get: "Site cannot be installed: no matching service worker," 404s for assets, the install prompt never appears, and offline mode fails. SPA deep-link navigation also 404s because GH Pages has no server-side fallback.

**Why it happens:**
Local dev runs at root (`localhost:5173/`), so root-relative paths "work" in dev and silently break only on the GH Pages subpath.

**How to avoid:**
Set the build base path to `/neverman-darts-app/` (e.g. Vite `base`). Ensure `manifest.start_url` and `scope` both point at the subpath, register the SW with explicit `{ scope: '/neverman-darts-app/' }`, and prefix all precached URLs. For SPA routing, either use hash routing or add the `404.html` redirect trick. Consider a custom domain or a user/organization site to sidestep the subpath entirely if it proves fragile.

**Warning signs:**
Works on `localhost` but install prompt missing on GH Pages; Lighthouse PWA audit fails "start_url not in scope"; assets 404 only in production; refresh on a deep route shows GitHub's 404 page.

**Phase to address:**
PWA / deployment phase. Test on the **actual GH Pages URL on a real tablet** as the phase exit criterion — not just localhost.

---

### Pitfall 7: Local data lost to storage eviction (no persistence request, no backup)

**What goes wrong:**
Player profiles, match history, and long-term stats live in IndexedDB as "best-effort" storage. Browsers evict best-effort data under storage pressure (Chromium/Firefox, LRU origin) and there is no export — so a family's months of records vanish silently and unrecoverably. (Safari additionally wipes after 7 days of non-interaction, though installed PWAs are exempt; the primary target here is Android Chrome / Windows.)

**Why it happens:**
IndexedDB "feels" permanent. `navigator.storage.persist()` is rarely called, and an export/backup feature is seen as polish, not core.

**How to avoid:**
Call `navigator.storage.persist()` early (ideally after the user has shown intent, e.g. created a profile) and surface the result. Use `navigator.storage.estimate()` to monitor usage. Ship a **JSON export/import (backup/restore) feature** as part of the persistence MVP — this is the real safety net and also covers device migration, which the on-device-only design otherwise can't. Treat it as a table-stakes feature, not a stretch goal.

**Warning signs:**
`persist()` never called; no export button anywhere; stats stored only in IndexedDB with no second copy; testing never simulates eviction (DevTools → clear storage) to confirm graceful behavior.

**Phase to address:**
Persistence / statistics phase. Export/import should ship in the same phase that introduces IndexedDB.

---

### Pitfall 8: No IndexedDB schema versioning / migration strategy

**What goes wrong:**
The DB schema changes between app versions (new stat field, restructured match record), but there's no `onupgradeneeded` migration. Returning users' apps throw on open, or silently fail to read old records, losing history accumulated under the prior schema.

**Why it happens:**
First version "just works"; migrations are deferred until the first schema change, by which point real user data already exists in the wild.

**How to avoid:**
Establish a versioned schema from version 1 with a real `onupgradeneeded` handler (or a wrapper like Dexie that formalizes migrations). Never mutate the meaning of an existing field — add new versions. Store an app/schema version in the data so import/export and migrations can reason about it. Test upgrading from a populated old DB to the new schema before each release.

**Warning signs:**
DB opened without a version number or with version hardcoded to 1 across releases; no migration code exists after the first schema change; old test data can't be read by the new build.

**Phase to address:**
Persistence phase (design the schema/versioning up front); revisit at every later phase that adds stored data.

---

### Pitfall 9: Touch targets too small near the bull / triple-double rings

**What goes wrong:**
A geometrically accurate dartboard renders the bull and the thin triple/double rings as tiny slivers. On a tablet a finger (~7–10 mm contact) cannot reliably hit T20 or D-Bull without mis-taps, making fast, accurate scoring impossible — the entire core value of the app.

**Why it happens:**
Designers replicate the real board's proportions for authenticity. Real boards are hit with a 6 mm dart point; fingers are an order of magnitude larger.

**How to avoid:**
Do **not** require the user to hit a proportional ring. Use one of: (a) a numbers-grid input (tap 20, then a Single/Double/Triple modifier), or (b) a dartboard whose **hit zones are enlarged** beyond the visual ring (generous invisible touch areas, ≥ ~9–10 mm / ~44 px min target), or (c) tap the segment then choose S/D/T. Keep the bull as its own large dedicated button. Prototype input on the actual tablet early and measure mis-tap rate.

**Warning signs:**
Triples/doubles entered by tapping a thin ring; testing only with a mouse on desktop; users repeatedly correcting entries; no separate large bull control.

**Phase to address:**
Input phase. Make "reliably hittable T/D on a real tablet" an explicit, tested exit criterion (PROJECT.md calls this out directly).

---

### Pitfall 10: No undo / correction flow for mis-entered throws

**What goes wrong:**
A player fat-fingers T5 instead of T20, or the wrong player's score is entered, and there's no way to undo. The match state is now wrong with no recovery, forcing a restart — fatal for trust during a real game.

**Why it happens:**
Happy-path development. Undo is treated as a later nicety, but mis-taps are guaranteed on touch.

**How to avoid:**
Design **undo as a first-class engine operation** from the start: an immutable per-dart history that can pop the last dart or last visit, correctly restoring score, dart count, active player, and leg/set state (reuse the snapshot model from Pitfall 2). Provide a visible, large Undo control. Consider per-dart confirmation or a "current visit shows the 3 entered darts before committing" pattern so corrections happen before the turn commits.

**Warning signs:**
Engine has no history stack; undo only removes a dart's points but not its effect on player/leg state; no UI affordance to fix the previous turn; redo not considered.

**Phase to address:**
Game-engine phase (history/undo primitive), surfaced in the input phase.

---

### Pitfall 11: BroadcastChannel race — spectator window misses the initial/early state

**What goes wrong:**
The main window opens the spectator window with `window.open()` and immediately `postMessage`s the game state over a BroadcastChannel. The spectator window hasn't loaded its script and subscribed yet, so it **misses the message** (BroadcastChannel does not buffer). The spectator shows a blank or default board. Same failure on spectator refresh: it loses all state because nothing re-sends.

**Why it happens:**
BroadcastChannel delivers only to currently-subscribed contexts and never replays. Devs assume "post once" works like a shared store.

**How to avoid:**
Use a **handshake/ready pattern**: the spectator window, once subscribed, posts a `ready` (or `request-state`) message; the main window replies with a full state snapshot. Also have the main window respond to a `request-state` at any time so a **refresh re-syncs**. Persist the latest state to a shared store (`localStorage` or IndexedDB) as a fallback so a freshly opened/refreshed spectator can hydrate immediately, then stay live via BroadcastChannel. Use a singleton channel per window (a sender doesn't receive its own messages).

**Warning signs:**
Spectator blank until the next score change; refreshing the spectator window loses the game; relies solely on a single post at open time; one channel instance used for both send and receive causing echo bugs.

**Phase to address:**
Spectator-display phase. Build the request-state/snapshot handshake as the core sync primitive, not an afterthought.

---

### Pitfall 12: Spectator window blocked or unrecoverable (popup blockers / closed window)

**What goes wrong:**
`window.open()` is called outside a user gesture (e.g. on load or after async work) and the browser **blocks it as a popup**, so the second monitor stays empty with no clear error. Or the user closes the spectator window and there's no way to reopen and re-sync it.

**Why it happens:**
Popup blockers only allow windows opened synchronously within a click handler. Async flows (awaiting state, timers) break the gesture chain.

**How to avoid:**
Open the spectator window **directly inside a click handler** ("Zuschauer-Anzeige öffnen" button), never after an `await` or in a `setTimeout`. Detect a `null` return from `window.open()` and show guidance to allow popups. Keep a reference and allow reopening; on reopen, run the same request-state handshake (Pitfall 11). On tablets, where movable windows don't exist, use the in-app fullscreen spectator view instead (already the project decision).

**Warning signs:**
Spectator opens from a non-click code path; no null-check on `window.open()` result; no reopen button; assuming desktop multi-window behavior on Android.

**Phase to address:**
Spectator-display phase.

---

### Pitfall 13: Screen sleeps mid-game (no / mishandled Wake Lock)

**What goes wrong:**
During a leg the tablet or the spectator monitor dims and locks because no Screen Wake Lock is held — extremely disruptive mid-match. Or a wake lock is acquired once but **silently lost** when the user switches apps/tabs and returns (the lock auto-releases on `visibilityState: hidden` and is not automatically restored).

**Why it happens:**
Wake Lock is easy to acquire once and forget. The auto-release-on-hidden behavior is non-obvious, so the lock dies after the first tab-away.

**How to avoid:**
Acquire `navigator.wakeLock.request('screen')` when a match is active; **re-acquire it in a `visibilitychange` handler** whenever the document becomes visible again. Feature-detect (`'wakeLock' in navigator`) and wrap in try/catch (the OS may refuse on low battery). Note support is Chrome/Edge/Android and Safari 16.4+ (installed-PWA bug fixed in iOS 18.4) — for the Android/Windows target this is well supported; ship a NoSleep.js-style fallback only if older devices matter. Release the lock when the match ends to save battery.

**Warning signs:**
Screen dims during play; wake lock requested once at startup and never re-acquired; no visibilitychange handler; no feature detection (throws on unsupported/HTTP).

**Phase to address:**
Input/UI phase (tablet) and spectator-display phase (the display monitor must also stay awake). Requires HTTPS — works on GitHub Pages.

---

### Pitfall 14: Spectator display crammed and unreadable at 3 m

**What goes wrong:**
The spectator view reuses the scoring UI density: small fonts, full stat tables, low contrast. From 3 m on a 27" monitor the current score and remaining points — the only things spectators actually need — are illegible, defeating the display's purpose.

**Why it happens:**
The spectator view is built by reusing the operator screen. "More info" feels generous but kills readability at distance.

**How to avoid:**
Design the spectator view **distance-first**: huge typography for remaining score per player, clear current-player highlight, legs/sets and averages secondary and smaller. Use high-contrast dark-mode palette (project requirement). Lay out for the actual player counts (1–4): test each of 1, 2, 3, 4-player layouts so 4 players don't shrink everything to the 2-player font size. Validate by literally viewing on a 27" monitor from ~3 m (project's stated acceptance bar).

**Warning signs:**
Spectator view is the operator view scaled down; fixed font sizes that don't adapt to player count; only tested on a laptop at arm's length; everything the same visual weight.

**Phase to address:**
Spectator-display phase. Make "legible on 27" at 3 m for 1–4 players" the explicit exit criterion.

---

### Pitfall 15: Accidental double-tap / unconfirmed throw entry

**What goes wrong:**
A single intended tap registers twice (double-tap), or a throw commits instantly with no chance to see/confirm it, so wrong scores enter the match faster than the operator can react — especially during fast scoring.

**Why it happens:**
Touch handlers fire on every `touchstart`/`click`; mobile "double-tap to zoom" and event duplication (touch + synthesized click) cause double registration. No debouncing, no visible "current visit" buffer.

**How to avoid:**
Debounce/guard rapid duplicate taps; use a single pointer-event model (`pointerdown`) and `touch-action: manipulation` / disable double-tap zoom. Show the **three darts of the current visit as a pending buffer** that the operator can see and correct before the turn commits, then a deliberate confirm (or auto-commit after the 3rd dart with easy undo per Pitfall 10). Provide immediate visual+optional audio feedback per registered dart.

**Warning signs:**
Same dart registers twice on quick taps; no visible pending-visit area; double-tap zooms the board; no debounce; operator can't tell what was just entered.

**Phase to address:**
Input phase (alongside touch-target sizing and undo).

---

## Technical Debt Patterns

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Hardcoded SW cache name (no versioning) | SW "works" in dev fast | Users stuck on stale buggy builds forever; hard to recover on PWAs | **Never** — version from the first SW commit |
| Score logic mixed into UI components | Fewer files early | Rules unverifiable; bust/avg bugs hide in render code; can't unit-test | **Never** — pure engine module from day 1 |
| IndexedDB with fixed version 1, no migration handler | Ships persistence sooner | First schema change breaks/loses existing user data | Only pre-first-real-data (internal testing); add migrations before any external use |
| No export/backup (IndexedDB only) | Skips a feature | Eviction or device loss = total data loss, unrecoverable | Only the very first throwaway prototype; ship export with the stats MVP |
| Proportional dartboard hit zones | Looks authentic | Unusable T/D entry on touch; core value fails | **Never** for the primary input; OK as a *visual* with enlarged hit areas |
| Single `postMessage` at spectator open (no handshake) | Less sync code | Spectator blanks on race/refresh | **Never** — handshake + snapshot is the minimum correct design |
| Root-relative paths (`/...`) | Works on localhost | Breaks entirely on GH Pages subpath | Only if deploying to a root/custom-domain site |

## Integration Gotchas

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| Service Worker (offline) | `cache-first` on HTML with fixed cache name | Hashed assets cache-first; app shell network-first/SWR; versioned cache + update prompt (Workbox/vite-plugin-pwa) |
| GitHub Pages (subpath host) | `start_url`/`scope`/SW path assume `/` | Set build base to `/neverman-darts-app/`; align manifest scope, SW scope, asset prefixes; test on real GH Pages URL |
| BroadcastChannel (cross-window) | Post once at open; assume buffering | Ready/request-state handshake + full snapshot; respond to request-state anytime; localStorage/IDB fallback for hydrate |
| `window.open()` (spectator) | Called after `await`/timer → popup-blocked | Open synchronously in a click handler; null-check result; reopen support |
| Screen Wake Lock | Acquire once; ignore auto-release | Re-acquire on `visibilitychange` visible; feature-detect; try/catch; release on match end |
| IndexedDB | Treat as permanent; no persist; no migrations | `navigator.storage.persist()`; versioned schema + `onupgradeneeded`; export/import backup |

## Performance Traps

*(Scale is tiny — one local device, ≤4 players, a household's match history. Classic scaling traps are N/A. Only local/render-side traps matter.)*

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| Re-rendering full SVG dartboard on every tap | Input lag / dropped taps on tablet | Static board markup; only update lightweight overlays/state; memoize | Low-end Android tablet during fast scoring |
| Recomputing all-time stats from full history on each open | Slow stats/profile load as history grows | Store rolling aggregates; compute incrementally on match commit | After hundreds of stored matches |
| Synchronous IndexedDB reads blocking UI | Janky transitions opening profiles | Async access, load off the render path, cache in memory for the session | Anytime history is non-trivial |
| Posting large state object on every dart over BroadcastChannel | Spectator update jank | Send minimal diffs for routine updates; full snapshot only on handshake | Rarely at this scale, but cheap to avoid |

## Security Mistakes

*(No backend, no accounts, no network sync, no PII beyond local player nicknames — the standard web-security surface is minimal. Only these domain-relevant items apply.)*

| Mistake | Risk | Prevention |
|---------|------|------------|
| Serving over HTTP / `file://` | Service worker + Wake Lock + install all silently fail (require secure context) | Rely on GitHub Pages HTTPS; never test core PWA features on `file://` |
| Trusting import file without validation | Malformed/hostile JSON import corrupts the local DB | Validate schema + version on import; back up current data before overwrite |
| Storing player names without any thought to local exposure | Minor — shared family device shows all profiles | Acceptable for home use; just avoid storing anything sensitive (it's a darts scorer) |

## UX Pitfalls

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| Thin proportional T/D/bull touch targets | Constant mis-taps; scoring slower than paper | Enlarged hit zones / numeric+modifier entry; dedicated large bull button |
| No undo for a mis-entered throw | One fat-finger ruins the match; restart needed | First-class per-dart/visit undo restoring full state |
| Instant commit with no pending-visit view | Operator can't catch errors before they land | Show the 3 darts of the current visit; confirm or easy-undo |
| Spectator view cluttered, small fonts | Unreadable from 3 m; display pointless | Distance-first: giant remaining score, current-player highlight; secondary stats smaller |
| Same spectator layout for 1 vs 4 players | 4-player view shrinks everything; 1-player wastes space | Responsive layouts per player count, tested at each of 1–4 |
| No "kein Finish" feedback on bogey numbers | Player distrusts the app on 162/169 etc. | Explicitly show no-checkout state for the 7 bogey numbers and >170 |
| Wrong/missing language or auto-translated terms | German darts users expect German + correct darts terms | German UI throughout; use correct German darts vocabulary (e.g. "Ausbullen", "Bust"/"Überworfen", "Finish") |
| Auto-pause interrupts mid-leg | Pause appears during an active turn | Trigger pause only at a leg boundary; countdown + manual continue (per project decision) |

## "Looks Done But Isn't" Checklist

- [ ] **Bust handling:** Often missing the `==1` and "finished on a non-double" cases — verify all three bust conditions and full-visit revert in double-out AND single-out.
- [ ] **3-dart average:** Often divides by turns not darts — verify checkout legs (1–2 darts) and busts (count as 3) produce textbook averages; max = 167, not 180.
- [ ] **Checkout table:** Often wrong on 156/157 (valid) vs 159/162/163/165/166/168/169 (bogey) — verify the full 2–170 table against a trusted reference and that every route ends on a double/bull.
- [ ] **PWA install:** Often works on localhost only — verify install + offline on the real GH Pages subpath URL on an actual Android tablet.
- [ ] **App updates:** Often serves stale version forever — verify a redeploy reaches an installed device via an update prompt, not just by clearing storage.
- [ ] **Data durability:** Often IndexedDB-only — verify `persist()` is requested and export/import round-trips real data; simulate eviction.
- [ ] **Schema migration:** Often untested — verify upgrading a populated old DB to a new schema keeps history.
- [ ] **Spectator sync:** Often blanks on refresh — verify the spectator window re-syncs full state after a refresh and after being reopened.
- [ ] **Wake lock:** Often dies after tab-away — verify the screen stays awake through an app-switch round trip on both the operator and spectator devices.
- [ ] **Undo:** Often only undoes points — verify undo restores active player, dart count, leg/set, and clears stale checkout suggestion.
- [ ] **Touch input:** Often mouse-tested only — verify reliable T20/D16/Bull entry by finger on the target tablet with a measured low mis-tap rate.

## Recovery Strategies

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| Stale SW serving old version | MEDIUM | Ship a new SW with a changed cache name + `skipWaiting`/`clients.claim`; add an update prompt; worst case instruct users to reinstall the PWA |
| Rules bug (bust/avg/checkout) shipped | HIGH | Bug now lives in users' cached app AND has corrupted stored stats; fix engine, bump cache, write a data-migration to recompute affected stats if feasible |
| Lost data from eviction (no backup) | HIGH (unrecoverable) | None — data is gone. Prevention (persist + export) is the only real recovery; afterward, add export and `persist()` immediately |
| Broken schema migration | MEDIUM–HIGH | Restore from a user export if one exists; add the missing `onupgradeneeded` path; never ship another schema change without a migration test |
| GH Pages subpath paths broken | LOW–MEDIUM | Set build base + align manifest/SW scopes; redeploy; re-verify install on device |
| Spectator sync race/blank | LOW | Add request-state handshake + snapshot reply + storage fallback; reopen the window |
| Wake lock dropped on visibility | LOW | Add the `visibilitychange` re-acquire handler |

## Pitfall-to-Phase Mapping

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| 1. Bust handling (3 conditions) | Game engine | Truth-table unit tests for all bust cases, both out modes |
| 2. Turn reversion correctness | Game engine | Snapshot-based revert; stats/achievements only on committed turns |
| 3. 3-dart average dart counting | Game engine (emit) + Statistics | Worked-example tests; max avg = 167 |
| 4. Impossible/bogey checkouts | Checkout suggestion | Full 2–170 table validated; bogey + >170 handled; routes end on double |
| 5. Stale SW / cache invalidation | PWA / deployment | Redeploy reaches installed device via update prompt |
| 6. GH Pages subpath paths | PWA / deployment | Install + offline pass on real GH Pages URL on a tablet |
| 7. Storage eviction / no backup | Persistence / statistics | `persist()` called; export/import round-trips; eviction simulated |
| 8. Schema migration | Persistence | Upgrade populated old DB → new schema keeps data |
| 9. Tiny touch targets | Input | Measured reliable T/D/Bull entry by finger on target tablet |
| 10. No undo/correction | Game engine + Input | Undo restores full state incl. player/leg/checkout |
| 11. BroadcastChannel race | Spectator display | Spectator re-syncs after refresh and reopen |
| 12. Popup-blocked / unrecoverable window | Spectator display | Window opens in click handler; null-checked; reopenable |
| 13. Screen sleep / wake lock | Input + Spectator display | Screen stays awake across an app-switch on both devices |
| 14. Unreadable spectator display | Spectator display | Legible on 27" at 3 m for each of 1–4 players |
| 15. Double-tap / unconfirmed entry | Input | Duplicate taps guarded; pending-visit buffer visible before commit |

## Sources

- Bogey numbers (159, 162, 163, 165, 166, 168, 169; 156/157 NOT bogey): [Darts Checkout Assistant — The Bogey Numbers](https://dartscheckoutassistant.com/2019/05/21/the-bogey-numbers/); [darts501 Checkout Chart](https://darts501.com/Check.html) — HIGH (cross-checked)
- 3-dart average convention (points ÷ darts × 3; checkout legs count actual darts; busts count as 3): [Darts Atlas — 3-Dart Average](https://guides.dartsatlas.com/stats/averages); [DartHelp](https://darthelp.com/guides/how-to-calculate-your-darts-average/) — HIGH
- Bust / double-out / "1 remaining" rules and auto-revert behavior in scoring apps: [DartCounter — Bust rule explained](https://dartcounterapp.com/bust-rule-darts-explained-official/); [DartCounter — Finishing rules](https://dartcounterapp.com/darts-finishing-rules/); [ScoreApp scoring rules](https://www.scoreapp.nl/en/guides/darts-scoring-rules) — HIGH
- Screen Wake Lock (iOS 16.4+, installed-PWA bug fixed 18.4, auto-release on hidden, visibilitychange re-acquire, HTTPS required): [MDN Screen Wake Lock API](https://developer.mozilla.org/en-US/docs/Web/API/Screen_Wake_Lock_API); [caniuse wake-lock](https://caniuse.com/wake-lock) — HIGH
- IndexedDB eviction, best-effort vs persistent, `navigator.storage.persist()`, Safari 7-day cap + PWA exemption: [MDN Storage quotas and eviction](https://developer.mozilla.org/en-US/docs/Web/API/Storage_API/Storage_quotas_and_eviction_criteria); [WebKit — Updates to Storage Policy](https://webkit.org/blog/14403/updates-to-storage-policy/); [web.dev — Storage for the web](https://web.dev/articles/storage-for-the-web) — HIGH
- PWA on GitHub Pages subpath (scope/start_url/SW alignment, cache versioning): [Christian Heilmann — GitHub page into a PWA](https://christianheilmann.com/2022/01/13/turning-a-github-page-into-a-progressive-web-app/); [Lighthouse #9429 start_url not in scope](https://github.com/GoogleChrome/lighthouse/issues/9429) — HIGH
- BroadcastChannel (no buffering, same-origin/partition, sender doesn't hear self, handshake pattern): [MDN Broadcast Channel API](https://developer.mozilla.org/en-US/docs/Web/API/Broadcast_Channel_API); [12 Days of Web — BroadcastChannel](https://12daysofweb.dev/2024/broadcastchannel-api/) — HIGH
- Reference apps for feature/UX expectations: DartCounter, Scory, ScoreApp, autodarts (per PROJECT.md) — MEDIUM (community/product docs, not standards)

---
*Pitfalls research for: touch X01 darts scoring PWA (offline-first, GitHub Pages, multi-window spectator)*
*Researched: 2026-06-10*
