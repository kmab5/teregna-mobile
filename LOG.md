# Teregna Mobile — Build Log

Running record of what is done, what is next, and the decisions worth not
relitigating. Update this at the end of every working session.

**Status:** foundation + receiver loop complete and building. Provider portal is
the next milestone.

**Last verified:** `npm run verify` green — 0 type errors, 0 lint errors,
5 parity checks, Android bundle 6.8 MB.

---

## Stack (settled)

| Concern | Choice | Why |
|---|---|---|
| Framework | **Expo SDK 57** (RN 0.86, React 19) | One codebase for Android + iOS; iOS builds on EAS without a Mac |
| Routing | **expo-router** | File-based, same mental model as the Next.js app |
| Language | **TypeScript**, strict | Contract types shared with the web app |
| Styling | **NativeWind 4** | Tailwind syntax, so the brand tokens port almost mechanically |
| Data | **TanStack Query** | Same caching/invalidation pattern as web |
| Backend | **@supabase/supabase-js** + SecureStore session | Same RLS, same RPCs, zero backend changes |
| Icons | **lucide-react-native** + react-native-svg 15.15.5 | Matches the web icon set |
| Fonts | Outfit / Work Sans / JetBrains Mono / Noto Sans Ethiopic | Same four faces as web |

---

## Done

### Foundation
- [x] Scaffolded on Expo SDK 57 with expo-router, `src/` layout
- [x] Brand tokens ported into `tailwind.config.js` (light + dark)
- [x] Fonts wired via `@expo-google-fonts`, splash held until loaded
- [x] `npm run verify` = typecheck → lint → parity tests → Android bundle

### Shared contract (copied from `teregna-web`, unmodified)
- [x] `lib/database.types.ts`, `lib/errors.ts`, `lib/query-keys.ts`
- [x] `i18n/config.ts`, `i18n/translate.ts`, `i18n/messages/{en,am}.ts` — all 299 keys
- [x] `lib/rpc.ts` — every RPC wrapper, same signatures

### Platform layer
- [x] `lib/supabase.ts` — SecureStore session adapter with key sanitising + chunking
- [x] `lib/auth.tsx` — session provider with a `ready` flag
- [x] `lib/queries.ts` — reads, realtime, foreground refetch, polling fallback
- [x] `lib/oauth.ts` — Google sign-in over a deep link
- [x] `i18n/provider.tsx` — locale from SecureStore, falls back to device language

### UI
- [x] Primitives: `Text` (typed variants), `Button`, `Card`, `Field`, `Screen`
- [x] Brand: `PositionBadge`, `Mark`, `StatusBadge`, `LanguageToggle`
- [x] Bottom tabs, with signed-out tabs hidden rather than bouncing to a wall

### Receiver loop (the product's core)
- [x] **Browse** — search, DB-driven category filters, pull to refresh, queue counts
- [x] **Provider detail** — visible items, stock display, quantities, note
- [x] **Send request** — idempotency key, out-of-stock warning, deferred sign-in
- [x] **My requests** — live position, ticking wait time, cancel, active/past split
- [x] **Sign in / sign up** — email + Google, language toggle before auth
- [x] **Account** — profile summary, language, sign out

### Provider (first slice)
- [x] **Queue** — read-only live queue, so the realtime path is exercisable now
      rather than shipping untested later

---

## Next up (in order)

### 1. Provider portal — actions
The queue currently renders but does nothing. Needed:
- [ ] Start / Finish with optimistic update and rollback on `invalid_transition`
- [ ] Archive screen + restore (default: back of queue)
- [ ] Items: list, add/edit sheet, visibility toggle, reorder, delete confirm, **stock field**
- [ ] Analytics: stat cards + charts (needs a native chart lib — see Open questions)
- [ ] Settings: open/closed toggle, business details, phone, delete account
- [ ] Onboarding: the three gated steps, mirroring web
- [ ] Setup checklist nudge on the queue screen

### 2. Provider/receiver separation
Web splits these into two chromes. On mobile they currently share one tab bar.
Decide: a distinct provider stack, or keep one tab bar with a mode switch.
Leaning toward a separate stack under `/business` with its own header, since a
provider working a shift is running their shop, not browsing.

### 3. Push notifications
The obvious mobile-only win. A provider should learn about a new request without
the app open; a receiver should learn when their turn is close.
- [ ] `expo-notifications` + push tokens on `profiles`
- [ ] Supabase trigger or Edge Function to send on insert / position change
- [ ] Permission prompt at the right moment (after first request, not on launch)

### 4. Polish
- [ ] Offline banner — the queue is read-only and stale rather than empty
- [ ] Haptics on finish (`expo-haptics`) — it is a physical action
- [ ] Swipe-to-finish on queue rows (Reanimated + Gesture Handler, both installed)
- [ ] Skeleton loaders instead of blank screens

### 5. Ship
- [ ] `eas.json` with development / preview / production profiles
- [ ] EAS build for Android, install on device
- [ ] Google OAuth: register the `teregna://` deep link in Supabase redirect URLs
- [ ] iOS build via EAS (no Mac needed) once Android is settled

---

## Decisions worth not relitigating

**Expo over native Kotlin/Flutter.** Chosen because it is the only option whose
build and typecheck loop can actually be run and verified in the environment
this is being developed in. Kotlin/Gradle and Flutter both need Maven/pub
registries that are unreachable, which would mean writing unverified code.

**Copied contract files, not a shared package.** A monorepo would be tidier, but
this is two independently deployed repos and the copied files are small and
stable. `tests/parity.test.mjs` guards the drift that copying invites — key
parity, no web APIs leaking in, no direct writes to `requests`, no service-role
key.

**SecureStore, not AsyncStorage, for the session.** The stored value is a refresh
token. On Android SecureStore lands in EncryptedSharedPreferences rather than a
plaintext file. It costs a key-sanitising and chunking adapter (2048-byte limit,
restricted key charset) which is why `lib/supabase.ts` is longer than the docs'
version.

**`detectSessionInUrl: false`.** That option is for browsers, where the OAuth
result arrives in `window.location`. On native the code comes back through a deep
link and `lib/oauth.ts` exchanges it explicitly.

**Realtime waits for the session before subscribing.** The session loads
asynchronously from SecureStore, so a channel opened during first render can
connect as `anon`, get every event filtered by RLS, and look connected while
delivering nothing. This exact bug shipped on web; `setAuth` before `subscribe`
is what prevents it.

**Refetch on foreground, plus a poll.** A backgrounded phone suspends the socket
and loses events outright, so resume-refetch is correctness, not optimisation.
The 15–20s poll is a safety net for the socket dropping silently.

**Stock informs, never blocks.** A depleted item stays selectable with a warning.
Providers restock and people cancel; it is their call.

**Signed-out tabs are hidden, not disabled.** A tab that always bounces you to a
login screen is worse than one that is not there.

---

## Open questions

- **Charts for analytics.** Recharts is DOM-only. Options: `victory-native`
  (Skia-based, needs `@shopify/react-native-skia`), `react-native-gifted-charts`
  (lighter, no Skia). Either way the **table fallback is mandatory** — that rule
  carries over from web.
- **Provider chrome.** Separate stack or one tab bar? See Next up #2.
- **Amharic review.** Translations are careful but not native-reviewed. Same
  caveat as web, same file (`i18n/messages/am.ts`) if corrections arrive.

---

## What cannot be verified here

`npm run verify` proves the app type-checks, lints, and bundles for Android. It
does **not** prove anything about layout, touch feel, or how it looks on a real
screen — there is no emulator or device in the build environment. Visual and
interaction review needs a human with an Android phone running `npx expo start`.

---

## Session history

### Session 1
Scaffolded, ported the contract layer, built the receiver loop end to end, plus
a read-only provider queue.

Two things caught by building rather than assuming:
- **NativeWind on RN 0.86** was the main technical risk, so it was smoke-tested
  before any real UI was written. It bundles fine.
- **`react-native-svg` 15.14.0 broke the bundle** — it imports `buffer`, which
  does not resolve on RN 0.86. The pin was an arbitrary guess; 15.15.5 works.
  `npx expo install` could not be used to resolve compatible versions because it
  needs Expo's API, which is unreachable from this environment, so every version
  here was confirmed by bundling rather than by the version map.
