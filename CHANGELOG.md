# Changelog

All notable changes to the Roguedivers II Companion App are recorded here, newest first. Every push to `main` deploys to GitHub Pages, so each section is dated by the day it went live.

## 2026-11-12

### Added
- **New gear in the Armory:**
  - **Armor:** SS-15 Focal Point (Medium), SS-33 Mimetic Marshal (Light) and SS-500 Pale Prosecutor (Light), with the new **Stationary Shroud** passive.
  - **Primary weapons:** R-40 Sightliner and AR-23L Liberator Legacy.
  - **Secondary weapon:** P-44 Mist.
  - **Throwable:** G-11 Caltrops.
  - **Stratagems:** GR-8 Recoilless Rifle, AMW-20 Apex, LAS-44 Nova and TD-110 Maelstrom.
- **Automatic Armory updates.** When the app's gear catalog changes, your saved Armory is updated on the next load, and all your checked items are kept. A one-time notice at the top of the page says which catalog version you're on and how many new items were added.
- **Keep weapons you extract with.** Mission Results has a new "Weapons found in-mission and extracted with" section with one Primary, one Secondary and one Support Weapon choice. Picking one adds it to your loadout, and a support weapon goes into a stratagem slot you choose. Leave a choice blank to decline it.
  - Only weapons that can be found in a mission are listed (from the Helldivers wiki), and only ones checked in your Armory.
  - The Break-Action Shotgun counts as the DBS-2 Double Freedom, and the CQC-72 Entrenchment Tool counts as the CQC-73 Entrenchment Tool.
  - Not available when "My Diver Died" is checked, since your Diver didn't extract.
  - Extracted weapons are listed in Mission History.
- **Light/dark theme button** in the footer. It cycles between Auto (follows your system setting), Light and Dark, and remembers your choice.

### Changed
- **Boosters with no effect on a Roguedivers run are never offered.** Sample Extricator, Sample Scanner, Increased Reinforcement Budget and Flexible Reinforcement Budget are skipped by the Booster wheel, milestone grants and rerolls, and the loadout "Change" picker. They still appear in the Armory checklist.
- The Armory no longer refreshes on a 24-hour timer. It updates only when the catalog actually changes. "Refresh Catalog" still forces an update.

### Fixed
- **LAS-4 Sai renamed to LAS-12 Sai**, its correct in-game name. If you had the LAS-4 checked in your Armory, check the LAS-12 again.

### Developer
- **Wiki audit scripts.** `python scripts/fetch_wiki_categories.py` downloads equipment lists from the Helldivers wiki API (helldivers.wiki.gg). `python scripts/compare_armory.py` then lists what `ArmoryBackup.ts` is missing or has extra.
- `CATALOG_VERSION` in `ArmoryBackup.ts` (a `YYYY-MM-DD` date) must be bumped whenever the catalog changes. Saved Armories with a different version are merged automatically. For a second change on the same day, add a suffix (`YYYY-MM-DD.2`).
- New `disabled` field on catalog items, checked by `isPickable()` everywhere gear is picked.
- New `foundInMission` and `pickupName` fields on catalog items. `newGameItem` now takes its flags as an options object, e.g. `newGameItem(name, keywords, { foundInMission: true })`.
- Colours in `index.css` use `light-dark()`, switched by `data-theme` on `<html>`. An inline script in `index.html` applies the saved theme before first paint.

## 2026-11-11

### Added
- **"My Diver Died" option in Mission Results**, for when your Diver dies but the squad extracts. No loot spins are earned, and your loadout, Specialization and Requisitions reset to the starting kit. An unspent Phoenix Down is lost too.
- **Milestone picks during Mission Results.** After you submit a mission, any Specialization or Requisition due at the new difficulty is offered before the loot spins, including picks reopened by a death reset. **Skip for now** leaves them for the "Pick now" banner.
- **Difficulty 9 Team Milestone:** 1 Specialization and 3 Requisitions.

### Changed
- **"My Diver Died" button replaced by "Helldiver Squad Wiped".** It now only handles a full reset, behind a confirmation. Rejoining after the squad extracts is handled in Mission Results.
- The mission summary lists only gear that actually changes, with readable names for Specializations and Requisitions.
- Quick Start guide rewritten for the new mission and death flow, including the Difficulty 9 milestone.

### Fixed
- A corrupted saved Armory no longer stops the app from loading.

## 2026-10-09

### Added
- **Stratagem slot selection for milestones.** When a Specialization or Requisition grants stratagems, the player now chooses which stratagem slot (1-4) each one goes into, instead of it always overwriting slot 1, 2, etc. Each slot button shows what is currently equipped there.
- **Mission summary screen.** Logging a mission now ends with a summary of the new difficulty and every gear change from loot spins, with **Accept** and **Cancel** buttons.
- Cancel buttons on every step of the Milestone Picker and on the loot wheel result screens.
- LAS-4 Sai in the Armory (renamed to LAS-12 Sai on 2026-11-12).

### Changed
- **Selection screens only apply changes once they are finished and accepted.** Cancelling at any step, with the Cancel button or Escape, now discards everything and leaves the Diver unchanged:
  - **Milestone Picker:** cancelling partway through a package pick discards it, and the "Pick now" banner returns.
  - **Mission Results:** the mission, level change and loot are saved only when the summary is accepted. Before, they were saved as soon as the last spin finished, or straight away on Submit when no spins were earned.
- **Milestone picks no longer allow duplicate stratagems.** Stratagems that are already equipped, or already granted by the same package, are greyed out in the picker and marked "(already equipped)".
  - If only one valid option is left, it is picked automatically.
  - If a grant has no valid options left (the Diver already has everything it could give), that grant is skipped. The rest of the package still applies, and the milestone pick is still used up.
- A package that fills all four stratagem slots, or rerolls them (Bargain Bin), skips slot selection.
- All buttons now share the same accent style, and the 160px width cap on that style has been removed.

### Removed
- "Illuminate - Invasion Fleet" from the faction roll.

### Fixed
- Pressing Escape during a Milestone Picker choice no longer leaves the pick stuck, with no dialog and no banner to resume it.
- A milestone grant with no remaining options no longer opens an empty picker that can't be closed.

## 2026-10-08

### Added
- **Quick Start guide** shown beside the Player panel. It covers Armory setup, loadouts, mission results, loot, packages and recovering from a death.
- **Starting armor selection.** New Divers begin with no armor and pick any unlocked medium armor with the Extra Padding passive.
- **Package details in the Milestone Picker.** Each Specialization and Requisition shows what it grants (a fixed item, or "select any one / one matching all" of a keyword list), what it rerolls, and any restriction.
- **Selected Packages panel** on the Player view, listing the Diver's Specialization and Requisitions with the exact gear each one granted.
- **Phoenix Down tracking.** A held Phoenix Down can be marked as spent. It can't be taken again while an unspent one is held.
- **Armor details everywhere.** Armor names show their weight and passive (e.g. `[Medium, Extra Padding]`), and the equipped armor's keywords appear on the Player view.
- **Build info footer** showing the app version, data version and commit, with a "Copy version info" button for bug reports.
- **Faction variants** in the faction roll: Predator, Spore Burst and Rupture Strains (Terminids); Jet Brigade, Incineration Corps and Cyborg Legion (Automatons); Appropriators, Vote Snatchers, Mindless Masses and Invasion Fleet (Illuminate).

### Changed
- **Loot spins are staged.** Each spin's pool takes earlier spins from the same mission into account. The mission and its loot are saved together after the last spin, and cancelling the loot step discards both.
- **Faction rolls are manual.** The faction can be rolled or rerolled at any time from the Player panel, replacing the automatic reroll prompt at difficulty 4 and 7.
- The default starting kit no longer includes armor or stratagems.
- Package choices are filtered against unlocked gear, and grants are recorded as the concrete items chosen or rerolled.
- Clearer Phoenix Down rules text.

### Developer
- The deploy workflow fetches full git history so build version numbers are accurate.

## 2026-09-26

### Developer
- Experimental Python integration: a faction-picking function (`faction_wheel_test.py`) served through a FastAPI wrapper (`app.py`). It isn't wired into the app yet.

## 2026-09-25

### Added
- **Uncheck All** button in the Armory. Like Check All, it leaves locked starting gear alone.

### Changed
- **Stratagem loot wheels** are now **Supply**, **Offensive** and **Defensive**, matching the ruleset, instead of "Stratagems" and "Support Items". Every stratagem is tagged with its wheel.
- Mission History now says "Operation Not Completed" instead of "Operation Failed".
- Action buttons (Log Mission Result, My Diver Died, Refresh Catalog, Check/Uncheck All) share one button style.

### Removed
- The loot wheel Reroll button. The ruleset doesn't allow unlimited rerolls.

### Fixed
- The **Armor Passives** wheel rolls a passive and then lets the player choose which unlocked armor set with that passive to equip. Before, it rolled a random armor set directly.

## 2026-09-24

### Added
- **First release of the Roguedivers II Companion App:**
  - Armory checklist of unlocked gear
  - Diver loadout tracking
  - Specializations and Requisitions unlocked by Team Milestones
  - Death flow (squad wiped or squad extracted)
  - Mission Results with loot wheel spins
  - Faction tracking and Mission History
- **Check All** button in the Armory.

### Fixed
- Check All now marks items as unlocked instead of toggling them, leaves locked starting gear alone, and keeps changes in every category, not just the last one.
