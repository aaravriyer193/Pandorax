# Pandorax

> *The world is stranger than you think.*

A curiosity-first discovery platform — a daily feed of astonishing wonders, interactive simulations, and forums for people who can't stop asking why.

---

## Stack

| Layer | Tool |
|---|---|
| Frontend | React 18 + Vite |
| Styling | Tailwind CSS + Lora + DM Sans |
| Database | Supabase (Postgres + RLS) |
| Auth | Supabase Auth — Google SSO |
| Storage | Supabase Storage (avatars, images, sim HTML files) |
| Hosting | Vercel (free tier) |
| News pipeline | GitHub Actions cron → Supabase (coming in phase 3) |

**Zero server costs.** Supabase free tier + Vercel free tier = $0/month.

---

## Getting started

### 1. Clone and install

```bash
git clone https://github.com/you/pandorax.git
cd pandorax
npm install
```

### 2. Set up Supabase

1. Go to [supabase.com](https://supabase.com) and create a new project
2. In **SQL Editor**, paste and run the entire contents of `pandorax-schema.sql`
3. In **Authentication → Providers**, enable **Google** and add your OAuth credentials
   - Get Google OAuth credentials at [console.cloud.google.com](https://console.cloud.google.com)
   - Set the authorised redirect URI to: `https://your-project.supabase.co/auth/v1/callback`
4. In **Storage**, confirm the three buckets were created: `avatars`, `wonder-images`, `sim-files`
   - If not, create them manually and set them to **public**

### 3. Environment variables

```bash
cp .env.example .env
```

Open `.env` and fill in:

```
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

Both values are in: **Supabase Dashboard → Settings → API**

### 4. Make yourself admin

1. Run the app and sign in with Google once
2. In **Supabase → SQL Editor**, run:

```sql
update public.profiles
set is_admin = true
where id = 'paste-your-auth-uid-here';
```

Find your UID in: **Supabase → Authentication → Users**

### 5. Seed the database (optional but recommended)

In `pandorax-schema.sql`, scroll to the bottom seed block. Uncomment it, paste your user ID, and run it in the SQL editor. This gives you 7 starter wonders so the feed isn't empty on first load.

### 6. Run locally

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

---

## Project structure

```
pandorax/
├── index.html
├── package.json
├── vite.config.js
├── tailwind.config.js
├── postcss.config.js
├── .env.example
├── pandorax-schema.sql        ← Full Supabase schema (run once)
└── src/
    ├── main.jsx               ← App entry, providers, toaster
    ├── App.jsx                ← Router + route guards
    ├── index.css              ← Global styles, paper texture, design tokens
    ├── lib/
    │   └── supabase.js        ← Supabase client + all query helpers
    ├── hooks/
    │   ├── useAuth.js         ← Session, profile, Google sign-in/out
    │   └── useLike.js         ← Optimistic like toggling
    ├── components/
    │   ├── Nav.jsx            ← Responsive nav + Avatar component
    │   ├── WonderCard.jsx     ← Feed card (standard + featured variant)
    │   ├── WonderModal.jsx    ← Full-screen wonder detail sheet
    │   ├── SubmitWonderModal.jsx ← User submission form with image upload
    │   ├── CommentSection.jsx ← Comments with realtime, replies, image attachments
    │   └── CategoryPill.jsx   ← Coloured category badge
    └── pages/
        ├── Landing.jsx        ← Marketing page with boids sim
        ├── Feed.jsx           ← Main wonders feed, infinite scroll, filters
        ├── SimulationsPage.jsx← Daily sim with calendar, iframe, comments
        ├── Forums.jsx         ← Thread list with category filter
        ├── ForumThread.jsx    ← Single thread + comment section
        ├── Profile.jsx        ← User profile, follow, content tabs
        └── Admin.jsx          ← Approve wonders, upload sims, resolve reports
```

---

## Key features

### Feed
- Infinite scroll (IntersectionObserver)
- Sort by **Latest** or **Trending** (hot score = likes×3 + comments×2 / age)
- Filter by 10 curiosity categories
- Featured card for the top story
- Optimistic likes + bookmarks
- Submit wonder modal with image upload (goes to `pending` queue)

### Simulations
- One simulation per day, embedded as a self-contained HTML file
- Calendar strip to browse previous days
- Fullscreen mode
- Likes + realtime comments

### Forums
- Thread list with category + sort filters
- New thread modal with image upload, tags, category
- Full thread page with nested comment replies
- Likes on threads and individual comments

### Profiles
- Public profile with follower/following counts
- Follow/unfollow with optimistic updates
- Curiosity tags
- Tabbed view: Wonders and Forum Posts

### Admin panel
- Approve or reject pending user submissions
- Upload daily simulation (HTML file + thumbnail)
- Resolve or dismiss content reports

### Auth
- Google SSO via Supabase Auth
- Profile auto-created on first sign-in (username derived from email)
- Session persisted across refreshes
- Protected routes for auth-required pages

---

## Deploying to Vercel

```bash
npm run build      # check it builds cleanly first
```

1. Push to GitHub
2. Go to [vercel.com](https://vercel.com) → **New Project** → import your repo
3. Add environment variables:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
4. Deploy — done

Add your Vercel domain to **Supabase → Authentication → URL Configuration → Redirect URLs**:
```
https://your-app.vercel.app/feed
```

---

## Supabase schema overview

| Table | Purpose |
|---|---|
| `profiles` | Extends `auth.users` — username, avatar, bio, tags |
| `follows` | Self-referencing follow graph |
| `categories` | 15 curiosity categories with emoji + colour |
| `wonders` | Feed posts — status: pending / published / rejected |
| `simulations` | Daily sims — one per date, HTML stored in Storage |
| `comments` | Polymorphic comments on wonders, sims, and forum posts |
| `likes` | Polymorphic likes on everything |
| `forum_posts` | Forum threads |
| `bookmarks` | Saved content |
| `reports` | Content moderation reports |
| `notifications` | User notification inbox |

All counts (likes, comments, followers) are maintained by **database triggers** — no manual syncing needed.

---

## Phase 3 — news pipeline (coming next)

A GitHub Actions workflow that runs on a schedule:
1. Pulls from NewsAPI, Guardian, NASA APOD, and arXiv
2. Scores each item for novelty + surprise
3. Inserts top items into `wonders` with `status: published` and `source: auto`

This keeps the feed alive without you manually posting every story.

---

## Design system

| Token | Value |
|---|---|
| Background | `#F2EDE3` (beige) |
| Text | `#1A1714` (ink) |
| Serif | Lora |
| Sans | DM Sans |
| Gold accent | `#C4922A` |
| Coral accent | `#D4604A` |
| Green accent | `#4A7C59` |
| Indigo accent | `#4A5580` |

Paper texture is achieved with two fixed SVG noise overlays at ~3% opacity.
All design tokens live in `tailwind.config.js` and `src/index.css`.

---

## License

MIT — do whatever you want with it.