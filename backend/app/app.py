from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from .faction_wheel_test import faction_wheel_test
from .version import BACKEND_VERSION

app = FastAPI(title="Faction Test API", version=BACKEND_VERSION)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "https://tentei-venser.github.io",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/faction")
async def get_faction():
    faction = faction_wheel_test()
    return {"faction": faction}
