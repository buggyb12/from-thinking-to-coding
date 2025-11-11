# Manual Testing Procedures

This document provides step-by-step manual QA procedures for each feature in the Pet Care App.

---

## Phase 0: Project Setup

### Backend Setup Test

**Objective:** Verify backend server starts and responds to health checks.

**Prerequisites:**
- PostgreSQL installed and running
- Database `petcare_dev` created
- `.env` file configured with correct DATABASE_URL

**Steps:**
1. Start PostgreSQL:
   ```bash
   # On Linux/WSL
   sudo service postgresql start

   # On macOS
   brew services start postgresql

   # Verify running
   pg_isready
   ```

2. Create database (first time only):
   ```bash
   createdb petcare_dev

   # Verify database exists
   psql -l | grep petcare_dev
   ```

3. Start backend server:
   ```bash
   cd /home/user/pet-care-app
   npm run dev
   ```

4. Verify console output shows:
   ```
   [HH:MM:SS] [SERVER] Server running on port 3001
   [HH:MM:SS] [DB] New client connected to database
   ```

5. Test health endpoint:
   ```bash
   curl http://localhost:3001/health
   ```

6. **Expected result:**
   ```json
   {"status":"ok"}
   ```

7. Test root endpoint:
   ```bash
   curl http://localhost:3001/
   ```

8. **Expected result:**
   ```json
   {
     "message":"Pet Care App API",
     "version":"1.0.0",
     "endpoints":{"health":"/health"}
   }
   ```

**Pass criteria:**
- ✅ Server starts without errors
- ✅ Database connection logs appear
- ✅ Health endpoint returns `{"status":"ok"}`
- ✅ Root endpoint returns API info

---

### Frontend Setup Test

**Objective:** Verify frontend builds and connects to backend.

**Prerequisites:**
- Backend server running on port 3001
- Frontend dependencies installed

**Steps:**
1. Start frontend development server:
   ```bash
   cd /home/user/pet-care-app/client
   npm run dev
   ```

2. Verify console output shows:
   ```
   VITE v5.x.x  ready in xxx ms

   ➜  Local:   http://localhost:3000/
   ```

3. Open browser to http://localhost:3000

4. **Expected visual result:**
   - Page loads with gradient purple background
   - White card in center with paw emoji 🐾
   - "Pet Care App" heading
   - "Gamified Pet Care Management" subtitle
   - Backend Status section showing "✅ Connected"
   - Checklist showing Phase 0 complete

5. Open browser DevTools → Console

6. **Expected:** No console errors

7. Open DevTools → Network tab

8. Refresh page

9. **Expected:** Request to `/api/health` returns 200 with `{"status":"ok"}`

**Pass criteria:**
- ✅ Frontend starts without errors
- ✅ Page displays correctly
- ✅ Backend status shows "✅ Connected"
- ✅ No console errors
- ✅ /api/health request succeeds

---

### TypeScript Compilation Test

**Objective:** Verify both backend and frontend compile without TypeScript errors.

**Steps:**
1. Compile backend:
   ```bash
   cd /home/user/pet-care-app
   npm run build
   ```

2. **Expected:**
   - No TypeScript errors
   - `dist/` directory created with compiled JavaScript
   - Exit code 0

3. Compile frontend:
   ```bash
   cd /home/user/pet-care-app/client
   npm run build
   ```

4. **Expected:**
   - No TypeScript errors
   - `dist/` directory created with optimized bundle
   - PWA manifest and service worker generated
   - Build completes successfully
   - Exit code 0

**Pass criteria:**
- ✅ Backend compiles (exit 0)
- ✅ Frontend compiles (exit 0)
- ✅ No TypeScript errors in either

---

### PWA Configuration Test

**Objective:** Verify PWA manifest and service worker are configured.

**Prerequisites:**
- Frontend built for production

**Steps:**
1. Build frontend:
   ```bash
   cd /home/user/pet-care-app/client
   npm run build
   ```

2. Serve production build:
   ```bash
   npm run preview
   ```

3. Open browser to the preview URL (usually http://localhost:4173)

4. Open DevTools → Application tab

5. Click "Manifest" in left sidebar

6. **Expected:**
   - Manifest loads successfully
   - Name: "Pet Care App"
   - Short name: "PetCare"
   - Theme color: #4F46E5
   - Icons present (192x192, 512x512)

7. Click "Service Workers" in left sidebar

8. **Expected:**
   - Service worker registered
   - Status: "activated and running"

9. Click "Storage" → "Cache Storage"

10. **Expected:**
    - PWA cache entries present
    - App shell files cached

**Pass criteria:**
- ✅ Manifest loads with correct configuration
- ✅ Service worker registers and activates
- ✅ Cache storage contains app shell

---

## Troubleshooting

### Backend won't start

**Symptom:** Server fails to start or crashes immediately

**Common causes:**
1. Port 3001 already in use
   ```bash
   lsof -ti:3001 | xargs kill -9
   ```

2. PostgreSQL not running
   ```bash
   pg_isready
   # If not ready: sudo service postgresql start
   ```

3. Database doesn't exist
   ```bash
   createdb petcare_dev
   ```

4. Invalid DATABASE_URL in .env
   - Check username, password, host, port, database name
   - Format: `postgresql://username:password@localhost:5432/petcare_dev`

---

### Frontend won't start

**Symptom:** Vite fails to start or crashes

**Common causes:**
1. Port 3000 already in use (Vite will auto-suggest port 3001)

2. Node modules not installed
   ```bash
   cd client
   rm -rf node_modules package-lock.json
   npm install
   ```

3. Build cache corruption
   ```bash
   rm -rf node_modules/.cache
   ```

---

### Backend connection fails in frontend

**Symptom:** Frontend shows "❌ Not connected"

**Common causes:**
1. Backend not running
   - Start backend: `npm run dev` in root directory

2. CORS misconfiguration
   - Check backend has `app.use(cors())` in server.ts

3. Proxy not working
   - Verify `client/vite.config.ts` has proxy to `http://localhost:3001`

4. Firewall blocking localhost connections
   - Check firewall settings
   - Try http://127.0.0.1:3000 instead

---

## Next Phase

Phase 1 will add:
- User signup/login forms
- JWT token handling
- Database migrations for users table
- Auth middleware tests

Testing procedures will be added as features are implemented.
