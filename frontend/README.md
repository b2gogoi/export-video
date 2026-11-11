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

The request history loads from `GET /requests?type=greeting` on page load and refreshes after every form submission. The query URL is derived from `VITE_API_URL` by replacing `/hello` with `/requests`; set `VITE_REQUESTS_API_URL` only if your routes differ. On wide screens the history table uses about 60% of the workspace; on smaller screens it stacks below the form.

The JSON request body stays `{ "name": "..." }`. Identity and context travel in headers: a random persistent `X-Client-Id`, fresh `X-Request-Id`, `X-Client-Sent-At`, language, and time zone. The client ID is stored in local storage so repeat visits in this browser can be grouped; clearing site data creates a new ID. This is a pseudonymous convenience identifier, not authentication or a reliable device fingerprint. Lambda saves the body and metadata separately in S3, alongside its own request ID and receive time. The browser identity is logged once per tab session in DevTools.

The API must allow the local frontend origin (`http://localhost:5173`) through CORS. See the root `template.yaml` and deploy the SAM changes if the deployed API has not been updated for CORS yet.

The backend also exposes `GET /requests?type=greeting` for reading stored request records by type. Query pages are limited to 100 items; pass the returned `nextToken` query parameter to fetch the next page.

## Production build

```bash
npm run build
```
