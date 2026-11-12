import type { ArmoryData, GameItem, ItemCategory, PlayerData } from "../types/Objects";
import { isPickable } from "../types/Objects";
import { STRATAGEM_SLOTS } from "./usePackagePick";

// Weapons found in a mission and extracted with can be equipped afterwards (Diver must have
// extracted, so not on a death). Normal carry capacity caps it at one of each of these.
export type PickupSlot = "primary" | "secondary" | "support";

export const PICKUP_SLOTS: { key: PickupSlot, label: string, category: ItemCategory }[] = [
    { key: "primary",   label: "Primary",        category: "primary" },
    { key: "secondary", label: "Secondary",      category: "secondary" },
    { key: "support",   label: "Support Weapon", category: "stratagem" },  // placed in a stratagem slot of the Diver's choice
];

// Owned, pickable in-mission finds for one carry slot. Anything already equipped there is left out,
// since extracting with it would change nothing (for support weapons: already in any stratagem slot).
export function pickupOptions(slot: PickupSlot, armory: ArmoryData, player: PlayerData): GameItem[] {
    const category = PICKUP_SLOTS.find(s => s.key === slot)!.category;
    const equipped = new Set<string>(slot === "support"
        ? STRATAGEM_SLOTS.map(s => player[s])
        : [player[slot]]);
    return Array.from(armory.data[category]?.values() ?? [])
        .filter(item => item.foundInMission && isPickable(item) && !equipped.has(item.name))
        .sort((a, b) => pickupLabel(a).localeCompare(pickupLabel(b)));
}

// Mapped pickups (e.g. the Break-Action Shotgun) show their in-mission name and the item they count as.
export function pickupLabel(item: GameItem): string {
    return item.pickupName ? `${item.pickupName} (counts as ${item.name})` : item.name;
}
