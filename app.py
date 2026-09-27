from fastapi import FastAPI

from faction_wheel_test import faction_wheel_test

app = FastAPI(title="Faction Test API")


@app.get("/faction")
def get_faction():
    faction = faction_wheel_test()
    return {"faction": faction}
