# Gamified Pet Care App - Implementation Plan

This plan breaks down the technical specification into stoppable phases, each producing working, testable software. Follow TDD strictly: no production code without a failing test first.

**Reference:** See `gamified-pet-care-app-spec.md` for complete technical details.

---

## Phase 0: Prerequisites & Setup

**Goal:** Initialize project with working hello world, database connection, and build pipeline.

**Files to create:**
- `package.json` - Backend dependencies (Express, TypeScript, PostgreSQL, bcrypt, jsonwebtoken)
- `tsconfig.json` - TypeScript configuration
- `client/package.json` - Frontend dependencies (React, TypeScript, Tailwind)
- `client/tsconfig.json` - Frontend TypeScript config
- `.env.example` - Environment variable template
- `src/server.ts` - Express hello world server
- `src/db/connection.ts` - PostgreSQL connection pool
- `client/src/App.tsx` - React hello world
- `README.md` - Project setup instructions

**Done means:**
- `npm install` succeeds for both backend and frontend
- PostgreSQL database created and connection verified
- Backend starts on port 3001, responds to GET /health with `{ status: "ok" }`
- Frontend starts on port 3000, displays "Pet Care App"
- TypeScript compiles without errors

**Test it:**
1. Run `npm install` in root directory
2. Run `npm install` in client directory
3. Create PostgreSQL database: `createdb petcare_dev`
4. Start backend: `npm run dev` (should see "Server running on port 3001")
5. Test health endpoint: `curl http://localhost:3001/health` (should return `{"status":"ok"}`)
6. Start frontend: `cd client && npm start` (should open browser with "Pet Care App")

---

## Phase 1: User Authentication Foundation

**Goal:** Users can signup and login with email/password, receiving JWT tokens. Database schema created.

**Files to create:**
- `src/db/migrations/001_create_users_table.sql` - Users table schema
- `src/models/User.ts` - User model with CRUD methods
- `src/services/AuthService.ts` - Password hashing (bcrypt), JWT generation/validation
- `src/routes/auth.ts` - POST /auth/signup, POST /auth/login, POST /auth/refresh
- `src/middleware/authenticate.ts` - JWT verification middleware
- `src/__tests__/AuthService.test.ts` - Unit tests for password hashing, token generation
- `src/__tests__/auth.routes.test.ts` - Integration tests for auth endpoints

**Done means:**
- Users table exists with fields: id, email, password_hash, name, timezone, created_at
- POST /auth/signup creates user with hashed password, returns access_token and refresh_token
- POST /auth/login validates credentials, returns tokens
- POST /auth/refresh accepts refresh token, returns new access token
- Invalid credentials return 401
- Duplicate email returns 409
- All auth tests pass

**Test it:**
1. Run migrations: `npm run migrate`
2. Run tests: `npm test -- auth`
3. Signup via curl: `curl -X POST http://localhost:3001/api/auth/signup -H "Content-Type: application/json" -d '{"email":"test@example.com","password":"password123","name":"Test User","timezone":"America/New_York"}'`
4. Verify response contains `access_token` and `refresh_token`
5. Login: `curl -X POST http://localhost:3001/api/auth/login -H "Content-Type: application/json" -d '{"email":"test@example.com","password":"password123"}'`
6. Verify login returns tokens
7. Test invalid password returns 401

---

## Phase 2: Pet Profile Management

**Goal:** Authenticated users can create pet profiles with photo uploads to S3.

**Files to create:**
- `src/db/migrations/002_create_pets_table.sql` - Pets table schema
- `src/models/Pet.ts` - Pet model with CRUD methods
- `src/services/S3Service.ts` - Photo upload, signed URL generation
- `src/routes/pets.ts` - POST /pets, GET /pets/:id, PATCH /pets/:id
- `src/middleware/upload.ts` - Multer middleware for multipart/form-data
- `src/__tests__/S3Service.test.ts` - Unit tests for S3 operations (use local mock or MinIO)
- `src/__tests__/pets.routes.test.ts` - Integration tests for pet endpoints

**Done means:**
- Pets table exists with fields: id, user_id, name, breed, age, weight, photo_url, vet_name, vet_phone, medical_notes, created_at
- POST /pets accepts multipart form data with pet fields and photo file
- Photo uploaded to S3, URL stored in database
- GET /pets/:id returns pet with signed photo URL (1-hour expiry)
- PATCH /pets/:id updates pet fields
- Endpoints require authentication (401 if no token)
- Users can only access their own pets (403 if wrong user)
- All pet tests pass

**Test it:**
1. Run migrations: `npm run migrate`
2. Run tests: `npm test -- pets`
3. Create pet with photo: `curl -X POST http://localhost:3001/api/pets -H "Authorization: Bearer <token>" -F "name=Max" -F "breed=Golden Retriever" -F "age=3" -F "weight=65" -F "photo=@/path/to/dog.jpg"`
4. Verify response contains pet with `photo_url`
5. GET pet: `curl http://localhost:3001/api/pets/<pet_id> -H "Authorization: Bearer <token>"`
6. Verify photo URL is signed and accessible
7. Test without auth token returns 401

---

## Phase 3: Gamified Onboarding System

**Goal:** Five-step onboarding flow with progress tracking, culminating in Level 1 unlock.

**Files to create:**
- `src/db/migrations/003_create_onboarding_progress_table.sql` - OnboardingProgress schema
- `src/db/migrations/004_add_user_progression_fields.sql` - Add current_level, total_points, feature_flags to users
- `src/models/OnboardingProgress.ts` - Onboarding model
- `src/services/ProgressionService.ts` - Level-up logic, point awards, feature unlocks
- `src/routes/onboarding.ts` - GET /onboarding/progress, POST /onboarding/complete-step
- `src/__tests__/ProgressionService.test.ts` - Unit tests for level calculation
- `src/__tests__/onboarding.routes.test.ts` - Integration tests for onboarding flow
- `client/src/pages/Onboarding.tsx` - Onboarding UI with 5 steps
- `client/src/components/ProgressBar.tsx` - Visual progress indicator

**Done means:**
- OnboardingProgress table tracks steps 1-5 per user
- POST /onboarding/complete-step increments step, stores step-specific data
- Step 2 creates pet profile (name, breed, age, photo)
- Step 3 creates first task with reminder time
- Step 4 completes first task, awards 10 points
- Step 5 auto-completes, sets user.current_level = 1
- GET /onboarding/progress returns current step and completion status
- Frontend shows progress bar (0% → 20% → 40% → 60% → 80% → 100%)
- All onboarding tests pass

**Test it:**
1. Run migrations: `npm run migrate`
2. Run tests: `npm test -- onboarding`
3. Signup new user
4. Complete Step 1: `curl -X POST http://localhost:3001/api/onboarding/complete-step -H "Authorization: Bearer <token>" -H "Content-Type: application/json" -d '{"step":1}'`
5. Complete Step 2 with pet data: `curl -X POST http://localhost:3001/api/onboarding/complete-step -H "Authorization: Bearer <token>" -H "Content-Type: application/json" -d '{"step":2,"data":{"pet_name":"Max","breed":"Golden Retriever","age":3}}'`
6. Complete steps 3-5 similarly
7. Verify user.current_level = 1 after step 5
8. Open frontend at /onboarding, verify progress bar updates visually

---

## Phase 4: Task Management System

**Goal:** Users create custom tasks with schedules, complete them, and earn points.

**Files to create:**
- `src/db/migrations/005_create_tasks_table.sql` - Tasks schema
- `src/db/migrations/006_create_task_completions_table.sql` - TaskCompletions schema
- `src/models/Task.ts` - Task model with CRUD methods
- `src/models/TaskCompletion.ts` - TaskCompletion model
- `src/services/TaskService.ts` - Task completion logic, point awards
- `src/routes/tasks.ts` - POST /tasks, GET /tasks, PATCH /tasks/:id, DELETE /tasks/:id, POST /tasks/:id/complete, GET /tasks/history
- `src/__tests__/TaskService.test.ts` - Unit tests for task completion and point calculation
- `src/__tests__/tasks.routes.test.ts` - Integration tests for task endpoints
- `client/src/pages/Dashboard.tsx` - Task list with completion checkboxes
- `client/src/components/TaskItem.tsx` - Individual task component

**Done means:**
- Tasks table exists with fields: id, user_id, pet_id, type, name, frequency, reminder_time, point_value, active
- TaskCompletions table stores: id, task_id, user_id, completed_at, date, points_awarded
- POST /tasks creates task (daily = 10 points, periodic = 25 points)
- GET /tasks?pet_id=xxx&date=YYYY-MM-DD returns tasks for date with completion status
- POST /tasks/:id/complete creates completion record, awards points to user.total_points
- DELETE /tasks/:id soft deletes (sets active = false)
- GET /tasks/history returns completions with date range filter
- All task tests pass

**Test it:**
1. Run migrations: `npm run migrate`
2. Run tests: `npm test -- tasks`
3. Create daily task: `curl -X POST http://localhost:3001/api/tasks -H "Authorization: Bearer <token>" -H "Content-Type: application/json" -d '{"pet_id":"<pet_id>","type":"daily","name":"Feed breakfast","frequency":"daily","reminder_time":"09:00","point_value":10}'`
4. Complete task: `curl -X POST http://localhost:3001/api/tasks/<task_id>/complete -H "Authorization: Bearer <token>"`
5. Verify response shows points_awarded = 10
6. Check user.total_points increased by 10
7. Open frontend dashboard, see task with checkbox, click to complete, verify checkmark animation

---

## Phase 5: Progression Engine & Level System

**Goal:** Users progress through 12 levels based on points, unlocking features at specific levels.

**Files to create:**
- `src/db/migrations/007_create_level_thresholds_table.sql` - Level thresholds with preset data
- `src/models/LevelThreshold.ts` - Level model
- `src/services/ProgressionService.ts` - Extend with level-up checks, feature unlock logic
- `src/routes/progress.ts` - GET /progress, GET /progress/levels
- `src/__tests__/ProgressionService.test.ts` - Unit tests for all 12 levels
- `src/__tests__/progress.routes.test.ts` - Integration tests
- `client/src/pages/Dashboard.tsx` - Add level display and progress bar
- `client/src/components/LevelUpModal.tsx` - Celebration modal on level-up

**Done means:**
- LevelThresholds table seeded with 12 levels (0, 100, 250, 500, 800, 1200, 1700, 2300, 3000, 3800, 4700, 5000 points)
- Each level has title (Novice, Caretaker, Attentive, etc.) and features_unlocked array
- On task completion, check if user.total_points >= next level threshold
- If yes, increment user.current_level, update user.feature_flags
- GET /progress returns: level, points, next_level_points, progress_percentage, unlocked_features
- GET /progress/levels returns all level data
- Frontend shows level badge and progress bar to next level
- Level-up triggers modal animation
- All progression tests pass

**Test it:**
1. Run migrations: `npm run migrate`
2. Run tests: `npm test -- progression`
3. Create user and add points manually (or complete 10 tasks = 100 points)
4. Verify user advances from Level 1 to Level 2 at 100 points
5. Check feature_flags updated for Level 3 (health_log) at 250 points
6. GET /progress: `curl http://localhost:3001/api/progress -H "Authorization: Bearer <token>"`
7. Verify response shows current level and progress percentage
8. Frontend: complete enough tasks to trigger level-up, verify modal appears

---

## Phase 6: Streak Tracking & Health Score

**Goal:** Track daily completion streaks and calculate pet health scores based on 7-day consistency.

**Files to create:**
- `src/db/migrations/008_add_streak_fields_to_users.sql` - Add current_streak, longest_streak to users
- `src/services/StreakService.ts` - Streak calculation on task completion, daily reset logic
- `src/services/HealthScoreService.ts` - Calculate health score from last 7 days
- `src/routes/pets.ts` - Extend with GET /pets/:id/health-score
- `src/__tests__/StreakService.test.ts` - Unit tests for streak logic (same day, missed day, timezone)
- `src/__tests__/HealthScoreService.test.ts` - Unit tests for score calculation
- `src/__tests__/streak.routes.test.ts` - Integration tests
- `client/src/components/StreakBadge.tsx` - Display streak with fire emoji
- `client/src/components/HealthScore.tsx` - Visual health indicator

**Done means:**
- Users have current_streak and longest_streak fields
- On first task completion each day, increment current_streak
- If no tasks completed by midnight, reset current_streak to 0 (cron job or on-demand check)
- Update longest_streak if current exceeds it
- GET /pets/:id/health-score calculates: completed tasks / scheduled tasks over last 7 days
- Returns score percentage and emoji (0-20%: 😟, 21-50%: 😐, 51-80%: 🙂, 81-100%: 😊)
- TaskCompletion records include streak_day field
- All streak tests pass

**Test it:**
1. Run migrations: `npm run migrate`
2. Run tests: `npm test -- streak`
3. Complete task on Day 1, verify current_streak = 1
4. Complete task on Day 2, verify current_streak = 2
5. Skip Day 3, check on Day 4, verify current_streak = 0
6. GET health score: `curl http://localhost:3001/api/pets/<pet_id>/health-score -H "Authorization: Bearer <token>"`
7. Verify score calculation matches 7-day completion rate
8. Frontend: see streak badge update after completing task

---

## Phase 7: Educational Quiz System

**Goal:** Users unlock and complete quizzes to earn points and advance levels.

**Files to create:**
- `src/db/migrations/009_create_quizzes_table.sql` - Quizzes schema
- `src/db/migrations/010_create_quiz_attempts_table.sql` - QuizAttempts schema
- `src/db/seeds/quizzes.sql` - Seed 20 pre-written quizzes
- `src/models/Quiz.ts` - Quiz model
- `src/models/QuizAttempt.ts` - QuizAttempt model
- `src/routes/quizzes.ts` - GET /quizzes/available, GET /quizzes/:id, POST /quizzes/:id/attempt
- `src/__tests__/quizzes.routes.test.ts` - Integration tests for quiz flow
- `client/src/pages/Quizzes.tsx` - Quiz list page
- `client/src/components/QuizCard.tsx` - Individual quiz with multiple choice

**Done means:**
- Quizzes table has 20 entries (categories: nutrition, safety, behavior, health)
- Each quiz: title, question, 4 options, correct_answer_index, explanation, unlock_level
- 2 quizzes per level (unlock_level 1-12)
- GET /quizzes/available returns quizzes for user's level, excluding correctly answered
- GET /quizzes/:id returns quiz without correct_answer_index
- POST /quizzes/:id/attempt validates answer, awards 15 points if correct
- Returns is_correct, explanation, points_awarded
- Incorrect answers can be retried
- All quiz tests pass

**Test it:**
1. Run migrations and seeds: `npm run migrate && npm run seed`
2. Run tests: `npm test -- quizzes`
3. GET available quizzes: `curl http://localhost:3001/api/quizzes/available -H "Authorization: Bearer <token>"`
4. Verify only quizzes for user's level returned
5. Attempt quiz: `curl -X POST http://localhost:3001/api/quizzes/<quiz_id>/attempt -H "Authorization: Bearer <token>" -H "Content-Type: application/json" -d '{"selected_answer_index":2}'`
6. Verify correct answer awards 15 points
7. Frontend: navigate to /quizzes, select quiz, answer, see result with explanation

---

## Phase 8: PWA Setup & Offline Support

**Goal:** App installable as PWA with offline support via service worker and IndexedDB caching.

**Files to create:**
- `client/public/manifest.json` - PWA manifest (name, icons, theme color)
- `client/public/icons/` - App icons (192x192, 512x512)
- `client/src/serviceWorker.ts` - Service worker registration
- `client/src/sw.js` - Service worker (cache app shell, API responses)
- `client/src/db/indexedDB.ts` - IndexedDB wrapper for offline data
- `client/src/utils/backgroundSync.ts` - Queue task completions when offline
- `client/src/__tests__/serviceWorker.test.ts` - Unit tests for SW registration
- `client/src/__tests__/indexedDB.test.ts` - Tests for offline storage

**Done means:**
- manifest.json defines app name, icons, start_url, display: standalone
- Service worker caches core app shell (HTML, CSS, JS)
- Service worker caches GET requests for pets, tasks, progress
- IndexedDB stores: pet profiles, task schedules, last 7 days completions
- When offline, task completions queued in IndexedDB
- When online, background sync processes queue, syncs to backend
- Lighthouse PWA score > 90
- All PWA tests pass

**Test it:**
1. Build frontend: `npm run build`
2. Serve production build: `npx serve -s build`
3. Open Chrome DevTools → Application → Manifest (verify manifest loaded)
4. Application → Service Workers (verify SW registered and active)
5. Test offline: DevTools → Network → Offline
6. Complete task while offline, verify stored in IndexedDB
7. Go online, verify task syncs to backend
8. Run Lighthouse audit, verify PWA score > 90

---

## Phase 9: Push Notification System

**Goal:** Users receive push notifications for task reminders and streak warnings.

**Files to create:**
- `src/services/PushService.ts` - Web Push setup with VAPID keys, send notification logic
- `src/routes/notifications.ts` - POST /notifications/subscribe, DELETE /notifications/unsubscribe
- `src/jobs/taskReminders.ts` - Cron job to send reminders at scheduled times
- `src/jobs/streakWarnings.ts` - Cron job to send warnings at 8 PM if no tasks completed
- `src/__tests__/PushService.test.ts` - Unit tests for notification sending
- `src/__tests__/notifications.routes.test.ts` - Integration tests
- `client/src/utils/notifications.ts` - Request permission, subscribe to push
- `client/src/components/NotificationPrompt.tsx` - Permission request UI

**Done means:**
- VAPID keys generated and stored in .env
- POST /notifications/subscribe stores PushSubscription in user.push_subscription
- Cron job runs hourly, checks tasks with reminder_time in next hour, sends push
- Cron job runs daily at 8 PM user timezone, sends warning if current_streak would break
- Push notifications include title, body, icon, badge
- Frontend requests notification permission after onboarding
- DELETE /notifications/unsubscribe clears subscription
- All notification tests pass

**Test it:**
1. Generate VAPID keys: `npx web-push generate-vapid-keys`
2. Add keys to .env
3. Run tests: `npm test -- notifications`
4. Complete onboarding, allow notification permission
5. Subscribe: `curl -X POST http://localhost:3001/api/notifications/subscribe -H "Authorization: Bearer <token>" -H "Content-Type: application/json" -d '{"subscription":{...}}'`
6. Create task with reminder in 5 minutes
7. Wait for reminder, verify notification appears
8. Skip tasks all day, verify streak warning at 8 PM

---

## Phase 10: Level-Gated Features

**Goal:** Unlock health logs (L3), expense tracker (L6), emergency protocols (L9) based on user level.

**Files to create:**
- `src/db/migrations/011_create_health_logs_table.sql` - HealthLog schema
- `src/db/migrations/012_create_expenses_table.sql` - Expense schema
- `src/models/HealthLog.ts` - HealthLog model
- `src/models/Expense.ts` - Expense model
- `src/middleware/requireLevel.ts` - Middleware to check user.current_level
- `src/routes/healthLogs.ts` - POST /health-logs, GET /health-logs (requires Level 3)
- `src/routes/expenses.ts` - POST /expenses, GET /expenses (requires Level 6)
- `src/routes/emergencyProtocols.ts` - GET /emergency-protocols (requires Level 9)
- `src/data/emergencyProtocols.json` - Static emergency scenarios
- `src/__tests__/levelGating.test.ts` - Tests for 403 when below required level
- `client/src/pages/HealthLog.tsx` - Health log UI (hidden until Level 3)
- `client/src/pages/Expenses.tsx` - Expense tracker UI (hidden until Level 6)
- `client/src/pages/Emergency.tsx` - Emergency protocol cards (hidden until Level 9)

**Done means:**
- HealthLog table: id, pet_id, date, weight, notes, created_at
- Expense table: id, pet_id, date, category, amount, description, created_at
- POST /health-logs requires Level 3, returns 403 if below
- POST /expenses requires Level 6, returns 403 if below
- GET /emergency-protocols requires Level 9, returns protocols array
- Frontend hides locked features entirely (no grayed-out buttons)
- On level-up, newly unlocked features appear immediately
- All level-gating tests pass

**Test it:**
1. Run migrations: `npm run migrate`
2. Run tests: `npm test -- levelGating`
3. Create user at Level 1, attempt POST /health-logs, verify 403
4. Advance user to Level 3 (add 250 points), attempt POST /health-logs, verify 200
5. Add health log: `curl -X POST http://localhost:3001/api/health-logs -H "Authorization: Bearer <token>" -H "Content-Type: application/json" -d '{"pet_id":"<pet_id>","date":"2025-01-15","weight":66,"notes":"Looking healthy"}'`
6. Advance to Level 6, verify expense tracker appears in UI
7. Advance to Level 9, verify emergency protocols button appears

---

## Phase 11: Insurance Conversion Flow

**Goal:** Level 12 users can request insurance quotes, triggering conversion tracking.

**Files to create:**
- `src/db/migrations/013_create_insurance_conversions_table.sql` - InsuranceConversion schema
- `src/models/InsuranceConversion.ts` - InsuranceConversion model
- `src/routes/insurance.ts` - POST /insurance/convert (requires Level 12)
- `src/services/AnalyticsService.ts` - Track conversion events
- `src/__tests__/insurance.routes.test.ts` - Integration tests
- `client/src/pages/Insurance.tsx` - Insurance conversion page (Level 12 only)
- `client/src/components/InsuranceCTA.tsx` - Call-to-action component

**Done means:**
- InsuranceConversion table: id, user_id, pet_id, consent_given, converted_at
- POST /insurance/convert requires Level 12, returns 403 if below
- Accepts pet_id and consent boolean
- Creates conversion record with timestamp
- Returns success: true and optional quote_url
- Analytics event logged: 'insurance_conversion' with user_id, pet_id, timestamp
- Frontend shows "Get Insurance Quote" button only at Level 12
- Button navigates to /insurance with pre-filled pet details
- All insurance tests pass

**Test it:**
1. Run migrations: `npm run migrate`
2. Run tests: `npm test -- insurance`
3. Create user at Level 11, verify no insurance CTA visible
4. Advance to Level 12 (5000 points), verify CTA appears
5. Click CTA, verify /insurance page loads
6. Submit conversion: `curl -X POST http://localhost:3001/api/insurance/convert -H "Authorization: Bearer <token>" -H "Content-Type: application/json" -d '{"pet_id":"<pet_id>","consent":true}'`
7. Verify conversion record created
8. Check analytics logs for 'insurance_conversion' event

---

## Phase 12: Analytics & Metrics Dashboard

**Goal:** Track engagement metrics (DAU, retention, onboarding completion, level distribution).

**Files to create:**
- `src/db/migrations/014_create_analytics_events_table.sql` - Events schema
- `src/models/AnalyticsEvent.ts` - Event model
- `src/routes/analytics.ts` - POST /analytics/event
- `src/services/AnalyticsService.ts` - Event tracking logic
- `src/scripts/calculateMetrics.ts` - Script to compute DAU, retention, cohorts
- `src/__tests__/AnalyticsService.test.ts` - Unit tests
- Internal dashboard (optional): View key metrics

**Done means:**
- AnalyticsEvents table: id, user_id, event_type, metadata, created_at
- POST /analytics/event logs events (types: page_view, task_completed, level_up, quiz_attempt, insurance_conversion)
- Frontend calls analytics endpoint on key actions
- Script calculateMetrics.ts computes:
  - DAU: unique users who opened app per day
  - D7/D30 retention: % users returning after 7/30 days
  - Onboarding completion: % users who reach Step 5
  - Level distribution: count of users at each level
- All analytics tests pass

**Test it:**
1. Run migrations: `npm run migrate`
2. Run tests: `npm test -- analytics`
3. Log event: `curl -X POST http://localhost:3001/api/analytics/event -H "Authorization: Bearer <token>" -H "Content-Type: application/json" -d '{"event_type":"page_view","metadata":{"page":"/dashboard"}}'`
4. Verify event stored in database
5. Run metrics script: `npm run calculate-metrics`
6. Verify output shows DAU, retention rates, onboarding completion rate
7. Confirm metrics match expected values for test data

---

## Phase 13: UI/UX Polish & Responsiveness

**Goal:** Polished, mobile-responsive UI with animations and improved UX.

**Files to modify:**
- `client/src/pages/*.tsx` - Add animations, loading states, error handling
- `client/src/components/*.tsx` - Refine styles, mobile breakpoints
- `client/src/styles/` - Tailwind custom theme, animations
- `client/src/utils/errorHandling.ts` - Centralized error display

**Done means:**
- All pages responsive on mobile (320px), tablet (768px), desktop (1024px+)
- Task completion shows checkmark animation
- Level-up shows celebration animation (confetti or equivalent)
- Loading spinners on async actions (login, photo upload, task completion)
- Error messages displayed in toast notifications
- Consistent color scheme and typography
- Accessibility: keyboard navigation, ARIA labels, screen reader support
- Lighthouse Performance score > 80, Accessibility score > 90

**Test it:**
1. Open app in Chrome DevTools responsive mode
2. Test all pages at 320px, 768px, 1024px widths
3. Complete task, verify checkmark animation smooth
4. Reach level-up, verify celebration animation plays
5. Test slow network (Slow 3G), verify loading indicators
6. Test keyboard navigation (Tab, Enter, Escape)
7. Run Lighthouse audit, verify Performance > 80, Accessibility > 90

---

## Phase 14: Security Hardening & Rate Limiting

**Goal:** Production-ready security with rate limiting, input validation, CORS configuration.

**Files to create/modify:**
- `src/middleware/rateLimiter.ts` - Rate limiting middleware (express-rate-limit)
- `src/middleware/validateInput.ts` - Input validation middleware (joi or zod)
- `src/middleware/cors.ts` - CORS configuration
- `src/middleware/helmet.ts` - Security headers (helmet)
- `src/config/security.ts` - Security configuration
- `src/__tests__/security.test.ts` - Tests for rate limiting, CSP, CORS

**Done means:**
- Rate limits applied: auth (5/15min), uploads (10/hour), tasks (100/hour)
- All user inputs validated (email format, password length, file MIME types)
- CORS restricted to production domain
- Helmet middleware adds: CSP, HSTS, X-Frame-Options, etc.
- SQL injection prevented via parameterized queries (verify all queries)
- XSS prevented via React escaping + CSP
- All security tests pass

**Test it:**
1. Run tests: `npm test -- security`
2. Test rate limiting: Make 6 signup requests in 1 minute, verify 6th returns 429
3. Test invalid input: POST signup with invalid email, verify 400 with validation error
4. Test CORS: Make request from unauthorized origin, verify blocked
5. Check headers: `curl -I http://localhost:3001/api/health` (verify CSP, HSTS headers)
6. Test SQL injection: Attempt `' OR '1'='1` in login, verify blocked
7. Run security audit: `npm audit` (verify no vulnerabilities)

---

## Phase 15: Deployment Preparation

**Goal:** Production-ready deployment with environment configs, migrations, and monitoring.

**Files to create:**
- `docker-compose.yml` - Docker setup (backend, frontend, PostgreSQL, Redis)
- `Dockerfile` - Backend container
- `client/Dockerfile` - Frontend container
- `.github/workflows/ci.yml` - GitHub Actions for CI (tests, linting)
- `scripts/migrate-production.sh` - Production migration script
- `scripts/backup-database.sh` - Database backup script
- `.env.production.example` - Production environment template

**Done means:**
- Docker Compose starts full stack (backend, frontend, DB, Redis)
- CI pipeline runs on every push: lint, typecheck, tests
- Production environment variables documented
- Migration script runs safely against production DB
- Backup script creates PostgreSQL dumps
- All tests pass in CI
- Docker images build without errors

**Test it:**
1. Build Docker images: `docker-compose build`
2. Start stack: `docker-compose up -d`
3. Verify backend accessible: `curl http://localhost:3001/health`
4. Verify frontend accessible: `curl http://localhost:3000`
5. Run migrations in Docker: `docker-compose exec backend npm run migrate`
6. Push to GitHub, verify CI runs and passes
7. Test backup script: `./scripts/backup-database.sh` (verify dump file created)

---

## Implementation Notes

### Test-Driven Development (TDD)
- **Write failing test first** - Every feature starts with a test that fails
- **Verify it fails** - Run test, confirm failure (not error)
- **Write minimal code** - Just enough to pass the test
- **Verify it passes** - Run test, confirm success
- **Refactor** - Clean up code while keeping tests green
- **Never skip verification** - No completion claims without fresh test output

### Verification Discipline
- Before claiming a phase is complete, run all tests and verify output
- Before committing, verify linter passes, build succeeds, tests pass
- No "should work" or "probably works" - only verified facts

### Git Workflow
- Commit after each passing test
- Commit messages: "Add failing test for X", "Implement X to pass test", "Refactor X"
- Never commit failing tests or broken builds
- Push to branch: `claude/repo-review-011CUzkZjmZWd955ytQxk93G`

### When Stuck
- Re-read the spec for clarification
- Check test output for specific error messages
- Break the problem into smaller steps
- Write a simpler test that passes first

---

## Success Criteria

The implementation is complete when:
- All 15 phases are done (each verified independently)
- All tests pass (run `npm test` - 0 failures)
- Linter passes (run `npm run lint` - 0 errors)
- Build succeeds (run `npm run build` - exit 0)
- Manual QA passes for each phase's "Test it" section
- Lighthouse scores: PWA > 90, Performance > 80, Accessibility > 90
- App deployed and accessible in production

---

**End of Implementation Plan**

*This plan is designed for autonomous execution by an AI coding agent. Each phase is self-contained and stoppable. Follow TDD strictly. Verify before claiming completion.*
