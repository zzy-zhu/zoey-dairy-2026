# Zoey's Diary

A private diary app: daily writing, today's priorities, goal setting,
inspiration you jot down, weekly reflection, and a tap-through weekly recap.
React + Vite on top of the same Firebase project the original 90-day app used,
so **every entry, weekly summary and check-in already in the database loads
straight in** — nothing was migrated or left behind.

The look is modern French vintage: Instrument Serif for anything that speaks,
Instrument Sans for anything that labels, warm paper with a little tooth, deep
gauloise blue and one bright yellow. Two palettes, switchable in Settings —
**Jour** (cream) and **Nuit** (navy).

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
| `days/{YYYY-MM-DD}` | `priorities[]` (each with an optional `goalId`) — kept separate so editing a to-do never touches the journal entry |
| `inspo/{id}` | `kind` (`note` \| `page`), `text` or the page fields, `goalId`, `date`, `createdAt` |
| `stories/{weekKey}` | The closing card Claude wrote for a week's recap, cached so replays are free |
| `memos/{id}` | A shaped note: `text`, `shape`, `kind` (`action` \| `emotion` \| `day`), `date`, `createdAt` |

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

## zOS

The first tab is the console. One screen for "where am I?": today's state with a
live countdown to midnight, the streak, this week's notes and their pattern,
today's priorities, what's counting down toward a goal date, and the most recent
logs. It's the default landing view — deep links like `#today` or `#goals` still
work.

It's the one view that takes the whole page: the shell widens to 1240px on
`#zos` and the panels sit in a 2:1 grid — the chain and the week's notes in the
wide column, priorities, goal countdowns and the week's state in the narrow one,
with the status card and the recent logs spanning both. Below 940px it collapses
to a single column, panels first and the log list last. Every other view stays a
740px reading column.

## The chain (streaks)

`lib/streak.js` computes everything from the check-in map: current run, longest
run ever, days total, and how much of the elapsed time you've kept up. A streak
counts as **alive** through today until midnight — writing yesterday and not yet
today doesn't break it, it just means today is still open, which is what the
countdown is for. The 28-day ribbon on the dashboard shows the shape of the last
month.

## The daily prompts

Five, deliberately overlapping as little as possible: what you're looking
forward to, what yesterday taught you, the smallest real step and what it's
toward, how you honestly are plus what's worth being grateful for, and a free
write. Above them sits **today's spark** — one line from a rotating set to write
from, stable through the day and different tomorrow.

Editing prompts in Settings still works, and a set you've customised is never
touched. If the stored prompts were still the original seven, they're migrated
to these five once, on load. Entries written under the old set keep all seven
answers: `lib/prompts.js` resolves an entry's prompts from its own
`questionsSnapshot`, and falls back to the original seven when an entry holds
more answers than there are current prompts, so nothing is truncated.

## Daily notes

Alongside the prompts, each day takes short memos in a shape you choose —
post-it, torn, taped, speech bubble, blob, arch, coin, ticket, starburst,
scallop, banner, hex. The shape is decoration; the **kind** carries the meaning:
*action* (something you did), *emotion* (something you felt), or *the day*
(what it was like). Each is stamped with its time.

The mix is the point. Once a week's notes exist, the recap gets two extra
slides — the notes themselves, and the pattern ("an even split between doing and
feeling this week") — and the same block is written into the saved weekly
summary, so the pattern is part of the record rather than a separate view.

## Priorities, goals and habits

A daily priority can be tied to a goal. That link is what makes the rest work:
each goal card shows how many of the week's priorities pointed at it, and the
weekly recap can say where the week actually went.

Habits can be added inline from Today or from the writing sheet. A new one
joins the standing list in `data/meta`, so it's waiting to be ticked every
following day; removing one in Settings only hides it going forward — past
entries keep their ticks.

## Inspiration

Write a spark down the moment you have it. Each one keeps the date **and time**
it was written and can be tied to a long-term goal. They're all gathered in the
Reflect tab, filterable by goal, newest first. Claude-written pages (below) show
up in the same list.

## The weekly recap

A tap-through story, phone-first: progress pips along the top, tap right to
advance and left to go back, press and hold to pause, swipe down to close
(arrow keys and Escape on a desktop). Slides are built from real data — days
written, words, habits kept, the word you reached for most, priorities done,
which goal the week went into, the longest thing you wrote, your streak — and
slides with nothing to say are dropped, so a quiet week gets a short story.

It's offered on the Sunday card on Today, and any past week can be replayed by
tapping it in the Weekly grid. **No API key needed** — only the optional
closing card calls Claude, and it's cached per week.

## Claude features (optional)

Two things use the API: the closing card of a recap, and the Reflect tab's read
of a week (three observations plus one thing to carry forward), plus a
"write me a page" inspiration one-pager. All use `claude-opus-5` via the
Anthropic SDK, called from the browser with your own API key — stored in
`localStorage` on that device only, never in Firestore. Leave the field empty
and everything else works as normal.

## Layout

```
src/
  App.jsx            shell: auth gate, nav, theme, hash routing
  firebase.js        app/auth/firestore init (local auth persistence)
  styles.css         design system — jour/nuit palettes, paper, type scale
  lib/
    dates.js         local-time date helpers, day/week/chapter maths, streaks
    store.jsx        auth + Firestore state and every write, via context
    format.js        renders entries to the plain-text `article` field
    story.js         week stats -> recap slides; per-goal accent colours
    insights.js      Claude calls (week read, recap card, inspiration page)
  components/        Sheet, EntrySheet, ReadSheet, Story, WeekStory, Countdown,
                     Memo, MemoBoard, HabitPicker, Sparks, InspoSheet, SignIn
    memos.js         memo shapes, kinds, and the weekly pattern
    streak.js        the chain: current/longest/consistency, midnight countdown
  views/             ZOS, Today, Goals, Weekly, Journal, Insights, Settings
  preview.jsx        dev-only harness (see below)
```

`preview.html` renders every view against fixture data without signing in —
handy for design work, and the only way to see a populated recap without a
week of real entries. It's excluded from the production build; open
`/zoey-dairy-2026/preview.html?view=story&theme=nuit` while `npm run dev`
is running (`view` also takes `today`, `goals`, `weekly`, `journal`,
`zos`, `insights`, `settings`; `theme` takes `jour` or `nuit`).
