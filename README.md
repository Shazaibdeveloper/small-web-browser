# The Small Web

A tiny browser over a tiny web. Next.js frontend, NestJS backend, MongoDB.

## Run

```bash
# 1. Database
docker compose up -d

# 2. Backend
cd backend
npm install
npm run seed
npm run start:dev

# 3. Frontend (new terminal)
cd frontend
npm install
echo "NEXT_PUBLIC_API_URL=http://localhost:4000/api" > .env.local
npm run dev
```

Open http://localhost:3000. Pick a person from the top-right dropdown, then type `tidepool.zz` in the address bar.