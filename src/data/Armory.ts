import type { ArmoryStatus, ArmoryData, ArmoryCache, ItemCategory, GameItem, Keyword, CatalogUpdate } from "../types/Objects"
import { newGameItem } from "../types/Objects"
import { useState, useEffect } from "react"
import { PopulateArmoryCache, CATALOG_VERSION } from "./ArmoryBackup"

const CACHE_KEY = "Roguedivers2Cache";

export function formatArmorPassive(passive: Keyword): string {
    return passive
        .split("-")
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");
}

export function formatArmorName(name: string, armory: ArmoryData): string {
    const keywords = formatArmorKeywords(name, armory);
    return keywords.length ? `${name} [${keywords.join(", ")}]` : name;
}

export function formatArmorKeywords(name: string, armory: ArmoryData): string[] {
    const keywords = armory.data.armor?.get(name)?.keywords ?? [];
    const weightLabels: Record<string, string> = {
        "light-armor": "Light",
        "medium-armor": "Medium",
        "heavy-armor": "Heavy",
    };
    const weightKeyword = keywords.find(keyword => weightLabels[keyword]);
    const weight = weightKeyword ? weightLabels[weightKeyword] : null;
    const passiveKeyword = keywords.find(keyword => !weightLabels[keyword]);
    const passive = passiveKeyword ? formatArmorPassive(passiveKeyword) : null;
    return [weight, passive].filter((keyword): keyword is string => !!keyword);
}


// receive cached data and organize for easier UI usage.
function buildArmoryData(cache: ArmoryCache)
    : ArmoryData
{
    const armory:ArmoryData = {
        dataTimeStamp: cache.dataTimeStamp,
        catalogVersion: cache.catalogVersion,
        data: {} as Record<ItemCategory, Map<string, GameItem>>
    };

    for (const [category, items] of Object.entries(cache.cacheData) as [ItemCategory, GameItem[]][]){
        armory.data[category] = new Map(items.map(item => [item.name, item]));
    }
    return armory;
}

// receive UI armory data and collapse for more serializable cache data.
function buildArmoryCache(armory: ArmoryData)
    : ArmoryCache
{
    const cache = {} as Record<ItemCategory, GameItem[]>
    for (const [category, itemMap] of Object.entries(armory.data) as [ItemCategory, Map<string, GameItem>][])
    {
        cache[category] = Array.from(itemMap.values())
    }

    return {
        dataTimeStamp: armory.dataTimeStamp,
        catalogVersion: armory.catalogVersion,
        cacheData: cache
    }
}

// How many items the merged armory has that the old save didn't - shown in the update notice.
function countNewItems(before: ArmoryData, after: ArmoryData): number {
    let count = 0;
    for (const [category, itemMap] of Object.entries(after.data) as [ItemCategory, Map<string, GameItem>][])
        for (const name of itemMap.keys())
            if (!before.data[category]?.has(name)) count++;
    return count;
}

// merge existing armory data with fresh cache data.
export function mergeArmoryData(liveData: ArmoryData, newData: ArmoryCache)
    : ArmoryData
{    
    // merge new items from newData into liveData
    const merged:ArmoryData = {
        dataTimeStamp: newData.dataTimeStamp,
        catalogVersion: newData.catalogVersion,
        data: {} as Record<ItemCategory, Map<string, GameItem>>
    }

    // new items are the truth source.
    // create new Armory lists, taking availability existing item lists.
    for (const [category, newItems] of Object.entries(newData.cacheData) as [ItemCategory, GameItem[]][]) {
        merged.data[category] = new Map(
            Array.from(newItems, 
                newItem => [newItem.name, newGameItem(
                    newItem.name,
                    newItem.keywords,
                    liveData.data[category]?.get(newItem.name)?.available ?? newItem.available,
                    newItem.locked,
                    newItem.disabled)]))
    }
    
    return merged;
}

export function useArmory() {
    const [armory, setArmory] = useState<ArmoryData>({
        dataTimeStamp:0,
        data: {} as Record<ItemCategory, Map<string, GameItem>>
    });
    const [status, setStatus] = useState<ArmoryStatus>("loading");
    const [catalogUpdate, setCatalogUpdate] = useState<CatalogUpdate | null>(null);

    // load once on mount
    useEffect(() => {
        function loadData() {
            const cachedRaw = localStorage.getItem(CACHE_KEY);
            let cached: ArmoryCache | null = null;
            try {
                cached = cachedRaw ? JSON.parse(cachedRaw) : null;
            }
            catch (error) {
                console.error("Error parsing cached armory data:", error);
            }

            // Saved Armory already matches the bundled catalog - use it as-is.
            if (cached && cached.catalogVersion === CATALOG_VERSION) {
                setArmory(buildArmoryData(cached));
                setStatus("fresh");
                return;
            }

            // No save yet, or one built from a different catalog version (including saves from before
            // versioning existed): merge with the current catalog, never overwrite - preserves every
            // available toggle already made.
            const liveData = cached ? buildArmoryData(cached) : null;
            try {
                const fresh = PopulateArmoryCache();
                const merged = liveData ? mergeArmoryData(liveData, fresh) : buildArmoryData(fresh);
                setArmory(merged);
                localStorage.setItem(CACHE_KEY, JSON.stringify(buildArmoryCache(merged)));
                setStatus("fresh");
                // A first visit has nothing to have been updated, so only existing saves get the notice.
                if (liveData)
                    setCatalogUpdate({ version: CATALOG_VERSION, newItems: countNewItems(liveData, merged) });
            }
            catch (error) {
                console.error(error);
                // Fall back to the outdated save rather than showing nothing.
                if (liveData) {
                    setArmory(liveData);
                    setStatus("cached");
                }
                else setStatus("error");
            }
        }

        loadData()
    }, []);

    function dismissCatalogUpdate() {
        setCatalogUpdate(null);
    }

    // Manually force a refresh against the (possibly updated) static catalog - e.g. after a new
    // Warbond's items have been added to ArmoryBackup.ts. Loads already merge automatically when
    // CATALOG_VERSION changes; this is the escape hatch if a catalog edit forgot to bump it.
    function refreshArmory() {
        try {
            setStatus("loading");
            const fresh = PopulateArmoryCache();
            if (fresh) {
                setArmory(prev => {
                    const merged = mergeArmoryData(prev, fresh);
                    localStorage.setItem(CACHE_KEY, JSON.stringify(buildArmoryCache(merged)));
                    return merged;
                });
                setStatus("fresh");
            }
        }
        catch (error) {
            setStatus("error");
            console.error(error);
        }
    }

    function toggleItemAvailable(category:ItemCategory, name: string) {
        setArmory(prev => {
            if (!prev) return prev;
            const item = prev.data[category]?.get(name);
            if (!item || item.locked) return prev;

            const updatedCategory = new Map(prev.data[category]);
            updatedCategory.set(name, {...item, available: !item.available});

            const next: ArmoryData = {
                ...prev,
                data: {...prev.data, [category]: updatedCategory}
            };

            localStorage.setItem(CACHE_KEY, JSON.stringify(buildArmoryCache(next)));
            return next;
        })
    }

    function selectAllItems(){
        setArmory(prev => {
            const nextData = {} as Record<ItemCategory, Map<string, GameItem>>;

            for (const [category, itemMap] of Object.entries(prev.data) as [ItemCategory, Map<string, GameItem>][]) {
                const updatedCategory = new Map(itemMap);
                for (const [itemName, item] of itemMap) {
                    if (item.locked) continue; // never touch locked starting gear
                    updatedCategory.set(itemName, {...item, available: true});
                }
                nextData[category] = updatedCategory;
            }

            const next: ArmoryData = {
                ...prev,
                data: nextData
            };

            localStorage.setItem(CACHE_KEY, JSON.stringify(buildArmoryCache(next)));
            return next;
        })
    }

    function deselectAllItems(){
        setArmory(prev => {
            const nextData = {} as Record<ItemCategory, Map<string, GameItem>>;

            for (const [category, itemMap] of Object.entries(prev.data) as [ItemCategory, Map<string, GameItem>][]) {
                const updatedCategory = new Map(itemMap);
                for (const [itemName, item] of itemMap) {
                    if (item.locked) continue; // never touch locked starting gear
                    updatedCategory.set(itemName, {...item, available: false});
                }
                nextData[category] = updatedCategory;
            }

            const next: ArmoryData = {
                ...prev,
                data: nextData
            };

            localStorage.setItem(CACHE_KEY, JSON.stringify(buildArmoryCache(next)));
            return next;
        })
    }

    return {
        armory,
        status,
        catalogUpdate,
        dismissCatalogUpdate,
        toggleItemAvailable,
        refreshArmory,
        selectAllItems,
        deselectAllItems
    };
}