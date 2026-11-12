"""Download equipment category listings from the Helldivers wiki (helldivers.wiki.gg).

Writes scripts/.wiki-cache/members.json: {category name: [page titles]}.
Run from anywhere:  python scripts/fetch_wiki_categories.py
Then compare against ArmoryBackup.ts with:  python scripts/compare_armory.py
"""
import json
import os
import urllib.parse
import urllib.request

API = "https://helldivers.wiki.gg/api.php"
USER_AGENT = "RogueDivers2-companion/1.0"
CACHE_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), ".wiki-cache")

# Wiki categories used by compare_armory.py. The parent "Stratagems" category also holds
# mission/objective/disambiguation pages; it is only fetched to report anything uncategorized.
CATEGORIES = [
    "Light Armor", "Medium Armor", "Heavy Armor",
    "Primary Weapons", "Secondary Weapons", "Throwables", "Boosters",
    "Support Weapon Stratagems", "Backpack Stratagems", "Eagle Stratagems", "Orbital Stratagems",
    "Sentry Stratagems", "Emplacement Stratagems", "Vehicle Stratagems",
    "Stratagems", "Mission Stratagems",
]


def category_members(category: str) -> list[str]:
    titles, cont = [], {}
    while True:
        query = {
            "action": "query", "list": "categorymembers", "cmtitle": "Category:" + category,
            "cmlimit": "500", "cmtype": "page", "format": "json", **cont,
        }
        request = urllib.request.Request(API + "?" + urllib.parse.urlencode(query),
                                         headers={"User-Agent": USER_AGENT})
        with urllib.request.urlopen(request) as response:
            data = json.load(response)
        titles += [member["title"] for member in data["query"]["categorymembers"]]
        if "continue" not in data:
            return titles
        cont = data["continue"]


def main() -> None:
    os.makedirs(CACHE_DIR, exist_ok=True)
    result = {category: category_members(category) for category in CATEGORIES}
    out_path = os.path.join(CACHE_DIR, "members.json")
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(result, f, indent=1)
    for category, titles in result.items():
        print(f"{len(titles):4} {category}")
    print(f"\nSaved to {out_path}")


if __name__ == "__main__":
    main()
