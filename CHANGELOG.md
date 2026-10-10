# Changelog

All notable changes to the Roguedivers II Companion App are recorded here.

## [Unreleased]

### Added
- **Stratagem slot selection for milestones.** When a Specialization or Requisition grants stratagems, the player now chooses which stratagem slot (1-4) each one goes into, instead of it always overwriting slot 1, 2, etc. Each slot button shows what is currently equipped there.
- **Mission summary screen.** Logging a mission now ends with a summary of the new difficulty and every gear change from loot spins, with **Accept** and **Cancel** buttons.
- Cancel buttons on every step of the Milestone Picker and on the loot wheel result screens.

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
