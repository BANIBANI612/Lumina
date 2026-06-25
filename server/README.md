Server proxy for Supabase

1. Copy `.env.example` to `.env`.
2. Fill in the following values in `server/.env`:
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY` (service role key from Supabase Project Settings → API)
   - `ADMIN_USER=admin`
   - `ADMIN_PASS=Lumina612@2007`
   - `ADMIN_JWT_SECRET` (a long random secret for JWT signing)
3. Install dependencies and start the server:

```bash
cd server
npm install
npm run start
```

4. Use the frontend app to register and log in with username/password. The frontend calls `/api/login`, `/api/register`, and `/api/subscribe` through the proxy backend.

5. Admin access is available via `/api/admin/login` using the configured `ADMIN_USER` and `ADMIN_PASS`.

## Free deployment with Render

1. Push the repository to GitHub.
2. Create a new Web Service on Render: https://dashboard.render.com/new/web-service.
3. Link the GitHub repository and choose the `server` folder as the root.
4. Set the build command to:

```bash
npm install
```

5. Set the start command to:

```bash
npm run start
```

6. In Render Environment > Environment Variables, add:
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `ADMIN_USER=admin`
   - `ADMIN_PASS=Lumina612@2007`
   - `ADMIN_JWT_SECRET` (a long random secret)

7. Deploy the service. Your app will be available at the Render-generated URL.

## How it works

- The Express server serves the static frontend from `lumina_pro/code.html`.
- The service worker and manifest are served from the project root.
- API routes are available under `/api/*`.

Important notes:

- `SUPABASE_SERVICE_ROLE_KEY` must be the Supabase service role key, not a publishable client key.
- Do not commit `server/.env` to version control. The repository already ignores it using `.gitignore`.



