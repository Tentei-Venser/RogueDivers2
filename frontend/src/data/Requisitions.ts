import type { LoadoutPackage } from "../types/Objects";

const MECHS = ["EXO-45 Patriot Exosuit", "EXO-49 Emancipator Exosuit", "EXO-51 Lumberer Exosuit", "EXO-55 Breakthrough Exosuit"];
const FRVS = ["M-102 Gunner FRV", "M-103 Supply FRV", "M-104 Incinerator FRV"];
const MINES = ["MD-17 Anti-Tank Mines", "MD-6 Anti-Personnel Minefield", "MD-8 Gas Mines", "MD-I4 Incendiary Mines"];
const MACHINEGUNS = ["MG-43 Machine Gun", "MG-206 Heavy Machine Gun", "M-105 Stalwart"];

export const REQUISITIONS: LoadoutPackage[] = [
    { id: "absolute-democracy", name: "Absolute Democracy",
      grants: { stratagem1: "Orbital 380mm HE Barrage", stratagem2: "Orbital Napalm Barrage" } },

    { id: "anti-tank-team", name: "Anti-Tank Team",
      grants: { stratagem1: "FAF-14 Spear", stratagem2: "M-103 Supply FRV" } },

    { id: "bargain-bin", name: "Bargain Bin",
      grants: {},
      reroll: ["primary", "secondary", "grenade", "armor", "stratagem1", "stratagem2", "stratagem3", "stratagem4", "booster"] },

    { id: "boltgun-supremacy", name: "Boltgun Supremacy",
      grants: { primary: "JAR-5 Dominator", secondary: "P/40-K Bolt Pistol" } },

    { id: "chaaarge", name: "CHAAARGE!",
      grants: { stratagem1: "Orbital Walking Barrage", stratagem2: "Orbital Smoke Strike" } },

    { id: "combat-controller", name: "Combat Controller",
      grants: { stratagem1: "eagle", stratagem2: "eagle" } },

    { id: "finishing-the-fight", name: "Finishing the Fight",
      grants: { armor: "feet-first", primary: "MA5C Assault Rifle" } },

    { id: "getaway-driver", name: "Getaway Driver",
      grants: { stratagem1: "Orbital Smoke Strike", stratagem2: FRVS } },

    { id: "hes-got-a-hammer", name: "He's got a hammer!",
      grants: { stratagem1: "LIFT-850 Jump Pack", stratagem2: "CQC-20 Breaching Hammer" } },

    { id: "hypersonic-freedom", name: "Hypersonic Freedom",
      grants: { stratagem1: "Orbital Railcannon Strike", stratagem2: "RS-422 Railgun" } },

    { id: "i-am-heavy-weapons-guy", name: "I am Heavy Weapons Guy",
      grants: { armor: "peak-physique", stratagem1: { keywords: ["support-weapon", "backpack"], filterMode: "AND" } } },

    { id: "i-know-a-guy", name: "I know a Guy",
      grants: { booster: "booster"},
      restricts: "Choose one squadmate to also gain a booster of their choice." }, // squad-wide effect (you + a squadmate) - out of scope for single-Diver PlayerData

    { id: "im-with-the-science-team", name: "I'm with the SCIENCE TEAM!!!",
      grants: { stratagem1: "PLAS-45 Epoch", stratagem2: "LIFT-182 Warp Pack" } },

    { id: "indirect-fire", name: "Indirect Fire",
      grants: { stratagem1: "mortar-sentry", stratagem2: "mortar-sentry" } },

    { id: "kibby-kommando", name: "Kibby Kommando",
      grants: { primary: "SG-97 Sweeper", stratagem1: "MG-206 Heavy Machine Gun" } },

    { id: "machine-gunner", name: "Machine Gunner",
      grants: { stratagem1: MACHINEGUNS, stratagem2: "B-1 Supply Pack" } },

    { id: "maximum-dakka", name: "Maximum Dakka",
      grants: { stratagem1: "M-1000 Maxigun", stratagem2: "A/G-16 Gatling Sentry" } },

    { id: "melta-man", name: "Melta-Man",
      grants: { grenade: "G/40-K Melta Mine", stratagem1: "40-K Meltagun" } },

    { id: "oops-all-mortars", name: "Oops, All Mortars",
      grants: { stratagem1: "mortar-sentry", stratagem2: "mortar-sentry", stratagem3: "mortar-sentry", stratagem4: "mortar-sentry" } },

    { id: "panzer", name: "Panzer Kommandant",
      grants: { stratagem1: "TD-220 Bastion MK XVI", secondary: "CQC-2 Saber" } },

    { id: "phoenix-down", name: "Phoenix Down",
      grants: {},
      restricts: "Grants one use of Reinforcement Call-In per mission (no permadeath consequence for the squad). Only the Diver holding this may use it, and only one Diver may hold it at a time. Not an equipment grant - not modeled." },

    { id: "reloading-is-a-skill-issue", name: "Reloading is a Skill Issue",
      grants: { primary: "LAS-13 Trident", stratagem1: "LAS-98 Laser Cannon" } },

    { id: "rip-and-tear", name: "Rip and Tear",
      grants: { primary: "DBS-2 Double Freedom", secondary: "CQC-42 Machete", armor: "RS-6 Fiend Destroyer" } },

    { id: "saboteur", name: "Saboteur",
      grants: { stratagem1: "Orbital Smoke Strike", stratagem2: "B/MD C4 Pack" } },

    { id: "shady-soul", name: "Shady Soul",
      grants: { stratagem1: "B-100 Portable Hellbomb", stratagem2: "EAT-411 Leveller" } },

    { id: "snacks-for-days", name: "Snacks for Days",
      grants: { stratagem1: "M-103 Supply FRV", stratagem2: "B-1 Supply Pack" } },
      // PDF says "B-1 Supply FRV" - no such item exists; treated as a typo for "B-1 Supply Pack"

    { id: "social-distancing", name: "Social Distancing",
      grants: { stratagem1: "Orbital Gas Strike", stratagem2: "A/ARC-3 Tesla Tower" } },

    { id: "stick-and-his-dog", name: "Stick and his Dog",
      grants: { stratagem1: "MG-43 Machine Gun", stratagem2: "AX/LAS-5 Rover" } },

    { id: "striding-into-valor", name: "Striding into Valor",
      grants: { stratagem1: "APW-1 Anti-Materiel Rifle", stratagem2: "B-1 Supply Pack" } },

    { id: "target-acquired", name: "Target Acquired",
      grants: { secondary: "P-33 Missile Pistol", stratagem1: ["FAF-14 Spear", "StA-X3 W.A.S.P. Launcher"] } },

    { id: "the-buffet", name: "The Buffet (All you can EAT)",
      grants: { stratagem1: "expendable", stratagem2: "expendable", stratagem3: "expendable", stratagem4: "expendable" } },

    { id: "the-dragon", name: "The Dragon",
      grants: { stratagem1: "LIFT-860 Hover Pack", stratagem2: "FLAM-40 Flamethrower" } },

    { id: "the-seagull", name: "The Seagull",
      grants: { stratagem1: MINES, stratagem2: MINES, stratagem3: MINES, stratagem4: MINES } },

    { id: "thunder-run", name: "Thunder Run",
      grants: { stratagem1: MECHS, stratagem2: "eagle" } },

    { id: "totally-not-on-fire", name: "Totally not on Fire",
      grants: { primary: "AR-2 Coyote", stratagem1: "B/FLAM-80 Cremator" } },

    { id: "to-whom-it-may-concern", name: "To whom it may Concern",
      grants: { stratagem1: "Eagle 500kg Bomb", stratagem2: "MS-11 Solo Silo" } },

    { id: "unlimited-power", name: "UNLIMITED POWER",
      grants: { stratagem1: "ARC-3 Arc Thrower", stratagem2: "AX/ARC-3 K-9" } },
];
