# Words

Public vocabulary memorization web app built with Next.js TSX and Neon Postgres.

## Setup

1. Put your Neon connection string in `.env`:

```bash
DATABASE_URL="postgresql://..."
NEXT_PUBLIC_VAPID_PUBLIC_KEY="..."
VAPID_PRIVATE_KEY="..."
VAPID_SUBJECT="mailto:you@example.com"
```

2. Run the SQL from `schema.sql` in Neon SQL Editor.

3. Install and run:

```bash
npm install
npm run dev
```

## Web Push keys

Generate VAPID keys once:

```bash
npx web-push generate-vapid-keys
```

Paste the public key into `NEXT_PUBLIC_VAPID_PUBLIC_KEY` and the private key into `VAPID_PRIVATE_KEY`.
