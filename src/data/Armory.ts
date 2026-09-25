import type { ArmoryStatus, ArmoryData, ArmoryCache, ItemCategory, GameItem } from "../types/Objects"
import { newGameItem } from "../types/Objects"
import { useState, useEffect } from "react"
import { PopulateArmoryCache } from "./ArmoryBackup"

const CACHE_KEY = "Roguedivers2Cache";
const CACHE_TTL = 
    1000    // 1K ms
    * 60    // 60 s
    * 60    // 60 m
    * 24    // 24 h
    * 1     //  1 d


// receive cached data and organize for easier UI usage.
function buildArmoryData(cache: ArmoryCache)
    : ArmoryData
{
    const armory:ArmoryData = {
        dataTimeStamp: cache.dataTimeStamp,
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
        cacheData: cache
    }
}

// merge existing armory data with fresh cache data.
export function mergeArmoryData(liveData: ArmoryData, newData: ArmoryCache)
    : ArmoryData
{    
    // merge new items from newData into liveData
    const merged:ArmoryData = {
        dataTimeStamp: newData.dataTimeStamp,
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
                    newItem.locked)]))
    }
    
    return merged;
}

export function useArmory() {
    const [armory, setArmory] = useState<ArmoryData>({
        dataTimeStamp:0,
        data: {} as Record<ItemCategory, Map<string, GameItem>>
    });
    const [status, setStatus] = useState<ArmoryStatus>("loading");

    // load once on mount
    useEffect(() => {
        function loadData() {
            const cachedRaw = localStorage.getItem(CACHE_KEY);
            let cached: ArmoryCache | null = cachedRaw ? JSON.parse(cachedRaw) : null;

            let liveData: ArmoryData | null = null;
            if (cached)
            {
                liveData = buildArmoryData(cached);
                setArmory(liveData);
                setStatus("cached");
            }

            // check if data is stale and refresh if needed.
            const isStale = !cached || Date.now() - cached.dataTimeStamp > CACHE_TTL;
            if (isStale)
                try {
                    setStatus("loading");
                    const fresh = PopulateArmoryCache();

                    if (fresh) {
                        // merge, never overwrite - preserves every available/locked toggle already made.
                        const merged = liveData ? mergeArmoryData(liveData, fresh) : buildArmoryData(fresh);
                        setArmory(merged);
                        localStorage.setItem(CACHE_KEY, JSON.stringify(buildArmoryCache(merged)))
                        setStatus("fresh");
                    }
                }
                catch (error) {
                    setStatus(cached ? "cached" : "error")
                    console.error(error)
                }
            else
                setStatus("fresh");
        }

        loadData()
    }, []);

    // Manually force a refresh against the (possibly updated) static catalog - e.g. after a new
    // Warbond's items have been added to ArmoryBackup.ts, without waiting for the 24h TTL.
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
                dataTimeStamp: prev.dataTimeStamp,
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
                dataTimeStamp: prev.dataTimeStamp,
                data: nextData
            };

            localStorage.setItem(CACHE_KEY, JSON.stringify(buildArmoryCache(next)));
            return next;
        })
    }

    return {
        armory,
        status,
        toggleItemAvailable,
        refreshArmory,
        selectAllItems
    };
}