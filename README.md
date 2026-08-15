# Teregna Mobile

ተረኛ · Android and iOS app for Teregna, built with Expo.

**See [`LOG.md`](LOG.md) for current progress and the next milestone.**

## Setup

Needs Node.js 20+ and the **Expo Go** app on your phone.

```
npm install
cp .env.example .env      # paste your Supabase URL + anon key
npm start
```

Scan the QR code with Expo Go. Live reload, no Android Studio, no cable.

| Command | Does |
|---|---|
| `npm start` | Dev server + QR code |
| `npm run android` | Open on a connected device/emulator |
| `npm run verify` | Typecheck + lint + parity tests + Android bundle |
| `npx expo install --check` | Report SDK version mismatches |
| `npx expo install --fix` | Align packages to the SDK. **Re-run `npm run verify` after** |
| `npm test` | Cross-platform parity checks |

## Push notifications need a development build

`expo-notifications` does not work in Expo Go — remote notifications were removed
from it in SDK 53. The app detects Expo Go and disables push entirely, so nothing
crashes and the permission prompt stays hidden. Everything else works normally.

To test push:

```
npx eas build --profile development --platform android
```

Install that APK and use `npm start` against it as usual.

## How it talks to the backend

The same contract as `teregna-web`, unchanged:

- **Reads** hit RLS-protected views — `provider_public`, `items_view`,
  `provider_queue`, `provider_archive`, `my_requests`.
- **Writes** go through RPC only (`src/lib/rpc.ts`). Clients hold no write grant
  on `requests`, so there is no other way in.
- **Realtime** subscribes to `requests`, then refetches the view. Position is
  derived server-side from `seq`; recomputing it locally would drift.
- **Errors** arrive as bare codes, mapped to translated sentences.

## Structure

```
src/
├── app/                    expo-router routes
│   ├── (tabs)/             browse, requests, business, account
│   ├── (auth)/             sign in / sign up
│   └── p/[id].tsx          provider detail + send request
├── components/
│   ├── ui/                 Text, Button, Card, Field, Screen
│   └── teregna/            PositionBadge, StatusBadge, LanguageToggle
├── i18n/                   provider + en/am catalogues (299 keys)
└── lib/                    supabase, auth, queries, rpc, format
```

## Shared with teregna-web

`database.types.ts`, `errors.ts`, `query-keys.ts`, and the whole `i18n/messages`
directory are **copied**, not imported. `npm test` guards the drift that invites:
key parity, no web-only APIs, no direct writes to `requests`, no service-role key.

If you change any of those in the web app, copy them here and re-run `npm test`.
