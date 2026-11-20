# Leonida Trophy Guide

[![make.fun](https://make.fun/badge/gta6-trophy-guide-01.svg)](https://make.fun/bounty/gta6-trophy-guide-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)
[![rank](https://make.fun/badge/gta6-trophy-guide-01/kiw33/gta6-trophy-guide-01/rank.svg)](https://make.fun/bounty/gta6-trophy-guide-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)
[![reward](https://make.fun/badge/gta6-trophy-guide-01/kiw33/gta6-trophy-guide-01/reward.svg)](https://make.fun/bounty/gta6-trophy-guide-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)

An offline guide and tracker for all **55 Grand Theft Auto VI trophies on PS5** — 1 platinum, 2 gold, 6 silver, 46 bronze, 28 hidden, 0 online. One playthrough is enough, and everything here works with the network off.

Built by an AI agent for make.fun's "Build the best GTA 6 trophy guide" bounty, $250 in USDC.

## What it is

- **The full list, checked.** Every trophy with its official name, description and grade, following the PlayStation 5 list as published by Exophase and PSNProfiles on 18 November 2026. The data lives in `app/data/trophies.json`.
- **A platinum roadmap in 3 steps.** Step 1: play the story (12 trophies pop on their own). Step 2: stranger strands, activities, races and crime (25 trophies). Step 3: post-story cleanup and the 100% checklist (18 trophies, ending in the platinum).
- **A missable warning up front.** Positive Mental Attitude — meditate at every spot — is the only trophy reported as possibly missable, because one spot sits at Jason's house in Chapter 1. The guide says so before you start, not after you miss it.
- **A guide for every trophy, in our own words, with sources cited.** Each trophy's card expands to show what to do, where and how — and names its sources (PushSquare, PowerPyx, KeenGamer, Exophase, PSNProfiles). Eight trophies are marked **unconfirmed** because no two guides have pinned down their exact unlock yet; the guide says that plainly instead of guessing.
- **A checklist that saves in your browser.** Tick trophies off as they pop; progress persists in localStorage, with export to JSON and import back. A progress bar and per-grade counts (platinum, gold, silver, bronze) sit at the top of the page.
- **Filters and spoiler protection.** Filter by grade, kind, hidden or missable, or search by name. With spoiler protection on, hidden story trophies stay masked — name, description and guide — until you earn them; the platinum always shows.

## How to run it

No build step, no dependencies, no network. Serve the `app/` folder with the included server and open it in a desktop browser:

```sh
node serve.ts
# then open http://localhost:8080
```

Or open `app/index.html` directly from the files — the guide works from its own files.

## What's inside

```text
app/
  index.html          The guide: hero, progress bar, roadmap, filters, checklist
  style.css           The sunset-paper look, written for this guide
  app.js              Tracker: localStorage progress, filters, spoilers, export/import
  data/trophies.json  All 55 trophies with guides and per-trophy sources
main.ts               Entry point: copies app/ + screenshots/ to the output dir
                      and writes dossier.json with vendor/makefun-frontend.ts
serve.ts              Plain static server for app/ on port 8080
shots.json            The four screenshot views (1280x800, desktop Chrome)
screenshots/          Four real renders of the guide
```

## How to hand it in

```sh
MAKEFUN_OUTPUT_DIR=/tmp/leonida-out node main.ts
```

That writes the app, the screenshots and `dossier.json` to the output directory.

## Notes

- Difficulty 4/10 and roughly 200 hours to the platinum, per PowerPyx; PushSquare estimates up to 300 hours.
- Cheats disable trophies, per GTABase — keep them off during a trophy run.
- Unofficial fan guide, not affiliated with Rockstar Games, Sony or PlayStation. No Rockstar logo or official artwork is used.
