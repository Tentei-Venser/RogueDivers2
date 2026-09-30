import { useEffect, useState } from 'react';
import type { PlayerData, PlayerStatus } from '../types/Objects'


const CACHE_KEY = "Roguedivers2PlayerCache";

const NO_PACKAGE = { id: "", name: "", grants: {} };

export function getDefaultLoudout()
    : PlayerData
{
    return{
        level: 1,
        faction: "",
        factionRerollLevel: 0,
        primary: "AR-23 Liberator",
        secondary: "P-2 Peacemaker",
        grenade: "G-12 High Explosive",
        armor: "B-01 Tactical",
        stratagem1: "Orbital Precision Strike",
        stratagem2: "MG-43 Machine Gun",
        stratagem3: "",
        stratagem4: "",
        booster: "",
        specialization: NO_PACKAGE,
        requisitions: [],
        missionHistory: []
    }
}

export function usePlayer()
{
    const [player, setPlayer] = useState<PlayerData>(getDefaultLoudout());
    const [status, setStatus] = useState<PlayerStatus>("loading")
    
    // load once on mount
    useEffect(() => {
        function loadData() {
            try{
                const cacheRaw = localStorage.getItem(CACHE_KEY);
                let cached: Partial<PlayerData> | null = cacheRaw ? JSON.parse(cacheRaw) : null;
                // Merge onto a fresh default rather than trusting the cache as complete - a save
                // made before a field (like missionHistory) existed won't have it, and that field
                // would otherwise come back as undefined instead of a sane default.
                if (cached)
                    setPlayer({ ...getDefaultLoudout(), ...cached });
            }
            catch (error) {
                setStatus("error");
                console.error(error);
            }

            setStatus("ready");
        }

        loadData()
    }, []);

    // Save any changes to the player to cache - gated on status === "ready" so this never fires
    // with the default in-memory state before the load effect's async localStorage read has
    // actually landed (which would silently overwrite real saved progress with the starting kit).
    useEffect(() => {
        if (status === "ready") localStorage.setItem(CACHE_KEY, JSON.stringify(player))
    }, [player, status]);

    function updatePlayer(patch: Partial<PlayerData>) {
        setPlayer(prev => prev ? {...prev, ...patch } : prev)
    }

    return {
        player, 
        status,
        updatePlayer
    };
}