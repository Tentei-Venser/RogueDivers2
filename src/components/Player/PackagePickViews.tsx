import type { ArmoryData } from "../../types/Objects";
import { resolveGrantOptions, describePackageKeywordFilters } from "../../data/Milestones";
import { formatArmorName } from "../../data/Armory";
import { STRATAGEM_SLOTS, isStratagemField, type PackagePick } from "../../data/usePackagePick";
import "./PlayerView.css"

// The three steps of a package pick, shared by the milestone banner's dialogs and the inline
// milestone phase of Mission Results. Each renders only its heading and choices - the caller
// supplies its own Cancel / Skip buttons around them.

interface PackagePickViewProps {
    pick: PackagePick;
    armory: ArmoryData;
}

export function PackageChoices({ pick, armory }: PackagePickViewProps) {
    const kind = pick.pendingKind;
    return (
        <>
            <h3>Choose a {kind === "specialization" ? "Specialization" : "Requisition"}</h3>
            <ul>
                {pick.eligible.map(pkg => (
                    <li key={pkg.id}>
                        <button
                            className="package-option package-choice"
                            onClick={() => pick.choosePackage(kind!, pkg)}>
                            <strong>{pkg.name}</strong>
                            <span className="package-filter-list">
                                {describePackageKeywordFilters(pkg, armory).map(filter => (
                                    <span className="package-filter" key={filter.field}>
                                        <strong>{filter.field}</strong>
                                        <span>
                                            {filter.itemName ? (
                                                <strong className="package-item-grant">
                                                    {filter.field === "Armor"
                                                        ? formatArmorName(filter.itemName, armory)
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
            {pick.eligible.length === 0 && kind && (
                <p>{kind === "requisition" && pick.hasUnusedPhoenixDown
                    ? "No other Requisitions are currently unlockable. Mark your active Phoenix Down Used before taking it again, or check off more gear in the Armory."
                    : `No ${kind}s are currently unlockable - check off more gear in the Armory first.`}</p>
            )}
        </>
    );
}

export function FieldChoices({ pick, armory }: PackagePickViewProps) {
    const current = pick.pendingFields[0];
    if (!current) return null;
    const [field, value] = current;
    return (
        <>
            <h3>Select {field}</h3>
            <ul>
                {resolveGrantOptions(value, armory, field).map(option => {
                    const duplicate = isStratagemField(field) && pick.takenForPick.has(option);
                    return (
                        <li key={option}>
                            <button className="starting-armor-button" disabled={duplicate} onClick={() => pick.chooseFieldValue(option)}>
                                {field === "armor" ? formatArmorName(option, armory) : option}
                                {duplicate && " (already equipped)"}
                            </button>
                        </li>
                    );
                })}
            </ul>
        </>
    );
}

export function SlotChoices({ pick }: { pick: PackagePick }) {
    return (
        <>
            <h3>Place {pick.pendingSlots[0]} in which slot?</h3>
            <ul>
                {STRATAGEM_SLOTS.map((slot, index) => (
                    <li key={slot}>
                        <button className="starting-armor-button" disabled={slot in pick.slotPatch} onClick={() => pick.chooseSlot(slot)}>
                            Stratagem {index + 1}: {pick.slotPatch[slot] ?? (pick.base[slot] || "Empty")}
                        </button>
                    </li>
                ))}
            </ul>
        </>
    );
}
