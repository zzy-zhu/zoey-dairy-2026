# Zoey's Diary

A private diary app: daily writing, today's priorities, goal setting, weekly
reflection, and an optional AI read of your week. React + Vite on top of the
same Firebase project the original 90-day app used, so **every entry, weekly
summary and check-in already in the database loads straight in** — nothing was
migrated or left behind.

Live at <https://zzy-zhu.github.io/zoey-dairy-2026/>

## Getting it running

```bash
npm install
npm run dev      # http://localhost:5173/zoey-dairy-2026/
npm run build    # production build into dist/
npm run preview  # serve the built output
npm run icons    # regenerate the PWA icons in public/icons/
```

## Deploying

Pushing to `main` runs `.github/workflows/deploy.yml`, which builds and
publishes `dist/` to GitHub Pages.

**One-time setup:** in the repo's *Settings → Pages*, set **Source** to
**GitHub Actions**. (Previously Pages served `index.html` from the branch root;
that file is now the Vite entry point and has to be built first.)

The Vite `base` is `/zoey-dairy-2026/`. If the repo is ever renamed, update
`base` in `vite.config.js` to match.

## On your phone

Open the site in Safari or Chrome and **Add to Home Screen**. It installs as a
standalone app (`public/manifest.webmanifest`), keeps you signed in, and
respects the notch and home-bar insets. Sign-in uses a popup and falls back to
a full-page redirect where popups are blocked.

## Data model

Everything lives under `users/{uid}/` in Firestore. The first three collections
are exactly the shapes the original app wrote:

| Path | Contents |
| --- | --- |
| `data/meta` | `startDate`, `checkins` map, `questions`, `weeklyQuestions`, and (new) `habits` |
| `entries/{YYYY-MM-DD}` | `answers[]`, `habits{}`, `emotion`, `article`, and (new) `questionsSnapshot` |
| `weeklyEntries/{weekKey}` | `weekNum`, `answers[]`, `article` |
| `goals/{id}` | `title`, `why`, `horizon`, `targetDate`, `milestones[]`, `doneAt`, `archived` |
| `days/{YYYY-MM-DD}` | `priorities[]` — kept separate so editing a to-do never touches the journal entry |

Two things worth knowing:

- `questionsSnapshot` records the prompts an entry was written against, so
  editing something from months ago doesn't shuffle its answers under a newer
  set of questions.
- Week numbers still count in sevens from `startDate`, which is how the old app
  keyed weekly summaries — the only change is that they no longer stop at 13.
  Weeks are grouped into 13-week "chapters" for the grid.

Settings has a **Download archive** button that dumps everything to one JSON
file, and the original app is still served at
[`/legacy.html`](public/legacy.html) (source also kept in
[`legacy/`](legacy/)) if you ever want to look at it.

## Reflections (optional)

The Reflect tab sends a week of entries to Claude and gets back three
observations plus one thing to carry forward. It uses `claude-opus-5` via the
Anthropic SDK, called directly from the browser with your own API key — the key
is stored in `localStorage` on that device only and never touches Firestore.
Leave the field empty and the rest of the app is unaffected.

## Layout

```
src/
  App.jsx            shell: auth gate, nav, theme, hash routing
  firebase.js        app/auth/firestore init (local auth persistence)
  styles.css         design system — day/night palettes, glass, drifting light
  lib/
    dates.js         local-time date helpers, day/week/chapter maths, streaks
    store.jsx        auth + Firestore state and every write, via context
    format.js        renders entries to the plain-text `article` field
    insights.js      Claude call for the Reflect tab
  components/        Sheet, EntrySheet, ReadSheet, SignIn
  views/             Today, Goals, Weekly, Journal, Insights, Settings
  preview.jsx        dev-only harness (see below)
```

`preview.html` renders every view against fixture data without signing in —
handy for design work. It's excluded from the production build; open
`/zoey-dairy-2026/preview.html?view=goals&theme=night` while `npm run dev` is
running.
