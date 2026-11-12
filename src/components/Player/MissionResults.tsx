import { useRef, useState } from "react";
import type { ArmoryData, GameItem, Keyword, LoadoutPackage, MissionResult, PlayerData } from "../../types/Objects";
import { WHEELS, WHEEL_FIELDS, rollWheel, wheelPool, armorPassivePool, rollArmorPassive, armorSetsWithPassive, type Wheel } from "../../data/Wheels";
import { formatArmorName, formatArmorPassive } from "../../data/Armory";
import { packageFieldLabel } from "../../data/Milestones";
import { usePackagePick, STRATAGEM_SLOTS } from "../../data/usePackagePick";
import { PICKUP_SLOTS, pickupOptions, pickupLabel, type PickupSlot } from "../../data/MissionPickups";
import { PackageChoices, FieldChoices, SlotChoices } from "./PackagePickViews";
import "./PlayerView.css"
import { getDefaultLoudout } from "../../data/Player";

interface MissionResultsProps {
    player: PlayerData;
    armory: ArmoryData;
    onUpdate: (patch: Partial<PlayerData>) => void;
}

// Human-readable value of a loadout field for the summary screen.
function formatLoadoutValue(field: keyof PlayerData, value: PlayerData[keyof PlayerData], armory: ArmoryData): string {
    if (field === "specialization") return (value as LoadoutPackage).name || "None";
    if (field === "requisitions") return (value as LoadoutPackage[]).map(pkg => pkg.name).join(", ") || "None";
    if (field === "armor") return value ? formatArmorName(String(value), armory) : "None";
    return String(value) || "None";
}

const NO_FOUND_WEAPONS: Record<PickupSlot, string> = { primary: "", secondary: "", support: "" };

export function MissionResults(props: MissionResultsProps) {
    const dialogRef = useRef<HTMLDialogElement>(null);
    const [step, setStep] = useState<"form" | "found-slot" | "spin">("form");
    const [foundWeapons, setFoundWeapons] = useState<Record<PickupSlot, string>>(NO_FOUND_WEAPONS);
    const [primaryCompleted, setPrimaryCompleted] = useState(false);
    const [secondariesCompleted, setSecondariesCompleted] = useState(false);
    const [basesDestroyed, setBasesDestroyed] = useState(false);
    const [operationCompleted, setOperationCompleted] = useState(false);
    const [diverDied, setDiverDied] = useState(false);
    const [spinsRemaining, setSpinsRemaining] = useState(0);
    const [activeWheel, setActiveWheel] = useState<Wheel | null>(null);
    const [rolledItem, setRolledItem] = useState<GameItem | null>(null);
    const [rolledPassive, setRolledPassive] = useState<Keyword | null>(null);
    const [pendingMission, setPendingMission] = useState<MissionResult | null>(null);
    const [pendingLoadout, setPendingLoadout] = useState<Partial<PlayerData>>({});
    const [milestonesSkipped, setMilestonesSkipped] = useState(false);
    const lootPlayer = { ...props.player, ...pendingLoadout };

    // Patches stack onto pendingLoadout in a fixed order: the death reset or extracted in-mission
    // finds (in submit, plus the support weapon's slot choice), then each milestone package, then
    // each spin. Milestone picks are made against the staged Diver at the
    // post-mission level, so a death reset re-opens the Specialization and every Requisition due
    // at that level, and spins afterwards see whatever the packages granted.
    const milestoneView = pendingMission
        ? { ...lootPlayer, level: nextLevel(pendingMission) }
        : lootPlayer;
    const picker = usePackagePick(milestoneView, props.armory,
        patch => setPendingLoadout(prev => ({ ...prev, ...patch })));

    // Re-derived each render: picks stay up while any is due (or one is mid-resolution), then the
    // spin screens take over. Skip hands any remaining picks to the MilestonePicker banner.
    const milestonePhase = step === "spin" && !milestonesSkipped
        && (picker.pendingKind !== null || picker.chosenPackage !== null);
    const spinPhase = step === "spin" && !milestonePhase;

    // Summary lists only the fields whose value actually changes, compared as displayed text so a
    // re-granted item (or the same starting kit after a death) isn't reported as a change.
    const changedFields = (Object.keys(pendingLoadout) as (keyof PlayerData)[]).filter(field =>
        formatLoadoutValue(field, lootPlayer[field], props.armory)
            !== formatLoadoutValue(field, props.player[field], props.armory));

    function open() {
        setStep("form");
        setPrimaryCompleted(false);
        setSecondariesCompleted(false);
        setBasesDestroyed(false);
        setOperationCompleted(false);
        setDiverDied(false);
        setFoundWeapons(NO_FOUND_WEAPONS);
        setSpinsRemaining(0);
        setActiveWheel(null);
        setRolledItem(null);
        setRolledPassive(null);
        setPendingMission(null);
        setPendingLoadout({});
        setMilestonesSkipped(false);
        picker.cancelPick();
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
        setMilestonesSkipped(false);
        picker.cancelPick();
        setStep("form");
        dialogRef.current?.close();
    }

    // A Diver who died didn't extract, so in-mission finds can't be kept - checking it clears them.
    function changeDiverDied(died: boolean) {
        setDiverDied(died);
        if (died) setFoundWeapons(NO_FOUND_WEAPONS);
    }

    function submit() {
        const spins = diverDied ? 0 : [primaryCompleted, secondariesCompleted, basesDestroyed].filter(Boolean).length;
        const extracted = diverDied ? [] : PICKUP_SLOTS.map(slot => foundWeapons[slot.key]).filter(name => name !== "");
        const result: MissionResult = {
            difficulty: props.player.level,
            primaryCompleted,
            secondariesCompleted,
            basesDestroyed,
            spinsEarned: spins,
            operationCompleted,
            diverDied,
            ...(extracted.length > 0 && { extractedWeapons: extracted }),
        };

        if (diverDied) {
            // Reset the pending loadout to a fresh starting kit for the next mission. Requisitions
            // are wiped wholesale - an unused Phoenix Down goes with everything else.
            const defaultLoadout = getDefaultLoudout();
            setPendingLoadout({
                primary: defaultLoadout.primary,
                secondary: defaultLoadout.secondary,
                grenade: defaultLoadout.grenade,
                armor: defaultLoadout.armor,
                stratagem1: defaultLoadout.stratagem1,
                stratagem2: defaultLoadout.stratagem2,
                stratagem3: defaultLoadout.stratagem3,
                stratagem4: defaultLoadout.stratagem4,
                booster: defaultLoadout.booster,
                specialization: defaultLoadout.specialization,
                requisitions: defaultLoadout.requisitions,
            });
        }
        else {
            // Extracted in-mission primary/secondary replace that slot; a support weapon is placed
            // in the found-slot step next.
            const found: Partial<PlayerData> = {};
            if (foundWeapons.primary) found.primary = foundWeapons.primary;
            if (foundWeapons.secondary) found.secondary = foundWeapons.secondary;
            setPendingLoadout(found);
        }
        setSpinsRemaining(spins);
        setPendingMission(result);
        setStep(!diverDied && foundWeapons.support ? "found-slot" : "spin");
    }

    function placeFoundSupport(slot: typeof STRATAGEM_SLOTS[number]) {
        setPendingLoadout(prev => ({ ...prev, [slot]: foundWeapons.support }));
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
        if (patch) setPendingLoadout(prev => ({ ...prev, ...patch }));
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
                            <li><label><input type="checkbox" checked={diverDied} onChange={e => changeDiverDied(e.target.checked)} /> My Diver Died</label></li>
                        </ul>
                        <fieldset className="found-weapons" disabled={diverDied}>
                            <legend>Weapons found in-mission and extracted with</legend>
                            <p className="found-weapons-note">
                                {diverDied
                                    ? "Not available - your Diver didn't extract."
                                    : "Select a weapon to add it to your loadout, or leave it blank to decline. Only weapons found in the mission count, not ones a squadmate brought."}
                            </p>
                            {PICKUP_SLOTS.map(slot => (
                                <label key={slot.key}>
                                    {slot.label}
                                    <select
                                        value={foundWeapons[slot.key]}
                                        onChange={e => setFoundWeapons(prev => ({ ...prev, [slot.key]: e.target.value }))}>
                                        <option value="">None</option>
                                        {pickupOptions(slot.key, props.armory, props.player).map(item => (
                                            <option key={item.name} value={item.name}>{pickupLabel(item)}</option>
                                        ))}
                                    </select>
                                </label>
                            ))}
                        </fieldset>
                        <button className="starting-armor-button" onClick={submit}>Submit</button>
                        <button className="starting-armor-button" onClick={() => dialogRef.current?.close()}>Cancel</button>
                    </>
                )}

                {step === "found-slot" && (
                    <>
                        <h3>Place {foundWeapons.support} in which stratagem slot?</h3>
                        <ul>
                            {STRATAGEM_SLOTS.map((slot, index) => (
                                <li key={slot}>
                                    <button className="starting-armor-button" onClick={() => placeFoundSupport(slot)}>
                                        Stratagem {index + 1}: {lootPlayer[slot] || "Empty"}
                                    </button>
                                </li>
                            ))}
                        </ul>
                        <button className="starting-armor-button" onClick={() => setStep("form")}>Back</button>
                        <button className="starting-armor-button" onClick={cancelLootDrops}>Cancel</button>
                    </>
                )}

                {milestonePhase && !picker.chosenPackage && (
                    <>
                        <PackageChoices pick={picker} armory={props.armory} />
                        <button className="starting-armor-button" onClick={() => setMilestonesSkipped(true)}>Skip for now</button>
                        <button className="starting-armor-button" onClick={cancelLootDrops}>Cancel</button>
                    </>
                )}

                {milestonePhase && picker.pendingFields.length > 0 && (
                    <>
                        <FieldChoices pick={picker} armory={props.armory} />
                        <button className="starting-armor-button" onClick={picker.cancelPick}>Back</button>
                        <button className="starting-armor-button" onClick={cancelLootDrops}>Cancel</button>
                    </>
                )}

                {milestonePhase && picker.pendingFields.length === 0 && picker.pendingSlots.length > 0 && (
                    <>
                        <SlotChoices pick={picker} />
                        <button className="starting-armor-button" onClick={picker.cancelPick}>Back</button>
                        <button className="starting-armor-button" onClick={cancelLootDrops}>Cancel</button>
                    </>
                )}

                {spinPhase && spinsRemaining <= 0 && (
                    <>
                        <h3>{pendingMission?.diverDied
                            ? "Diver died - no spins earned."
                            : pendingMission?.spinsEarned
                                ? "All spins used."
                                : "No spins earned."}</h3>
                        {pendingMission?.operationCompleted && <p>Difficulty will advance to {nextLevel(pendingMission)}.</p>}
                        {pendingMission?.diverDied && <p>Your Diver will be reset to the starting kit.</p>}
                        {changedFields.length > 0 && (
                            <ul className="package-effects">
                                {changedFields.map(field => (
                                    <li key={field}>{packageFieldLabel(field)}: {formatLoadoutValue(field, lootPlayer[field], props.armory)}</li>
                                ))}
                            </ul>
                        )}
                        <button className="starting-armor-button" onClick={acceptMission}>Accept</button>
                        <button className="starting-armor-button" onClick={cancelLootDrops}>Cancel</button>
                    </>
                )}

                {spinPhase && spinsRemaining > 0 && !activeWheel && (
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

                {spinPhase && activeWheel && activeWheel.rollsPassive && (
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

                {spinPhase && activeWheel && !activeWheel.rollsPassive && (
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

                {spinPhase && activeWheel && (
                    <button className="starting-armor-button" onClick={cancelLootDrops}>Cancel</button>
                )}
            </dialog>
        </>
    );
}
