# Local greeting client

React, TypeScript, Vite, and Tailwind CSS frontend for the SAM greeting API.

## Run locally

Use Node.js 24 (or another Node.js version supported by the current Vite release).

```bash
cp .env.example .env.local
npm ci
npm run dev
```

Open the local Vite URL (usually http://localhost:5173). Set `VITE_API_URL` in `.env.local` to the deployed API endpoint if it changes. The browser sends a JSON `POST` request with `{ "name": "..." }` and displays the API response.

Each request also includes a random persistent `clientId`, a fresh `requestId`, a timestamp, and basic browser context (user agent, language, and time zone). The client ID is stored in local storage so repeat visits in this browser can be grouped; clearing site data creates a new ID. This is a pseudonymous convenience identifier, not authentication or a reliable device fingerprint. The browser identity is logged once per tab session in DevTools.

The API must allow the local frontend origin (`http://localhost:5173`) through CORS. See the root `template.yaml` and deploy the SAM changes if the deployed API has not been updated for CORS yet.

## Production build

```bash
npm run build
```
