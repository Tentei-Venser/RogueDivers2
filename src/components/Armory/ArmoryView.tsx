import type { ArmoryData, CatalogUpdate, ItemCategory } from "../../types/Objects";
import { formatArmorName } from "../../data/Armory";
import "./ArmoryView.css"

const Categories: {key: ItemCategory, label: string}[] = [
    {key: "primary",    label: "Primary Weapons"},
    {key: "secondary",  label: "Secondary Weapons"},
    {key: "grenade",    label: "Grenades/Throwables"},
    {key: "armor",      label: "Armor"},
    {key: "stratagem",  label: "Stratagems"},
    {key: "booster",    label: "Boosters"},
]

interface ArmoryViewProps {
    armory: ArmoryData,
    onToggle: (category: ItemCategory, name: string) => void,
    onRefresh: () => void,
    onSelectAll: () => void,
    onDeselectAll: () => void
}

// One-time notice after a saved Armory was automatically merged with a newer catalog.
export function CatalogUpdateNotice({ update, onDismiss }: { update: CatalogUpdate, onDismiss: () => void }) {
    return (
        <div className="catalog-update-notice" role="status">
            <span>
                Armory updated to the {update.version} catalog. Your checked items were kept.
                {update.newItems > 0 &&
                    ` ${update.newItems} new item${update.newItems === 1 ? "" : "s"} added - check any you own in the Armory below.`}
            </span>
            <button className="starting-armor-button" type="button" onClick={onDismiss}>Dismiss</button>
        </div>
    );
}

export function ArmoryView(props:ArmoryViewProps){
    return (
        <section id="armory">
            <div className="armory-view">
                <h2>Armory</h2>
                <button className="starting-armor-button" onClick={props.onRefresh}>
                    Refresh Catalog (new Warbond?)
                </button>
                <button className="starting-armor-button" onClick={props.onSelectAll}>
                    Check All
                </button>
                <button className="starting-armor-button" onClick={props.onDeselectAll}>
                    Uncheck All
                </button>
                {Categories.map(category => {
                    const items = Array.from(props.armory.data[category.key]?.values() ?? [])
                                    .sort((a,b) => a.name.localeCompare(b.name));
                                    
                    return (
                        <details key={category.key} className="armory-category">
                                <summary>{category.label}</summary>
                                <ul className="armory-items">
                                    {
                                        items.map(item => (
                                            <li key={item.name} 
                                                className={item.locked ? "locked" : item.available ? "available" : "unavailable"}>
                                                    <label>
                                                        <input
                                                            type="checkbox"
                                                            checked={item.available}
                                                            disabled={item.locked}
                                                            onChange={() => props.onToggle(category.key, item.name)}
                                                        />
                                                        {category.key === "armor" ? formatArmorName(item.name, props.armory) : item.name}
                                                    </label>
                                            </li>
                                        ))
                                    }
                                </ul>
                            </details>
                    )
                })}
            </div>
        </section>
    )
}