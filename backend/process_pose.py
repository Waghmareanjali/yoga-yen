import cv2
from pathlib import Path

from mediapipe.tasks import python
from mediapipe.tasks.python import vision
from mediapipe import Image, ImageFormat


MODEL_PATH = Path(__file__).resolve().parent / "models" / "pose_landmarker_lite.task"


def process_pose(frame_folder):
    frame_folder = Path(frame_folder)

    base_options = python.BaseOptions(
        model_asset_path=str(MODEL_PATH)
    )

    options = vision.PoseLandmarkerOptions(
        base_options=base_options,
        running_mode=vision.RunningMode.IMAGE,
        num_poses=1
    )

    detector = vision.PoseLandmarker.create_from_options(options)

    frame_files = sorted(frame_folder.glob("*.jpg"))

    print(f"Processing {len(frame_files)} frames...")

    detected_frames = 0

    for frame_path in frame_files:
        frame = cv2.imread(str(frame_path))

        if frame is None:
            continue

        rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)

        mp_image = Image(
            image_format=ImageFormat.SRGB,
            data=rgb_frame
        )

        result = detector.detect(mp_image)

        if result.pose_landmarks:
            detected_frames += 1

    detector.close()

    print(f"Pose detected in {detected_frames} frames.")

    return detected_frames