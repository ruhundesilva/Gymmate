# GymMates

An iOS gym workout tracker with cooperative workout scheduling — "Strava for the gym."

## Stack

- [Expo](https://expo.dev) (managed workflow) + TypeScript strict
- [Expo Router](https://docs.expo.dev/router/introduction/) for file-based navigation
- [Supabase](https://supabase.com) — Postgres, Auth, Row Level Security, Storage
- `expo-secure-store` (Keychain) for session persistence
- `expo-apple-authentication` for Sign in with Apple

See `docs/02-architecture.md` for the full architecture and `docs/11-decisions.md`
for settled stack decisions.

## Setup

```bash
npm install
cp .env.example .env   # fill in EXPO_PUBLIC_SUPABASE_URL / EXPO_PUBLIC_SUPABASE_ANON_KEY
```

## Running the app

Sign in with Apple is a native module, so the app needs a **dev-client** build —
it will not run in the plain Expo Go app.

```bash
npm run ios       # builds and launches in the iOS Simulator
npm run android    # builds and launches on an Android emulator
```

After the first native build, `npx expo start` reconnects to the already-installed
dev client for fast-refreshing JS changes without rebuilding.

## Development commands

```bash
npm run typecheck   # tsc --noEmit
npm run lint        # expo lint
npm test            # placeholder — no test suite yet
```

## Database

Schema changes are Supabase migrations under `supabase/migrations/`. Never edit
the live database directly.

```bash
supabase migration new <name>   # create a new migration
supabase db push --linked       # apply pending migrations to the linked project
```
