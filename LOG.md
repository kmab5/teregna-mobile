# Teregna Mobile — Build Log

Running record of what is done, what is next, and the decisions worth not
relitigating. Update this at the end of every working session.

**Status:** feature-complete against the web app. Push notifications and polish
are the remaining milestones.

**Last verified:** `npm run verify` green — 0 type errors, 0 lint errors,
10 parity checks, Android bundle. Runs on a physical Android device.

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
- [x] `i18n/plural.ts` — CLDR plural selection that works on Hermes

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

### Provider portal (complete)
- [x] Own stack under the Business tab, with dark chrome and section nav
- [x] **Queue** — live, optimistic Start/Finish with rollback, escalating wait times
- [x] **Setup checklist** — states why customers cannot find you yet
- [x] **Archive** — filters, restore to back of queue
- [x] **Items** — add/edit sheet, visibility, reorder, delete confirm, **stock**
- [x] **Analytics** — stat cards, three charts, table fallback on each
- [x] **Settings** — open/closed, business details, profile, delete account
- [x] **Onboarding** — three gated steps

### Shared UI
- [x] `Toast` — non-blocking confirmation, anchored top (the thumb covers the bottom)
- [x] `Sheet` — bottom-anchored modal
- [x] `Chart` — SVG bars/area with mandatory table toggle
- [x] **Gutters widened 16px → 20px** across every screen

---

## Next up (in order)

### 1. Push notifications
The obvious mobile-only win. A provider should learn about a new request without
the app open; a receiver should learn when their turn is close.
- [ ] `expo-notifications` + push tokens on `profiles`
- [ ] Supabase trigger or Edge Function to send on insert / position change
- [ ] Permission prompt at the right moment (after first request, not on launch)

### 2. Polish
- [ ] Offline banner — the queue is read-only and stale rather than empty
- [ ] Haptics on finish (`expo-haptics`) — it is a physical action
- [ ] Swipe-to-finish on queue rows (Reanimated + Gesture Handler, both installed)
- [ ] Skeleton loaders instead of blank screens

### 3. Ship
- [x] `eas.json` with development / preview / production profiles
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

**Hand-rolled CLDR plural rules, no polyfill.** Hermes has no
`Intl.PluralRules` on Android at all - constructing one throws and takes the
render tree down. `@formatjs/intl-pluralrules` is the usual answer, but for two
locales with two categories each the rules are three lines, and a hand-written
table can be verified here against Node's full-ICU implementation. The parity
test compares 2022 cases and requires an exact match, so the shortcut is
measured rather than assumed. Add a third locale and this decision is worth
revisiting.

**Every Intl call is guarded.** Hermes does provide NumberFormat and
DateTimeFormat via platform ICU, but an unresolvable locale still throws. Each
has a plain-JS fallback so a formatting failure degrades one label rather than
blanking a screen.

**Charts drawn with react-native-svg, no chart library.** victory-native needs
Skia and gifted-charts is another dependency to keep in step with the SDK, while
a bar chart and an area chart are a handful of `<Rect>`s and one `<Path>`.
react-native-svg is already present for the icons, so this adds nothing to the
bundle. The table fallback carries over from web and is **not optional**.

**Provider gets its own stack, not more tabs.** Resolved from Session 1's open
question. A provider working a shift is running their shop, so the section has
dark chrome and its own section nav — but it nests inside the existing Business
tab, which keeps one way home and avoids a second row of navigation eating the
screen.

**Toasts, not Alert.** `Alert.alert` blocks and demands dismissal, which is the
wrong response to an action someone took deliberately. Anchored to the top,
because on a phone the bottom is covered by the tab bar and by the thumb that
just tapped.

**20px screen gutters.** 16px was measurably too tight against the edge —
reported from real use — and worse on curved-glass phones where the last few
pixels are hard to reach. A parity check now fails if any full-width screen
container drops below 20px.

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

- **A device smoke pass is now part of "done".** Typecheck, lint and bundle are
  necessary and were not sufficient; anything touching a platform API needs a run
  on hardware before it counts as finished.
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

### Session 3 — provider portal

Built the provider portal to parity with web: queue actions, archive, items with
stock, analytics, settings, onboarding. Resolved both open questions from
Session 1 (own stack; SVG charts). Widened screen gutters after real-device
feedback that content sat too close to the edge — that had only been filed
vaguely under "polish", not planned, so it is now a guarded rule rather than a
matter of taste.

The gutter guard took three attempts to write correctly, which is worth
recording: the first version scanned only `src/app` and missed the shared
`Screen` component where the gutter actually lives, and the second used an
attribute-shaped regex that could not see classes wrapped in `cn(...)`. Each
version "passed" while testing nothing. A guard is only real once you have
watched it fail.

### Session 2 — device bugs

First run on a real Android phone surfaced two crashes that the build could not
have caught. Both are now covered by tests, and both tests were confirmed to
fail when the bug is reintroduced.

1. **`Intl.PluralRules` is undefined on Hermes.** `createTranslator` constructed
   one eagerly, so the app died on the first screen that rendered any text -
   `undefined cannot be used as a constructor`. I had assumed Hermes ships full
   ICU; it ships partial ICU, and PluralRules is one of the gaps. Now behind
   `createPluralSelector`, which uses the real API where it exists and falls
   back to transcribed CLDR rules where it does not.

2. **A `<Stack.Screen>` named a route that did not exist.** `provider/[providerId]`
   was left over from a directory renamed to `p/[id]` during the first session.
   expo-router only warns on this, so it was invisible in the bundle output.

The lesson matches the backend ones: a green build says the code is well-formed,
not that the runtime has the APIs it calls. The new tests assert against the
runtime's actual capabilities rather than the code compiling.

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
