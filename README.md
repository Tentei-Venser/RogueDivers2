# Roguedivers II Companion App

A companion web app for **LhilaKalkari's Roguedivers Ruleset** — a permadeath, roguelike-style ruleset for Helldivers 2. The app acts as the rules engine and session tracker for a single Diver's career: it enforces *when* you're allowed to do things (pick a Specialization, reroll your Faction, earn a wheel spin) and holds the current state of your run, so nothing has to be tracked by hand on paper or in a spreadsheet.

The full ruleset is in [`Helldivers II Roguedivers Ruleset 2.0.1.pdf`](./Helldivers%20II%20Roguedivers%20Ruleset%202.0.1.pdf); the app's design and data model are documented in [`helldivers-roguelike-design-doc.md`](./helldivers-roguelike-design-doc.md).

## Features

- **Armory checklist** — track which weapons, armor, stratagems, and boosters you've actually unlocked in-game via Warbonds, with a manual "Refresh Catalog" button for when a new Warbond adds items.
- **Player loadout** — current gear, level, and Faction, each changeable via a picker limited to what you've unlocked.
- **Specializations & Requisitions** — gated by difficulty (Team Milestones), only offering picks you can legally take given your Armory.
- **Mission Results** — log objective completion, see spins earned, and spin the wheels right in the app (no more tab-switching to wheelofnames.com).
- **Death Flow** — handles a squad wipe (full reset) or a rejoin after the squad extracts without you (fresh kit at the squad's Team Milestone tier).
- **Mission History** — a running log of every mission you've logged this career.
- **Faction tracking** — initial roll and the difficulty 4/7 reroll reminders.

Progress is saved to `localStorage`, so it survives a page refresh.

## Tech stack

React 19 + TypeScript, built with Vite. No backend — everything runs client-side.

## Running locally

```bash
npm install
npm run dev
```

## Building for production

```bash
npm run build
```

## Credits

Ruleset written by [LhilaKalkari](https://www.twitch.tv/lhilakalkari), with input from [Natureclaws](https://www.twitch.tv/natureclaws), edited by Karleen Winters, original concept by u/starfruit_eater.
React app written by Tentei Venser, co-authored by Anthropic Claude
