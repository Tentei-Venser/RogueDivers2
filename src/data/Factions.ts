import type { PlayerData } from "../types/Objects";

export const FACTIONS = ["Terminids", "Automatons", "Illuminate"];

// A reroll is due at these difficulty thresholds, per the ruleset.
export const FACTION_REROLL_THRESHOLDS = [4, 7];

export function rollFaction(): string {
    return FACTIONS[Math.floor(Math.random() * FACTIONS.length)];
}

// Due either before the very first roll, or once the player's level has passed a threshold
// that hasn't been rerolled for yet.
export function isFactionRerollDue(player: PlayerData): boolean {
    if (player.faction === "") return true;
    return FACTION_REROLL_THRESHOLDS.some(t => player.level >= t && player.factionRerollLevel < t);
}

// The highest threshold satisfied by the player's current level - if a level jump skipped past
// more than one threshold at once (e.g. a Death Flow rejoin straight to difficulty 7), one reroll
// covers all of them rather than prompting twice in a row.
export function highestFactionRerollThreshold(level: number): number {
    return FACTION_REROLL_THRESHOLDS.filter(t => level >= t).at(-1) ?? 0;
}
