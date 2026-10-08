from fastapi import FastAPI, UploadFile, File
from pathlib import Path
import shutil
from extract_frames import extract_frames
from process_pose import process_pose

app = FastAPI()

UPLOAD_DIR = Path("uploads")
UPLOAD_DIR.mkdir(exist_ok=True)


@app.get("/")
def home():
    return {"message": "YogaYen Backend is running"}


@app.post("/upload-video")
async def upload_video(file: UploadFile = File(...)):
    video_path = UPLOAD_DIR / file.filename

    with video_path.open("wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        frames_folder = extract_frames(video_path)
        pose_count = process_pose(frames_folder)

    return {
    "message": "Video uploaded and frames extracted successfully",
    "filename": file.filename,
    "path": str(video_path),
    "pose_detected_frames": pose_count
    }