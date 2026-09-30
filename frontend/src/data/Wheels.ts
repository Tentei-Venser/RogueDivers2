import type { ArmoryData, GameItem, ItemCategory, Keyword, PlayerData } from "../types/Objects";

export interface Wheel {
    label: string;
    category: ItemCategory;
    requireKeyword?: Keyword;   // item must have this keyword to be in the pool
    excludeKeyword?: Keyword;   // item must NOT have this keyword to be in the pool
    rollsPassive?: boolean;     // Armor Passives: roll a passive, then let the player pick which unlocked armor set has it
}

// The 7 wheels that pay out post-mission spins. "Stratagems" and "Support Items" are separate
// wheels in the ruleset but share one internal ItemCategory now, so they're told apart by the
// "support-weapon" keyword instead of by category.
export const WHEELS: Wheel[] = [
    { label: "Armor Passives", category: "armor", rollsPassive: true },
    { label: "Boosters", category: "booster" },
    { label: "Grenades", category: "grenade" },
    { label: "Primary Weapons", category: "primary" },
    { label: "Secondary Weapons", category: "secondary" },
    { label: "Stratagems [Offensive]", category: "stratagem", requireKeyword: "offensive" },
    { label: "Stratagems [Defensive]", category: "stratagem", requireKeyword: "defensive" },
    { label: "Stratagems [Support]", category: "stratagem", requireKeyword: "supply" },
];

// Which PlayerData field(s) a wheel's category can land in - a single fixed slot for most
// categories, but any of the 4 stratagem slots for the stratagem category.
export const WHEEL_FIELDS: Record<ItemCategory, (keyof PlayerData)[]> = {
    armor: ["armor"],
    booster: ["booster"],
    grenade: ["grenade"],
    primary: ["primary"],
    secondary: ["secondary"],
    stratagem: ["stratagem1", "stratagem2", "stratagem3", "stratagem4"],
};

// Currently-equipped values across every field a wheel's category could land in - for most
// categories that's just the one field's own value, but for stratagem it's all 4 slots at once,
// since a rolled stratagem can't duplicate any of them, not just the one being replaced.
function equippedValues(wheel: Wheel, player: PlayerData): Set<string> {
    return new Set(
        WHEEL_FIELDS[wheel.category]
            .map(field => player[field] as string)
            .filter(value => value !== "")
    );
}

// The roll pool is every unlocked (available) item in the wheel's category matching its keyword
// filter, excluding whatever's already equipped in a field this wheel could land in - locked
// starting gear IS a valid result, and a roll that would just duplicate what's already equipped
// is filtered out up front rather than offered and rerolled by hand.
export function wheelPool(wheel: Wheel, armory: ArmoryData, player: PlayerData): GameItem[] {
    const avoid = equippedValues(wheel, player);
    const items = Array.from(armory.data[wheel.category]?.values() ?? []);
    return items.filter(item =>
        item.available &&
        !avoid.has(item.name) &&
        (!wheel.requireKeyword || item.keywords?.includes(wheel.requireKeyword)) &&
        (!wheel.excludeKeyword || !item.keywords?.includes(wheel.excludeKeyword))
    );
}

export function rollWheel(wheel: Wheel, armory: ArmoryData, player: PlayerData): GameItem | null {
    const pool = wheelPool(wheel, armory, player);
    if (pool.length === 0) return null;
    return pool[Math.floor(Math.random() * pool.length)];
}

const ARMOR_WEIGHT_KEYWORDS: Keyword[] = ["light-armor", "medium-armor", "heavy-armor"];

// Every armor item carries exactly one weight keyword and one passive keyword - whichever
// keyword isn't a weight class is the passive.
function passiveOf(item: GameItem): Keyword | undefined {
    return item.keywords?.find(k => !ARMOR_WEIGHT_KEYWORDS.includes(k));
}

// The Armor Passives wheel rolls a passive (not a specific armor set) - the pool is every
// distinct passive represented among unlocked armor sets, excluding the passive currently
// equipped (so a "duplicate" roll can't happen at the passive level either).
export function armorPassivePool(armory: ArmoryData, player: PlayerData): Keyword[] {
    const currentItem = armory.data.armor?.get(player.armor);
    const currentPassive = currentItem ? passiveOf(currentItem) : undefined;

    const passives = new Set<Keyword>();
    for (const item of armory.data.armor?.values() ?? []) {
        if (!item.available) continue;
        const passive = passiveOf(item);
        if (passive && passive !== currentPassive) passives.add(passive);
    }
    return Array.from(passives).sort();
}

export function rollArmorPassive(armory: ArmoryData, player: PlayerData): Keyword | null {
    const pool = armorPassivePool(armory, player);
    if (pool.length === 0) return null;
    return pool[Math.floor(Math.random() * pool.length)];
}

// Every unlocked armor set carrying the rolled passive - the player picks which one to equip.
export function armorSetsWithPassive(armory: ArmoryData, passive: Keyword): GameItem[] {
    const items: GameItem[] = [];
    for (const item of armory.data.armor?.values() ?? []) {
        if (item.available && passiveOf(item) === passive) items.push(item);
    }
    return items.sort((a, b) => a.name.localeCompare(b.name));
}
