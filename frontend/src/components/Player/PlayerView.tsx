import { useRef, useState } from "react";
import type { ArmoryData, ItemCategory, PlayerRow, PlayerData, LoadoutPackage } from "../../types/Objects";
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

    return (
        <section id="player">
            <div className="player-view">
                <h2>Player</h2>
                {ROWS.map(
                    row => (
                        <div className="player-row" key={row.label}>
                            <span className="player-label">{row.label}</span>
                            <span className="player-value">{row.getValue(props.player) || "-"}</span>
                            <button onClick={() => openPicker(row)}>Change</button>
                        </div>
                    )
                )}
            </div>

            <dialog ref={dialogRef} 
                className="item-picker" 
                onClick={e => { if (e.target === dialogRef.current) dialogRef.current?.close(); }}
                onClose={() => setActiveRow(null)}>
                <h3>Select {activeRow?.label}</h3>
                <ul>
                    {activeRow && activeRow.getOptions(props.armory).map(value => 
                        (
                            <li key={value}>
                                <button onClick={() => selectValue(value)}>{value}</button>
                            </li>
                        )
                    )}
                </ul>
                <button onClick={() => dialogRef.current?.close()}>Cancel</button>
            </dialog>
        </section>
    )
}