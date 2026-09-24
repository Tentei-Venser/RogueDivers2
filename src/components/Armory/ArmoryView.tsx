import type { ArmoryData, ItemCategory } from "../../types/Objects";
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
    onRefresh: () => void
}

export function ArmoryView(props:ArmoryViewProps){
    return (
        <section id="armory">
            <div className="armory-view">
                <h2>Armory</h2>
                <button className="armory-refresh" onClick={props.onRefresh}>
                    Refresh Catalog (new Warbond?)
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
                                                        {item.name}
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