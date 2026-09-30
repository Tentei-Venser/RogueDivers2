import type { LoadoutPackage } from "../types/Objects";

export const SPECIALIZATIONS: LoadoutPackage[] = [
    { id: "apprentice-corpsman", name: "Apprentice Corpsman",
      grants: { armor: "med-kit", secondary: "P-11 Stim Pistol" } },

    { id: "big-game-hunter", name: "Big Game Hunter",
      grants: { stratagem1: "S-11 Speargun", armor: "desert-stormer" } },

    { id: "cav-scout", name: "Cav Scout",
      grants: { armor: "scout", stratagem1:"M-102 Gunner FRV" } }, 

    { id: "commissar", name: "Commissar",
      grants: { secondary: "P/40-K Bolt Pistol", armor: "democracy-protects" },
      restricts: "No CB-9 Exploding Crossbow" },

    { id: "courier", name: "Courier",
      grants: { primary: "rounds-reload", stratagem1: "guard-dog" } },

    { id: "diver-with-no-name", name: "Diver With No Name",
      grants: { secondary: "firearm", armor: "gunslinger" } },

    { id: "grenadier", name: "Grenadier",
      grants: { grenade: "explosive", armor: { keywords: ["concussive-padding-grenadier", "engineering-kit", "integrated-explosives"], filterMode: "OR" } } },

    { id: "guardsman", name: "Guardsman",
      grants: { primary: "R/40-K Hot-Shot Marksman Rifle", armor: "true-grit" } },

    { id: "hellghast", name: "Hellghast",
      grants: { primary: "StA-52 Assault Rifle", armor: "acclimated" } },

    { id: "hellspartan", name: "Hellspartan",
      grants: { secondary: "melee", armor: { keywords: ["peak-physique", "rock-solid"], filterMode: "OR" } } },

    { id: "honor-guard", name: "Honor Guard",
      grants: { primary: "R-2 Amendment", armor: "reinforced-epaulettes" } },

    { id: "less-lethal", name: "Less Lethal",
      grants: { primary: "AR-32 Pacifier", grenade: "G-109 Urchin", armor: "ballistic-padding" } },

    { id: "logi-diver", name: "Logi-Diver",
      grants: { booster: "Hellpod Space Optimization", stratagem1: "B-1 Supply Pack" } },

    { id: "pest-control", name: "Pest Control",
      grants: { grenade: "G-4 Gas", armor: "advanced-filtration" } },

    { id: "pyromaniac", name: "Pyromaniac",
      grants: { primary: "FLAM-66 Torcher", armor: "inflammable" } },

    { id: "python-commando", name: "Python Commando",
      grants: { stratagem1: "CQC-9 Defoliation Tool", armor: "rock-solid" } },

    { id: "recon-diver", name: "Recon-Diver",
      grants: { stratagem1: "APW-1 Anti-Materiel Rifle", armor: { keywords: ["scout", "light-armor"], filterMode: "AND" } } },

    { id: "redacted-primary", name: "REDACTED (Primary Suppressed)",
      grants: { primary: "suppressed", armor: "reduced-signature" } },

    { id: "redacted-secondary", name: "REDACTED (Secondary Suppressed)",
      grants: { secondary: "suppressed", armor: "reduced-signature" } },

    { id: "science-diver", name: "Science-Diver",
      grants: { grenade: "G-31 Arc", armor: "adreno-defibrillator" } },

    { id: "test-subject", name: "Test Subject",
      grants: { stratagem1: "LIFT-182 Warp Pack", armor: "adreno-defibrillator" } },

    { id: "trench-diver", name: "Trench-Diver",
      grants: {
          secondary: "CQC-73 Entrenchment Tool",
          armor: { keywords: ["concussive-padding-grenadier", "concussive-padding-hazmat", "concussive-padding-reinforced"], filterMode: "OR" },
          stratagem1: "mortar-sentry",
      } },

    { id: "truth-enforcer", name: "Truth Enforcer",
      grants: { primary: "SG-20 Halt", armor: "unflinching" } },

    { id: "turtle-diver", name: "Turtle-Diver",
      grants: { armor: "heavy-armor", stratagem1: ["SH-51 Directional Shield", "SH-20 Ballistic Shield Backpack"] } },

    { id: "martyr", name: "Martyr",
      grants: { grenade: "G-50 Seeker", armor: "integrated-explosives" } },

    { id: "viper-commando", name: "Viper Commando",
      grants: { primary: "AR-23A Liberator Carbine", armor: "peak-physique" } },

    { id: "wrecking-crew", name: "Wrecking Crew",
      grants: { stratagem1: "CQC-20 Breaching Hammer", armor: "supplementary-adrenaline" } },
];
