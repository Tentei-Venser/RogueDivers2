import { useState } from "react";
import type { ArmoryData, PlayerData, LoadoutPackage, GrantValue } from "../types/Objects";
import { SPECIALIZATIONS } from "./Specializations";
import { REQUISITIONS } from "./Requisitions";
import { isSpecializationDue, requisitionPicksDue, isPackageAvailable, resolveGrantOptions, rollFieldValue } from "./Milestones";

export const STRATAGEM_SLOTS = ["stratagem1", "stratagem2", "stratagem3", "stratagem4"] as const;
export type StratagemSlot = typeof STRATAGEM_SLOTS[number];
export type PackageKind = "specialization" | "requisition";

export function isStratagemField(field: keyof PlayerData): field is StratagemSlot {
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

// Drives a single Specialization/Requisition pick from package choice through every grant field
// and stratagem slot. `base` is the Diver the pick is made against - the saved player for the
// milestone banner, or the staged post-mission Diver inside Mission Results - so due picks,
// duplicate checks and rerolls all see the same loadout the result will be applied on top of.
// Nothing is applied until the whole package resolves, and then only through onComplete.
export function usePackagePick(base: PlayerData, armory: ArmoryData, onComplete: (patch: Partial<PlayerData>) => void) {
    const [chosenKind, setChosenKind] = useState<PackageKind | null>(null);
    const [chosenPackage, setChosenPackage] = useState<LoadoutPackage | null>(null);
    const [patch, setPatch] = useState<Partial<PlayerData>>({});
    const [pendingFields, setPendingFields] = useState<[keyof PlayerData, GrantValue][]>([]);
    const [pendingSlots, setPendingSlots] = useState<string[]>([]);         // granted stratagems still to be placed
    const [slotPatch, setSlotPatch] = useState<Partial<PlayerData>>({});    // granted stratagems, keyed by the slot chosen for them

    // Re-derived from `base` every render, rather than tracked separately - so it always reflects
    // reality even if level/specialization/requisitions change from somewhere else (e.g. the Level
    // "Change" button in PlayerView, or a staged death reset in Mission Results).
    const pendingKind: PackageKind | null = chosenPackage
        ? null
        : isSpecializationDue(base)
            ? "specialization"
            : requisitionPicksDue(base) > 0
                ? "requisition"
                : null;

    // Once every grant field has been resolved to a concrete value and every granted stratagem has a
    // slot, apply the whole package in one patch. Still applies when every grant was skipped as a
    // duplicate - the package itself is recorded and the milestone pick is spent either way.
    function complete(kind: PackageKind, pkg: LoadoutPackage, grants: Partial<PlayerData>) {
        const selectedPackage = {
            ...pkg,
            resolvedGrants: grants as Partial<Record<keyof PlayerData, string>>,
        };
        onComplete(
            kind === "specialization"
                ? { ...grants, specialization: selectedPackage }
                : { ...grants, requisitions: [...base.requisitions, selectedPackage] }
        );
        cancelPick();
    }

    // Options for a grant that are still legal to take. Stratagem grants exclude anything already
    // equipped or already granted by this package, so a pick can never duplicate a stratagem.
    function availableOptions(field: keyof PlayerData, value: GrantValue, current: Partial<PlayerData>): string[] {
        const options = resolveGrantOptions(value, armory, field);
        if (!isStratagemField(field)) return options;
        const taken = takenStratagems(base, current);
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
    // that fills all 4 slots overwrites every one regardless, so it skips the slot step - and one
    // with nothing left to place completes right here.
    function advance(kind: PackageKind, pkg: LoadoutPackage, next: Partial<PlayerData>, remaining: [keyof PlayerData, GrantValue][]) {
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
        if (fillsEverySlot || granted.length === 0) {
            complete(kind, pkg, next);
            return;
        }
        setPatch(withoutGranted);
        setPendingSlots(granted);
    }

    function choosePackage(kind: PackageKind, pkg: LoadoutPackage) {
        const { settled: resolved, remaining } = settleFields(
            Object.entries(pkg.grants) as [keyof PlayerData, GrantValue][], {});

        // reroll fields are random, no player choice. Each roll sees a "current view" that includes
        // anything already rerolled earlier in this same batch (not just `base` as it was before
        // this action started) - otherwise, e.g. rerolling all 4 stratagem slots for Bargain Bin
        // could hand two of them the same result, since each would only avoid the ORIGINAL other
        // slots' values, not each other's freshly-rolled ones. A genuinely exhausted pool goes blank.
        for (const field of pkg.reroll ?? []) {
            const currentView = { ...base, ...resolved } as PlayerData;
            const rolled = rollFieldValue(field, armory, currentView);
            (resolved as Record<string, string>)[field] = rolled;
        }

        setChosenKind(kind);
        setChosenPackage(pkg);
        advance(kind, pkg, resolved, remaining);
    }

    function chooseFieldValue(value: string) {
        const [field] = pendingFields[0];
        const { settled, remaining } = settleFields(pendingFields.slice(1), { ...patch, [field]: value });
        advance(chosenKind!, chosenPackage!, settled, remaining);
    }

    function chooseSlot(slot: StratagemSlot) {
        const nextSlotPatch = { ...slotPatch, [slot]: pendingSlots[0] };
        const remainingSlots = pendingSlots.slice(1);
        if (remainingSlots.length === 0) {
            complete(chosenKind!, chosenPackage!, { ...patch, ...nextSlotPatch });
            return;
        }
        setSlotPatch(nextSlotPatch);
        setPendingSlots(remainingSlots);
    }

    // Abandons a package mid-pick. Nothing is applied until the final pick, so this only has to
    // drop the staged state - the pick is then offered again.
    function cancelPick() {
        setChosenPackage(null);
        setChosenKind(null);
        setPatch({});
        setPendingFields([]);
        setPendingSlots([]);
        setSlotPatch({});
    }

    const table = pendingKind === "specialization" ? SPECIALIZATIONS : REQUISITIONS;
    const hasUnusedPhoenixDown = base.requisitions.some(pkg => pkg.id === "phoenix-down" && !pkg.used);
    const eligible = pendingKind ? table.filter(pkg =>
        isPackageAvailable(pkg, armory)
        && !(pendingKind === "requisition" && pkg.id === "phoenix-down" && hasUnusedPhoenixDown)
    ) : [];

    return {
        base,
        pendingKind,
        eligible,
        hasUnusedPhoenixDown,
        chosenPackage,
        pendingFields,
        pendingSlots,
        slotPatch,
        takenForPick: takenStratagems(base, patch),
        choosePackage,
        chooseFieldValue,
        chooseSlot,
        cancelPick,
    };
}

export type PackagePick = ReturnType<typeof usePackagePick>;
