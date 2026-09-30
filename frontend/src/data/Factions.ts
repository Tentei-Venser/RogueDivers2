import type { PlayerData } from "../types/Objects.ts";
import type { Faction } from "../types/Objects.ts";
import { API_BASE_URL } from "../api/api.tsx";
import axios from "axios";

export async function rollFaction(): Promise<string> {
    const faction = await axios.get<Faction>(`${API_BASE_URL}/faction`);
    return faction.data.faction;
}

// Due either before the very first roll, or once the player's level has passed a threshold
// that hasn't been rerolled for yet.
export function isFactionRerollDue(player: PlayerData): boolean {
    if (player.faction === "") return true;
    return player.level > player.factionRerollLevel;
}
