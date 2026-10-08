import type { PlayerData } from "../../types/Objects";
import { rollFaction } from "../../data/Factions";
import "./PlayerView.css"

interface FactionTrackerProps {
    player: PlayerData;
    onUpdate: (patch: Partial<PlayerData>) => void;
}

export function FactionTracker(props: FactionTrackerProps) {

    function roll() {
        props.onUpdate({
            faction: rollFaction(),
            factionRerollLevel: Math.max(props.player.factionRerollLevel, props.player.level),
        });
    }

    return (
        <>
            <span className="faction-label">Faction: <strong>{props.player.faction || "Not yet rolled"}</strong></span>
            <button className="faction-action" onClick={roll}>{props.player.faction ? "Reroll Faction" : "Roll Faction"}</button>
        </>
    );
}
