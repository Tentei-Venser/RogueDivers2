import type {PlayerData, ArmoryData, ItemCategory, RestoredSave} from "../types/Objects";
import { getDefaultLoudout } from "./Player";
export const SAVE_DATA_VERSION = 1;

export interface SaveData {
    saveDataVersion: number;
    appVersion: string;
    dataVersion: string;
    commitSha: string;
    armoryDataVersion: string;
    exportedAt: Date;
    player: PlayerData;
    unlocked: Partial<Record<ItemCategory, string[]>>;
}

function buildSaveData(player: PlayerData, armory: ArmoryData): SaveData {
    const unlocked: Partial<Record<ItemCategory, string[]>> = {};
    for (const [category, items] of Object.entries(armory.data)) {
        unlocked[category as ItemCategory] = Array.from(items.values())
            .filter(item => item.available)
            .map(item => item.name);
    }  
    return {
        saveDataVersion: SAVE_DATA_VERSION, 
        appVersion: __APP_VERSION__,
        dataVersion: __DATA_VERSION__,
        commitSha: __COMMIT_SHA__,
        armoryDataVersion: armory.catalogVersion ?? "unknown",
        exportedAt: new Date(), 
        player, 
        unlocked
    };
}

function downloadSaveData(saveData: SaveData) {
    const year = saveData.exportedAt.getFullYear();
    const month = String(saveData.exportedAt.getMonth() + 1).padStart(2, "0");
    const day = String(saveData.exportedAt.getDate()).padStart(2, "0");
    const hour = String(saveData.exportedAt.getHours()).padStart(2, "0");
    const minute = String(saveData.exportedAt.getMinutes()).padStart(2, "0");
    const second = String(saveData.exportedAt.getSeconds()).padStart(2, "0");
    
    const blob = new Blob([JSON.stringify(saveData, null, 2)], {type: "application/json"});
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Roguedivers2_SaveData_${year}-${month}-${day}_${hour}-${minute}-${second}_Z.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 0);
}

function promptForFile(accept = ".json,application/json"): Promise<File | null> {
    return new Promise((resolve) => {
        const input = document.createElement("input");
        input.type = "file";
        input.accept = accept;
        input.onchange = () => resolve(input.files?.[0] ?? null);
        input.oncancel = () => resolve(null);
        input.click();
    });
}

export async function handleExport(player: PlayerData, armory: ArmoryData) {
    const saveData = buildSaveData(player, armory);
    downloadSaveData(saveData);
}

export async function handleImport(updatePlayer: (player: Partial<PlayerData>) => void, 
        replaceArmory: (newArmory: Map<ItemCategory, string[]>) => void) {
    const file = await promptForFile();
    if (!file) return;
    const text = await file.text();
    try {
        const restored = restoreSaveData(text);
        if (!confirm("Importing this save will overwrite your current player and armory data. Are you sure you want to proceed?")) return;
        replaceArmory(restored.armory);
        updatePlayer(restored.player);
    } catch (error) {
        alert((error as Error).message);
    }
}
// Builds the restored state without touching React state or localStorage, so the caller
// can validate/confirm first and then commit both halves together (or neither).
// Throws with a user-facing message if the save is unusable.
function restoreSaveData(text: string): RestoredSave {
    try {
        if (!text) 
            throw new Error("File is empty.");
        const save = JSON.parse(text) as SaveData;
        if (typeof save !== "object" || save === null)
            throw new Error("File isn't a Roguedivers2 save.");
        if (typeof save.saveDataVersion !== "number")
            throw new Error("Save is missing its version.");
        if (save.saveDataVersion > SAVE_DATA_VERSION)
            throw new Error("Save was made by a newer version of the app.");
        if (typeof save.player !== "object" || save.player === null)
            throw new Error("Save has no player data.");

        if (save.player.missionHistory === undefined || !Array.isArray(save.player.missionHistory))
            save.player.missionHistory = [];
        if (save.player.requisitions === undefined || !Array.isArray(save.player.requisitions))
            save.player.requisitions = [];

        // Same default-merge the player loader uses, so saves from before a field existed still load.
        const playerDefaults = getDefaultLoudout();
        for (const key of Object.keys(playerDefaults) as (keyof PlayerData)[]) {
            if (typeof(save.player[key]) !== typeof(playerDefaults[key]) || save.player[key] === null) {
                delete save.player[key];
            }
        }
        const player: PlayerData = { ...playerDefaults, ...save.player };

        const unlocked = (typeof save.unlocked === "object" && save.unlocked !== null) ? save.unlocked : {};
        const armory = new Map<ItemCategory, string[]>();
        for (const [category, names] of Object.entries(unlocked) as [ItemCategory, string[]][]) {
            armory.set(category, Array.isArray(names) ? names.filter(n => typeof n === "string") : []);
        }

        return {
            player,
            armory,
        };

    }
    catch (error) {
        if (error instanceof SyntaxError) {
            throw new Error("Failed to parse save data. Please ensure the file is a valid Roguedivers2 save: " + (error as Error).message);
        }
        else {
            throw error;
        }
    }
}