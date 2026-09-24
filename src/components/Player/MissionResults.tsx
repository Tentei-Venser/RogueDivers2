import { useRef, useState } from "react";
import type { ArmoryData, GameItem, MissionResult, PlayerData } from "../../types/Objects";
import { WHEELS, WHEEL_FIELDS, rollWheel, wheelPool, type Wheel } from "../../data/Wheels";
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

    function open() {
        setStep("form");
        setPrimaryCompleted(false);
        setSecondariesCompleted(false);
        setBasesDestroyed(false);
        setOperationCompleted(false);
        setActiveWheel(null);
        setRolledItem(null);
        dialogRef.current?.showModal();
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
        props.onUpdate({
            level: operationCompleted ? Math.min(10, props.player.level + 1) : props.player.level,
            missionHistory: [...props.player.missionHistory, result],
        });
        setStep("spin");
    }

    function pickWheel(wheel: Wheel) {
        setActiveWheel(wheel);
        setRolledItem(rollWheel(wheel, props.armory, props.player));
    }

    function reroll() {
        if (activeWheel) setRolledItem(rollWheel(activeWheel, props.armory, props.player));
    }

    function finishSpin(patch?: Partial<PlayerData>) {
        if (patch) props.onUpdate(patch);
        setSpinsRemaining(prev => prev - 1);
        setActiveWheel(null);
        setRolledItem(null);
    }

    return (
        <>
            <button className="mission-button" onClick={open}>Log Mission Result</button>

            <dialog ref={dialogRef} className="item-picker">
                {step === "form" && (
                    <>
                        <h3>Mission Result</h3>
                        <ul className="mission-checklist">
                            <li><label><input type="checkbox" checked={primaryCompleted} onChange={e => setPrimaryCompleted(e.target.checked)} /> Primary Objective Completed</label></li>
                            <li><label><input type="checkbox" checked={secondariesCompleted} onChange={e => setSecondariesCompleted(e.target.checked)} /> All Secondary Objectives Completed</label></li>
                            <li><label><input type="checkbox" checked={basesDestroyed} onChange={e => setBasesDestroyed(e.target.checked)} /> All Enemy Bases Destroyed</label></li>
                            <li><label><input type="checkbox" checked={operationCompleted} onChange={e => setOperationCompleted(e.target.checked)} /> Operation Completed (advances difficulty)</label></li>
                        </ul>
                        <button onClick={submit}>Submit</button>
                        <button onClick={() => dialogRef.current?.close()}>Cancel</button>
                    </>
                )}

                {step === "spin" && spinsRemaining <= 0 && (
                    <>
                        <h3>All spins used.</h3>
                        {operationCompleted && <p>Difficulty advanced to {props.player.level}.</p>}
                        <button onClick={() => dialogRef.current?.close()}>Done</button>
                    </>
                )}

                {step === "spin" && spinsRemaining > 0 && !activeWheel && (
                    <>
                        <h3>{spinsRemaining} spin{spinsRemaining > 1 ? "s" : ""} remaining - pick a wheel</h3>
                        <ul>
                            {WHEELS.map(wheel => {
                                const poolSize = wheelPool(wheel, props.armory, props.player).length;
                                return (
                                    <li key={wheel.label}>
                                        <button disabled={poolSize === 0} onClick={() => pickWheel(wheel)}>
                                            {wheel.label} ({poolSize} available)
                                        </button>
                                    </li>
                                );
                            })}
                        </ul>
                    </>
                )}

                {step === "spin" && activeWheel && (
                    <>
                        <h3>{activeWheel.label}</h3>
                        {rolledItem ? (
                            <>
                                <p>Rolled: <strong>{rolledItem.name}</strong></p>
                                <ul>
                                    {WHEEL_FIELDS[activeWheel.category].map(field => (
                                        <li key={field}>
                                            <button onClick={() => finishSpin({ [field]: rolledItem.name })}>
                                                Equip as {field} (currently: {String(props.player[field]) || "-"})
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                                <button onClick={reroll}>Reroll</button>
                                <button onClick={() => finishSpin()}>Keep current gear</button>
                            </>
                        ) : (
                            <>
                                <p>No new result here - everything eligible is already equipped or unavailable.</p>
                                <button onClick={() => finishSpin()}>Keep current gear</button>
                            </>
                        )}
                    </>
                )}
            </dialog>
        </>
    );
}
