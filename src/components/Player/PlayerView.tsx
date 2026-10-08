import { useRef, useState } from "react";
import type { ArmoryData, ItemCategory, PlayerRow, PlayerData, LoadoutPackage } from "../../types/Objects";
import { describePackageEffects } from "../../data/Milestones";
import { formatArmorName, formatArmorKeywords } from "../../data/Armory";
import { FactionTracker } from "./FactionTracker";
import "./PlayerView.css"

interface PlayerViewProps {
    player:PlayerData,
    armory:ArmoryData,
    onUpdate: (patch: Partial<PlayerData>) => void
}

function getUnlockedItems(armory: ArmoryData, categories: ItemCategory[])
    : string[] {
    const names: string[] = [];
    for (const category of categories) {
        for (const item of armory.data[category]?.values() ?? []){
            if (item.available) names.push(item.name);
        }
    }
    return names.sort((a, b) => a.localeCompare(b));
}

function getUnlockedStartingArmors(armory: ArmoryData): string[] {
    return Array.from(armory.data.armor?.values() ?? [])
        .filter(item => item.available
            && item.keywords?.includes("medium-armor")
            && item.keywords?.includes("extra-padding"))
        .map(item => item.name)
        .sort((a, b) => a.localeCompare(b));
}

const STARTING_ARMOR_ROW: PlayerRow = {
    label: "Starting Armor",
    getValue: player => player.armor,
    getOptions: getUnlockedStartingArmors,
    applyValue: value => ({ armor: value })
};

function fromCategories(field: keyof PlayerData, categories: ItemCategory[])
: PlayerRow {
    return {
        label: field,
        getValue: player => {
            var val = player[field];
            if (Array.isArray(val))
                return val.map(loadout => (loadout as LoadoutPackage).name).join(", ") || "";
            else if (typeof val === "object")
                return (player[field] as LoadoutPackage).name
            else if (typeof player[field] === "string")
                return player[field];
            else if (typeof player[field] === "number")
                return player[field].toString()
            else return ""
        },
        getOptions: armory => getUnlockedItems(armory, categories),
        applyValue: value => ({[field]: value})
    }
}

export function PlayerView(props:PlayerViewProps){
    const dialogRef = useRef<HTMLDialogElement>(null);
    const [activeRow, setActiveRow] = useState<PlayerRow | null>(null);
    const armorKeywords = props.player.armor
        ? formatArmorKeywords(props.player.armor, props.armory)
        : [];

    const ROWS: PlayerRow[] = [
        { 
            label: "Level",
            getValue: player => String(player.level),
            getOptions: () => ["1","2","3","4","5","6","7","8","9","10"],
            applyValue: value => ({level: Number(value)})
        },
        fromCategories("primary", ["primary"]),
        fromCategories("secondary", ["secondary"]),
        fromCategories("grenade", ["grenade"]),
        fromCategories("armor", ["armor"]),
        fromCategories("stratagem1", ["stratagem"]),
        fromCategories("stratagem2", ["stratagem"]),
        fromCategories("stratagem3", ["stratagem"]),
        fromCategories("stratagem4", ["stratagem"]),
        fromCategories("booster", ["booster"]),
    ]

    function openPicker(row: PlayerRow) {
        setActiveRow(row);
        dialogRef.current?.showModal();
    }

    function selectValue(value: string) {
        if (activeRow) props.onUpdate(activeRow.applyValue(value));
        dialogRef.current?.close();
    }

    function markRequisitionUsed(index: number) {
        const requisition = props.player.requisitions[index];
        if (requisition?.id !== "phoenix-down" || requisition.used) return;

        props.onUpdate({
            requisitions: props.player.requisitions.map((item, itemIndex) =>
                itemIndex === index ? { ...item, used: true } : item
            ),
        });
    }

    return (
        <section id="player">
            <div className="player-view">
                <h2>Player</h2>
                <FactionTracker player={props.player} onUpdate={props.onUpdate} />
                {ROWS.map(
                    row => (
                        <div className="player-row" key={row.label}>
                            <span className="player-label">{row.label}</span>
                            <span className="player-value">
                                {row.label === "armor"
                                    ? props.player.armor
                                        ? <span className="armor-value">
                                            <span>{props.player.armor}</span>
                                            {armorKeywords.length > 0 && (
                                                <span className="armor-keywords">[{armorKeywords.join(", ")}]</span>
                                            )}
                                        </span>
                                        : "-"
                                    : row.getValue(props.player) || "-"}
                            </span>
                            <span className="player-actions">
                                {row.label === "armor" && !props.player.armor ? (
                                    <button className="starting-armor-button" onClick={() => openPicker(STARTING_ARMOR_ROW)}>
                                        Select Starting Armor
                                    </button>
                                ) : (
                                    <button onClick={() => openPicker(row)}>Change</button>
                                )}
                            </span>
                        </div>
                    )
                )}
                {(props.player.specialization.id || props.player.requisitions.length > 0) && (
                    <div className="player-packages">
                        <h3>Selected Packages</h3>
                        {props.player.specialization.id && (
                            <div className="player-package">
                                <strong>Specialization: {props.player.specialization.name}</strong>
                                <ul className="package-effects">
                                    {describePackageEffects(props.player.specialization, props.armory).map(effect => (
                                        <li key={effect}>{effect}</li>
                                    ))}
                                </ul>
                            </div>
                        )}
                        {props.player.requisitions.map((pkg, index) => (
                            <div className={`player-package ${pkg.used ? "player-package-used" : ""}`} key={`${pkg.id}-${index}`}>
                                <div className="player-package-heading">
                                    <strong>Requisition: {pkg.name}</strong>
                                    {pkg.id === "phoenix-down" && (
                                        <button
                                            className="requisition-used-button"
                                            type="button"
                                            aria-label={pkg.used ? "Phoenix Down spent" : "Mark Phoenix Down used after spending it in-game"}
                                            aria-pressed={pkg.used === true}
                                            disabled={pkg.used === true}
                                            onClick={() => markRequisitionUsed(index)}>
                                            {pkg.used ? "Spent" : "Mark Used After Spending"}
                                        </button>
                                    )}
                                </div>
                                <ul className="package-effects">
                                    {describePackageEffects(pkg, props.armory).map(effect => (
                                        <li key={effect}>{effect}</li>
                                    ))}
                                </ul>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <dialog ref={dialogRef} 
                className="item-picker" 
                onClick={e => { if (e.target === dialogRef.current) dialogRef.current?.close(); }}
                onClose={() => setActiveRow(null)}>
                <h3>{activeRow?.label === "Starting Armor" ? "Select Starting Armor" : `Select ${activeRow?.label}`}</h3>
                <ul>
                    {activeRow && activeRow.getOptions(props.armory).map(value => 
                        (
                            <li key={value}>
                                <button onClick={() => selectValue(value)}>
                                    {activeRow.label === "armor" || activeRow.label === "Starting Armor"
                                        ? formatArmorName(value, props.armory)
                                        : value}
                                </button>
                            </li>
                        )
                    )}
                </ul>
                {activeRow?.label === "Starting Armor" && activeRow.getOptions(props.armory).length === 0 && (
                    <p>No unlocked medium armor with Extra Padding is available.</p>
                )}
                <button onClick={() => dialogRef.current?.close()}>Cancel</button>
            </dialog>
        </section>
    )
}