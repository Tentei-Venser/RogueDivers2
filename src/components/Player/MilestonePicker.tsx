import { useEffect, useRef, useState } from "react";
import type { ArmoryData, PlayerData } from "../../types/Objects";
import { usePackagePick } from "../../data/usePackagePick";
import { PackageChoices, FieldChoices, SlotChoices } from "./PackagePickViews";
import "./PlayerView.css"

interface MilestonePickerProps {
    player: PlayerData,
    armory: ArmoryData,
    onUpdate: (patch: Partial<PlayerData>) => void
}

// Fallback for milestone picks made outside Mission Results - e.g. a level changed by hand in
// PlayerView, or a pick skipped during the mission flow. Picks against the saved player.
export function MilestonePicker(props: MilestonePickerProps) {
    const packageDialogRef = useRef<HTMLDialogElement>(null);
    const fieldDialogRef = useRef<HTMLDialogElement>(null);
    const slotDialogRef = useRef<HTMLDialogElement>(null);
    const [dialogOpen, setDialogOpen] = useState(false);

    const pick = usePackagePick(props.player, props.armory, patch => {
        props.onUpdate(patch);
        setDialogOpen(false);
    });
    const { pendingKind, chosenPackage, pendingFields, pendingSlots } = pick;

    // The picker itself is opened on demand (see the banner below), never forced open automatically -
    // showModal() makes the rest of the page inert, and forcing it open the moment a pick becomes due
    // would trap the player if nothing's unlockable yet, with no way to go check off gear in the Armory.
    useEffect(() => {
        if (dialogOpen && pendingKind) packageDialogRef.current?.showModal();
        else packageDialogRef.current?.close();
    }, [dialogOpen, pendingKind]);

    useEffect(() => {
        if (chosenPackage && pendingFields.length > 0) fieldDialogRef.current?.showModal();
        else fieldDialogRef.current?.close();
    }, [chosenPackage, pendingFields]);

    useEffect(() => {
        if (chosenPackage && pendingFields.length === 0 && pendingSlots.length > 0) slotDialogRef.current?.showModal();
        else slotDialogRef.current?.close();
    }, [chosenPackage, pendingFields, pendingSlots]);

    // Abandons a package mid-pick - the banner then offers the milestone pick again.
    function cancelPick() {
        pick.cancelPick();
        setDialogOpen(false);
    }

    return (
        <>
            {pendingKind && !dialogOpen && (
                <div className="milestone-banner">
                    <span>A {pendingKind === "specialization" ? "Specialization" : "Requisition"} is available to pick.</span>
                    <button className="starting-armor-button" onClick={() => setDialogOpen(true)}>Pick now</button>
                </div>
            )}

            <dialog
                ref={packageDialogRef}
                className="item-picker package-picker"
                onClose={() => setDialogOpen(false)}>
                <PackageChoices pick={pick} armory={props.armory} />
                <button className="starting-armor-button" onClick={() => packageDialogRef.current?.close()}>Not right now</button>
            </dialog>

            {/* Escape is routed through cancelPick rather than the dialog's own close, so a
                half-finished pick is discarded instead of left stuck with no dialog showing. */}
            <dialog ref={fieldDialogRef} className="item-picker" onCancel={e => { e.preventDefault(); cancelPick(); }}>
                <FieldChoices pick={pick} armory={props.armory} />
                <button className="starting-armor-button" onClick={cancelPick}>Cancel</button>
            </dialog>

            <dialog ref={slotDialogRef} className="item-picker" onCancel={e => { e.preventDefault(); cancelPick(); }}>
                <SlotChoices pick={pick} />
                <button className="starting-armor-button" onClick={cancelPick}>Cancel</button>
            </dialog>
        </>
    );
}
