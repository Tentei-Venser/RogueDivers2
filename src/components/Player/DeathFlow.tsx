import { useRef } from "react";
import type { PlayerData } from "../../types/Objects";
import { getDefaultLoudout } from "../../data/Player";
import "./PlayerView.css"

interface DeathFlowProps {
    onUpdate: (patch: Partial<PlayerData>) => void;
}

export function DeathFlow(props: DeathFlowProps) {
    const dialogRef = useRef<HTMLDialogElement>(null);

    function open() {
        dialogRef.current?.showModal();
    }

    function squadWiped() {
        // full reset - back to difficulty 1 and the default starting kit. The Armory itself
        // is never touched here: Warbond unlocks are account-wide and persist through death.
        props.onUpdate(getDefaultLoudout());
        dialogRef.current?.close();
    }

    return (
        <>
            <button className="starting-armor-button" onClick={open}>Helldiver Squad Wiped</button>

            <dialog ref={dialogRef} className="item-picker">
                <h3>Your sacrifice will be noted in the Annals of Democracy.</h3>
                <p>This will reset your diver and progress.</p>
                <p>Continue?</p>
                <div style={{ display: "flex", justifyContent: "space-between", alignSelf: "end" }} >
                    <button 
                        className="starting-armor-button" 
                        onClick={() => dialogRef.current?.close()}>
                            Cancel
                    </button>
                    <button 
                        className="starting-armor-button" 
                        onClick={squadWiped}>
                            Reset all Progress
                    </button>
                </div>
            </dialog>
        </>
    );
}
