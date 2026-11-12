export function QuickstartView() {
    return (
        <section className="quickstart-panel" aria-labelledby="quickstart-heading">
            <h2 id="quickstart-heading">Quick Start</h2>
            <ol className="quickstart-list">
                <li><strong>Mark unlocked gear.</strong> Check items you own in the Armory below so they can be selected as grants and loot.</li>
                <li><strong>Log mission results below.</strong> Mark completed objectives to earn loot spins; completing the operation advances difficulty. If your diver dies but your squad extracts, check the "My Diver Died" option here. Extracted with a weapon you found in the mission? Select it here to add it to your loadout.</li>
                <li><strong>Choose milestones.</strong> Your team earns Specializations at Difficulty 3 and Requisitions at Difficulty 5, 7, and 9. Select available milestones and follow their listed grants.</li>
                <li><strong>Resolve loot drops.</strong> Pick a wheel, then equip the result or keep your current gear. Resolve all earned spins to save the result.</li>
                <li><strong>Set your loadout.</strong> Click "Change" beside a slot, or "Select Starting Armor" when no armor is equipped.</li>
                <li><strong>If your squad is wiped out,</strong> click "Helldiver Squad Wiped" to reset the game to a fresh level 1 character.</li>
            </ol>
        </section>
    );
}