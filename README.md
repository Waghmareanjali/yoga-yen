# Yoga Yen

Yoga Yen is a responsive React + Vite application for posture awareness, movement breaks, and everyday wellness habits. It supports a clearly labeled demo mode and can connect to a FastAPI backend. Posture information is a wellness indicator, not a medical diagnosis.

## Stack

- React + Vite
- React Router
- Framer Motion
- Recharts
- Zustand
- Lucide React
- MediaPipe tasks vision ready for browser-side landmark analysis

## Folder structure

```text
src/
├── api/
├── components/
├── constants/
├── context/
├── data/
├── hooks/
├── pages/
├── routes/
├── store/
├── styles/
├── utils/
├── App.jsx
├── main.jsx
└── README.md
```

## Environment variables

Create a local `.env` file in the project root or copy `.env.example`:

```bash
VITE_API_BASE_URL=http://localhost:8000
VITE_USE_MOCK_API=true
```

- `VITE_API_BASE_URL`: base URL for the FastAPI backend.
- `VITE_USE_MOCK_API`: set to `true` to use mock data; set to `false` when the backend is ready and running. If omitted in a production build, the app defaults to its clearly labeled demo mode rather than calling a localhost API.

Environment values prefixed with `VITE_` are bundled into browser code and are public. Do not put secrets, private keys, or server-only credentials in them.

## Switching from mock data to FastAPI

1. Start the Python FastAPI backend on `http://localhost:8000`.
2. Set `VITE_USE_MOCK_API=false` in `.env`.
3. Ensure your backend exposes the expected REST endpoints such as `/api/auth/login` and `/api/posture/current`.
4. Keep the frontend API functions in `src/api/` and the same function signatures for smooth switching.

## Run locally

```bash
npm install
npm run dev -- --host 0.0.0.0
```

The app is available in the browser at the local Vite host, usually `http://localhost:5173`.

## Deploy to Vercel

1. Import this repository into Vercel and select the project root (the folder containing `package.json`).
2. Use the Vite defaults: build command `npm run build` and output directory `dist`.
3. In **Project Settings → Environment Variables**, set `VITE_API_BASE_URL` to the deployed backend URL and `VITE_USE_MOCK_API` to `false` when that backend is ready. Use `true` to keep the app in its labeled demo mode.
4. Redeploy after changing environment variables. `vercel.json` rewrites client-side routes to the SPA entry point.
5. Configure the backend to allow requests from the production Vercel domain. Camera access requires HTTPS; Vercel deployments provide HTTPS by default.

Never add a real `.env` file to Git. Local `.env*` files are ignored; `.env.example` is safe to commit.

## Privacy note

Your privacy comes first. Yoga Yen is designed to analyze posture without unnecessarily storing webcam images or videos.

## Disclaimer

This frontend uses demo data by default and should be treated as a wellness indicator, not a medical diagnosis or medically validated outcome.
