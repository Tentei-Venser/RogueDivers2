"""Compare src/data/ArmoryBackup.ts against the wiki listings saved by fetch_wiki_categories.py.

Run:  python scripts/compare_armory.py
Prints, per ArmoryBackup section, items on the wiki but missing from the backup (+) and items in
the backup with no matching wiki page (-). Results still need a human pass: the wiki categories
include help/style pages, event novelties and disambiguation pages.
"""
import json
import os
import re

SCRIPTS_DIR = os.path.dirname(os.path.abspath(__file__))
BACKUP_PATH = os.path.join(SCRIPTS_DIR, "..", "src", "data", "ArmoryBackup.ts")
MEMBERS_PATH = os.path.join(SCRIPTS_DIR, ".wiki-cache", "members.json")

# ArmoryBackup section -> wiki categories that should cover it.
SECTION_CATEGORIES = {
    "armor": ["Light Armor", "Medium Armor", "Heavy Armor"],
    "primary": ["Primary Weapons"],
    "secondary": ["Secondary Weapons"],
    "grenade": ["Throwables"],
    "stratagem": ["Support Weapon Stratagems", "Backpack Stratagems", "Eagle Stratagems",
                  "Orbital Stratagems", "Sentry Stratagems", "Emplacement Stratagems",
                  "Vehicle Stratagems"],
    "booster": ["Boosters"],
}


def normalize(name: str) -> str:
    name = re.sub(r"\s*\(.*?\)$", "", name)  # drop suffixes like "(Helldivers 2)"
    return re.sub(r"[^a-z0-9]", "", name.lower())


def backup_sections(source: str) -> dict[str, list[str]]:
    return {
        match.group(1): re.findall(r'newGameItem\("([^"]+)"', match.group(2))
        for match in re.finditer(r"(\w+): \[(.*?)\n\s*\]", source, re.S)
    }


def main() -> None:
    with open(BACKUP_PATH, encoding="utf-8") as f:
        sections = backup_sections(f.read())
    with open(MEMBERS_PATH, encoding="utf-8") as f:
        wiki = json.load(f)

    for section, categories in SECTION_CATEGORIES.items():
        ours = {normalize(name): name for name in sections.get(section, [])}
        theirs: dict[str, str] = {}
        for category in categories:
            for title in wiki.get(category, []):
                theirs.setdefault(normalize(title), title)
        missing = sorted(title for key, title in theirs.items() if key not in ours)
        extra = sorted(name for key, name in ours.items() if key not in theirs)

        print(f"\n=== {section}: backup {len(ours)}, wiki {len(theirs)} ===")
        print("  On wiki, not in backup:")
        for title in missing:
            print("    +", title)
        print("  In backup, not matched on wiki:")
        for name in extra:
            print("    -", name)

    # Stratagem pages that aren't in any loadout sub-category (or Mission Stratagems).
    covered = {normalize(t) for c in SECTION_CATEGORIES["stratagem"] + ["Mission Stratagems"]
               for t in wiki.get(c, [])}
    other = sorted(t for t in wiki.get("Stratagems", []) if normalize(t) not in covered)
    print("\n=== Stratagems pages outside the loadout sub-categories ===")
    for title in other:
        print("    ?", title)


if __name__ == "__main__":
    main()
