export const FACTIONS = [
    "Terminids", 
    "Terminids - Predator Strain", 
    "Terminids - Spore Burst Strain", 
    "Terminids - Rupture Strain", 
    "Automatons", 
    "Automatons - Jet Brigade", 
    "Automatons - Incineration Corps", 
    "Automatons - Cyborg Legion", 
    "Illuminate", 
    "Illuminate - Appropriators", 
    "Illuminate - Vote Snatchers", 
    "Illuminate - Mindless Masses", 
    "Illuminate - Invasion Fleet"
];

export function rollFaction(): string {
    return FACTIONS[Math.floor(Math.random() * FACTIONS.length)];
}
