# Pet Care App

Gamified Pet Care Management - A Progressive Web App

## Current Status

**Phase 0 Complete** - Project setup and hello world working!

**What works right now:**
- Backend Express server with health check endpoint
- PostgreSQL database connection setup
- Frontend React app with Tailwind CSS
- PWA configuration with Vite
- TypeScript compilation for both backend and frontend

**Try it:**
1. Follow setup instructions below
2. Start backend: `npm run dev` (runs on :3001)
3. Start frontend: `cd client && npm run dev` (runs on :3000)
4. Visit http://localhost:3000 - see "Pet Care App" with backend connection status!

**Next:** Phase 1 - User Authentication Foundation

---

## Tech Stack

### Backend
- Node.js + Express
- TypeScript
- PostgreSQL
- JWT Authentication
- bcrypt for password hashing

### Frontend
- React 18
- TypeScript
- Tailwind CSS
- Vite
- PWA support

---

## Prerequisites

Before starting, ensure you have:
- Node.js 18+ installed
- PostgreSQL 14+ installed and running
- npm or yarn package manager

---

## Setup Instructions

### 1. Clone and Install Dependencies

```bash
# Install backend dependencies
npm install

# Install frontend dependencies
cd client
npm install
cd ..
```

### 2. Database Setup

```bash
# Create PostgreSQL database
createdb petcare_dev

# Verify connection (optional)
psql petcare_dev
# You should see the PostgreSQL prompt
# Type \q to exit
```

### 3. Environment Configuration

```bash
# Copy environment template
cp .env.example .env

# Edit .env with your configuration
# At minimum, update:
# - DATABASE_URL with your PostgreSQL credentials
# - JWT_SECRET with a secure random string
```

Example `.env`:
```
PORT=3001
NODE_ENV=development
DATABASE_URL=postgresql://your_username:your_password@localhost:5432/petcare_dev
JWT_SECRET=your-super-secret-jwt-key-change-this
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d
FRONTEND_URL=http://localhost:3000
```

### 4. Start the Application

**Terminal 1 - Backend:**
```bash
npm run dev
```
You should see:
```
[HH:MM:SS] [SERVER] Server running on port 3001
```

**Terminal 2 - Frontend:**
```bash
cd client
npm run dev
```
You should see:
```
  VITE v5.x.x  ready in xxx ms

  ➜  Local:   http://localhost:3000/
```

### 5. Verify Everything Works

1. **Backend health check:**
   ```bash
   curl http://localhost:3001/health
   ```
   Expected output: `{"status":"ok"}`

2. **Frontend:**
   - Open http://localhost:3000 in your browser
   - You should see "Pet Care App" with "✅ Connected" backend status

---

## Available Scripts

### Backend

```bash
npm run dev          # Start development server with hot reload
npm run build        # Compile TypeScript to JavaScript
npm start            # Run compiled JavaScript (production)
npm test             # Run tests with Jest
npm run lint         # Run ESLint
```

### Frontend

```bash
npm run dev          # Start Vite development server
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Run ESLint
```

---

## Project Structure

```
pet-care-app/
├── src/                      # Backend source code
│   ├── server.ts            # Express server entry point
│   ├── db/
│   │   └── connection.ts    # PostgreSQL connection pool
│   ├── models/              # Database models (Phase 1+)
│   ├── routes/              # API routes (Phase 1+)
│   ├── services/            # Business logic (Phase 1+)
│   ├── middleware/          # Express middleware (Phase 1+)
│   └── __tests__/           # Backend tests
│
├── client/                   # Frontend source code
│   ├── src/
│   │   ├── main.tsx         # React entry point
│   │   ├── App.tsx          # Main app component
│   │   ├── pages/           # Page components (Phase 1+)
│   │   ├── components/      # Reusable components (Phase 1+)
│   │   └── index.css        # Global styles
│   ├── public/              # Static assets
│   └── index.html           # HTML template
│
├── dist/                     # Compiled backend code (gitignored)
├── .env                      # Environment variables (gitignored)
├── .env.example              # Environment template
├── package.json              # Backend dependencies
├── tsconfig.json             # Backend TypeScript config
├── jest.config.js            # Jest test config
└── README.md                 # This file
```

---

## Development Guidelines

See `AGENTS.md` (in planning repo) for comprehensive development guidelines including:
- Test-Driven Development (TDD) workflow
- Verification discipline
- Phase wrap-up protocol
- Code review process
- Security best practices

---

## Troubleshooting

### Backend won't start

**Problem:** Port 3001 already in use
```bash
# Find process using port 3001
lsof -ti:3001

# Kill the process
kill -9 <PID>
```

**Problem:** Database connection failed
- Verify PostgreSQL is running: `pg_isready`
- Check DATABASE_URL in .env matches your setup
- Ensure database exists: `psql -l | grep petcare_dev`

### Frontend won't start

**Problem:** Port 3000 already in use
- Vite will automatically suggest port 3001
- Or kill process: `lsof -ti:3000 | xargs kill -9`

**Problem:** Backend connection fails
- Ensure backend is running on port 3001
- Check Vite proxy configuration in `client/vite.config.ts`
- Verify CORS is enabled in backend

### TypeScript compilation errors

```bash
# Backend
npm run build

# Frontend
cd client && npm run build
```

If errors persist, check:
- `tsconfig.json` configuration
- Missing type definitions (`@types/*` packages)
- Node modules are installed

---

## Next Steps

Phase 1 will implement:
- User signup and login with JWT
- Password hashing with bcrypt
- Database migrations for users table
- Protected API endpoints
- Auth middleware

See `gamified-pet-care-app-plan.md` in planning repo for complete implementation roadmap.

---

## Documentation

- **Specification:** `gamified-pet-care-app-spec.md` - Complete technical spec
- **Implementation Plan:** `gamified-pet-care-app-plan.md` - 15-phase roadmap
- **Development Guidelines:** `gamified-pet-care-app-AGENTS.md` - How to work on this project

All planning documents are in the parent repository: `/home/user/from-thinking-to-coding/`

---

## License

MIT
