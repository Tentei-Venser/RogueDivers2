import type { PlayerData } from "../../types/Objects";
import { rollFaction, isFactionRerollDue, highestFactionRerollThreshold } from "../../data/Factions";
import "./PlayerView.css"

interface FactionTrackerProps {
    player: PlayerData;
    onUpdate: (patch: Partial<PlayerData>) => void;
}

export function FactionTracker(props: FactionTrackerProps) {
    const due = isFactionRerollDue(props.player);

    function roll() {
        props.onUpdate({
            faction: rollFaction(),
            factionRerollLevel: Math.max(props.player.factionRerollLevel, highestFactionRerollThreshold(props.player.level)),
        });
    }

    return (
        <div className="faction-tracker">
            <span>Faction: <strong>{props.player.faction || "Not yet rolled"}</strong></span>
            {due && (
                <div className="milestone-banner">
                    <span>{props.player.faction ? "A Faction reroll is due." : "Roll your starting Faction."}</span>
                    <button onClick={roll}>{props.player.faction ? "Reroll Faction" : "Roll Faction"}</button>
                </div>
            )}
        </div>
    );
}
