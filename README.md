This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

---

**Supabase integration (users & permissions)**

Quick setup to try the users dashboard locally:

1. Create a Supabase project at https://app.supabase.com and get the project URL, anon key, and service role key.
2. Run the SQL in `supabase/schema.sql` in the Supabase SQL editor to create the `users` and `user_types` tables.
3. Add environment variables to your `.env.local` in the project root:

```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

4. Install dependencies and run dev server:

```powershell
npm install
npm run dev
```

5. Open `http://localhost:3000` and use the Users UI to list/create/delete users.

Notes:
- The API routes under `src/app/api/users/route.ts` use the Supabase service role key, so keep `.env.local` out of version control.
- This is a starting point: next steps include adding authentication, RBAC checks, audit logs, and central admin screens for alert rules and centers.

Auth API Endpoints

I added server endpoints to register/login and inspect the current user using Supabase Auth. They are:

- `POST /api/auth/register`  - body: `{ email, password, full_name }`. Creates a Supabase Auth user, a `users` row and assigns default `admin` user type. Returns `{ user, token, refresh_token }` on success.
- `POST /api/auth/login`     - body: `{ email, password }`. Signs in using Supabase and returns `{ user, token, refresh_token }`.
- `GET /api/auth/me`         - header: `Authorization: Bearer <access_token>`. Returns `{ user, auth }`.

Usage example (login):

```powershell
curl -X POST http://localhost:3000/api/auth/login -H "Content-Type: application/json" -d '{"email":"you@example.com","password":"secret"}'
```

Notes:
- These endpoints use the Supabase **service role** key on the server. Keep `SUPABASE_SERVICE_ROLE_KEY` secret and out of VCS.
- The returned `token` is the Supabase JWT (access token). Use it in `Authorization: Bearer <token>` for authenticated requests.
- Next steps: protect the UI, add refresh token handling, and implement role-based guards on server routes.
