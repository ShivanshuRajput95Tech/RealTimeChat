# RealTimeChat Client

This is the frontend for RealTimeChat, built with React, Vite, Tailwind CSS, Axios, and Socket.IO Client.

## Run locally

```bash
npm install
cp .env.example .env
npm run dev
```

Default local URL: `http://localhost:5173`

## Environment variables

Create `QuickChat-Full-Stack/client/.env`:

```env
VITE_BACKEND_URL=http://localhost:5000
# Optional legacy alias:
# VITE_API_URL=http://localhost:5000
```

## Available scripts

- `npm run dev` — start the Vite dev server
- `npm run build` — create a production build
- `npm run lint` — run ESLint
- `npm run preview` — preview the production build locally

## Integration notes

- REST requests are sent to the backend base URL configured in `VITE_BACKEND_URL`.
- Socket.IO connections use the same backend base URL and authenticate with the JWT access token.
- The current UI is responsive and theme-aware, but it still uses the same existing backend contract for auth, messages, profile updates, and read receipts.
