import { useRef, useState } from "react";
import type { ArmoryData, GameItem, Keyword, MissionResult, PlayerData } from "../../types/Objects";
import { WHEELS, WHEEL_FIELDS, rollWheel, wheelPool, armorPassivePool, rollArmorPassive, armorSetsWithPassive, type Wheel } from "../../data/Wheels";
import { formatArmorName, formatArmorPassive } from "../../data/Armory";
import "./PlayerView.css"

interface MissionResultsProps {
    player: PlayerData;
    armory: ArmoryData;
    onUpdate: (patch: Partial<PlayerData>) => void;
}

export function MissionResults(props: MissionResultsProps) {
    const dialogRef = useRef<HTMLDialogElement>(null);
    const [step, setStep] = useState<"form" | "spin">("form");
    const [primaryCompleted, setPrimaryCompleted] = useState(false);
    const [secondariesCompleted, setSecondariesCompleted] = useState(false);
    const [basesDestroyed, setBasesDestroyed] = useState(false);
    const [operationCompleted, setOperationCompleted] = useState(false);
    const [spinsRemaining, setSpinsRemaining] = useState(0);
    const [activeWheel, setActiveWheel] = useState<Wheel | null>(null);
    const [rolledItem, setRolledItem] = useState<GameItem | null>(null);
    const [rolledPassive, setRolledPassive] = useState<Keyword | null>(null);
    const [pendingMission, setPendingMission] = useState<MissionResult | null>(null);
    const [pendingLoadout, setPendingLoadout] = useState<Partial<PlayerData>>({});
    const lootPlayer = { ...props.player, ...pendingLoadout };

    function open() {
        setStep("form");
        setPrimaryCompleted(false);
        setSecondariesCompleted(false);
        setBasesDestroyed(false);
        setOperationCompleted(false);
        setSpinsRemaining(0);
        setActiveWheel(null);
        setRolledItem(null);
        setRolledPassive(null);
        setPendingMission(null);
        setPendingLoadout({});
        dialogRef.current?.showModal();
    }

    function nextLevel(result: MissionResult) {
        return result.operationCompleted ? Math.min(10, result.difficulty + 1) : result.difficulty;
    }

    // The mission and every loot pick stay staged until the player accepts the summary screen -
    // cancelling or escaping out at any step leaves the player untouched.
    function acceptMission() {
        if (pendingMission) {
            props.onUpdate({
                ...pendingLoadout,
                level: nextLevel(pendingMission),
                missionHistory: [...props.player.missionHistory, pendingMission],
            });
        }
        dialogRef.current?.close();
    }

    function cancelLootDrops() {
        setPendingMission(null);
        setPendingLoadout({});
        setSpinsRemaining(0);
        setActiveWheel(null);
        setRolledItem(null);
        setRolledPassive(null);
        setStep("form");
        dialogRef.current?.close();
    }

    function submit() {
        const spins = [primaryCompleted, secondariesCompleted, basesDestroyed].filter(Boolean).length;
        const result: MissionResult = {
            difficulty: props.player.level,
            primaryCompleted,
            secondariesCompleted,
            basesDestroyed,
            spinsEarned: spins,
            operationCompleted,
        };

        setSpinsRemaining(spins);
        setPendingMission(result);
        setPendingLoadout({});
        setStep("spin");
    }

    function pickWheel(wheel: Wheel) {
        setActiveWheel(wheel);
        if (wheel.rollsPassive) {
            setRolledPassive(rollArmorPassive(props.armory, lootPlayer));
            setRolledItem(null);
        } else {
            setRolledItem(rollWheel(wheel, props.armory, lootPlayer));
            setRolledPassive(null);
        }
    }

    function finishSpin(patch?: Partial<PlayerData>) {
        const updatedLoadout = patch ? { ...pendingLoadout, ...patch } : pendingLoadout;
        setPendingLoadout(updatedLoadout);
        setSpinsRemaining(spinsRemaining - 1);
        setActiveWheel(null);
        setRolledItem(null);
        setRolledPassive(null);
    }

    return (
        <>
            <button className="starting-armor-button" onClick={open}>Log Mission Result</button>

            <dialog ref={dialogRef} className="item-picker mission-results-dialog">
                {step === "form" && (
                    <>
                        <h3>Mission Result</h3>
                        <ul className="mission-checklist">
                            <li><label><input type="checkbox" checked={primaryCompleted} onChange={e => setPrimaryCompleted(e.target.checked)} /> Primary Objective Completed</label></li>
                            <li><label><input type="checkbox" checked={secondariesCompleted} onChange={e => setSecondariesCompleted(e.target.checked)} /> All Secondary Objectives Completed</label></li>
                            <li><label><input type="checkbox" checked={basesDestroyed} onChange={e => setBasesDestroyed(e.target.checked)} /> All Enemy Bases Destroyed</label></li>
                            <li><label><input type="checkbox" checked={operationCompleted} onChange={e => setOperationCompleted(e.target.checked)} /> Operation Completed (advances difficulty)</label></li>
                        </ul>
                        <button className="starting-armor-button" onClick={submit}>Submit</button>
                        <button className="starting-armor-button" onClick={() => dialogRef.current?.close()}>Cancel</button>
                    </>
                )}

                {step === "spin" && spinsRemaining <= 0 && (
                    <>
                        <h3>{pendingMission?.spinsEarned ? "All spins used." : "No spins earned."}</h3>
                        {pendingMission?.operationCompleted && <p>Difficulty will advance to {nextLevel(pendingMission)}.</p>}
                        {Object.keys(pendingLoadout).length > 0 && (
                            <ul className="package-effects">
                                {Object.entries(pendingLoadout).map(([field, value]) => (
                                    <li key={field}>{field}: {field === "armor" ? formatArmorName(String(value), props.armory) : String(value)}</li>
                                ))}
                            </ul>
                        )}
                        <button className="starting-armor-button" onClick={acceptMission}>Accept</button>
                        <button className="starting-armor-button" onClick={cancelLootDrops}>Cancel</button>
                    </>
                )}

                {step === "spin" && spinsRemaining > 0 && !activeWheel && (
                    <>
                        <h3>{spinsRemaining} spin{spinsRemaining > 1 ? "s" : ""} remaining - pick a wheel</h3>
                        <ul>
                            {WHEELS.map(wheel => {
                                const poolSize = wheel.rollsPassive
                                    ? armorPassivePool(props.armory, lootPlayer).length
                                    : wheelPool(wheel, props.armory, lootPlayer).length;
                                return (
                                    <li key={wheel.label}>
                                        <button className="starting-armor-button" disabled={poolSize === 0} onClick={() => pickWheel(wheel)}>
                                            {wheel.label} ({poolSize} available)
                                        </button>
                                    </li>
                                );
                            })}
                        </ul>
                        <button className="starting-armor-button" onClick={cancelLootDrops}>Cancel</button>
                    </>
                )}

                {step === "spin" && activeWheel && activeWheel.rollsPassive && (
                    <>
                        <h3>{activeWheel.label}</h3>
                        {rolledPassive ? (
                            <>
                                <p className="milestone-banner loot-result-banner">
                                    Rolled passive: <strong>{formatArmorPassive(rolledPassive)}</strong>
                                </p>
                                <p>Choose which unlocked armor set to equip:</p>
                                <ul>
                                    {armorSetsWithPassive(props.armory, rolledPassive).map(item => (
                                        <li key={item.name}>
                                            <button className="starting-armor-button" onClick={() => finishSpin({ armor: item.name })}>
                                                {formatArmorName(item.name, props.armory)}
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                                <button className="starting-armor-button" onClick={() => finishSpin()}>Keep current gear</button>
                            </>
                        ) : (
                            <>
                                <p>No new result here - everything eligible is already equipped or unavailable.</p>
                                <button className="starting-armor-button" onClick={() => finishSpin()}>Keep current gear</button>
                            </>
                        )}
                    </>
                )}

                {step === "spin" && activeWheel && !activeWheel.rollsPassive && (
                    <>
                        <h3>{activeWheel.label}</h3>
                        {rolledItem ? (
                            <>
                                <p className="milestone-banner loot-result-banner">Rolled: <strong>
                                    {activeWheel.category === "armor"
                                        ? formatArmorName(rolledItem.name, props.armory)
                                        : rolledItem.name}
                                </strong></p>
                                <ul>
                                    {WHEEL_FIELDS[activeWheel.category].map(field => {
                                        const currentItem = String(lootPlayer[field]) || "-";
                                        return (
                                            <li key={field}>
                                                <button className="starting-armor-button" onClick={() => finishSpin({ [field]: rolledItem.name })}>
                                                    Equip as {field} (currently: {currentItem})
                                                </button>
                                            </li>
                                        );
                                    })}
                                </ul>
                                <button className="starting-armor-button" onClick={() => finishSpin()}>Keep current gear</button>
                            </>
                        ) : (
                            <>
                                <p>No new result here - everything eligible is already equipped or unavailable.</p>
                                <button className="starting-armor-button" onClick={() => finishSpin()}>Keep current gear</button>
                            </>
                        )}
                    </>
                )}

                {step === "spin" && activeWheel && (
                    <button className="starting-armor-button" onClick={cancelLootDrops}>Cancel</button>
                )}
            </dialog>
        </>
    );
}
