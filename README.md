# NearWe CMS

This is the standalone Vite application for the NearWe CMS. It is located beside
the main website project in `D:\NEW CMS NEARWE\CMS`.

## Run locally

```powershell
npm install
npm run dev
```

In development, CMS API calls use the existing local API URL unless
`VITE_API_BASE_URL` is set.

## Configure the API

Set `VITE_API_BASE_URL` to the backend base URL for production builds. You can
copy `.env.example` to `.env.local` and set the value there. Do not commit
`.env.local`.

```powershell
npm run build
npm run preview
```

# cms-only-nearwe
