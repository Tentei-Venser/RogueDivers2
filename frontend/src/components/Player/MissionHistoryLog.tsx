import type { PlayerData } from "../../types/Objects";
import "./PlayerView.css"

interface MissionHistoryLogProps {
    player: PlayerData;
}

export function MissionHistoryLog(props: MissionHistoryLogProps) {
    const history = [...props.player.missionHistory].reverse(); // most recent first

    return (
        <details className="mission-history">
            <summary>Mission History ({history.length})</summary>
            {history.length === 0 ? (
                <p>No missions logged yet.</p>
            ) : (
                <ul>
                    {history.map((mission, i) => (
                        <li key={i}>
                            <span>Difficulty {mission.difficulty}</span>
                            <span>{mission.primaryCompleted ? "Primary ✓" : "Primary ✗"}</span>
                            <span>{mission.secondariesCompleted ? "Secondaries ✓" : "Secondaries ✗"}</span>
                            <span>{mission.basesDestroyed ? "Bases ✓" : "Bases ✗"}</span>
                            <span>{mission.spinsEarned} spin{mission.spinsEarned !== 1 ? "s" : ""}</span>
                            <span className={mission.operationCompleted ? "mission-success" : "mission-failure"}>
                                {mission.operationCompleted ? "Operation Completed" : "Operation Not Completed"}
                            </span>
                        </li>
                    ))}
                </ul>
            )}
        </details>
    );
}
