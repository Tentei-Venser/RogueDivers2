import type { ArmoryData, ItemCategory, Keyword, LoadoutPackage, GrantValue, PlayerData } from "../types/Objects";
import { TEAM_MILESTONES } from "./TeamMilestones";

export function currentMilestone(level: number) {
    return [...TEAM_MILESTONES].reverse().find(m => level >= m.difficultyThreshold);
}

export function isSpecializationDue(player: PlayerData): boolean {
    const milestone = currentMilestone(player.level);
    return !!milestone && milestone.specializationChoices > 0 && player.specialization.id === "";
}

export function requisitionPicksDue(player: PlayerData): number {
    const milestone = currentMilestone(player.level);
    if (!milestone) return 0;
    return Math.max(0, milestone.requisitionChoices - player.requisitions.length);
}

const FIELD_CATEGORIES: Partial<Record<keyof PlayerData, ItemCategory[]>> = {
    primary: ["primary"],
    secondary: ["secondary"],
    grenade: ["grenade"],
    armor: ["armor"],
    stratagem1: ["stratagem"],
    stratagem2: ["stratagem"],
    stratagem3: ["stratagem"],
    stratagem4: ["stratagem"],
    booster: ["booster"],
};

function getUnlockedItems(armory: ArmoryData, categories: ItemCategory[]): string[] {
    const names: string[] = [];
    for (const category of categories)
        for (const item of armory.data[category]?.values() ?? [])
            if (item.available) names.push(item.name);
    return names.sort((a, b) => a.localeCompare(b));
}

function matchesKeywords(itemKeywords: Keyword[] | undefined, keywords: Keyword[], mode: "AND" | "OR"): boolean {
    const has = new Set(itemKeywords ?? []);
    return mode === "AND" ? keywords.every(k => has.has(k)) : keywords.some(k => has.has(k));
}

// Turns a grant's GrantValue into the list of item names currently valid to fill that field with,
// given what's actually unlocked in the Armory. A fixed name resolves to itself (if still unlocked),
// a bare Keyword or KeywordFilter resolves to every matching unlocked item, and string[] resolves to
// whichever of the named alternatives are still unlocked.
export function resolveGrantOptions(value: GrantValue, armory: ArmoryData, field: keyof PlayerData): string[] {
    const categories = FIELD_CATEGORIES[field] ?? [];

    if (Array.isArray(value)) {
        const unlocked = new Set(getUnlockedItems(armory, categories));
        return value.filter(name => unlocked.has(name));
    }

    if (typeof value === "object") {
        const options: string[] = [];
        for (const category of categories)
            for (const item of armory.data[category]?.values() ?? [])
                if (item.available && matchesKeywords(item.keywords, value.keywords, value.filterMode))
                    options.push(item.name);
        return options.sort((a, b) => a.localeCompare(b));
    }

    // string: either a fixed item name, or a bare Keyword filter - disambiguate by checking
    // whether it matches a real unlocked item's name first.
    const unlocked = getUnlockedItems(armory, categories);
    if (unlocked.includes(value)) return [value];

    const options: string[] = [];
    for (const category of categories)
        for (const item of armory.data[category]?.values() ?? [])
            if (item.available && item.keywords?.includes(value as Keyword))
                options.push(item.name);
    return options.sort((a, b) => a.localeCompare(b));
}

// A package can only be offered if every one of its grants resolves to at least one
// currently-unlocked option - matches the ruleset's "only offer what the Diver can legally take" rule.
export function isPackageAvailable(pkg: LoadoutPackage, armory: ArmoryData): boolean {
    return (Object.entries(pkg.grants) as [keyof PlayerData, GrantValue][])
        .every(([field, value]) => resolveGrantOptions(value, armory, field).length > 0);
}

// Currently-equipped values a rolled result for this field must not duplicate - just the field's
// own value for most fields, but for a stratagem slot it's all 4 slots at once, since a rolled
// stratagem can't duplicate ANY currently-equipped stratagem, not just the one being replaced.
function equippedValues(field: keyof PlayerData, player: PlayerData): Set<string> {
    const siblings = field.startsWith("stratagem")
        ? (["stratagem1", "stratagem2", "stratagem3", "stratagem4"] as (keyof PlayerData)[])
        : [field];
    return new Set(siblings.map(f => player[f] as string).filter(v => v !== ""));
}

// Picks a uniformly random unlocked item for a field - "take what you get," no player choice.
// Locked starting gear IS a valid result. A roll that would duplicate what's already equipped
// (in this field, or in ANY stratagem slot when field is one of the 4) is filtered out up front
// rather than offered and rerolled by hand - if nothing valid remains, the field goes blank.
export function rollFieldValue(field: keyof PlayerData, armory: ArmoryData, player: PlayerData): string {
    const categories = FIELD_CATEGORIES[field] ?? [];
    const avoid = equippedValues(field, player);
    const pool: string[] = [];
    for (const category of categories)
        for (const item of armory.data[category]?.values() ?? [])
            if (item.available && !avoid.has(item.name)) pool.push(item.name);
    if (pool.length === 0) return "";
    return pool[Math.floor(Math.random() * pool.length)];
}
