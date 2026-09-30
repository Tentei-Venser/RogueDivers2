import { useRef, useState } from "react";
import type { PlayerData } from "../../types/Objects";
import { getDefaultLoudout } from "../../data/Player";
import "./PlayerView.css"

interface DeathFlowProps {
    onUpdate: (patch: Partial<PlayerData>) => void;
}

const DIFFICULTIES = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10"];

export function DeathFlow(props: DeathFlowProps) {
    const dialogRef = useRef<HTMLDialogElement>(null);
    const [step, setStep] = useState<"outcome" | "difficulty">("outcome");

    function open() {
        setStep("outcome");
        dialogRef.current?.showModal();
    }

    function squadWiped() {
        // full reset - back to difficulty 1 and the default starting kit. The Armory itself
        // is never touched here: Warbond unlocks are account-wide and persist through death.
        props.onUpdate(getDefaultLoudout());
        dialogRef.current?.close();
    }

    function squadExtracted(difficulty: number) {
        // Rejoin at the squad's current difficulty with a fresh starting-kit loadout and no
        // Specialization/Requisitions yet - MilestonePicker (already mounted) will pick up from
        // here and prompt for whatever the Team Milestone tier at this difficulty grants.
        props.onUpdate({ ...getDefaultLoudout(), level: difficulty });
        dialogRef.current?.close();
    }

    return (
        <>
            <button className="death-button" onClick={open}>My Diver Died</button>

            <dialog ref={dialogRef} className="item-picker" onClose={() => setStep("outcome")}>
                {step === "outcome" && (
                    <>
                        <h3>Did the squad complete the mission and extract without you?</h3>
                        <ul>
                            <li><button onClick={() => setStep("difficulty")}>Yes - squad extracted</button></li>
                            <li><button onClick={squadWiped}>No - squad was wiped</button></li>
                        </ul>
                    </>
                )}
                {step === "difficulty" && (
                    <>
                        <h3>What difficulty is the squad currently at?</h3>
                        <ul>
                            {DIFFICULTIES.map(d => (
                                <li key={d}><button onClick={() => squadExtracted(Number(d))}>{d}</button></li>
                            ))}
                        </ul>
                    </>
                )}
                <button onClick={() => dialogRef.current?.close()}>Cancel</button>
            </dialog>
        </>
    );
}
