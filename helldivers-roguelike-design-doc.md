# Design Document: Helldivers II Roguelike Career Tracker

**Author:** Rachel (dev), for LhilaKalkari's Roguelike Ruleset v2.0
**Status:** Draft v2 — in progress, Armory checklist UI underway
**Purpose of this doc:** Define scope, data model, and architecture for a V1 web app; kept in sync with the actual `Objects.ts` / `Armory.ts` / `ArmoryBackup.ts` / `TeamMilestones.ts` / `Roguedivers.tsx` as they evolve.

---

## 1. Problem Statement

LhilaKalkari's Roguelike Ruleset turns Helldivers II into a permadeath progression game: a Diver starts with a fixed loadout, climbs difficulty 1→10, unlocks Specializations/Requisitions at set thresholds, and earns spins on equipment wheels based on mission performance. Right now this is tracked manually (paper/spreadsheet) alongside external wheelofnames.com spinners.

The app's job is to be the **rules engine and session tracker** — it enforces *when* a player is allowed to do something (reroll faction, pick a Specialization, earn a spin) and holds the current state of one career. It is explicitly **not** trying to replace the wheels themselves.

## 2. Goals (V1)

- Track a single Diver's career: starting kit → current difficulty → unlocked packages → current loadout.
- Enforce ruleset logic: when Specializations/Requisitions become available, when a faction reroll is due, how many spins a mission earned.
- Provide a clean "what do I do next" screen at all times.
- Zero setup: open the page, start a career, no login.
- Survive a page refresh — progress persists via `localStorage` (mandatory, not a stretch goal).
- Let the player check off which weapons/armor/stratagems/etc. they've actually unlocked in-game (the Armory), so the rules engine never offers something they can't legally take.

## 3. Non-Goals (V1)

Explicitly deferred — worth stating in an interview as evidence of scope discipline, not omission:

- **Live squad tracking** — multiple Divers' state synced across devices in real time, co-op weapon-retention rules for *other* players' finds. Genuinely needs a backend and multi-user design — Phase 2. (Team Milestones themselves are in V1 — see §5 — since they govern what happens to *this* Diver on death, which is squad-dependent even without syncing the rest of the squad's state.)
- **Reimplementing the equipment wheels.** The wheels' item pools change with every Warbond update; LhilaKalkari already maintains them on wheelofnames.com. The app links out and lets the player record the result rather than owning that data. (See §7 for the trade-off reasoning.) This is a different concern from the game *catalog* (§6) — the wheels are Lhila's curated roll pools, the catalog is just "what exists."
- **Live catalog fetching.** Originally planned (see §6), but a static bundled dataset shipped first and that's staying as-is for now — see the Decisions Log (§10).

## 4. User Stories (V1)

1. As a Diver, I see my starting kit locked in at career start (B-01 Tactical Armor or equivalent medium armor w/ Extra Padding, AR-23 Liberator, P-2 Peacemaker, G-12 HE Grenade), plus my rolled Faction.
2. As a Diver, I advance my difficulty after a successful mission and the app tells me if I just unlocked a Specialization or Requisition choice.
3. As a Diver, at difficulty 3 I'm prompted to pick one Specialization from the table, and my loadout updates to reflect the mandatory items it grants.
4. As a Diver, at difficulty 5/7/9 I'm prompted to pick a Requisition each time, stacking with prior gear.
5. As a Diver, at difficulty 4 and 7 I'm reminded to reroll my Faction.
6. As a Diver, after a mission I log which objectives I completed (Primary / all Secondaries / all bases, plus whether the operation itself completed) and the app tells me how many wheel spins I earned and links me to the relevant wheel(s).
7. As a Diver, I can mark a wheel result as accepted or rerolled (duplicate/invalid per ruleset) and it updates my loadout.
8. As a Diver, if I die, the app asks whether the rest of my squad completed the mission and extracted without me.
   - **If the squad was wiped:** my run fully resets — difficulty back to 1, loadout back to the default starting kit.
   - **If the squad extracted:** I rejoin the campaign at the squad's current difficulty with a fresh loadout built from the Team Milestone tier that difficulty unlocks (Specialization only at 3+, + 1 Requisition at 5+, + 2 Requisitions at 7+), choosing from whatever my Armory allows.
9. As a Diver, I maintain a checklist (the **Armory**) of which weapons, throwables, stratagems, armor, boosters, and support weapons I've unlocked through the game's Warbond system, so the app only offers Specializations, Requisitions, or wheel results I can legally equip. *(Current focus — the checklist UI and its persistence.)*

## 5. Data Model

TypeScript, no backend in V1. This section tracks the actual shapes in `Objects.ts`, not an idealized version — where the real code and the original plan diverged, the real code wins.

```ts
// Objects.ts
export type ItemCategory = "armor" | "primary" | "secondary" | "grenade" | "stratagem" | "support" | "booster";

export interface Specialization {
  id: string;
  name: string;
  grants: string;
  restricts?: string;
}

export interface TeamMilestone {
  difficultyThreshold: number;    // 3, 5, or 7
  specializationChoices: number;  // 1 at every threshold
  requisitionChoices: number;     // 0 at 3, 1 at 5, 2 at 7
}
// TEAM_MILESTONES: TeamMilestone[] lives in TeamMilestones.ts

export type DeathOutcome = "squad-wiped" | "squad-extracted";

export interface MissionResult {
  difficulty: number;
  primaryCompleted: boolean;
  secondariesCompleted: boolean;
  basesDestroyed: boolean;
  operationCompleted: boolean;
  spinsEarned: number;    // derived from the booleans above
}

export interface GameItem {
  name: string;
  available: boolean;   // player has unlocked it via Warbond
  locked: boolean;        // prevents removing starting/mandatory gear from the Armory
}

export function newGameItem(name: string, available: boolean = false, locked: boolean = false): GameItem {
  return { name, available, locked };
}

// Persisted/seed shape: plain item lists per category, no timestamp.
export interface ArmoryCache {
  cacheData: Record<ItemCategory, GameItem[]>;
}

// Working shape the UI actually consumes: Maps for O(1) lookup by name,
// plus the timestamp this snapshot was built.
export interface ArmoryData {
  dataTimeStamp: number;   // epoch ms
  armor: Map<string, GameItem>;
  primary: Map<string, GameItem>;
  secondary: Map<string, GameItem>;
  grenade: Map<string, GameItem>;
  stratagem: Map<string, GameItem>;
  booster: Map<string, GameItem>;
  support: Map<string, GameItem>;
}

export function buildArmoryData(
  cache: Record<ItemCategory, GameItem[]>,
  dataTimeStamp: number = Date.now()
): ArmoryData {
  const armory = {} as ArmoryData;
  for (const [category, items] of Object.entries(cache) as [ItemCategory, GameItem[]][]) {
    armory[category] = new Map(items.map((item) => [item.name, item]));
  }
  armory.dataTimeStamp = dataTimeStamp;
  return armory;
}
```

**Note on `ItemCategory` vs. earlier drafts:** an earlier version of this doc had a separate `Armory` interface with pluralized/renamed keys (`primaries`, `throwables`, etc.) distinct from `ItemCategory`. That mismatch got resolved by making `ArmoryData`'s keys identical to `ItemCategory`'s values — one naming scheme, no translation table needed between "what the catalog calls a category" and "what the Armory calls a category."

**`EquippedItem`/`DiverState` (loadout + overall career state) haven't been implemented in code yet** — the plan below is still the target shape, not yet reflected in a file:

```ts
interface EquippedItem {
  name: string;
  category: ItemCategory;
  grantedBy: string | null;   // id of the Specialization/Requisition that granted it, or null
  source: "starting-kit" | "specialization" | "requisition" | "wheel-roll" | "field-find";
}
// "mandatory" is derived, not stored: an item is locked (untradeable) exactly while
// grantedBy still points at a package the Diver currently holds.

interface DiverState {
  difficulty: number;               // 1-10. Resets to 1 only on a full wipe;
                                     // unchanged if the squad extracted without this Diver.
  faction: string | null;
  loadout: EquippedItem[];
  specialization: Specialization | null;
  requisitions: Requisition[];
  isAlive: boolean;
  missionHistory: MissionResult[];
  armory: ArmoryData;                // persists through death — Warbond unlocks are account-wide
}
```

## 6. Game Catalog & Ownership Checklist (the Armory)

The ruleset already has a "reroll if not allowed" rule for Specialization/Requisition conflicts. The same logic has to apply to *ownership* — a Diver can't equip a weapon they haven't unlocked in-game yet, whether it comes from a wheel spin, a Specialization, or a Requisition.

- **`ArmoryCache`/`ArmoryBackup.ts`** answers "what items exist" — right now a static, hand-maintained list (`PopulateArmoryCache()`), seeded with the starting kit already marked `available: true, locked: true` (`AR-23 Liberator`, `P-2 Peacemaker`, `G-12 High Explosive`, `Extra Padding`).
- **`ArmoryData`** (built via `buildArmoryData`) is the working shape the UI binds to — `Map<string, GameItem>` per category, so a checkbox can look up and flip one item's `available` flag in O(1).
- **Gating behavior this unlocks, once the reducer/state layer exists:**
  - Specialization/Requisition pickers only list options where every item they'd grant has `available: true` in the Armory.
  - Wheel-result recording cross-checks a rolled item against the Armory before accepting it; an unowned result triggers the same reroll flow as a duplicate or disallowed item.

### Armory checklist UI *(current work)*

- One collapsible section per `ItemCategory`, each item a checkbox bound to `GameItem.available`; `locked` items (the starting kit) render checked and disabled — the player can't uncheck mandatory gear.
- Toggling a checkbox must go through the same state-update path as everything else (a reducer action, not a direct mutation) so the `locked` guard is enforced in one place, not just as a UI nicety that a bug or dev-tools poke could bypass.
- Every change needs to survive a refresh — see the persistence notes in §10, including the bugs found while wiring this up.

### Catalog fetch, cache, and merge — *(deferred, see §10)*

A hardcoded item list goes stale the moment a new Warbond ships, so a fetch-based catalog was the original plan — but a static dataset shipped first to unblock the checklist UI, and stayed. If it's revisited later:

- **Cache-first, stale-while-revalidate:** show cached data immediately, refetch in the background if older than a TTL (proposed: 7 days).
- **Source:** the helldivers.wiki.gg MediaWiki API (`action=query&list=categorymembers`) per category, or HellHub Collective's API if it covers more than stratagems.
- **Merge, never overwrite:** a fresh catalog may only *add* newly-discovered item names (as unowned); it must never touch a player's existing `available`/`locked` flags, and never *remove* an item that disappears from one fetch.

## 7. Key Architecture Decision: Wheels Stay External

| Option | Trade-off |
|---|---|
| **A. Link out to wheelofnames.com, player self-reports result** (chosen) | Zero maintenance burden as Warbonds add/remove items; matches what LhilaKalkari already curates. Costs: an honor-system step, one extra click per spin. |
| B. Hardcode item pools in-app and roll locally | Full in-app experience, but the app silently goes stale every balance patch unless someone maintains a second copy of the item list. |

Option A ships faster and stays correct with zero upkeep — the app's job is the *rules*, not the *content*. Worth a callout in a portfolio writeup: recognizing "don't own data you don't need to own" is exactly the kind of judgment call an SE III writeup should show.

The 7 wheels that pay out post-mission spins (confirmed): **Armor Passives, Boosters, Grenades, Primary Weapons, Secondary Weapons, Stratagems, Support Items.** The Faction wheel is out of this rotation entirely since it's tied to career start and the level 4/7 reroll, not mission performance.

## 8. Component Architecture

React + TypeScript, Vite, no backend (a C# API is a natural Phase 2 if squad sync gets added later). Persistence is per-piece-of-state for now (the Armory saves itself), not one global `CareerProvider` sync yet — that provider is still to be built once `DiverState` exists as real code.

```
<App>
  <CareerProvider>              // TODO: not yet built — useReducer + Context, backed by localStorage
    <KitPanel />                // current loadout, mandatory items flagged
    <DifficultyTracker />       // current level, "advance" action, unlock prompts
    <FactionPanel />            // current faction + reroll-due indicator at lvl 4/7
    <SpecializationModal />     // fires when difficulty hits 3 and none chosen yet
    <RequisitionModal />        // fires at 5/7/9
    <MissionResolutionForm />   // end-of-mission checklist → computes spins → links to wheel(s)
    <WheelResultForm />         // record accept/reroll outcome, updates loadout
    <ArmoryChecklist />         // IN PROGRESS — checkboxes bound to useArmory()'s ArmoryData
    <DeathFlow />               // "did the squad extract?" prompt → full wipe, or Team Milestone rejoin
  </CareerProvider>
</App>
```

State transitions (advance difficulty, choose Specialization, resolve mission, resolve death, toggle an Armory item) should live as reducer actions once `CareerProvider` exists — this keeps the rules-enforcement logic testable in isolation from the UI. `useArmory` is the first piece of this and currently manages its own state/persistence standalone, ahead of the rest of `DiverState` existing.

## 9. Suggested Build Order

1. ~~Kit + difficulty tracker, `localStorage`-backed from day one~~ — not started; the Armory work below came first.
2. **Armory checklist + persistence** *(in progress)* — `useArmory` hook, static bundled dataset, checkbox UI, `locked` items non-negotiable, survives a refresh. See §10 for the bugs found while building this.
3. **Specialization/Requisition gating + data tables + Team Milestone table**, filtered against the Armory — the core rules engine, not yet started.
4. **Mission resolution → spin calculation → wheel link-out → result recording**, validated against the Armory.
5. **Death flow** — the extraction prompt branching to full wipe vs. Team Milestone rejoin.
6. *(Stretch, Phase 2)* live squad sync; live catalog fetch, if revisited.

## 10. Decisions Log

Resolved decisions and known issues, kept as a record of *why*, not just *what*:

- **Mandatory items:** locked only while the granting perk/trait/effect is active — modeled via `grantedBy` on `EquippedItem` (not yet implemented) and via `GameItem.locked` for the Armory checklist specifically.
- **Which wheels earn spins:** Armor Passives, Boosters, Grenades, Primary Weapons, Secondary Weapons, Stratagems, Support Items — 7 total. The Faction wheel is excluded.
- **Persistence:** mandatory, not optional — losing a whole career to a stray refresh would be a hostile UX for a permadeath game.
- **Armory checklist scope:** Warbond-unlocked equipment specifically, not a general inventory.
- **Death reset:** the Armory never resets — Warbond unlocks are account-wide and persist. Difficulty/loadout branch on whether the squad extracted without this Diver (full wipe → difficulty 1 + default kit; extracted → difficulty unchanged, loadout rebuilt at the Team Milestone tier for that difficulty).
- **Game catalog:** live fetch deferred — a static bundled dataset (`ArmoryBackup.ts`) shipped first to unblock the checklist UI and is staying for now. The fetch/cache/merge design in §6 is preserved as the plan if it's ever revisited, but `useArmory`'s consumers shouldn't need to change when/if that happens — only what populates the Armory does.
- **Known bugs found while wiring up the Armory checklist** (tracked here so they don't get lost, not necessarily all fixed yet):
  - `useArmory` must not be `async`, and its caller must not `await` it — a React hook/component returning a `Promise` breaks rendering. Hooks are called synchronously; state updates are how a hook "returns" fresh data over time, not a resolved promise.
  - `Map` does not survive `JSON.stringify`/`JSON.parse` — `ArmoryData`'s per-category `Map<string, GameItem>` needs an explicit convert-to-array-before-saving / rebuild-via-`buildArmoryData`-after-loading step, or every save silently writes empty objects.
  - The original "stale → reload from static backup" branch re-ran on effectively every load (TTL was `0`), overwriting any checked-off items with fresh defaults every refresh. Since there's currently no live source to actually be stale against, the static backup should only ever seed the Armory once, on a truly empty cache — never overwrite an existing one.
