import os
import shutil
from datetime import datetime, timedelta, timezone
from pathlib import Path

import jwt
from bson import ObjectId
from dotenv import load_dotenv
from fastapi import Depends, FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jwt.exceptions import InvalidTokenError
from pydantic import BaseModel, ConfigDict, Field
from pymongo.errors import DuplicateKeyError
from pwdlib import PasswordHash

from database import client, db, users_collection, check_database_connection
from extract_frames import extract_frames
from process_pose import process_pose


BACKEND_DIR = Path(__file__).resolve().parent
load_dotenv(BACKEND_DIR / ".env")

JWT_SECRET = os.getenv("JWT_SECRET")
JWT_ALGORITHM = "HS256"
TOKEN_EXPIRE_MINUTES = 60

if not JWT_SECRET:
    raise RuntimeError("JWT_SECRET is missing from backend/.env")

app = FastAPI(title="YogaYen API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)

security = HTTPBearer(auto_error=False)
password_hash = PasswordHash.recommended()

UPLOAD_DIR = BACKEND_DIR / "uploads"
UPLOAD_DIR.mkdir(exist_ok=True)


class RegisterRequest(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    full_name: str = Field(min_length=2, max_length=100)
    email: str = Field(min_length=5, max_length=254)
    phone: str = Field(min_length=7, max_length=20)
    password: str = Field(min_length=8, max_length=128)
    confirm_password: str | None = None


class LoginRequest(BaseModel):
    email: str = Field(min_length=5, max_length=254)
    password: str = Field(min_length=1, max_length=128)


def public_user(user):
    return {
        "id": str(user["_id"]),
        "full_name": user["full_name"],
        "name": user["full_name"],
        "email": user["email"],
        "phone": user["phone"],
    }


def create_access_token(user_id):
    now = datetime.now(timezone.utc)
    payload = {
        "sub": str(user_id),
        "iat": now,
        "exp": now + timedelta(minutes=TOKEN_EXPIRE_MINUTES),
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


def get_authenticated_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(security),
):
    if credentials is None:
        raise HTTPException(status_code=401, detail="Authentication required.")

    try:
        payload = jwt.decode(
            credentials.credentials,
            JWT_SECRET,
            algorithms=[JWT_ALGORITHM],
        )
        user_id = payload.get("sub")
        if not user_id or not ObjectId.is_valid(user_id):
            raise HTTPException(status_code=401, detail="Invalid authentication token.")
    except InvalidTokenError as error:
        raise HTTPException(
            status_code=401,
            detail="Invalid or expired authentication token.",
        ) from error

    user = users_collection.find_one({"_id": ObjectId(user_id)})
    if user is None:
        raise HTTPException(status_code=401, detail="User account not found.")

    return user


@app.on_event("startup")
def initialize_database():
    check_database_connection()
    users_collection.create_index("email", unique=True)


@app.get("/")
def home():
    return {"message": "YogaYen Backend is running"}


@app.post("/api/auth/register", status_code=201)
def register(payload: RegisterRequest):
    email = payload.email.strip().lower()

    if payload.confirm_password is not None:
        if payload.password != payload.confirm_password:
            raise HTTPException(
                status_code=422,
                detail="Passwords do not match.",
            )

    if users_collection.find_one({"email": email}, {"_id": 1}):
        raise HTTPException(
            status_code=409,
            detail="An account with this email already exists.",
        )

    user_document = {
        "full_name": payload.full_name.strip(),
        "email": email,
        "phone": payload.phone.strip(),
        "password_hash": password_hash.hash(payload.password),
        "created_at": datetime.now(timezone.utc),
    }

    try:
        result = users_collection.insert_one(user_document)
    except DuplicateKeyError as error:
        raise HTTPException(
            status_code=409,
            detail="An account with this email already exists.",
        ) from error

    return {
        "message": "Registration successful. Please sign in.",
        "user_id": str(result.inserted_id),
    }


@app.post("/api/auth/login")
def login(payload: LoginRequest):
    email = payload.email.strip().lower()
    user = users_collection.find_one({"email": email})

    if user is None or not password_hash.verify(
        payload.password,
        user["password_hash"],
    ):
        raise HTTPException(
            status_code=401,
            detail="Invalid email or password.",
        )

    return {
        "access_token": create_access_token(user["_id"]),
        "token_type": "bearer",
        "user": public_user(user),
    }


@app.get("/api/auth/me")
def current_user(user=Depends(get_authenticated_user)):
    return {"user": public_user(user)}


@app.post("/api/auth/logout")
def logout(user=Depends(get_authenticated_user)):
    # The frontend clears its local session.
    # JWTs are stateless and remain valid until expiration.
    return {"message": "Signed out locally."}


@app.post("/upload-video")
async def upload_video(file: UploadFile = File(...)):
    filename = Path(file.filename or "").name
    if not filename:
        raise HTTPException(
            status_code=400,
            detail="A video filename is required.",
        )

    video_path = UPLOAD_DIR / filename

    try:
        with video_path.open("wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        frames_folder = extract_frames(video_path)
        pose_count = process_pose(frames_folder)

    except ValueError as error:
        raise HTTPException(status_code=400, detail=str(error)) from error
    finally:
        await file.close()

    return {
        "message": "Video uploaded and frames extracted successfully",
        "filename": filename,
        "path": str(video_path),
        "pose_detected_frames": pose_count,
    }
