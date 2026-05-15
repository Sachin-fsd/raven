# Raven WhatsApp-style Chat

Full-stack chat app with:
- **Frontend**: Next.js (deploy to Vercel)
- **Backend**: Node.js + Express + Socket.IO (deploy to Render/DigitalOcean)
- **Database**: MongoDB

## Features
- Register/login with name, email, password
- Unique name and unique email enforcement
- JWT auth with 7-day expiry
- Search users
- Recent chats list (left panel)
- Real-time chat (right panel)
- Message status: pending, sent, delivered, read
- MongoDB-backed chat history per selected user
- WhatsApp-like two-panel UI and message bubble alignment
- Socket loading overlay until connection is ready

## Project Structure
- `frontend/` Next.js app
- `backend/` Express + Socket.IO API

## Local Run
### Backend
```bash
cd backend
cp .env.example .env
npm install
npm run dev
```

### Frontend
```bash
cd frontend
cp .env.example .env.local
npm install
npm run dev
```

## Deployment
- Frontend (Vercel): set env vars `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_SOCKET_URL`
- Backend (Render/DigitalOcean): set env vars `MONGODB_URI`, `JWT_SECRET`, `CLIENT_URL`

