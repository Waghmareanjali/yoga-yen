# Yoga Yen

Yoga Yen is a React + Vite wellness application for posture awareness, movement breaks, and everyday habits. The frontend contains public information pages and an app experience; the FastAPI backend currently provides video upload, frame extraction, and pose-processing routes. Posture output is for wellness awareness, not a medical diagnosis.

This guide is for contributors and anyone cloning the repository. Read the current requirement status before treating a feature as complete: some frontend screens depend on backend APIs that have not been implemented yet.

## Project at a glance

| Area | What it does | Main location |
| --- | --- | --- |
| Frontend app | React pages, navigation, API clients, camera flows, and UI state | `src/` |
| API clients | Calls to the configured backend | `src/api/` |
| Backend service | FastAPI health and video-upload endpoints | `backend/main.py` |
| Video processing | Saves uploads, extracts JPEG frames, and runs MediaPipe pose processing | `backend/extract_frames.py`, `backend/process_pose.py` |
| Backend dependencies | Python package list for a virtual environment | `backend/requirements.txt` |

The frontend uses React, Vite, React Router, Zustand, Recharts, Framer Motion, Lucide, and MediaPipe Tasks Vision. The backend uses FastAPI, Uvicorn, OpenCV, MediaPipe, and `python-multipart`.

## Requirement and implementation status

Check this section before adding features or telling someone a requirement is complete. A frontend form or screen is not proof that its end-to-end backend requirement is implemented.

| Requirement / feature | Current status | What to check |
| --- | --- | --- |
| Registration form validation | Frontend validates required fields, email format, 10-digit mobile number, and password length (at least 8 characters). | Try invalid and valid inputs on the registration page. |
| Real registration, login, and persistent accounts | **Not complete.** The frontend expects authentication APIs, but the current FastAPI backend does not implement authentication or a database. | Do not use preview login as real authentication. Implement and connect a backend identity provider/database first. |
| User-specific dashboard, goals, settings, and history | **Not complete end-to-end.** API-backed screens need their expected backend endpoints. | Verify each API contract and persistence against the selected backend before relying on those screens. |
| Development preview data | Available only in development when preview mode is enabled. It is sample UI data, is not a real account, and is not persisted to the backend. | Never deploy or present preview mode as authentication or production data. |
| Live camera monitoring | Camera pose landmarks are processed in the browser; MediaPipe model/WASM assets currently load from hosted URLs. | Use localhost or HTTPS, grant camera permission, and check network access for the assets. |
| Live Monitor video and frame storage | The app records a session after the user confirms the camera/storage prompt. On stop, it uploads the clip; the backend saves it under `backend/uploads/` and extracts frames under `backend/frames/<video-name>/`. | Keep the backend running, stop a recording session, and wait for the saved confirmation. |
| Image Analysis snapshots | Timed still snapshots remain in browser memory unless the user explicitly submits an image for analysis. | Do not assume snapshots are written to disk. |
| Backend pose model | The backend expects `backend/models/pose_landmarker_lite.task`. | Confirm the model file exists before testing pose processing. |

### Requirement check before implementation

Before changing a feature:

1. Read this README and inspect the relevant frontend screen/API client and backend route.
2. Write down the expected behavior and acceptance checks, including validation, errors, and where data must be stored.
3. Check whether the required backend endpoint and persistent storage actually exist. If they do not, document that dependency rather than substituting sample data or claiming the feature is complete.
4. After changes, run the relevant checks below and manually verify the actual user flow. Update this status table when implementation status changes.

## Requirements

- Node.js compatible with the Vite version in `package.json` and npm.
- Python with package wheels available for the backend requirements (MediaPipe requires a supported Python/platform combination).
- A browser that supports camera access and `MediaRecorder` for Live Monitor recording.
- Camera access is available only on localhost or a secure HTTPS origin.
- Internet access is needed to load the current hosted MediaPipe WASM runtime and pose model in the browser.
- For backend pose processing, provide `backend/models/pose_landmarker_lite.task`.

## Clone and configure

Clone the repository, then change to the folder containing `package.json`:

```powershell
git clone <repository-url>
Set-Location <repository-folder>
```

Create the frontend environment file from the example:

```powershell
Copy-Item .env.example .env
```

Set `VITE_API_BASE_URL` in `.env` to the backend base URL (default: `http://localhost:8000`). `VITE_USE_MOCK_API` can enable development-only mock task/settings behavior; it does not provide real authentication or a database.

Variables prefixed with `VITE_` are bundled into public browser code. Never put credentials, private keys, or server-only secrets in them.

## Install and run the frontend

From the project root, install JavaScript dependencies and start Vite:

```powershell
npm install
npm run dev
```

Open the local URL printed by Vite, usually `http://localhost:5173`. Keep this terminal running. If you change `.env`, restart Vite.

## Set up and run the backend in a Python virtual environment

Use a dedicated virtual environment so backend packages do not get installed into system Python. The commands below are for PowerShell, run from the project root:

```powershell
py -m venv backend\venv
.\backend\venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
python -m pip install -r backend\requirements.txt
Set-Location backend
python -m uvicorn main:app --reload
```

If PowerShell blocks activation for this terminal, use the venv interpreter directly instead:

```powershell
.\backend\venv\Scripts\python.exe -m pip install --upgrade pip
.\backend\venv\Scripts\python.exe -m pip install -r backend\requirements.txt
Set-Location backend
..\backend\venv\Scripts\python.exe -m uvicorn main:app --reload
```

Alternatively, on macOS/Linux, run these from the project root:

```bash
python3 -m venv backend/venv
source backend/venv/bin/activate
python -m pip install --upgrade pip
python -m pip install -r backend/requirements.txt
cd backend
python -m uvicorn main:app --reload
```

Keep the backend terminal open. The root health route is `http://127.0.0.1:8000/`; interactive API documentation is at `http://127.0.0.1:8000/docs`. The app's video upload client uses the configured `VITE_API_BASE_URL`.

### Video upload and storage

The backend exposes `POST /upload-video` with a multipart form field named `file`. A successful upload:

1. Saves the video under `backend/uploads/`.
2. Extracts JPEG images under `backend/frames/<video-name>/`.
3. Runs pose processing on the extracted frames.

Live Monitor records only after the user proceeds through the camera/storage disclosure. Stop the session and wait for the UI's **Video saved** confirmation. If upload fails, use the retry action while the backend is available. The browser cannot write directly into the repository; it sends the recording to the backend, which writes the files.

The backend is not currently a complete authentication, goals, profile, settings, or posture-classification API. These features need corresponding backend routes and, where applicable, persistent storage before they can work as real services.

## Checks before submitting changes

Run these from the project root:

```powershell
npm run lint
npm run build
```

The repository currently has no dedicated test script configured in `package.json`. For Python syntax validation:

```powershell
.\backend\venv\Scripts\python.exe -m compileall backend
```

For changes to camera/upload behavior, additionally verify manually:

1. The frontend and backend are both running.
2. The browser asks for camera access and clearly discloses recording/storage.
3. Start and stop a short session.
4. Wait for the successful upload message; confirm the video exists in `backend/uploads/` and extracted JPEGs exist in that session's `backend/frames/` directory.
5. Test the failure state with the backend stopped, then confirm retry succeeds after restarting it. Do not use real camera footage for tests unless the tester explicitly agrees to record and retain it.

Update this README's requirement status and setup instructions whenever code changes alter endpoints, dependencies, setup, or user-visible behavior.

## Deploy

The frontend can be built with `npm run build` (output: `dist/`). Set `VITE_API_BASE_URL` to a reachable deployed backend before building. Camera access requires HTTPS. The backend must be deployed separately with its Python dependencies, model file, writable upload/frame directories, and any required API/database integrations. Do not deploy the development preview as real authentication.

## Privacy and health disclaimer

Live Monitor recordings are uploaded to the configured backend when a session stops, and extracted frames are stored there. Proceed only if you consent to this storage. Image Analysis snapshots remain in browser memory until explicitly submitted. Yoga Yen provides posture/wellness awareness only and does not provide medical diagnosis.
