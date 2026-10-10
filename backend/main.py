from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pathlib import Path
import shutil
from extract_frames import extract_frames
from process_pose import process_pose

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)

BACKEND_DIR = Path(__file__).resolve().parent
UPLOAD_DIR = BACKEND_DIR / "uploads"
UPLOAD_DIR.mkdir(exist_ok=True)


@app.get("/")
def home():
    return {"message": "YogaYen Backend is running"}


@app.post("/upload-video")
async def upload_video(file: UploadFile = File(...)):
    filename = Path(file.filename or "").name
    if not filename:
        raise HTTPException(status_code=400, detail="A video filename is required.")

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