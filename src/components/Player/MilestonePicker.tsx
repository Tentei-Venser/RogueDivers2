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

export function MilestonePicker(props: MilestonePickerProps) {
    const packageDialogRef = useRef<HTMLDialogElement>(null);
    const fieldDialogRef = useRef<HTMLDialogElement>(null);

    const [chosenKind, setChosenKind] = useState<"specialization" | "requisition" | null>(null);
    const [chosenPackage, setChosenPackage] = useState<LoadoutPackage | null>(null);
    const [patch, setPatch] = useState<Partial<PlayerData>>({});
    const [pendingFields, setPendingFields] = useState<[keyof PlayerData, GrantValue][]>([]);
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

    // Once every grant field has been resolved to a concrete value, apply the whole package in one patch.
    useEffect(() => {
        if (!chosenPackage || pendingFields.length > 0) return;

        const selectedPackage = {
            ...chosenPackage,
            resolvedGrants: patch as Partial<Record<keyof PlayerData, string>>,
        };
        props.onUpdate(
            chosenKind === "specialization"
                ? { ...patch, specialization: selectedPackage }
                : { ...patch, requisitions: [...props.player.requisitions, selectedPackage] }
        );
        setChosenPackage(null);
        setChosenKind(null);
        setPatch({});
        setDialogOpen(false);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [chosenPackage, pendingFields]);

    function choosePackage(kind: "specialization" | "requisition", pkg: LoadoutPackage) {
        const resolved: Partial<PlayerData> = {};
        const ambiguous: [keyof PlayerData, GrantValue][] = [];

        for (const [field, value] of Object.entries(pkg.grants) as [keyof PlayerData, GrantValue][]) {
            const options = resolveGrantOptions(value, props.armory, field);
            if (options.length === 1) (resolved as Record<string, string>)[field] = options[0];
            else ambiguous.push([field, value]);
        }

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
        setPatch(resolved);
        setPendingFields(ambiguous);
    }

    function chooseFieldValue(value: string) {
        const [field] = pendingFields[0];
        setPatch(prev => ({ ...prev, [field]: value }));
        setPendingFields(prev => prev.slice(1));
    }

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
                    <button onClick={() => setDialogOpen(true)}>Pick now</button>
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
                <button onClick={() => packageDialogRef.current?.close()}>Not right now</button>
            </dialog>

            <dialog ref={fieldDialogRef} className="item-picker">
                <h3>Select {pendingFields[0]?.[0]}</h3>
                <ul>
                    {pendingFields[0] && resolveGrantOptions(pendingFields[0][1], props.armory, pendingFields[0][0]).map(value => (
                        <li key={value}>
                            <button onClick={() => chooseFieldValue(value)}>
                                {pendingFields[0][0] === "armor" ? formatArmorName(value, props.armory) : value}
                            </button>
                        </li>
                    ))}
                </ul>
            </dialog>
        </>
    );
}
