import { useEffect, useRef, useState } from "react";
import type { ArmoryData, PlayerData, LoadoutPackage, GrantValue } from "../../types/Objects";
import { SPECIALIZATIONS } from "../../data/Specializations";
import { REQUISITIONS } from "../../data/Requisitions";
import { isSpecializationDue, requisitionPicksDue, isPackageAvailable, resolveGrantOptions, rollFieldValue, describePackageKeywordFilters } from "../../data/Milestones";
import { formatArmorName } from "../../data/Armory";
import "./PlayerView.css"

interface MilestonePickerProps {
    player: PlayerData,
    armory: ArmoryData,
    onUpdate: (patch: Partial<PlayerData>) => void
}

const STRATAGEM_SLOTS = ["stratagem1", "stratagem2", "stratagem3", "stratagem4"] as const;
type StratagemSlot = typeof STRATAGEM_SLOTS[number];

function isStratagemField(field: keyof PlayerData): field is StratagemSlot {
    return field.startsWith("stratagem");
}

// Stratagems a new pick must not duplicate: everything currently equipped, plus anything this
// package has already resolved for another of its stratagem grants.
function takenStratagems(player: PlayerData, patch: Partial<PlayerData>): Set<string> {
    return new Set(
        STRATAGEM_SLOTS.flatMap(slot => [player[slot], patch[slot]])
            .filter((value): value is string => !!value)
    );
}

export function MilestonePicker(props: MilestonePickerProps) {
    const packageDialogRef = useRef<HTMLDialogElement>(null);
    const fieldDialogRef = useRef<HTMLDialogElement>(null);
    const slotDialogRef = useRef<HTMLDialogElement>(null);

    const [chosenKind, setChosenKind] = useState<"specialization" | "requisition" | null>(null);
    const [chosenPackage, setChosenPackage] = useState<LoadoutPackage | null>(null);
    const [patch, setPatch] = useState<Partial<PlayerData>>({});
    const [pendingFields, setPendingFields] = useState<[keyof PlayerData, GrantValue][]>([]);
    const [pendingSlots, setPendingSlots] = useState<string[]>([]);         // granted stratagems still to be placed
    const [slotPatch, setSlotPatch] = useState<Partial<PlayerData>>({});    // granted stratagems, keyed by the slot chosen for them
    const [dialogOpen, setDialogOpen] = useState(false);

    // Re-derived from player state every render, rather than tracked separately - so it always
    // reflects reality even if level/specialization/requisitions change from somewhere else (e.g.
    // the Level "Change" button in PlayerView, not just a future Mission Results flow).
    const pendingKind: "specialization" | "requisition" | null = chosenPackage
        ? null
        : isSpecializationDue(props.player)
            ? "specialization"
            : requisitionPicksDue(props.player) > 0
                ? "requisition"
                : null;

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

    // Once every grant field has been resolved to a concrete value and every granted stratagem has a
    // slot, apply the whole package in one patch. Still applies when every grant was skipped as a
    // duplicate - the package itself is recorded and the milestone pick is spent either way.
    useEffect(() => {
        if (!chosenPackage || pendingFields.length > 0 || pendingSlots.length > 0) return;

        const grants = { ...patch, ...slotPatch };
        const selectedPackage = {
            ...chosenPackage,
            resolvedGrants: grants as Partial<Record<keyof PlayerData, string>>,
        };
        props.onUpdate(
            chosenKind === "specialization"
                ? { ...grants, specialization: selectedPackage }
                : { ...grants, requisitions: [...props.player.requisitions, selectedPackage] }
        );
        setChosenPackage(null);
        setChosenKind(null);
        setPatch({});
        setSlotPatch({});
        setDialogOpen(false);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [chosenPackage, pendingFields, pendingSlots]);

    // Options for a grant that are still legal to take. Stratagem grants exclude anything already
    // equipped or already granted by this package, so a pick can never duplicate a stratagem.
    function availableOptions(field: keyof PlayerData, value: GrantValue, current: Partial<PlayerData>): string[] {
        const options = resolveGrantOptions(value, props.armory, field);
        if (!isStratagemField(field)) return options;
        const taken = takenStratagems(props.player, current);
        return options.filter(option => !taken.has(option));
    }

    // Resolves every field that no longer needs a player choice: one legal option auto-resolves, and
    // none drops the grant (for a stratagem, the Diver already has everything it could give). Repeats
    // until nothing changes, since resolving one stratagem grant can narrow another's options.
    function settleFields(fields: [keyof PlayerData, GrantValue][], start: Partial<PlayerData>) {
        const settled: Partial<PlayerData> = { ...start };
        let remaining = fields;
        let changed = true;
        while (changed) {
            changed = false;
            const next: [keyof PlayerData, GrantValue][] = [];
            for (const [field, value] of remaining) {
                const options = availableOptions(field, value, settled);
                if (options.length > 1) next.push([field, value]);
                else {
                    if (options.length === 1) (settled as Record<string, string>)[field] = options[0];
                    changed = true;
                }
            }
            remaining = next;
        }
        return { settled, remaining };
    }

    // Moves on to the next ambiguous field, or - once there are none - pulls the granted (not
    // rerolled) stratagems back out of the patch so the player can choose a slot for each. A package
    // that fills all 4 slots overwrites every one regardless, so it skips the slot dialog.
    function advance(pkg: LoadoutPackage, next: Partial<PlayerData>, remaining: [keyof PlayerData, GrantValue][]) {
        setPendingFields(remaining);
        setSlotPatch({});
        if (remaining.length > 0) {
            setPatch(next);
            setPendingSlots([]);
            return;
        }

        const rerolled = new Set(pkg.reroll ?? []);
        const withoutGranted: Partial<PlayerData> = { ...next };
        const granted: string[] = [];
        for (const slot of STRATAGEM_SLOTS) {
            if (rerolled.has(slot) || !withoutGranted[slot]) continue;
            granted.push(withoutGranted[slot]);
            delete withoutGranted[slot];
        }

        const fillsEverySlot = granted.length === STRATAGEM_SLOTS.length;
        setPatch(fillsEverySlot ? next : withoutGranted);
        setPendingSlots(fillsEverySlot ? [] : granted);
    }

    function choosePackage(kind: "specialization" | "requisition", pkg: LoadoutPackage) {
        const { settled: resolved, remaining } = settleFields(
            Object.entries(pkg.grants) as [keyof PlayerData, GrantValue][], {});

        // reroll fields are random, no player choice. Each roll sees a "current view" that includes
        // anything already rerolled earlier in this same batch (not just props.player as it was
        // before this action started) - otherwise, e.g. rerolling all 4 stratagem slots for Bargain
        // Bin could hand two of them the same result, since each would only avoid the ORIGINAL other
        // slots' values, not each other's freshly-rolled ones. A genuinely exhausted pool goes blank.
        for (const field of pkg.reroll ?? []) {
            const currentView = { ...props.player, ...resolved } as PlayerData;
            const rolled = rollFieldValue(field, props.armory, currentView);
            (resolved as Record<string, string>)[field] = rolled;
        }

        setChosenKind(kind);
        setChosenPackage(pkg);
        advance(pkg, resolved, remaining);
    }

    function chooseFieldValue(value: string) {
        const [field] = pendingFields[0];
        const { settled, remaining } = settleFields(pendingFields.slice(1), { ...patch, [field]: value });
        advance(chosenPackage!, settled, remaining);
    }

    // Abandons a package mid-pick. Nothing is applied to the player until the final pick, so this
    // only has to drop the staged state - the banner then offers the milestone pick again.
    function cancelPick() {
        setChosenPackage(null);
        setChosenKind(null);
        setPatch({});
        setPendingFields([]);
        setPendingSlots([]);
        setSlotPatch({});
        setDialogOpen(false);
    }

    function chooseSlot(slot: StratagemSlot) {
        setSlotPatch(prev => ({ ...prev, [slot]: pendingSlots[0] }));
        setPendingSlots(prev => prev.slice(1));
    }

    const takenForPick = takenStratagems(props.player, patch);

    const table = pendingKind === "specialization" ? SPECIALIZATIONS : REQUISITIONS;
    const hasUnusedPhoenixDown = props.player.requisitions.some(pkg => pkg.id === "phoenix-down" && !pkg.used);
    const eligible = pendingKind ? table.filter(pkg =>
        isPackageAvailable(pkg, props.armory)
        && !(pendingKind === "requisition" && pkg.id === "phoenix-down" && hasUnusedPhoenixDown)
    ) : [];

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
                <h3>Choose a {pendingKind === "specialization" ? "Specialization" : "Requisition"}</h3>
                <ul>
                    {eligible.map(pkg => (
                        <li key={pkg.id}>
                            <button
                                className="package-option package-choice"
                                onClick={() => choosePackage(pendingKind!, pkg)}>
                                <strong>{pkg.name}</strong>
                                <span className="package-filter-list">
                                    {describePackageKeywordFilters(pkg, props.armory).map(filter => (
                                        <span className="package-filter" key={filter.field}>
                                            <strong>{filter.field}</strong>
                                            <span>
                                                {filter.itemName ? (
                                                    <strong className="package-item-grant">
                                                        {filter.field === "Armor"
                                                            ? formatArmorName(filter.itemName, props.armory)
                                                            : filter.itemName}
                                                    </strong>
                                                ) : filter.keywords.length > 0 ? (
                                                    <>
                                                        <span className="filter-match">
                                                            {filter.match === "All" ? "Select one matching all" : "Select any one"}
                                                        </span>{" "}
                                                        <strong className="package-keywords">
                                                            [{filter.keywords.join(" · ")}]
                                                        </strong>
                                                    </>
                                                ) : filter.emptyText}
                                            </span>
                                        </span>
                                    ))}
                                    {pkg.restricts && (
                                        <span className="package-restriction">Restriction: {pkg.restricts}</span>
                                    )}
                                </span>
                            </button>
                        </li>
                    ))}
                </ul>
                {eligible.length === 0 && pendingKind && (
                    <p>{pendingKind === "requisition" && hasUnusedPhoenixDown
                        ? "No other Requisitions are currently unlockable. Mark your active Phoenix Down Used before taking it again, or check off more gear in the Armory."
                        : `No ${pendingKind}s are currently unlockable - check off more gear in the Armory first.`}</p>
                )}
                <button className="starting-armor-button" onClick={() => packageDialogRef.current?.close()}>Not right now</button>
            </dialog>

            {/* Escape is routed through cancelPick rather than the dialog's own close, so a
                half-finished pick is discarded instead of left stuck with no dialog showing. */}
            <dialog ref={fieldDialogRef} className="item-picker" onCancel={e => { e.preventDefault(); cancelPick(); }}>
                <h3>Select {pendingFields[0]?.[0]}</h3>
                <ul>
                    {pendingFields[0] && resolveGrantOptions(pendingFields[0][1], props.armory, pendingFields[0][0]).map(value => {
                        const duplicate = isStratagemField(pendingFields[0][0]) && takenForPick.has(value);
                        return (
                            <li key={value}>
                                <button className="starting-armor-button" disabled={duplicate} onClick={() => chooseFieldValue(value)}>
                                    {pendingFields[0][0] === "armor" ? formatArmorName(value, props.armory) : value}
                                    {duplicate && " (already equipped)"}
                                </button>
                            </li>
                        );
                    })}
                </ul>
                <button className="starting-armor-button" onClick={cancelPick}>Cancel</button>
            </dialog>

            <dialog ref={slotDialogRef} className="item-picker" onCancel={e => { e.preventDefault(); cancelPick(); }}>
                <h3>Place {pendingSlots[0]} in which slot?</h3>
                <ul>
                    {STRATAGEM_SLOTS.map((slot, index) => (
                        <li key={slot}>
                            <button className="starting-armor-button" disabled={slot in slotPatch} onClick={() => chooseSlot(slot)}>
                                Stratagem {index + 1}: {slotPatch[slot] ?? (props.player[slot] || "Empty")}
                            </button>
                        </li>
                    ))}
                </ul>
                <button className="starting-armor-button" onClick={cancelPick}>Cancel</button>
            </dialog>
        </>
    );
}
