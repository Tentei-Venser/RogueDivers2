# Roguedivers II Companion App

A companion web app for **LhilaKalkari's Roguedivers Ruleset**, a permadeath, roguelike-style ruleset for Helldivers 2. The React frontend manages a Diver's career and progression, while a FastAPI backend provides faction rolls.

See the [design document](../helldivers-roguelike-design-doc.md) for the app's design and data model.

## Features

- **Armory checklist** — track which weapons, armor, stratagems, and boosters you've actually unlocked in-game via Warbonds, with a manual "Refresh Catalog" button for when a new Warbond adds items.
- **Player loadout** — current gear, level, and Faction, each changeable via a picker limited to what you've unlocked.
- **Specializations & Requisitions** — gated by difficulty (Team Milestones), offering picks allowed by the current Armory.
- **Mission Results** — log objective completion, see spins earned, and spin the wheels right in the app (no more tab-switching to wheelofnames.com).
- **Death Flow** — handles a squad wipe (full reset) or a rejoin after the squad extracts without you (fresh kit at the squad's Team Milestone tier).
- **Mission History** — a running log of every mission you've logged this career.
- **Faction tracking** — request faction rolls from the backend and track difficulty 4/7 reroll reminders.

Progress is saved to `localStorage`, so it survives a page refresh.

## Tech stack

Frontend: React 19, TypeScript, and Vite. Backend: Python and FastAPI. The Vite development server proxies `/api` requests to the backend.

## Versions

The frontend, backend, and static game data use independent Semantic Versioning (`MAJOR.MINOR.PATCH`) tracks. Increment a version when changing its corresponding component: major for breaking changes, minor for compatible features or data additions, and patch for fixes or corrections.

| Component | Version | Version source |
| --- | --- | --- |
| Frontend | 0.1.0 | [`package.json`](./package.json) |
| Backend | 0.1.0 | [`version.py`](../backend/app/version.py) |
| Static game data | 0.1.0 | [`Version.ts`](./src/data/Version.ts) |

The static data version covers the catalog and progression tables in `frontend/src/data` and the faction list in `backend/app/faction_wheel_test.py`.

## Running locally

Run the backend from the repository root in one terminal:

```bash
python -m pip install fastapi uvicorn
python -m uvicorn backend.app.app:app --reload
```

Run the frontend from `frontend/` in a second terminal:

```bash
cd frontend
npm install
npm run dev
```

Open the URL printed by Vite (with the configured base path, usually `http://localhost:5173/RogueDivers2/`). The frontend sends `/api/faction` through Vite's proxy to the backend's `/faction` endpoint on port 8000.

## Building for production

Build the frontend from `frontend/`:

```bash
npm run build
```

The backend must be deployed separately from the frontend.

## Publishing to GitHub Pages

GitHub Pages only hosts the static frontend; it cannot run the FastAPI backend. Deploy the backend separately to a public HTTPS host, then add a repository Actions variable named `VITE_API_BASE_URL` containing the backend origin, for example `https://your-api.example.com` (without a `/faction` suffix).

The Pages workflow builds the frontend from `frontend/` and embeds this variable into the published bundle. It fails the build if the variable is missing or is not HTTPS. The backend must allow the Pages origin `https://tentei-venser.github.io` through CORS; local development continues to use the Vite proxy.

## Changelog

### Unreleased

- Split the application into `frontend/` and `backend/` projects.
- Add a FastAPI faction endpoint and asynchronous faction rolling from the frontend.
- Configure the Vite development proxy for frontend-to-backend API requests.
- Configure GitHub Pages builds to use the separately hosted HTTPS backend.
- Add independent version tracking for the frontend, backend, and static game data.

## Credits

Ruleset written by [LhilaKalkari](https://www.twitch.tv/lhilakalkari), with input from [Natureclaws](https://www.twitch.tv/natureclaws), edited by Karleen Winters, original concept by u/starfruit_eater.
React app written by Tentei Venser, co-authored by Anthropic Claude
Backend developed by MightyAxeMan.
