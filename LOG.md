# Teregna Mobile — Build Log

Running record of what is done, what is next, and the decisions worth not
relitigating. Update this at the end of every working session.

**Status:** feature-complete, plus push notifications and polish. Remaining work
is shipping: EAS build, store listings.

**Last verified:** `npm run verify` green — 0 type errors, 0 lint errors,
15 parity checks, Android bundle. Runs on a physical Android device.

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

### Push notifications
- [x] `expo-notifications`, token stored on `profiles` via `upsert_profile`
- [x] Postgres trigger sends through `pg_net` — new request, turn started,
      completed, cancelled
- [x] Permission asked in context, once, never on launch
- [x] Sign-out clears the token

### Polish
- [x] Offline banner — stale beats looking empty
- [x] Haptic confirmation on finish
- [x] Skeleton loaders

### First run, guide, theme
- [x] **Intro slides** on first launch, skippable, with the language toggle on it
- [x] **Guide sheet** — both sides of the product, reachable from either settings
- [x] **Theme** — Light / Dark / System, persisted

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

## Next up

- [ ] **Receipt confirmation.** "I have received my request" for customers and
      "I have received my payment" for providers, as groundwork for ratings.
- [ ] Device pass on the new navigation: mode switch, swipe, bottom bar.

## Next up (in order)

### 1. Ship
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

**Publishable key, not anon.** Supabase replaced the legacy JWT `anon` /
`service_role` pair with opaque `sb_publishable_` / `sb_secret_` keys. Legacy is
deprecated at the end of 2026 and new projects are not issued it at all. The
client accepts several env var names because the dashboard, the docs and older
setups each suggest a different one, and a mismatch presents as "cannot connect"
rather than anything that names the cause. Startup also refuses to boot if a
SECRET key is found in an `EXPO_PUBLIC_` variable — that key bypasses RLS and
must never reach a phone.

**Push is sent from Postgres via pg_net, not an Edge Function.** The trigger
already holds the row that changed and the recipient, so a round trip to a
function adds a moving part without adding information. pg_net posts
asynchronously, so a slow push endpoint cannot delay or roll back the transaction
that finished someone’s request. Every failure path in the trigger is swallowed:
a notification that fails to arrive is a worse day, one that breaks
`finish_request` is a broken product.

**Position changes do not notify.** A queue of ten advancing one step would fire
ten notifications, and the app already updates live when it is open. Only four
events send: joined, started, completed, cancelled.

**Permission is asked in context, never on launch.** A prompt before someone
knows what the app does gets declined, and on iOS a decline is close to permanent
— the OS will not ask again. It appears once the person is already in a queue or
already running one.

**expo-notifications is loaded lazily, never statically imported.** It throws AT
IMPORT TIME in Expo Go on Android, and a static import does not fail gracefully —
it takes the whole module graph down, after which expo-router reports every route
as "missing the required default export" and dies on `Cannot read property
’ErrorBoundary’ of undefined`. None of those messages mention notifications, which
is what makes it expensive to diagnose. It is behind `await import()` plus a
runtime check plus a try/catch: the check avoids a pointless attempt, the
try/catch is what guarantees a throwing import can never crash the app.

**Push is unavailable in Expo Go, by design.** The prompt hides itself there
rather than asking for something that cannot be granted. Test with a development
build.

**Never import `@react-navigation/*`.** expo-router vendors its own copy as of
SDK 56 and the public packages are a build error. Anything the navigator needs -
including tabBar prop types - comes from expo-router itself.

**Overdue alerts need a scheduled job, not a trigger.** Nothing changes in the
database when a wait crosses its threshold: the row was written once and the
clock moved. `overdue_notified_at` makes the sweep fire once per request, because
a provider who gets the same alert every five minutes turns notifications off
entirely - losing every other alert with it.

**`reactCompiler` is off.** It is experimental and it runs on JSX that NativeWind
has already rewritten through its own transform. Two layers rewriting the same
elements is a plausible way for a prop like `onPress` to be dropped, and the
compiler buys optimisation only — nothing here depends on it. The touch target
also carries a plain `style` prop instead of a `className`, so the NativeWind
interop is off the press path entirely.

**Theme has three states, not two.** "Follow my phone" is a real preference, and
a boolean toggle silently converts it into a fixed choice the first time it is
touched.

**Navigate with `router.push()`, never `<Link asChild>`.** `asChild` injects
`onPress` by cloning the child element, and with `reactCompiler` enabled the
child can be memoised such that the injected handler never arrives. The result is
a control that silently does nothing - no error, no navigation, nothing in the
logs, which is close to the worst possible failure to diagnose. The object form
`push({ pathname: "/p/[id]", params: { id } })` is also the one typed routes
actually check: a template literal is just `string` to them.

**The drawer is one instance around the whole tree, not per-mode.** Declaring it
inside each tab layout would mean two copies to keep in step, and the mode switch
inside it would unmount itself mid-navigation.

**All colour comes from `theme/colors.ts`. None comes from a class.**

The app previously had two independent mechanisms deciding what "dark" meant -
NativeWind’s `dark:` variant and this object - and they had to agree on all 199
occurrences. When they disagreed the result was dark-mode text on light-mode
backgrounds, reported three separate times as "the contrast is ruined" and "the
background is too bright". Patching individual components never fixed it because
the architecture guaranteed it would recur somewhere else.

There is one mechanism now: NativeWind handles LAYOUT (flex, spacing, radius,
size), and every colour is an inline style from the resolved theme. A parity
check fails the build on any colour class. Every foreground/background pair in
both schemes is measured, and all clear 4.5:1. Icons, charts
and anything taking a `color` prop cannot use NativeWind’s `dark:` variant, so a
hardcoded hex silently stays on one theme’s value while the background inverts.
That produced a 1.70:1 pill in dark mode.

**Swallowed errors must still be recorded.** A push that fails must never break
`finish_request`, but a failure nobody can see is indistinguishable from a
working system with nothing to report. Every attempt is logged.

**Realtime channel topics carry a unique suffix.** `supabase.channel(topic)`
RETURNS AN EXISTING channel for a repeated topic rather than creating a second
one. Because this subscription is asynchronous, a re-running effect can reach
`.channel()` before the previous run’s cleanup removed it, get back a channel
that is already subscribed, and throw `cannot add postgres_changes callbacks
after subscribe()`. A per-instance suffix makes the collision impossible.

**Node scripts resolve paths with `fileURLToPath`, never `url.pathname`.** On
Windows a file URL yields `/D:/Code/...`, and joining that produces `D:\D:\Code\...`.
It looks identical on Linux, which is why it shipped.

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

### Session 14 — drawer and central settings

Account and Settings were two screens doing the same job, and both were tabs -
so the same person edited their name in one place and their phone in another
depending on which mode they happened to be in, while configuration competed for
bar space with the queue.

- **One drawer**, wrapping the whole tree. Identity, which side of the product
  you are on, settings, order history, guide, sign out.
- **One `/settings` route** for both modes. The business section appears for
  people who have a business, rather than living on a separate screen.
- **The mode switch moved into the drawer.** It changes the entire app, which is
  a heavier decision than a bar button implies, and it sat awkwardly beside the
  business name it was about to replace.
- **Bottom bars are working surfaces only.** Customer: Browse, Requests,
  History. Business: Queue, Archive, Items, Analytics.

Built on Reanimated rather than a Drawer navigator: the two sides have different
tab sets, so a navigator-level drawer would have to be declared twice and kept in
step. Wrapping once means both modes get the identical panel, and the switch
inside it can move between them without unmounting itself.

### Session 13 — theming overhaul

"Go over everything once" was the right instruction: three of the six reported
problems were one architectural fault, not three bugs.

- **199 `dark:` colour classes removed.** Colour now has exactly one source.
  Dark backgrounds are genuinely dark (`#100D1C` rather than a washed `#141024`),
  and every pairing is measured rather than eyeballed.
- **Cancel is an icon button.** The labelled one overflowed the card.
- **Page transitions** slide rather than cut, so Back has a direction.
- **Push status panel** in both settings screens. "Notifications aren’t firing"
  has at least four causes - Expo Go, no EAS project id, permission denied, no
  token stored - and none announce themselves. The app now names which one
  applies, and `private.push_diagnosis()` answers the same from the server.

Worth recording: the sweep initially placed `useThemeColors()` inside nested
functions and type literals, which ESLint caught as a rules-of-hooks violation
before it could reach a device. Mechanical refactors need the linter as much as
hand-written code does.

### Session 12 — web parity

Audited the web app against everything the backend had gained. It was **77
catalogue keys behind** and missing four features:

- **Order detail** (`/orders/[orderId]`), server-rendered because it is a page
  people bookmark and forward — it should not need hydration to show a phone
  number somebody is standing there waiting to dial. The time-dependent parts
  (overdue warning, relative wait) are a client component, since rendering them
  on the server would freeze them at request time.
- **Order links** from queue rows, archive rows and request cards, so a completed
  job stays reachable.
- **Guide** and a **three-state theme control**, matching mobile.
- **Phone required at signup.**

Deliberately NOT ported: push notifications, first-run intro slides, offline
banner. A browser has its own answers to all three.

A drift check now lives in the web test suite. It cannot see the mobile repo, so
it asserts the shape drift produces — a catalogue missing whole feature
namespaces — which is what would have caught this months earlier.

### Session 11 — mode switching, swipe, history

The deferred list, done.

- **Two surfaces, not one tab bar.** `(customer)` and `(business)` are separate
  route groups with their own tabs and chrome. The top bar carries the switch,
  so neither is a trap. A provider working a shift no longer sees Browse.
- **Swipe between tabs**, with a fade transition and a rebuilt bottom bar - one
  sliding pill rather than five independently animating items.
- **Order history** (`/history`): every order, filterable, and each opens its
  full detail. Provider archive rows now do the same, so a completed job from
  three weeks ago is as reachable as this morning’s.
- **Account overhauled** around what people come there to do - history,
  preferences, sign out - rather than mirroring the data model.
- **Phone required at signup**, carried through signup metadata into the
  provisioning trigger.
- **Overdue-wait alerts** via a pg_cron sweep every five minutes.

The navigation had to be rebuilt mid-session: **as of SDK 56 expo-router is
incompatible with `@react-navigation/*`**, so the pager-backed material tabs I
started with were a hard build error. The swipe is now a pan gesture over
expo-router’s own tabs, with `failOffsetY` so scrolling a list does not fight the
navigator. A parity check bans the import.

### Session 10 — assets, contrast, orders

- **Brand assets generated** from the mark: app icon, Android adaptive
  foreground/background/monochrome, splash (light and dark), notification icon,
  favicon. Every Expo template file removed.
- **Queue pill was 1.47:1 in dark mode.** The cause was `bg-primary/[0.14]`:
  NativeWind does not reliably emit arbitrary-opacity backgrounds, and when it
  does not the background stays FULLY OPAQUE — lavender text on lavender. Now
  solid measured pairs (9.2:1 and 8.3:1). A parity check bans the syntax.
- **Business chrome is light in light mode.** A dark header in an otherwise
  light app read as a rendering fault rather than deliberate separation.
- **Status bar seam** removed: the top bar now shares the page background.
- **Selection tick** is a drawn icon, not a "✓" glyph, which carried its own
  line box and clipped against its container.
- **Order detail screen** (`/order/[id]`) with line items, total, expected time,
  and the counterparty phone number.

The phone rule is worth stating: a provider sees a customer number for a request
in their queue; a customer sees a provider number only once work has started. It
is enforced by the database, not the client.

That gating originally failed its test, and the reason was instructive: RLS
correctly stopped a receiver reading the owner’s profile row. The fix is a
definer accessor returning ONLY the phone, rather than a policy widening access
to `profiles` — that row also holds `push_token`, and a policy permissive enough
to share a phone would hand over the token too.

### Session 9 — dead taps (again), intro, guide, theme

The provider cards were still unresponsive after Session 8, so the `Link asChild`
theory was incomplete at best. Removed every remaining layer between the finger
and the handler:

- `reactCompiler` disabled — experimental, and stacked on top of NativeWind’s own
  JSX transform.
- The touch target now uses a `style` prop rather than `className`, keeping the
  NativeWind interop off the element that owns `onPress`.
- A `__DEV__` log on press, so the next report can distinguish "the handler never
  fires" from "it fires and navigation does nothing" — two different bugs that
  look identical from the outside, which is why this took three attempts.

Also added the intro slides, the guide, and the theme switcher.

### Session 8 — dead taps, real top bar

1. **Provider cards were completely unresponsive.** Not a blank destination this
   time - the press never fired. `<Link asChild>` clones its child to inject
   `onPress`, and `reactCompiler` (on in app.json) can memoise the child so the
   handler never lands. Replaced with explicit `router.push()`. A parity check
   now fails on any `Link asChild`.

   Worth noting I fixed the *destination* last session and assumed that was the
   whole problem. It was two separate bugs on the same path, and the second one
   was still there.

2. **Top bar.** Adding padding twice did not answer this, because the request was
   for chrome, not spacing: content began immediately under the status bar with
   nothing between them. There is now a real 48px `TopBar` with the mark and a
   bottom border, and the screens that build their own chrome (provider detail,
   business section) match its height.

### Session 7 — blank screens, contrast, silent push

1. **Providers would not open.** The detail screen rendered the same empty View
   for loading, missing and failed, so every one of them looked like the app
   doing nothing. It now says which, with a way back. A provider can legitimately
   be missing since discovery started excluding the caller’s own businesses.

2. **Queue pill unreadable in dark mode.** The text colour was a hardcoded
   light-mode hex while the tinted background inverted around it: measured at
   **1.70:1**. Icons and chart primitives take a `color` string, not a class, so
   `dark:` cannot reach them - that is now what `theme/colors.ts` exists for.
   All four pill pairings measured, all clear 4.5:1.

3. **The push prompt was Amharic in English.** A batch insert wrote the wrong
   column into `en.ts`. Types cannot catch it - both are strings - and key parity
   passed because the KEYS were right. Two checks now scan for Ethiopic script in
   the English file and its absence in the Amharic one.

4. **Notifications silent with no way to diagnose.** `create extension pg_net`
   was never run (it is present on Supabase, but assuming that is how a feature
   works on one project and not the next), and `send_push` ended in
   `exception when others then null`. Swallowing is right; swallowing without
   recording is not. Every attempt now lands in `private.push_log`, and
   `private.push_diagnosis()` answers the question in one query.

5. **Top spacing** increased under the status bar across every screen.

### Session 6 — realtime, Windows, self-service

Four fixes from real use:

1. **Realtime threw on opening a provider.** Unique channel topics, plus a
   `.catch()` so a failed subscription cannot surface as an unhandled rejection.

2. **`npm test` failed on Windows.** `new URL(...).pathname` produced
   `D:\D:\Code\...`. Now `fileURLToPath`. My tests only ever ran on Linux, where
   the two are indistinguishable.

3. **`npx eas build` could not find an executable.** The package is `eas-cli`,
   the binary is `eas`, so `npx eas` looks for the wrong package. Added
   `npm run build:dev` / `build:preview` / `build:prod`.

4. **A provider was listed among the services they could request.** Fixed in the
   database, not the clients: `provider_public` excludes the caller’s own
   businesses, and `create_request` raises `self_request`. Hiding it is
   presentation; the RPC guard is the actual rule, and it holds for a hand-rolled
   call against an id the caller already knows.

Fixing (4) broke an existing test that asserted a provider appears in discovery —
checked as the owner. That was the new rule working, so the test now checks as a
customer and asserts the owner does *not* see it.

### Session 5 — Expo Go crash

`expo-notifications` throws at import time in Expo Go, and `_layout.tsx` imported
`push.ts`, so a single unavailable native module cascaded into a total render
failure with error messages that pointed at routing rather than notifications.

Now lazily imported behind a runtime check and a try/catch, with the prompt
hidden in Expo Go. A parity check fails on any static import of an Expo
Go-hostile module — verified by reintroducing the exact import.

Also bumped expo to 57.0.13. **`npx expo install --check` reports seven other
packages that may need aligning, and it cannot be resolved from the build
environment here** — it needs Expo’s version API. Run `npx expo install --fix`
locally and re-run `npm run verify`. The candidates are the ones installed with
plain npm rather than `expo install`: the four `@expo-google-fonts` packages,
async-storage, netinfo, react-native-svg and url-polyfill.

### Session 4 — device fixes, keys, push, polish

Three fixes from real use, then the remaining features.

1. **Duplicate route crash.** `business.tsx` from Session 1 and the new
   `business/` directory both registered a route named `business`. The shipped
   zip was clean — the stale file was in the working tree, because unzipping over
   a checkout adds files but never removes them. A parity check now fails when a
   route is defined by both a file and a directory.

2. **Supabase not connecting.** Migrated to the new publishable key, with the
   project URL baked into `.env.example` and a startup error that names the file,
   the variable, and the `-c` cache flag rather than failing silently.

3. **Tab bar too close to the edge.** It used a fixed height with no safe-area
   inset, so on Android gesture navigation the bottom of every target sat inside
   the system gesture strip. Now grows by `insets.bottom`.

Then push notifications end to end, plus the offline banner, haptics and
skeletons.

One bug worth recording from the backend side: the first version of the
token-claiming logic failed with a unique-constraint violation, because
`upsert_profile` runs with INVOKER rights and RLS quite correctly stopped one
account clearing another account’s row. That is the policy working, not a
mistake in it — the fix was a narrow definer helper that only ever nulls a token.
Caught by a test that models two accounts sharing a phone.

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
