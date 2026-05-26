# souq-front

Frontend for the Salla multi-vendor marketplace. Next.js 15 (App Router), TypeScript, talks to the [souq](https://github.com/medcharaf111/souq) backend over HTTP.

## What it does

- Admin home (`/`) — lists installed stores with product counts and a Sync button per store
- Customer storefront (`/store/[storeId]`) — product grid with search, pagination, and deep-link to the merchant's Salla product URL for checkout
- Install entry — the "Install" button is a server-side link to the backend's `/install` endpoint, which begins the OAuth flow

## Setup

```bash
cp .env.example .env.local
# set NEXT_PUBLIC_API_URL to the souq backend's URL (default http://localhost:3000)

npm install
npm run dev   # listens on :3001 to avoid clashing with the backend on :3000
```

## Routes

| Path | Purpose |
|---|---|
| `/` | Admin home — installed stores, sync buttons |
| `/store/[storeId]` | Customer storefront — product grid, search, pagination |

## How it talks to the backend

All API calls go through `src/lib/api.ts`. There's a thin typed wrapper around `fetch` against `NEXT_PUBLIC_API_URL`. No browser-side OAuth — the install button is a navigation to the backend, which handles the redirect dance and bounces the user back here via `FRONTEND_URL`.

## Production notes

- CORS is set on the backend to allow this frontend's origin. Update `FRONTEND_URL` on the backend if you change where the frontend is deployed.
- The customer storefront is a server component, so product data is fetched server-side. No customer-side API keys leak.
- Authentication for customers (cart, wishlist, orders) is not implemented yet. v1 redirects checkout to the merchant's Salla product URL via the `url` field.

## Companion backend

The backend lives in [souq](https://github.com/medcharaf111/souq). Both repos work together — frontend on `:3001`, backend on `:3000` for local dev.
