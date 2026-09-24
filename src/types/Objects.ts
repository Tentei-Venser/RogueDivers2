export type ItemCategory = "armor"
    | "primary"
    | "secondary"
    | "grenade"
    | "stratagem"
    | "booster"

export type Keyword =
    | "guard-dog"
    | "mortar-sentry"
    | "melee"
    | "firearm"
    | "rounds-reload"
    | "suppressed"
    | "light-armor"
    | "medium-armor"
    | "heavy-armor"
    | "blunt-force-mitigation"
    | "true-grit"
    | "kinetic-displacement-mitigation"
    | "oxygenator"
    | "concussive-padding-grenadier"
    | "concussive-padding-hazmat"
    | "concussive-padding-reinforced"
    | "reduced-signature"
    | "supplementary-adrenaline"
    | "rock-solid"
    | "desert-stormer"
    | "feet-first"
    | "adreno-defibrillator"
    | "ballistic-padding"
    | "reinforced-epaulettes"
    | "gunslinger"
    | "integrated-explosives"
    | "acclimated"
    | "siege-ready"
    | "unflinching"
    | "advanced-filtration"
    | "inflammable"
    | "peak-physique"
    | "electrical-conduit"
    | "fortified"
    | "scout"
    | "engineering-kit"
    | "med-kit"
    | "servo-assisted"
    | "democracy-protects"
    | "extra-padding"
    | "support-weapon"
    | "sentry"
    | "backpack"
    | "eagle"
    | "orbital"
    | "emplacement"
    | "vehicle"
    | "anti-tank"
    | "explosive"
    | "incendiary"
    | "arc"
    | "beam"
    | "caustic"
    | "heat"
    | "stun"
    | "one-handed"
    | "chargeup"
    | "sticky"
    | "guided"
    | "expendable"
    | "stationary-reload"
    | "hellpod"
    | "light-armor-penetrating"
    | "medium-armor-penetrating"
    | "heavy-armor-penetrating"
    | "booster";
    
export type PlayerStatus = "loading"
    | "ready"
    | "error"

export type ArmoryStatus = "loading"
    | "cached"
    | "fresh"
    | "error";

export interface KeywordFilter {
    keywords: Keyword[];           // items must match according to filterMode
    filterMode: "AND" | "OR";      // AND = item needs every keyword; OR = item needs any one of them
}

export type GrantValue = string
    | string[]
    | Keyword
    | KeywordFilter

export interface PlayerRow {
    label: string; 
    getValue: (player: PlayerData) => string;
    getOptions: (armory: ArmoryData) => string[];
    applyValue: (value: string) => Partial<PlayerData>;
}

export interface LoadoutPackage {
    id: string;                                             // Unique identifier
    name: string;                                           // Full name of the package
    grants: Partial<Record<keyof PlayerData, GrantValue>>;  // Description of what the package gives the Diver.
    reroll?: (keyof PlayerData)[];                          // Fields randomly rerolled from unlocked gear, no player choice - "take what you get".
    restricts?: string                                      // Description of anything the package restricts for the Diver.
}

export interface TeamMilestone {
    difficultyThreshold: number;    // Level of the milestone.
    specializationChoices: number;  // Count of allowed specializations for the Diver.
    requisitionChoices: number;     // Count of allowed requisitions for the Diver.
}

export type DeathOutcome = "squad-wiped" | "squad-extracted"

export interface MissionResult {
    difficulty: number;
    primaryCompleted: boolean;
    secondariesCompleted: boolean;
    basesDestroyed: boolean;
    spinsEarned: number;            // 1 per True boolean above
    operationCompleted: boolean;    // if true, increase difficulty by 1 and level up!
}

export interface GameItem {
    name: string;           // Item's in-game name.
    available: boolean;     // If the player has unlocked the item in-game.
    locked: boolean;        // Used to prevent removing starting gear from the armory.
    keywords?: Keyword[];   // List of keywords for filtering ease.
}

export function newGameItem(name:string, 
    keywords: Keyword[] = [],
    available: boolean = false, 
    locked: boolean = false)
    : GameItem
{
    return {
        name,
        available,
        locked,
        keywords
    };
}

export interface ArmoryCache {
    dataTimeStamp: number   // epoch ms
    cacheData: Record<ItemCategory, GameItem[]>
}

export interface ArmoryData {
    dataTimeStamp: number   // epoch ms
    data: Record<ItemCategory, Map<string, GameItem>>
}

export interface PlayerData {
    level: number,
    faction: string,
    factionRerollLevel: number,     // the highest difficulty threshold (4 or 7) a Faction reroll has already been done for
    primary: string,
    secondary: string,
    grenade: string,
    armor: string,
    stratagem1: string,
    stratagem2: string,
    stratagem3: string,
    stratagem4: string,
    booster: string,
    specialization: LoadoutPackage,
    requisitions: LoadoutPackage[],
    missionHistory: MissionResult[]
}

export interface Player{
    player: PlayerData,
    status: PlayerStatus,
    updatePlayer: (patch: Partial<PlayerData>) => void
}

export interface Armory {
    armory: ArmoryData,
    status: ArmoryStatus,
    toggleItemAvailable: (category:ItemCategory, name: string) => void,
    refreshArmory: () => void
}