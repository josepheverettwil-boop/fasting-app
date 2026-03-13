# Fasting App

A cross-platform (Web, iOS, Android) fasting tracker with social features, built with Expo, Supabase, and React Native.

## Features

- **Fasting Timer** — Large circular timer with real-time progress, fasting phase tracking (Fed State → Autophagy), and preset durations (12:12, 16:8, 18:6, 20:4, OMAD, 36h, 48h, 72h)
- **Mood Tracking** — 5-point scale mood logging during fasts with optional notes
- **Fast Summary** — Post-fast report showing mood journey chart, peaks, lows, and averages
- **Social** — Add friends, see each other's active fasting status in real-time
- **Messaging** — Send support messages to friends who are fasting; peer Q&A
- **Group Fasts** — Create and join group fasting sessions with friends
- **Cross-Platform** — Single codebase for Web, iOS, and Android via Expo

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Expo (React Native) + Expo Router |
| Database | Supabase (PostgreSQL + Realtime) |
| Auth | Supabase Auth |
| Email | Resend (via Supabase Edge Functions) |
| Hosting | Render (web) / App Store / Google Play |

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- A [Supabase](https://supabase.com) project
- (Optional) [Resend](https://resend.com) account for emails

### Setup

1. **Clone the repo**
   ```bash
   git clone https://github.com/YOUR_USERNAME/fasting-app.git
   cd fasting-app
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment**
   ```bash
   cp .env.example .env
   ```
   Fill in your Supabase URL and anon key in `.env`.

4. **Run database migrations**
   Execute `supabase/migrations/001_initial_schema.sql` in your Supabase SQL Editor.

5. **Start the app**
   ```bash
   # Web
   npm run web

   # iOS Simulator
   npm run ios

   # Android Emulator
   npm run android
   ```

## Project Structure

```
fasting-app/
├── app/                    # Expo Router screens
│   ├── (tabs)/             # Main tab navigation
│   │   ├── index.tsx       # Timer / Home
│   │   ├── social.tsx      # Friends & Group Fasts
│   │   ├── messages.tsx    # Conversations
│   │   └── profile.tsx     # Profile & Stats
│   ├── auth/               # Login / Signup
│   ├── chat/[userId].tsx   # 1:1 Chat
│   ├── fast-summary/[id].tsx # Post-fast summary
│   └── group-fast/         # Group fast create & detail
├── components/             # Reusable UI components
├── contexts/               # React contexts (Auth, Fasting)
├── lib/                    # Supabase client, types, hooks, theme
│   └── hooks/              # useFriends, useMessages, useGroupFasts
├── supabase/migrations/    # Database schema
├── render.yaml             # Render deployment config
└── app.json                # Expo config
```

## Deployment

### Web (Render)

1. Connect your GitHub repo to [Render](https://render.com)
2. Render will auto-detect `render.yaml`
3. Set environment variables in the Render dashboard

### Mobile

```bash
# Build for iOS
npx eas build --platform ios

# Build for Android
npx eas build --platform android
```

## License

MIT
