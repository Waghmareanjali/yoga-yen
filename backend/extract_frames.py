import cv2
from pathlib import Path


def extract_frames(video_path):
    video_path = Path(video_path)

    frames_dir = Path("frames")

    session_name = video_path.stem
    output_dir = frames_dir / session_name

    output_dir.mkdir(parents=True, exist_ok=True)

    print(f"🎥 Video: {video_path}")
    print(f"📁 Frames will be saved in: {output_dir}")

    cap = cv2.VideoCapture(str(video_path))

    if not cap.isOpened():
        print("❌ Could not open the video.")
        return 0

    fps = cap.get(cv2.CAP_PROP_FPS)
    total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))

    print(f"FPS: {fps}")
    print(f"Total frames: {total_frames}")

    frame_number = 0

    while True:
        success, frame = cap.read()

        if not success:
            break

        frame_number += 1

        frame_filename = output_dir / f"frame_{frame_number:04d}.jpg"

        cv2.imwrite(str(frame_filename), frame)

    cap.release()

    print(f"✅ Finished! Extracted {frame_number} frames.")

    return output_dir