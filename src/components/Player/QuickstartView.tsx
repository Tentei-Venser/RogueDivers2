export function QuickstartView() {
    return (
        <section className="quickstart-panel" aria-labelledby="quickstart-heading">
            <h2 id="quickstart-heading">Quick Start</h2>
            <ol className="quickstart-list">
                <li><strong>Mark unlocked gear.</strong> Check items you own in the Armory below so they can be selected as grants and loot.</li>
                <li><strong>Set your loadout.</strong> Use Change beside a slot, or Select Starting Armor when no armor is equipped.</li>
                <li><strong>Log mission results.</strong> Mark completed objectives to earn loot spins; completing the operation advances difficulty.</li>
                <li><strong>Resolve loot drops.</strong> Pick a wheel, then equip the result or keep your current gear. Resolve all earned spins to save the result.</li>
                <li><strong>Choose packages.</strong> When a milestone is available, pick a Specialization or Requisition and follow its listed grants.</li>
                <li><strong>After a death,</strong> use My Diver Died to reset after a squad wipe or rejoin the squad at its current difficulty.</li>
            </ol>
        </section>
    );
}