
import cv2
import csv
import json
from pathlib import Path

from mediapipe.tasks import python
from mediapipe.tasks.python import vision
from mediapipe import Image, ImageFormat


# Project paths
BACKEND_DIR = Path(__file__).resolve().parent

MODEL_PATH = BACKEND_DIR / "models" / "pose_landmarker_lite.task"
OUTPUT_FOLDER = BACKEND_DIR / "outputs"
ANNOTATED_FOLDER = OUTPUT_FOLDER / "annotated_frames"


def process_pose(frame_folder):
    frame_folder = Path(frame_folder)

    OUTPUT_FOLDER.mkdir(parents=True, exist_ok=True)
    ANNOTATED_FOLDER.mkdir(parents=True, exist_ok=True)

    # Load the MediaPipe pose model
    base_options = python.BaseOptions(
        model_asset_path=str(MODEL_PATH)
    )

    options = vision.PoseLandmarkerOptions(
        base_options=base_options,
        running_mode=vision.RunningMode.IMAGE,
        num_poses=1
    )

    # Find all JPG frames
    frame_files = sorted(frame_folder.glob("*.jpg"))

    print(f"Processing {len(frame_files)} frames...")

    detected_frames = 0
    all_landmarks = []

    # Create the pose detector
    detector = vision.PoseLandmarker.create_from_options(options)

    # Main frame-processing loop
    try:
        for frame_path in frame_files:
            frame = cv2.imread(str(frame_path))

            if frame is None:
                print(f"Skipping unreadable frame: {frame_path.name}")
                continue

            # Convert BGR to RGB for MediaPipe
            rgb_frame = cv2.cvtColor(
                frame,
                cv2.COLOR_BGR2RGB
            )

            mp_image = Image(
                image_format=ImageFormat.SRGB,
                data=rgb_frame
            )

            # Detect pose landmarks
            result = detector.detect(mp_image)

            if not result.pose_landmarks:
                continue

            detected_frames += 1

            # Get the detected pose and image dimensions
            pose_landmarks = result.pose_landmarks[0]
            height, width = frame.shape[:2]

            # Main body skeleton connections
            connections = [
                (11, 12),
                (11, 13), (13, 15),
                (12, 14), (14, 16),
                (11, 23), (12, 24),
                (23, 24),
                (23, 25), (25, 27),
                (27, 29), (29, 31),
                (24, 26), (26, 28),
                (28, 30), (30, 32),
                (15, 17), (15, 19), (15, 21),
                (16, 18), (16, 20), (16, 22)
            ]

            # Draw skeleton lines
            for start, end in connections:
                p1 = pose_landmarks[start]
                p2 = pose_landmarks[end]

                point1 = (
                    int(p1.x * width),
                    int(p1.y * height)
                )

                point2 = (
                    int(p2.x * width),
                    int(p2.y * height)
                )

                cv2.line(
                    frame,
                    point1,
                    point2,
                    (0, 255, 0),
                    2
                )

            # Draw landmark points
            for landmark in pose_landmarks:
                if 0 <= landmark.x <= 1 and 0 <= landmark.y <= 1:
                    point = (
                        int(landmark.x * width),
                        int(landmark.y * height)
                    )

                    cv2.circle(
                        frame,
                        point,
                        4,
                        (0, 0, 255),
                        -1
                    )

            # Save the annotated frame
            annotated_path = ANNOTATED_FOLDER / frame_path.name

            cv2.imwrite(
                str(annotated_path),
                frame
            )

            # Save all 33 pose landmarks
            for landmark_id, landmark in enumerate(pose_landmarks):
                all_landmarks.append({
                    "frame": frame_path.name,
                    "landmark_id": landmark_id,
                    "x": landmark.x,
                    "y": landmark.y,
                    "z": landmark.z,
                    "visibility": getattr(
                        landmark, "visibility", None
                    ),
                    "presence": getattr(
                        landmark, "presence", None
                    )
                })

    finally:
        detector.close()

    # Export landmarks to JSON
    json_path = OUTPUT_FOLDER / "pose_landmarks.json"

    with open(json_path, "w", encoding="utf-8") as file:
        json.dump(all_landmarks, file, indent=2)

    # Export landmarks to CSV
    csv_path = OUTPUT_FOLDER / "pose_landmarks.csv"

    columns = [
        "frame",
        "landmark_id",
        "x",
        "y",
        "z",
        "visibility",
        "presence"
    ]

    with open(csv_path, "w", newline="", encoding="utf-8") as file:
        writer = csv.DictWriter(file, fieldnames=columns)
        writer.writeheader()
        writer.writerows(all_landmarks)

    # Display the results
    print(f"Pose detected in {detected_frames} frames.")
    print(f"Landmark rows saved: {len(all_landmarks)}")
    print(f"Annotated frames folder: {ANNOTATED_FOLDER}")
    print(f"JSON file: {json_path}")
    print(f"CSV file: {csv_path}")

    return detected_frames