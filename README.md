# Yoga Yen

Yoga Yen is a responsive React + Vite UI prototype for posture awareness, movement breaks, and everyday wellness habits. It currently runs without authentication or a database; screens use preview data so the interface can be developed independently. Posture information is a wellness indicator, not a medical diagnosis.

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
VITE_UI_ONLY_MODE=true
```

- `VITE_UI_ONLY_MODE`: defaults to `true`. Keeps backend requests disabled and uses preview data. Set to `false` only when backend integration is intentionally being developed.
- `VITE_USE_MOCK_API`: keeps API modules on preview data. Leave this `true` while in UI-only mode.
- `VITE_API_BASE_URL`: reserved for the future FastAPI integration; it is not contacted in UI-only mode.

Environment values prefixed with `VITE_` are bundled into browser code and are public. Do not put secrets, private keys, or server-only credentials in them.

## Current development mode

- Login and registration screens are available for design testing. Login works with blank or arbitrary fields; registration fields are optional. Both create only an in-memory preview session and do not verify credentials or create an account.
- The app sidebar's Sign out action resets the in-memory preview profile and returns to the login screen; it does not revoke access to public app routes.
- Dashboard and app routes remain directly accessible without login.
- Preview measurements and recommendations are illustrative and are not saved to a database.
- Camera-based pose landmarks run locally in the browser. Image-analysis demo mode does not send uploaded images to a server.
- To begin backend integration later, set `VITE_UI_ONLY_MODE=false` and configure the API/mock flags deliberately, then replace the dummy sign-in and registration with real authentication.

## Run locally

```bash
npm install
npm run dev -- --host 0.0.0.0
```

The app is available in the browser at the local Vite host, usually `http://localhost:5173`.

## Deploy to Vercel

1. Import this repository into Vercel and select the project root (the folder containing `package.json`).
2. Use the Vite defaults: build command `npm run build` and output directory `dist`.
3. Leave `VITE_UI_ONLY_MODE=true` for the current UI-only deployment; no backend URL or database is needed.
4. Redeploy after changing environment variables. `vercel.json` rewrites client-side routes to the SPA entry point.
5. Camera access requires HTTPS; Vercel deployments provide HTTPS by default.

Never add a real `.env` file to Git. Local `.env*` files are ignored; `.env.example` is safe to commit.

## Privacy note

Your privacy comes first. Yoga Yen is designed to analyze posture without unnecessarily storing webcam images or videos.

## Disclaimer

This frontend uses demo data by default and should be treated as a wellness indicator, not a medical diagnosis or medically validated outcome.
