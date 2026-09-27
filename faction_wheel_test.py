import random


def faction_wheel_test():
    all_factions = [
        "Terminids - Basic",
        "Terminids - Predator Strain",
        "Terminids - Spore Burst Strain",
        "Terminids - Rupture Strain",
        "Automatons - Basic",
        "Automatons - Jet Brigade",
        "Automatons - Incineration Corps",
        "Automatons - Cyborg Legion",
        "Illuminate - Basic",
        "Illuminate - Appropriators",
        "Illuminate - Vote Snatchers",
        "Illuminate - Mindless Masses",
        "Illuminate - Invasion Fleet",
    ]
    faction_result = random.choice(all_factions)
    print(faction_result)
    return faction_result
