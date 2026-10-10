import cv2
from pathlib import Path


def extract_frames(video_path):
    video_path = Path(video_path)

    frames_dir = Path(__file__).resolve().parent / "frames"

    session_name = video_path.stem
    output_dir = frames_dir / session_name

    output_dir.mkdir(parents=True, exist_ok=True)

    print(f"Video: {video_path}")
    print(f"Frames will be saved in: {output_dir}")

    cap = cv2.VideoCapture(str(video_path))

    if not cap.isOpened():
        cap.release()
        raise ValueError("The uploaded file is not a readable video.")

    frame_number = 0

    try:
        fps = cap.get(cv2.CAP_PROP_FPS)
        total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        print(f"FPS: {fps}")
        print(f"Total frames: {total_frames}")

        while True:
            success, frame = cap.read()

            if not success:
                break

            frame_number += 1
            frame_filename = output_dir / f"frame_{frame_number:04d}.jpg"

            if not cv2.imwrite(str(frame_filename), frame):
                raise OSError(f"Could not write extracted frame: {frame_filename}")
    finally:
        cap.release()

    if frame_number == 0:
        raise ValueError("The video contains no decodable frames.")

    print(f"Finished! Extracted {frame_number} frames.")

    return output_dir