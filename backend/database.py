import os
from pathlib import Path

from dotenv import load_dotenv
from pymongo import MongoClient

BACKEND_DIR = Path(__file__).resolve().parent
load_dotenv(BACKEND_DIR / ".env")

MONGODB_URI = os.getenv(
    "MONGODB_URI",
    "mongodb://127.0.0.1:27017",
)
MONGODB_DATABASE = os.getenv("MONGODB_DATABASE", "yogayen")

client = MongoClient(
    MONGODB_URI,
    serverSelectionTimeoutMS=3000,
)

db = client[MONGODB_DATABASE]
users_collection = db["users"]


def check_database_connection():
    client.admin.command("ping")
    return True
