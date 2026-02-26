# CLAUDE.md — AI Reading Companion

> This file is read by every Claude Code agent at the start of every session.
> Follow every convention here without exception. Do not deviate unless explicitly told to in the task prompt.

---

## 🧭 Project Overview

**App Name:** AI Reading Companion (working title)
**Platform:** iOS only (Apple App Store — Kids Category)
**Target Users:** Parents (account holders) + Children ages 5–10 (readers)
**Core Loop:** Child reads aloud → app listens in real time → highlights words → flags mispronunciations → parent sees progress dashboard

### What This App Does

1. Child picks a leveled story
2. App streams audio and aligns spoken words to on-screen text in real time
3. App highlights the current word as the child reads
4. App flags mispronounced or skipped words
5. After the session, parent sees: accuracy %, minutes read, struggled words
6. Weekly parent summary: progress over time, words mastered, difficulty recommendation

---

## 🏗️ Full Tech Stack

| Layer             | Tool                                | Notes                                         |
| ----------------- | ----------------------------------- | --------------------------------------------- |
| Language          | TypeScript                          | Strict mode enabled everywhere                |
| Frontend          | React Native                        | Via Expo                                      |
| Mobile Framework  | Expo (Managed Workflow)             | Use EAS Build for App Store                   |
| Auth              | Clerk                               | Sign in with Apple required                   |
| Database          | Supabase (Postgres)                 | via Supabase JS client                        |
| Storage           | Supabase Storage                    | Story assets, audio recordings                |
| Backend/API       | Node.js (STT relay service)         | WebSocket server for real-time audio          |
| Background Jobs   | Inngest                             | Async workflows, reports, notifications       |
| STT Provider      | AssemblyAI (now) → Deepgram (later) | Via abstraction layer — never call directly   |
| Payments          | Apple In-App Purchases              | RevenueCat SDK for IAP management             |
| Testing           | Jest + React Native Testing Library | See Testing Strategy section                  |
| Linting           | ESLint + Prettier                   | See Linting & Formatting section              |
| Project Mgmt      | GitHub + Linear                     | Linear ticket IDs in all commits              |
| Multi-agent       | Conductor                           | Parallel Claude Code agents via git worktrees |
| Commit Convention | Commitizen (Conventional Commits)   | See commit rules below                        |

---

## 📁 Project Structure

```
/
├── apps/
│   └── mobile/                    # Expo React Native app
│       ├── app/                   # Expo Router screens
│       │   ├── (auth)/            # Login, signup, consent screens
│       │   ├── (parent)/          # Parent dashboard screens
│       │   └── (reading)/         # Reading session screens
│       ├── components/            # Shared UI components
│       ├── hooks/                 # Custom React hooks
│       └── assets/                # Images, fonts
│
├── packages/
│   └── stt/                       # STT abstraction layer (shared package)
│       ├── types/
│       │   └── stt.types.ts       # ALL shared STT data models — never change shape
│       ├── providers/
│       │   ├── stt.provider.interface.ts   # The contract every provider implements
│       │   ├── assemblyai.provider.ts      # AssemblyAI implementation (current)
│       │   ├── deepgram.provider.ts        # Deepgram implementation (future)
│       │   └── mock.provider.ts            # Mock for local dev and tests
│       ├── services/
│       │   ├── stt.service.ts              # Factory — reads STT_PROVIDER env var
│       │   └── reading-session.service.ts  # Scoring, alignment, mispronunciation logic
│       └── index.ts                        # Public exports only — import from here
│
├── server/
│   └── stt-relay/                 # Node.js WebSocket relay for real-time audio
│       ├── src/
│       │   ├── websocket.ts       # WebSocket server
│       │   └── audio.ts           # Audio chunking and forwarding
│       └── package.json
│
├── supabase/
│   ├── migrations/                # All DB migrations — never edit existing migrations
│   └── seed.ts                    # Seed data for development
│
├── inngest/
│   └── functions/                 # All Inngest background job functions
│
├── CLAUDE.md                      # This file
├── .env.example                   # All required env vars documented here
└── package.json                   # Monorepo root (use pnpm workspaces)
```

---

## 📖 Story Content JSON Shape

The `stories.content` column stores a structured representation of the story text. This is the single source of truth for rendering the reading UI, aligning STT output, and scoring accuracy.

### Schema

```typescript
interface StoryContent {
  paragraphs: StoryParagraph[];
}

interface StoryParagraph {
  paragraphIndex: number; // 0-based, sequential
  sentences: StorySentence[];
}

interface StorySentence {
  sentenceIndex: number; // 0-based within paragraph
  text: string; // Full sentence as display string
  words: StoryWord[];
}

interface StoryWord {
  wordIndex: number; // 0-based, global across entire story (used as alignment key)
  text: string; // Display form: "Hello," (with punctuation)
  textNormalized: string; // Lowercase, no punctuation: "hello" (used for STT matching)
  charOffset: number; // Character offset from start of sentence (for highlight positioning)
}
```

### Example

```json
{
  "paragraphs": [
    {
      "paragraphIndex": 0,
      "sentences": [
        {
          "sentenceIndex": 0,
          "text": "The cat sat on the mat.",
          "words": [
            { "wordIndex": 0, "text": "The", "textNormalized": "the", "charOffset": 0 },
            { "wordIndex": 1, "text": "cat", "textNormalized": "cat", "charOffset": 4 },
            { "wordIndex": 2, "text": "sat", "textNormalized": "sat", "charOffset": 8 },
            { "wordIndex": 3, "text": "on", "textNormalized": "on", "charOffset": 12 },
            { "wordIndex": 4, "text": "the", "textNormalized": "the", "charOffset": 15 },
            { "wordIndex": 5, "text": "mat.", "textNormalized": "mat", "charOffset": 19 }
          ]
        }
      ]
    }
  ]
}
```

### Rules

- `wordIndex` is **globally unique** across the entire story — it is the primary key for aligning STT output to on-screen text
- `textNormalized` is always lowercase, stripped of all punctuation — this is what gets compared to STT transcription output
- `text` preserves original casing and punctuation — this is what the child sees on screen
- `charOffset` is relative to the sentence `text` string — the reading UI uses this for precise word highlighting
- Story content is **immutable once published** — never mutate content that has existing reading sessions linked to it
- New stories should be ingested through a content pipeline that auto-generates `wordIndex`, `textNormalized`, and `charOffset` from raw text

---

## 🔌 STT Abstraction Layer — Critical Rules

This is the most important architectural rule in the project.

### The Golden Rule

> **All app code imports from `packages/stt/index.ts` only.**
> Nothing outside the `stt/` package ever imports directly from
> `assemblyai.provider.ts` or `deepgram.provider.ts`.

### Why This Exists

We start with AssemblyAI and will migrate to Deepgram later.
The abstraction layer means that migration = changing one environment variable.
If you bypass the abstraction, you create provider lock-in and break the migration path.

### Core Types (never change the shape of these)

```typescript
TranscribedWord; // word, startTime (ms), endTime (ms), confidence (0–1)
TranscriptionResult; // sessionId, transcript, words[], isFinal, audioDurationMs
StreamingTranscriptEvent; // type: 'partial'|'final'|'error', sessionId, words[], transcript
ReadingSessionSummary; // sessionId, childId, storyId, accuracyPercent, struggledWords[]
StreamingSessionConfig; // language, sampleRate, confidenceThreshold, childMode
```

### Provider Selection

Controlled by environment variable — never hardcoded:

```
STT_PROVIDER=assemblyai   → AssemblyAI (current default)
STT_PROVIDER=deepgram     → Deepgram (future)
STT_PROVIDER=mock         → Mock provider (always use for local dev)
```

### Timestamp Note

AssemblyAI returns timestamps in **milliseconds**.
Deepgram returns timestamps in **seconds** — multiply by 1000 inside the provider.
App code always receives milliseconds. This detail never leaks outside the provider file.

---

## 🌐 WebSocket Protocol (Mobile ↔ STT Relay)

The mobile app communicates with the STT relay server over a single WebSocket connection per reading session.

### Connection

```
wss://<STT_RELAY_HOST>/session
```

### Authentication

The client sends the parent's Clerk JWT as a query parameter on connect:

```
wss://<STT_RELAY_HOST>/session?token=<clerk_jwt>
```

The server validates the JWT before accepting the connection. If invalid, the server closes with code `4001`.

### Message Flow

```
Mobile App                          STT Relay Server                    STT Provider
    |                                     |                                  |
    |--- session:start -----------------→ |                                  |
    |                                     |--- open streaming session ------→ |
    |←-- session:ready ------------------|                                  |
    |                                     |                                  |
    |--- audio:chunk (binary) ----------→ |--- forward audio chunk --------→ |
    |                                     |←-- transcription event ---------|
    |←-- transcript:partial -------------|                                  |
    |                                     |                                  |
    |--- audio:chunk (binary) ----------→ |--- forward audio chunk --------→ |
    |                                     |←-- transcription event ---------|
    |←-- transcript:final ---------------|                                  |
    |                                     |                                  |
    |--- session:end -------------------→ |                                  |
    |←-- session:summary ----------------|                                  |
    |                                     |--- close streaming session ----→ |
```

### Client → Server Messages

**`session:start`** — Initiates a reading session

```typescript
{
  type: 'session:start';
  sessionId: string; // UUID, generated client-side
  childId: string; // UUID of child profile
  storyId: string; // UUID of story being read
  config: {
    sampleRate: number; // Audio sample rate (default: 16000)
    language: string; // BCP-47 code (default: "en-US")
  }
}
```

**`audio:chunk`** — Raw audio data (sent as binary WebSocket frame)

- Format: 16-bit PCM, mono, little-endian
- Sample rate: as specified in `session:start` config
- Chunk size: ~100ms of audio per frame (1600 samples at 16kHz)
- Sent continuously while child is reading

**`session:end`** — Ends the reading session

```typescript
{
  type: 'session:end';
  sessionId: string;
}
```

### Server → Client Messages

**`session:ready`** — Server is ready to receive audio

```typescript
{
  type: 'session:ready';
  sessionId: string;
}
```

**`transcript:partial`** — Interim transcription (not final, may change)

```typescript
{
  type: "transcript:partial";
  sessionId: string;
  words: TranscribedWord[];  // From STT types — word, startTime, endTime, confidence
  transcript: string;        // Full partial transcript string
}
```

**`transcript:final`** — Finalized transcription for a segment (will not change)

```typescript
{
  type: "transcript:final";
  sessionId: string;
  words: TranscribedWord[];
  transcript: string;
}
```

**`session:summary`** — Final session results after `session:end`

```typescript
{
  type: 'session:summary';
  sessionId: string;
  summary: ReadingSessionSummary; // From STT types
}
```

**`error`** — Server or provider error

```typescript
{
  type: 'error';
  sessionId: string;
  code: string; // Machine-readable: "auth_failed" | "provider_error" | "rate_limit" | "invalid_message"
  message: string; // Human-readable description
}
```

### WebSocket Close Codes

| Code   | Meaning                                   |
| ------ | ----------------------------------------- |
| `1000` | Normal close (session ended cleanly)      |
| `4001` | Authentication failed (invalid JWT)       |
| `4002` | Invalid session (missing childId/storyId) |
| `4003` | Provider error (STT service unavailable)  |
| `4008` | Rate limited                              |

### Rules

- All JSON messages are UTF-8 text frames; audio is binary frames
- The server must distinguish binary (audio) from text (JSON) frames
- The client should implement reconnection with exponential backoff (max 3 retries)
- The server should timeout idle connections after 5 minutes of no audio data
- The relay server never stores audio — it forwards chunks in real time and discards them

---

## 🎙️ Audio Capture (Mobile)

### Library

Use **`expo-av`** (`Audio.Recording` API) for microphone access.

### Why `expo-av`

- Included in Expo managed workflow — no native module ejection needed
- Supports configurable sample rate, channels, and encoding
- Works reliably on iOS for streaming audio capture
- `expo-audio` is newer but less battle-tested for continuous streaming use cases

### Recording Configuration

```typescript
const RECORDING_OPTIONS: Audio.RecordingOptions = {
  android: {}, // Not needed — iOS only
  ios: {
    extension: '.raw',
    outputFormat: Audio.IOSOutputFormat.LINEARPCM,
    audioQuality: Audio.IOSAudioQuality.HIGH,
    sampleRate: 16000,
    numberOfChannels: 1,
    bitRate: 256000,
    linearPCMBitDepth: 16,
    linearPCMIsBigEndian: false,
    linearPCMIsFloat: false,
  },
  web: {}, // Not needed — iOS only
};
```

### Audio Streaming Approach

`expo-av` doesn't natively support streaming chunks from a recording. Use this pattern:

1. Start recording with `Audio.Recording`
2. Use `onRecordingStatusUpdate` callback to track recording progress
3. Read the file in chunks at regular intervals (~100ms) using `expo-file-system`
4. Send each new chunk over WebSocket as binary frame
5. On session end, stop recording and clean up the temporary file

```typescript
// Pseudocode — the Reading UI agent owns the real implementation
const recording = new Audio.Recording();
await recording.prepareToRecordAsync(RECORDING_OPTIONS);
await recording.startAsync();

// Poll for new audio data
const chunkInterval = setInterval(async () => {
  const uri = recording.getURI();
  if (uri) {
    const newChunk = await readNewBytes(uri, lastReadPosition);
    if (newChunk.length > 0) {
      websocket.send(newChunk); // Binary frame
      lastReadPosition += newChunk.length;
    }
  }
}, 100);
```

### Permissions

- Request microphone permission at session start, not at app launch
- Use `Audio.requestPermissionsAsync()` — show a clear explanation before the system prompt
- If denied, show a friendly message directing the parent to Settings
- Never record audio outside of an active reading session

### Rules

- Always call `recording.stopAndUnloadAsync()` on session end
- Always release the audio session when not recording
- Delete temporary audio files after session completes
- Audio format must match what the STT relay expects: 16-bit PCM, mono, 16kHz, little-endian

---

## 🗄️ Database Schema (Supabase / Postgres)

### Core Tables

```sql
-- Parent accounts (managed by Clerk, mirrored here)
users
  id          uuid PRIMARY KEY
  clerk_id    text UNIQUE NOT NULL
  email       text NOT NULL
  created_at  timestamptz DEFAULT now()

-- Child profiles (no PII — COPPA compliant)
child_profiles
  id            uuid PRIMARY KEY
  parent_id     uuid REFERENCES users(id)
  display_name  text NOT NULL        -- first name only
  reading_level int DEFAULT 1        -- 1–5
  avatar_id     text                 -- references a preset avatar, not a photo
  created_at    timestamptz DEFAULT now()

-- Stories content
stories
  id          uuid PRIMARY KEY
  title       text NOT NULL
  level       int NOT NULL           -- 1–5
  word_count  int NOT NULL
  content     jsonb NOT NULL         -- structured word array (see Story Content JSON Shape)
  is_free     boolean DEFAULT false
  created_at  timestamptz DEFAULT now()

-- Reading sessions
reading_sessions
  id                uuid PRIMARY KEY
  child_id          uuid REFERENCES child_profiles(id)
  story_id          uuid REFERENCES stories(id)
  started_at        timestamptz NOT NULL
  ended_at          timestamptz
  accuracy_percent  numeric(5,2)
  duration_ms       int
  words_read        int
  words_correct     int

-- Per-session word results
session_words
  id            uuid PRIMARY KEY
  session_id    uuid REFERENCES reading_sessions(id)
  word          text NOT NULL
  expected_word text NOT NULL
  confidence    numeric(4,3)
  was_correct   boolean
  start_time_ms int
  end_time_ms   int

-- Subscriptions (mirrors Apple IAP status)
subscriptions
  id              uuid PRIMARY KEY
  user_id         uuid REFERENCES users(id)
  plan            text DEFAULT 'free'   -- 'free' | 'premium'
  expires_at      timestamptz
  revenuecat_id   text
  updated_at      timestamptz DEFAULT now()
```

### Migration Rules

- **Never edit existing migration files** — always create a new migration
- Migration files named: `YYYYMMDDHHMMSS_description.sql`
- All migrations live in `/supabase/migrations/`

---

## 🔐 Auth Architecture (Clerk + COPPA)

### Account Model

```
Parent Account (Clerk)
└── Child Profile 1 (Supabase — no auth)
└── Child Profile 2 (Supabase — no auth)
```

- Parents sign up and hold all accounts, billing, and consent
- Children never have credentials — they tap their profile avatar to start
- All data associated with a child is accessed through the parent's auth token

### Required Auth Flows

1. **Sign up** → email/password or Sign in with Apple (required by Apple)
2. **Parental consent screen** → plain language, explicit checkbox, privacy policy link
3. **Child profile creation** → first name + avatar selection only (no email, no DOB)
4. **Child session start** → tap avatar, no password

### COPPA Rules — Never Violate These

- Never collect email, phone, or any PII from child profiles
- Never use third-party analytics SDKs that track children (no Firebase Analytics, no Mixpanel on child sessions)
- Never show ads in the app — Kids category prohibition
- Never link outside the app without a parental gate
- Privacy policy must explicitly address children's data collection
- All data collection requires verifiable parental consent obtained at signup

---

## 💳 Payments (Apple IAP via RevenueCat)

### Plans

```
Free:    3 stories, basic progress tracking
Premium: Full story library, weekly reports, difficulty leveling — $12.99/month or $99/year
```

### Rules

- Use **RevenueCat SDK** for all IAP handling — never call StoreKit directly
- Never use Stripe for in-app purchases on iOS (App Store rejection risk)
- Stripe can be used for web-based payments only if a web version is built later
- Always check subscription status via RevenueCat, not local state

---

## ⚙️ Environment Variables

```bash
# STT
STT_PROVIDER=mock                          # assemblyai | deepgram | mock
ASSEMBLYAI_API_KEY=
DEEPGRAM_API_KEY=
STT_CONFIDENCE_THRESHOLD=0.70              # Lower for kids' speech
STT_SAMPLE_RATE=16000
STT_LANGUAGE=en-US

# Supabase
SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=                 # Server only — never expose to client

# Clerk
CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=                          # Server only

# Inngest
INNGEST_EVENT_KEY=
INNGEST_SIGNING_KEY=

# RevenueCat
REVENUECAT_API_KEY=

# STT Relay
STT_RELAY_HOST=                            # WebSocket relay server host

# Environment
NODE_ENV=development                        # development | production
```

**Rules:**

- Never commit `.env` files
- Never expose `_SERVICE_ROLE_KEY` or `_SECRET_KEY` vars to the client
- Always use `mock` for `STT_PROVIDER` in local dev

---

## 📋 Inngest Background Jobs

All async workflows live in `/inngest/functions/`. Current planned functions:

| Function                 | Trigger                    | Purpose                                         |
| ------------------------ | -------------------------- | ----------------------------------------------- |
| `generate-weekly-report` | Scheduled (Sunday 8pm)     | Compile weekly parent summary                   |
| `session-complete`       | Event: `session/completed` | Aggregate session stats, update accuracy trends |
| `difficulty-check`       | Event: `session/completed` | Evaluate if child is ready for next level       |
| `send-push-notification` | Event: `notification/send` | Push to parent device                           |

### Rules

- Every Inngest function must have a unique `id` string
- Always handle failures with `step.run()` for retryable steps
- Never put real-time logic in Inngest — it's async only

---

## 🧪 Testing Strategy

### Framework

- **Jest** — test runner for all packages and server code
- **React Native Testing Library** — component and screen tests for the mobile app
- **MSW (Mock Service Worker)** — mock HTTP/WebSocket in integration tests (server-side only)

### Structure

Tests live next to the code they test:

```
components/
  WordHighlight.tsx
  WordHighlight.test.tsx
packages/stt/
  services/
    reading-session.service.ts
    reading-session.service.test.ts
```

### What to Test

| Layer                    | What to Test                                                          | Priority                                   |
| ------------------------ | --------------------------------------------------------------------- | ------------------------------------------ |
| `packages/stt`           | Word alignment, scoring, mispronunciation detection, provider factory | **Critical** — this is core business logic |
| `packages/stt` providers | Each provider normalizes to shared types correctly                    | **Critical**                               |
| `server/stt-relay`       | WebSocket message handling, auth validation, error codes              | **High**                                   |
| `apps/mobile` components | Word highlighting, reading progress display                           | **Medium**                                 |
| `apps/mobile` screens    | Session flow (start → read → end → summary)                           | **Medium**                                 |
| `inngest/functions`      | Job logic in isolation (mock Supabase)                                | **Medium**                                 |

### Coverage Expectations

- `packages/stt/**` — aim for **90%+ coverage** (this is the core engine)
- `server/stt-relay/**` — aim for **80%+ coverage**
- `apps/mobile/**` — aim for **70%+ coverage** (UI tests are brittle, focus on logic)
- No hard enforcement gate initially — we'll add CI checks once the baseline is stable

### Rules

- Always use the mock STT provider in tests — never hit real APIs
- Tests must be deterministic — no reliance on timing, network, or external state
- Name test files `*.test.ts` or `*.test.tsx` — Jest is configured to find these
- Use `describe` blocks that match the function/component name
- Each test should test one behavior — name it clearly: `"flags word as incorrect when confidence below threshold"`

---

## 🧹 Linting & Formatting

### Tools

- **ESLint** — static analysis and code quality
- **Prettier** — auto-formatting (no style debates)

### ESLint Config

Extend from these shared configs:

```
@typescript-eslint/recommended
eslint-plugin-react
eslint-plugin-react-hooks
eslint-plugin-react-native
```

### Key Rules

```jsonc
{
  // TypeScript strict
  "@typescript-eslint/no-explicit-any": "error",
  "@typescript-eslint/no-unused-vars": ["error", { "argsIgnorePattern": "^_" }],

  // React
  "react-hooks/rules-of-hooks": "error",
  "react-hooks/exhaustive-deps": "warn",

  // Project-specific
  "no-console": ["error", { "allow": ["warn", "error"] }],
  "no-restricted-imports": [
    "error",
    {
      "patterns": [
        {
          "group": ["**/assemblyai.provider*", "**/deepgram.provider*"],
          "message": "Import from packages/stt/index.ts instead. Never import providers directly.",
        },
      ],
    },
  ],
}
```

The `no-restricted-imports` rule **enforces the STT Golden Rule at the linter level** — any direct provider import will fail CI.

### Prettier Config

```jsonc
{
  "semi": true,
  "singleQuote": true,
  "trailingComma": "all",
  "printWidth": 100,
  "tabWidth": 2,
  "arrowParens": "always",
}
```

### Scripts

```bash
pnpm lint          # ESLint across all workspaces
pnpm format        # Prettier write across all workspaces
pnpm format:check  # Prettier check (CI only — fails on unformatted code)
```

### Rules

- Prettier runs on save (configure editor) — no manual formatting
- ESLint runs in CI — PRs with lint errors cannot merge
- No ESLint rule disabling without a comment explaining why: `// eslint-disable-next-line @typescript-eslint/no-explicit-any -- legacy API returns untyped response`
- Config files live at the monorepo root — workspaces inherit, don't duplicate

---

## 📝 Commit Conventions (Commitizen — Conventional Commits)

**Every commit must follow this format:**

```
type(scope): short description [LINEAR-TICKET-ID]

Examples:
feat(stt): add AssemblyAI streaming provider [READ-12]
fix(auth): handle Sign in with Apple token expiry [READ-34]
chore(db): add session_words migration [READ-45]
test(stt): add mock provider unit tests [READ-56]
docs(claude): update CLAUDE.md with Inngest functions [READ-67]
```

### Types

| Type       | When to Use                         |
| ---------- | ----------------------------------- |
| `feat`     | New feature or capability           |
| `fix`      | Bug fix                             |
| `chore`    | Config, deps, tooling, migrations   |
| `test`     | Adding or updating tests            |
| `docs`     | Documentation only                  |
| `refactor` | Code change with no behavior change |
| `style`    | Formatting, no logic change         |

### Scopes

Use the layer or module name: `stt`, `auth`, `db`, `reading`, `dashboard`, `inngest`, `server`, `expo`, `claude`

### Rules

- Always include the Linear ticket ID in brackets at the end if one exists
- Keep the description under 72 characters
- Use present tense: "add feature" not "added feature"
- Never use a generic message like "updates", "fixes", "changes", or "WIP" alone

---

## 🤖 Conductor / Multi-Agent Rules

When running parallel agents via Conductor, each agent owns a clearly scoped domain. Agents must not touch files outside their domain without flagging it first.

### Domain Ownership

| Agent            | Owns                                      | Branch prefix     |
| ---------------- | ----------------------------------------- | ----------------- |
| STT Agent        | `packages/stt/**`                         | `feat/stt-`       |
| Auth Agent       | `apps/mobile/app/(auth)/**`, Clerk config | `feat/auth-`      |
| DB Agent         | `supabase/migrations/**`, schema types    | `feat/db-`        |
| Reading UI Agent | `apps/mobile/app/(reading)/**`            | `feat/reading-`   |
| Dashboard Agent  | `apps/mobile/app/(parent)/**`             | `feat/dashboard-` |
| Server Agent     | `server/stt-relay/**`                     | `feat/server-`    |
| Inngest Agent    | `inngest/functions/**`                    | `feat/inngest-`   |

### Rules

- Each agent works on its own git worktree (Conductor handles this automatically)
- Never directly push to `main` — all work goes through PRs
- If your task requires touching another agent's domain, stop and flag it for review
- Always run `pnpm typecheck` before committing

---

## ✅ General Coding Rules

- **TypeScript strict mode** — no `any`, no type suppression without a comment explaining why
- **No direct provider imports** — always go through `packages/stt/index.ts`
- **No PII in child profiles** — first name and avatar only
- **No console.log in production code** — use a proper logger
- **Mock provider by default** — `STT_PROVIDER=mock` for all local development
- **Migrations are append-only** — never edit an existing migration file
- **One concern per file** — don't mix UI, business logic, and data fetching in one file
- **Env vars via process.env only** — never hardcode keys, URLs, or secrets
- Use `pnpm` as the package manager — never `npm` or `yarn`

---

## 🎨 UI Design System & App Store Compliance (Kids Category)

> **This section is mandatory reading before building or modifying any screen.**
> Syllaboo is published under the **Apple App Store Kids Category**. This imposes strict restrictions that go far beyond normal App Store guidelines. Violating any of these will result in **rejection during App Review**.

---

### Apple Kids Category — Hard Rules (Non-Negotiable)

These rules apply to every screen a child can access. No exceptions.

#### 1. No External Links Without a Parental Gate

- **Never** render a tappable URL, `<Text>` with `onPress` linking out, or `Linking.openURL()` anywhere in the child-facing UI
- Any link that leaves the app (Safari, App Store, another app) **must** be behind a parental gate
- This includes: privacy policy links, "Learn More", support links, social media icons, and deep links to other apps
- **Parental gate implementation**: Use a simple math problem (e.g., "What is 14 + 23?") or a text-entry challenge that a young child cannot solve. Never use a simple "Are you a parent?" yes/no prompt — Apple rejects these

#### 2. No Ads — Period

- The Kids Category prohibits all advertising, including house ads for your own products
- Never integrate any ad SDK (AdMob, Unity Ads, Facebook Audience Network, etc.)
- Never show banners, interstitials, rewarded video, or native ad units
- "Premium upsell" cards shown to children (e.g., "Unlock more stories!") **must not** use manipulative, urgent, or pressure language — see Paywall Rules below

#### 3. No Third-Party Analytics or Tracking on Child Sessions

- **Never** import Firebase Analytics, Mixpanel, Amplitude, Segment, or any behavioral analytics SDK that fires on child-facing screens
- Supabase row inserts for session data are fine — this is first-party, server-side data
- If analytics are needed on child screens, use only **first-party, on-device counters** or Supabase-backed events
- Apple allows analytics on **parent-only screens** (behind auth), but keep it minimal

#### 4. No Data Collection from Children

- Child profile screens collect **first name and avatar selection only** — no email, no DOB, no location, no photos
- Never request camera, photo library, or contacts permissions in child-facing flows
- Microphone permission is allowed **only** during an active reading session and must be clearly explained
- Never use device fingerprinting, IDFA, or any identifier tied to a child

#### 5. No User-Generated Content Visible to Other Users

- Children cannot post, share, or see content from other children
- No chat, messaging, comments, forums, or social features
- Leaderboards are only acceptable if they show the child's own data (not other children)

#### 6. No Behavioral Push Notifications to Children

- Push notifications to encourage the child to return ("Come back and read!") are prohibited
- Notifications must go to the **parent's device/account** only
- In-app encouragement (mascot saying "Great job!") during an active session is fine

---

### Paywall & Purchase Rules (Kids Category Specific)

Apple has **extra scrutiny** on how Kids apps present purchases. These rules apply in addition to standard IAP guidelines.

#### What's Allowed

- A **single, clearly labeled** premium upsell section on the **parent dashboard** (behind auth)
- Lock icons on premium stories in the library grid — this is a passive indicator, not a prompt
- A paywall screen that the **parent** navigates to intentionally

#### What's Prohibited

- **Pop-ups, modals, or interstitials** urging purchase on any child-facing screen
- Language like "Buy now!", "Ask your parents!", "You're missing out!", or countdown timers
- Tapping a locked story should **not** immediately show a purchase modal. Instead: show a message like "This story is for Premium readers. Ask a grown-up to unlock it in the Parent Hub." with no purchase button — the parent must navigate to the Parent Hub themselves
- Never show pricing to children. Dollar amounts (`$12.99/mo`) belong **only** on parent-facing screens
- Never auto-redirect children to a purchase flow

#### Parental Gate for Purchases

- Any screen that initiates an Apple IAP transaction **must** be behind a parental gate
- The parental gate must appear **before** the system purchase dialog, not after
- RevenueCat's `presentPaywall()` should only be called after the gate is passed

---

### Parental Gate Implementation

Use this pattern consistently across the app.

```typescript
// Pattern — NOT the literal implementation. The agent owns the real code.
// Parental gate = math problem with randomized operands

interface ParentalGateConfig {
  onSuccess: () => void;
  onCancel: () => void;
  reason: string; // Shown to user: "To access Parent Hub" / "To change settings"
}

// Generate: two random numbers (10–50), require their sum
// Display: "To continue, please solve: 27 + 38 = ?"
// Input: numeric keypad only
// Allow: 2 attempts, then cooldown of 30 seconds
// Never: use yes/no, slider, or single-tap gates — Apple rejects these
```

#### Where Parental Gates Are Required

| Action                                                 | Gate Required? |
| ------------------------------------------------------ | -------------- |
| Opening Parent Hub / Dashboard                         | **Yes**        |
| Changing app settings                                  | **Yes**        |
| Initiating a purchase or subscription                  | **Yes**        |
| Tapping any external link (privacy policy, support)    | **Yes**        |
| Viewing or modifying child profiles (from parent side) | **Yes**        |
| Child tapping their own avatar to start reading        | No             |
| Child navigating the story library                     | No             |
| Child starting/ending a reading session                | No             |

---

### Design Tokens — Syllaboo Visual Language

All agents must use these tokens. Never hardcode raw hex values in components — always reference the theme.

#### Color Palette

```typescript
const colors = {
  // Backgrounds
  bg: {
    primary: '#FFF8F0', // Warm cream — main app background
    secondary: '#FFF3E6', // Slightly deeper cream — card backgrounds
    surface: '#FFFFFF', // White — elevated cards, modals, input fields
    reading: '#FFF8F0', // Reading session background (same as primary)
  },

  // Brand
  brand: {
    primary: '#F5A623', // Warm amber/gold — primary buttons, CTAs, highlights
    primaryDark: '#E0911A', // Darker amber — pressed state
    secondary: '#7ECEC1', // Soft teal — secondary actions, accents
    secondaryDark: '#5EBDB0', // Darker teal — pressed state
    accent: '#FF6B6B', // Coral — error states, mispronounced words
  },

  // Text
  text: {
    primary: '#2D2D2D', // Near-black — headings, body text
    secondary: '#6B7280', // Medium gray — labels, helper text
    disabled: '#B0B0B0', // Light gray — disabled states
    onBrand: '#FFFFFF', // White — text on brand-colored buttons
    reading: '#1A1A2E', // Dark navy — story text (high contrast for readability)
  },

  // State
  state: {
    success: '#4CAF50', // Green — correct words, achievements
    warning: '#FFC107', // Yellow — partial matches
    error: '#FF6B6B', // Coral — mispronounced words (same as brand.accent)
    highlight: '#FFD93D', // Bright yellow — current word highlight during reading
    locked: '#D4C5A9', // Muted gold — lock icon overlay on premium content
  },

  // Child UI specific
  child: {
    starGold: '#FFD700', // Stars, XP indicators
    levelPurple: '#9B59B6', // Level badges
    streakOrange: '#FF8C42', // Streak badges
    badgeBg: '#F0E6FF', // Light purple — badge backgrounds
  },
} as const;
```

#### Typography

```typescript
// Font family: Use a single, highly legible font.
// Recommended: "Nunito" (rounded, friendly, excellent for children + parents)
// Fallback: System default (San Francisco on iOS)
// Never use: decorative or script fonts for body/UI text

const typography = {
  // Display — "GREAT JOB!", celebration screens only
  display: {
    fontSize: 36,
    fontWeight: '800' as const, // ExtraBold
    lineHeight: 44,
    letterSpacing: 1,
  },

  // Headings — screen titles, section headers
  h1: { fontSize: 28, fontWeight: '700' as const, lineHeight: 36 },
  h2: { fontSize: 22, fontWeight: '700' as const, lineHeight: 30 },
  h3: { fontSize: 18, fontWeight: '600' as const, lineHeight: 26 },

  // Body
  body: { fontSize: 16, fontWeight: '400' as const, lineHeight: 24 },
  bodyBold: { fontSize: 16, fontWeight: '600' as const, lineHeight: 24 },

  // Small — labels, captions, metadata
  caption: { fontSize: 13, fontWeight: '500' as const, lineHeight: 18 },
  small: { fontSize: 11, fontWeight: '400' as const, lineHeight: 16 },

  // Reading — story text shown to child during reading session
  // CRITICAL: Must be large, well-spaced, and highly legible
  reading: {
    fontSize: 32,
    fontWeight: '600' as const,
    lineHeight: 48, // 1.5x line height for children
    letterSpacing: 0.5, // Slight letter spacing aids young readers
    wordSpacing: 6, // Extra word spacing for clarity
  },

  // Reading highlight — the current word being read
  readingHighlight: {
    fontSize: 32,
    fontWeight: '700' as const,
    lineHeight: 48,
  },
} as const;
```

#### Spacing & Layout

```typescript
const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

const layout = {
  screenPadding: 20, // Horizontal padding on all screens
  cardBorderRadius: 16, // Rounded cards
  buttonBorderRadius: 28, // Pill-shaped buttons (child UI)
  buttonBorderRadiusParent: 12, // Softer rounding for parent UI
  inputBorderRadius: 12, // Form inputs
  avatarSize: {
    small: 40,
    medium: 64,
    large: 120, // Profile screen, child selector
  },
  tabBarHeight: 80, // Bottom tab bar
  minTapTarget: 44, // Apple HIG minimum (MUST enforce — see Accessibility)
} as const;
```

#### Shadows & Elevation

```typescript
const shadows = {
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  button: {
    shadowColor: '#F5A623',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  modal: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 8,
  },
} as const;
```

---

### Screen Zones — Parent vs. Child

The app has two distinct UI zones with different design rules. **Every screen must be classified as one or the other.**

#### Child Zone — `(reading)` routes + story library + profile (child-facing)

- **Aesthetic**: Warm, playful, high-contrast, large touch targets
- Background: `colors.bg.primary` (warm cream)
- Corners: heavily rounded (`cardBorderRadius: 16+`)
- Buttons: pill-shaped, large (min height 56px), high contrast
- Text: large (`reading` or `h2` minimum for interactive labels)
- Mascot: Sammy the Sloth appears for encouragement, transitions, and empty states
- Animations: celebratory (confetti, stars, bounce), never punitive
- **Restrictions**: No external links, no pricing, no analytics, no tracking

#### Parent Zone — `(parent)` routes + `(auth)` routes

- **Aesthetic**: Clean, warm, informational — still friendly but more structured
- Background: `colors.bg.primary` with `colors.bg.surface` cards
- Corners: softer rounding (`buttonBorderRadiusParent: 12`)
- Text: standard `body` sizing
- Data-heavy: charts, stats, word lists — prioritize clarity
- **Allowed**: External links (with parental gate already passed), pricing, analytics, settings

---

### Component Patterns

#### Buttons

```typescript
// Child-facing primary button (e.g., "LET'S GO!", "CONTINUE", "READ NOW")
{
  height: 56,
  borderRadius: 28,              // Pill shape
  backgroundColor: colors.brand.primary,
  paddingHorizontal: spacing.xl,
  // Text: uppercase, bold, white, fontSize 18+
  // Shadow: shadows.button
  // Pressed state: backgroundColor → colors.brand.primaryDark, scale(0.97)
}

// Child-facing secondary button (e.g., "END SESSION")
{
  height: 48,
  borderRadius: 24,
  backgroundColor: colors.bg.surface,
  borderWidth: 2,
  borderColor: colors.text.secondary,
  // Text: sentence case, semibold, colors.text.primary
}

// Parent-facing button
{
  height: 48,
  borderRadius: 12,
  backgroundColor: colors.brand.primary,
  // Text: sentence case, semibold, white
}
```

#### Cards

```typescript
// Story card (library grid)
{
  borderRadius: 16,
  overflow: 'hidden',
  backgroundColor: colors.bg.surface,
  ...shadows.card,
  // Image: fills top portion, aspect ratio 16:10
  // Title: below image, h3, 2 lines max with ellipsis
  // Badge: "FREE" green pill or lock icon — top-right corner of image
}

// Stat card (parent dashboard)
{
  borderRadius: 16,
  backgroundColor: colors.bg.surface,
  padding: spacing.lg,
  ...shadows.card,
  // Icon: top-left, 24x24, tinted with relevant color
  // Label: caption, colors.text.secondary
  // Value: h1, colors.text.primary
  // Trend: small text + arrow, green for up / red for down
}
```

#### Reading Session UI

```typescript
// Word display — the most critical UI in the entire app
// Rules:
// 1. Words use `typography.reading` (fontSize 32, semibold)
// 2. Current word: `colors.text.reading` + slight scale-up (1.05) + underline/highlight
// 3. Correct past words: `colors.state.success` (green tint)
// 4. Mispronounced words: `colors.state.error` (coral) — never use red alone (colorblind)
//    ALSO add a subtle wavy underline or dotted underline as a secondary indicator
// 5. Upcoming words: `colors.text.secondary` (gray, slightly faded)
// 6. Word spacing: generous — at least 6px between words
// 7. Line wrapping: break at word boundaries only — never hyphenate for children
// 8. Max words visible at once: 8-12 — scroll the text, don't shrink the font
// 9. Background: clean, uncluttered — no illustrations behind the text area
```

#### Mascot (Sammy the Sloth)

```typescript
// Sammy appears in these contexts:
// - Reading session: small (64x64), positioned top-center with speech bubble
// - Celebration screen: large (200x200), center, with party hat + confetti
// - Empty states: medium (120x120), center, with contextual pose
// - Story intro: medium, peeking from the right side
// - Library header: small, peeking from top-left

// Rules:
// - Sammy is ALWAYS pre-rendered artwork (PNG/SVG asset) — never AI-generated at runtime
// - Sammy's expressions: happy, excited, encouraging, sleeping (for "no sessions yet")
// - Sammy NEVER shows negative emotions (no sad, angry, disappointed faces)
// - Mispronounced words: Sammy says "Let's try that again!" — never "Wrong!" or "Incorrect!"
// - Sammy's speech bubbles use friendly, encouraging, age-appropriate language
```

#### Bottom Tab Bar

```typescript
// Child tab bar:
// Tabs: Home (house icon), Library (book icon), Reading (mic icon), Profile (sloth avatar)
// Active: brand.primary color, label visible
// Inactive: text.secondary, label visible (always show labels for children)
// Height: 80px (taller than standard for larger tap targets)
// Background: colors.bg.surface with top shadow

// Parent tab bar:
// Tabs: Home (grid icon), Library (book icon), Progress (chart icon), Profile (sloth icon)
// Standard iOS tab bar sizing (49pt), labels always visible
```

---

### Accessibility — Kids-Specific Requirements

These go beyond standard iOS accessibility guidelines because the target audience is ages 5–10.

#### Touch Targets

- **Minimum 44x44pt** (Apple HIG) — but for child-facing screens, prefer **56x56pt** or larger
- Story cards in the library grid: minimum 120pt tall tap area
- Buttons in reading session: minimum 48pt height
- Never place two tappable elements closer than 12pt apart

#### Color & Contrast

- **4.5:1 minimum contrast ratio** for all text on all screens (WCAG AA)
- Reading session text: **7:1 ratio** (WCAG AAA) — `colors.text.reading` (#1A1A2E) on `colors.bg.reading` (#FFF8F0) = ~15:1 ✓
- Never use color as the **only** indicator — always pair with shape, icon, or text (e.g., mispronounced words get coral color + wavy underline)
- Ensure all state indicators work in grayscale

#### Text & Readability

- Reading session: minimum `fontSize: 28` — 32 is the default and preferred
- Never use all-caps for story text (harder for developing readers to parse)
- All-caps is acceptable for short button labels ("CONTINUE", "LET'S GO!") and celebration headings ("GREAT JOB!")
- Minimum `lineHeight: 1.4x` for all body text; `1.5x` for reading session text
- Never justify text — always use left alignment for story content

#### Motion & Animation

- Respect `AccessibilityInfo.isReduceMotionEnabled` — disable confetti, bounces, and auto-animations when enabled
- Never use flashing or strobing effects (seizure risk)
- Keep animations under 300ms for micro-interactions, under 800ms for celebrations
- Auto-playing animations (mascot wave, confetti) must not loop infinitely — max 2-3 cycles

#### VoiceOver / Screen Reader

- All images must have `accessibilityLabel` set
- Story cards: label = story title + level + free/locked status
- Reading session: the word display should be announced word-by-word as the child reads (not all at once)
- Buttons: clear, descriptive labels — "Start reading The Sleepy Sloth's Big Day" not just "Start"
- Lock icons: `accessibilityLabel="Premium story, locked"` not just "lock"

---

### Navigation Patterns

#### Screen Transitions

- **Stack navigation** (push/pop) for: story detail → reading session → celebration
- **Tab navigation** for: main app tabs (Library, Reading, Progress, Profile)
- **Modal navigation** for: parental gate, settings, purchase flows
- Transition style: iOS native slide (default Expo Router behavior) — don't override with custom animations unless there's a strong UX reason
- Exception: celebration screen can use a fade-in or scale-up entrance for dramatic effect

#### Back Navigation

- **Always provide a back button** on every non-root screen — never trap the user
- Reading session: back button should trigger a confirmation ("Are you sure you want to stop reading?") to prevent accidental taps
- Child screens: use a chunky, clearly visible back arrow (not a thin chevron)

#### Deep Links

- Deep links into the app are allowed but must **always land on a parent-authenticated screen first**, never directly into a child session
- Universal links for marketing (syllaboo.app/stories/xyz) should open the story in the library, not auto-start a reading session

---

### Screen Inventory & Zone Classification

| Screen                 | Zone   | Route Group | Notes                                      |
| ---------------------- | ------ | ----------- | ------------------------------------------ |
| Sign In / Sign Up      | Parent | `(auth)`    | Clerk UI, Sign in with Apple required      |
| Parental Consent       | Parent | `(auth)`    | Explicit checkbox + privacy policy link    |
| Child Profile Create   | Parent | `(auth)`    | First name + avatar only                   |
| Child Selector         | Child  | `(reading)` | Tap avatar to start — no password          |
| Story Library          | Child  | `(reading)` | Grid of stories, level filters, lock icons |
| Story Detail / Intro   | Child  | `(reading)` | Cover art, title, "Let's Go!" CTA          |
| Reading Session        | Child  | `(reading)` | Core reading UI with word tracking         |
| Celebration / Summary  | Child  | `(reading)` | Stars, XP, level-up — no pricing           |
| Parent Hub (Dashboard) | Parent | `(parent)`  | Stats, charts, struggled words             |
| Weekly Report          | Parent | `(parent)`  | Detailed weekly breakdown                  |
| Subscription / Paywall | Parent | `(parent)`  | Behind parental gate, pricing shown        |
| Settings               | Parent | `(parent)`  | Behind parental gate                       |
| Child Profile Edit     | Parent | `(parent)`  | Behind parental gate                       |

---

### Anti-Patterns — Things That Will Get the App Rejected

> If you build any of these, App Review **will** reject the submission.

| Anti-Pattern                                                         | Why It's Rejected                                                            | What to Do Instead                                                                |
| -------------------------------------------------------------------- | ---------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| `Linking.openURL()` on a child screen without a parental gate        | Kids Category Rule 1.3 — no external links without gate                      | Route through parental gate first, or remove the link entirely                    |
| "Ask your parents to buy Premium!" text on a child screen            | Guideline 3.1.1 — manipulative purchase language aimed at children           | Show "This story is for Premium readers" with no purchase CTA                     |
| Firebase Analytics SDK imported anywhere                             | If it fires on child screens, violates COPPA / Kids Category analytics rules | Use Supabase-backed first-party events only                                       |
| Full-screen upsell modal after a child finishes a reading session    | Guideline 3.1.1 — purchase pressure directed at children                     | Show celebration screen only; parent sees upsell in their dashboard               |
| Collecting child's age, birthday, or email                           | COPPA violation, Kids Category Rule 5.1.1(ii)                                | Collect only first name and avatar selection                                      |
| WebView loading any external URL in child zone                       | Uncontrolled content + external link without gate                            | Never use WebView in child-facing screens                                         |
| Social sharing buttons on any screen                                 | Kids Category — no social features for children                              | Remove entirely; parent can screenshot if they want                               |
| "You've been gone for 3 days! Come back!" push notification          | Behavioral/manipulative notification targeting child                         | Send only to parent account: "Scout read 3 stories this week!"                    |
| Custom IDFA or device fingerprinting                                 | Kids Category tracking prohibition                                           | Use only Supabase user IDs tied to parent account                                 |
| Background audio recording when app is not in active reading session | Privacy violation — microphone access beyond stated purpose                  | Record only during active session; call `stopAndUnloadAsync()` immediately on end |

---

### Illustrations & Assets

#### Style Guidelines

- Art style: soft watercolor / storybook illustration — warm, gentle, friendly
- Color palette for illustrations: should harmonize with the app's cream/amber/teal palette
- Characters: round shapes, big eyes, friendly expressions — think picture book, not cartoon network
- No scary, violent, or intense imagery — even mild villains should be goofy, not threatening
- All illustrations are **static assets** bundled with the app — never fetch from a CDN at runtime for child screens (offline capability + no external requests)

#### Asset Requirements

- Story cover art: 600x400 minimum, 2x and 3x scales for Retina
- Mascot variants: provide all expressions as separate PNGs with transparent backgrounds
- Achievement badges: 120x120, circular, with clear iconography
- Level indicators: consistent color coding across all screens
  - Level 1: Green (#4CAF50)
  - Level 2: Yellow (#FFC107)
  - Level 3: Orange (#FF8C42)
  - Level 4: Pink (#FF6B8A)
  - Level 5: Purple (#9B59B6)

#### Dark Mode

- **Not supported at launch.** The warm cream palette is the brand identity.
- Force light mode: set `UIUserInterfaceStyle = Light` in `Info.plist`
- This is acceptable for Kids Category apps and avoids doubling the design work
- Revisit post-launch if users request it

---

### Loading & Empty States

#### Loading

- Never show a blank screen — always show a skeleton or the mascot with a loading animation
- Reading session: show the story title and a progress bar while STT connection establishes
- Library: show placeholder cards with a subtle pulse animation
- Target: all screens should show meaningful content within 500ms

#### Empty States

- Story library (no stories loaded): Sammy holding a book, "Stories are loading! Hang tight."
- No reading sessions yet: Sammy sleeping, "No reading adventures yet! Pick a story to start."
- Parent dashboard (no data): Simple message with illustration, "Once [child name] reads their first story, you'll see their progress here."
- Never show a blank white screen, a raw error message, or a technical spinner

#### Error States

- Network errors: friendly message + retry button, never show error codes or stack traces
- STT connection failure: "Oops! I couldn't hear you. Let's try again!" + retry
- Microphone permission denied: clear, parent-friendly explanation + "Open Settings" button
- Never show toasts or snackbars on child screens — use inline messages with the mascot instead

---

### Performance Constraints

- **First Meaningful Paint**: under 1.5 seconds on iPhone SE (2nd gen) — the lowest-spec target device
- **Reading session start to "Listening..."**: under 2 seconds (WebSocket connect + STT ready)
- **Word highlight latency**: under 200ms from STT transcript to on-screen highlight update
- **Animations**: 60fps on all target devices — if an animation drops frames, simplify or remove it
- **Image sizes**: all bundled images optimized (WebP preferred), no single image > 500KB
- **App launch to interactive**: under 3 seconds cold start

---

### Summary of Key Rules for Agents

1. **Classify every screen** as Child Zone or Parent Zone before writing any UI code
2. **Parental gates** before: external links, purchases, settings, profile edits
3. **No pricing, purchase CTAs, or manipulative language** on child screens
4. **No third-party analytics SDKs** — use Supabase-backed events only
5. **No external links** in child zone without a parental gate
6. **44pt minimum touch targets** everywhere; prefer 56pt for child screens
7. **Use design tokens** from this section — never hardcode hex colors or font sizes
8. **Reading text is sacred**: fontSize 32, high contrast, generous spacing, no clutter behind it
9. **Sammy is always encouraging** — never negative, disappointed, or punitive
10. **Dark mode is off** — force light mode via Info.plist
11. **Test on iPhone SE** — if it works there, it works everywhere
12. **Respect `isReduceMotionEnabled`** — disable celebrations and auto-animations when set

## 🚀 Getting Started (New Agent Checklist)

Before writing any code, an agent should:

1. Read this entire `CLAUDE.md`
2. Check the Linear ticket for the specific task scope
3. Confirm which domain you own (see Conductor domain table above)
4. Verify `STT_PROVIDER=mock` is set in your `.env`
5. Run `pnpm install` and `pnpm typecheck` to confirm clean state
6. Create your branch with the correct prefix (e.g. `feat/stt-assemblyai-provider`)
7. Commit frequently with conventional commit messages including the Linear ticket ID
