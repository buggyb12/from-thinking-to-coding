# Gamified Pet Care App - Technical Specification

## Product Overview

A Progressive Web App (PWA) that gamifies real pet care tasks to drive engagement and qualify users for insurance offers. Users manage their actual pet (not virtual), completing real-world care activities that are tracked, rewarded, and turned into a 12-level progression system.

**Core Goal:** Create engaged, responsible pet owners through gamified task completion, culminating in insurance conversion.

**Target Metrics:**
- D7 retention: 40%+
- D30 retention: 25%+
- Onboarding completion: 70%+
- Insurance conversion at Level 12: 15%+

---

## Technical Architecture

### Stack
- **Frontend:** React 18 + TypeScript + Tailwind CSS
- **Backend:** Node.js 18+ + Express
- **Database:** PostgreSQL 14+
- **Cache:** Redis 7+
- **Storage:** S3-compatible object storage
- **Auth:** JWT with refresh tokens
- **Push:** Web Push API via service workers

### Architecture Diagram

```
┌─────────────────────────────────────────────────────────┐
│                     PWA Client                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │
│  │ React UI     │  │ Service      │  │ Local        │ │
│  │ Components   │◄─┤ Worker       │◄─┤ Storage      │ │
│  │              │  │ (offline,    │  │ (IndexedDB)  │ │
│  │              │  │  push, sync) │  │              │ │
│  └──────┬───────┘  └──────────────┘  └──────────────┘ │
└─────────┼──────────────────────────────────────────────┘
          │ HTTPS
          ▼
┌─────────────────────────────────────────────────────────┐
│                   Backend Services                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │
│  │ API Gateway  │  │ Push Notif   │  │ Task         │ │
│  │ (Express)    │──┤ Service      │  │ Scheduler    │ │
│  └──────┬───────┘  └──────────────┘  └──────────────┘ │
│         │                                               │
│  ┌──────┴───────┬──────────────┬──────────────┐       │
│  │              │              │              │       │
│  ▼              ▼              ▼              ▼       │
│ ┌──────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  │
│ │Auth  │  │User/Pet  │  │Progress  │  │Analytics │  │
│ │Svc   │  │Service   │  │Engine    │  │Service   │  │
│ └──────┘  └──────────┘  └──────────┘  └──────────┘  │
└─────────────┬───────────────┬──────────────┬──────────┘
              │               │              │
       ┌──────▼──────┐ ┌─────▼─────┐ ┌─────▼─────┐
       │ PostgreSQL  │ │   Redis   │ │ S3 Object │
       │  Database   │ │   Cache   │ │  Storage  │
       └─────────────┘ └───────────┘ └───────────┘
```

---

## Data Models

### User
```typescript
{
  id: uuid (primary key)
  email: string (unique, indexed)
  password_hash: string
  name: string
  timezone: string (IANA format, e.g., "America/New_York")
  created_at: timestamp
  last_login: timestamp
  onboarding_completed: boolean
  current_level: integer (1-12)
  total_points: integer
  current_streak: integer (days)
  longest_streak: integer
  push_subscription: jsonb (Web Push subscription object)
  feature_flags: jsonb (unlocked features by level)
}
```

### Pet
```typescript
{
  id: uuid (primary key)
  user_id: uuid (foreign key, indexed)
  name: string
  breed: string
  age: integer (years)
  weight: decimal (lbs or kg)
  photo_url: string (S3 signed URL)
  vet_name: string (optional)
  vet_phone: string (optional)
  medical_notes: text (optional)
  created_at: timestamp
}
```

### Task
```typescript
{
  id: uuid (primary key)
  user_id: uuid (foreign key, indexed)
  pet_id: uuid (foreign key)
  type: enum ('daily', 'periodic')
  name: string (e.g., "Feed breakfast", "Walk", "Groom")
  description: text (optional)
  frequency: enum ('daily', 'weekly', 'monthly', 'custom')
  custom_interval_days: integer (null for non-custom)
  reminder_time: time (HH:MM, user timezone)
  point_value: integer (10 for daily, 25 for periodic)
  active: boolean
  created_at: timestamp
}
```

### TaskCompletion
```typescript
{
  id: uuid (primary key)
  task_id: uuid (foreign key, indexed)
  user_id: uuid (foreign key, indexed)
  completed_at: timestamp (indexed)
  date: date (YYYY-MM-DD, indexed for daily rollup)
  points_awarded: integer
  streak_day: integer (what day of streak this was)
}
```

### Quiz
```typescript
{
  id: uuid (primary key)
  title: string
  question: text
  options: jsonb (array of 4 strings)
  correct_answer_index: integer (0-3)
  explanation: text (shown after answer)
  unlock_level: integer (2 quizzes per level)
  category: enum ('nutrition', 'safety', 'behavior', 'health')
  point_value: integer (default 15)
}
```

### QuizAttempt
```typescript
{
  id: uuid (primary key)
  user_id: uuid (foreign key, indexed)
  quiz_id: uuid (foreign key)
  selected_answer_index: integer
  is_correct: boolean
  points_awarded: integer (0 if incorrect)
  attempted_at: timestamp
}
```

### LevelThreshold
```typescript
{
  level: integer (primary key, 1-12)
  points_required: integer
  title: string (e.g., "Novice", "Guardian", "Master Guardian")
  features_unlocked: jsonb (array of feature names)
}

// Preset values:
Level 1: 0 points, "Novice", []
Level 2: 100, "Caretaker", []
Level 3: 250, "Attentive", ["health_log"]
Level 4: 500, "Devoted", []
Level 5: 800, "Companion", []
Level 6: 1200, "Protector", ["expense_tracker"]
Level 7: 1700, "Dedicated", []
Level 8: 2300, "Expert", []
Level 9: 3000, "Champion", ["emergency_protocols"]
Level 10: 3800, "Elite", []
Level 11: 4700, "Legendary", []
Level 12: 5000, "Master Guardian", ["insurance_quote", "social_sharing"]
```

### OnboardingProgress
```typescript
{
  user_id: uuid (primary key, foreign key)
  step: integer (1-5)
  step_1_completed: boolean (Welcome)
  step_2_completed: boolean (Pet photo + basic info)
  step_3_completed: boolean (Set first reminder)
  step_4_completed: boolean (Complete first check-in)
  step_5_completed: boolean (Unlock dashboard)
  completed_at: timestamp (null until all steps done)
}
```

### HealthLog (Unlocked Level 3)
```typescript
{
  id: uuid (primary key)
  pet_id: uuid (foreign key, indexed)
  date: date
  weight: decimal
  notes: text
  created_at: timestamp
}
```

### Expense (Unlocked Level 6)
```typescript
{
  id: uuid (primary key)
  pet_id: uuid (foreign key, indexed)
  date: date
  category: enum ('vet', 'food', 'grooming', 'medication', 'other')
  amount: decimal
  description: text
  created_at: timestamp
}
```

### InsuranceConversion
```typescript
{
  id: uuid (primary key)
  user_id: uuid (foreign key, indexed)
  pet_id: uuid (foreign key)
  consent_given: boolean
  converted_at: timestamp
}
```

---

## API Endpoints

### Authentication

**POST /api/auth/signup**
- Body: `{ email, password, name, timezone }`
- Returns: `{ user, access_token, refresh_token }`
- Creates user, onboarding_progress record
- Password must be 8+ chars

**POST /api/auth/login**
- Body: `{ email, password }`
- Returns: `{ user, access_token, refresh_token }`

**POST /api/auth/refresh**
- Body: `{ refresh_token }`
- Returns: `{ access_token }`

**POST /api/auth/logout**
- Body: `{ refresh_token }`
- Returns: `{ success: true }`

**POST /api/auth/reset-password-request**
- Body: `{ email }`
- Sends password reset email with token

**POST /api/auth/reset-password**
- Body: `{ token, new_password }`
- Returns: `{ success: true }`

### Onboarding

**GET /api/onboarding/progress**
- Returns: `{ step, steps_completed: { 1: true, 2: false, ... } }`

**POST /api/onboarding/complete-step**
- Body: `{ step: integer, data: object }`
- Step 2 data: `{ pet_name, breed, age, photo_file }`
- Step 3 data: `{ task_name, reminder_time }`
- Step 4 data: `{ task_id }` (mark first task complete)
- Step 5 auto-completes on reaching step
- Returns: `{ progress, level_up?: boolean }`

### Pet Management

**POST /api/pets**
- Body: `{ name, breed, age, weight, photo_file, vet_name?, vet_phone?, medical_notes? }`
- Returns: `{ pet }`
- Uploads photo to S3, stores signed URL

**GET /api/pets/:id**
- Returns: `{ pet }`

**PATCH /api/pets/:id**
- Body: Partial pet fields
- Returns: `{ pet }`

**GET /api/pets/:id/health-score**
- Returns: `{ score: percentage, last_7_days_completion: array }`
- Score = tasks completed / tasks scheduled over last 7 days

### Tasks

**POST /api/tasks**
- Body: `{ pet_id, type, name, description?, frequency, custom_interval_days?, reminder_time }`
- Returns: `{ task }`

**GET /api/tasks**
- Query: `?pet_id=uuid&date=YYYY-MM-DD`
- Returns: `{ tasks: array, completions: array }`
- Tasks for specified date with completion status

**PATCH /api/tasks/:id**
- Body: Partial task fields
- Returns: `{ task }`

**DELETE /api/tasks/:id**
- Soft deletes (sets active=false)
- Returns: `{ success: true }`

**POST /api/tasks/:id/complete**
- Body: `{ completed_at?: timestamp }` (defaults to now)
- Creates TaskCompletion record
- Awards points
- Updates user streak
- Checks for level-up
- Returns: `{ completion, points_awarded, new_level?, streak }`

**GET /api/tasks/history**
- Query: `?pet_id=uuid&from=YYYY-MM-DD&to=YYYY-MM-DD`
- Returns: `{ completions: array, total_points: integer }`

### Progress & Levels

**GET /api/progress**
- Returns: `{ level, points, next_level_points, progress_percentage, unlocked_features, streak }`

**GET /api/progress/levels**
- Returns: `{ levels: array of all level thresholds }`

### Quizzes

**GET /api/quizzes/available**
- Returns quizzes unlocked for user's current level
- Excludes quizzes already answered correctly
- Returns: `{ quizzes: array }`

**GET /api/quizzes/:id**
- Returns: `{ quiz }` (without correct_answer_index)

**POST /api/quizzes/:id/attempt**
- Body: `{ selected_answer_index }`
- Checks answer, awards points if correct
- Returns: `{ is_correct, explanation, points_awarded, new_level? }`

### Features (Level-Gated)

**POST /api/health-logs** (Level 3+)
- Body: `{ pet_id, date, weight, notes }`
- Returns: `{ health_log }`

**GET /api/health-logs** (Level 3+)
- Query: `?pet_id=uuid`
- Returns: `{ logs: array }`

**POST /api/expenses** (Level 6+)
- Body: `{ pet_id, date, category, amount, description }`
- Returns: `{ expense }`

**GET /api/expenses** (Level 6+)
- Query: `?pet_id=uuid&from=YYYY-MM-DD&to=YYYY-MM-DD`
- Returns: `{ expenses: array, total: decimal }`

**GET /api/emergency-protocols** (Level 9+)
- Returns: `{ protocols: array }` (poisoning, choking, injury, etc.)

**POST /api/insurance/convert** (Level 12+)
- Body: `{ pet_id, consent }`
- Creates InsuranceConversion record
- Returns: `{ success: true, quote_url?: string }`

### Notifications

**POST /api/notifications/subscribe**
- Body: `{ subscription: PushSubscription }` (Web Push API object)
- Stores in user.push_subscription
- Returns: `{ success: true }`

**DELETE /api/notifications/unsubscribe**
- Clears user.push_subscription
- Returns: `{ success: true }`

### Analytics

**POST /api/analytics/event**
- Body: `{ event_type, metadata: object }`
- Event types: 'page_view', 'task_completed', 'level_up', 'quiz_attempt', etc.
- Returns: `{ success: true }`

---

## User Flows

### 1. Onboarding Flow (Critical Path)

```
1. User lands on landing page
   GET / → PWA shell loads

2. User clicks "Get Started"
   → Navigate to /signup

3. User enters email, password, name, timezone
   POST /api/auth/signup
   ← { user, access_token }
   → Store tokens in localStorage
   → Navigate to /onboarding/step/1

4. Step 1: Welcome screen (30 sec)
   - Shows value prop animation
   - Progress bar: 0%
   - Button: "Start Your Journey"
   → POST /api/onboarding/complete-step { step: 1 }
   ← { progress }
   → Navigate to /onboarding/step/2
   → Progress bar: 20%

5. Step 2: Pet profile creation (60 sec)
   - Upload photo (camera or file)
   - Enter: name, breed, age
   - Button: "Meet [PetName]"
   → POST /api/onboarding/complete-step { step: 2, data: { ... } }
   ← { progress }
   → Navigate to /onboarding/step/3
   → Progress bar: 40%

6. Step 3: First reminder (30 sec)
   - Choose from preset tasks (Feed, Walk, Groom)
   - Set time (time picker)
   - Button: "Set Reminder"
   → POST /api/onboarding/complete-step { step: 3, data: { ... } }
   ← { progress }
   → Navigate to /onboarding/step/4
   → Progress bar: 60%

7. Step 4: First check-in (15 sec)
   - Shows created task
   - Button: "I Did This! ✓"
   → POST /api/onboarding/complete-step { step: 4, data: { task_id } }
   ← { progress, level_up: true } (reaches Level 1)
   → Navigate to /onboarding/step/5
   → Progress bar: 80%

8. Step 5: Dashboard unlock (celebration)
   - Level-up animation
   - "You're now a Novice Guardian!"
   - Shows dashboard preview
   - Button: "Explore Dashboard"
   → POST /api/onboarding/complete-step { step: 5 }
   ← { progress }
   → Navigate to /dashboard
   → Progress bar: 100%
   → Onboarding complete
```

**Total time target: 2-3 minutes**

### 2. Daily Task Loop (Core Habit)

```
1. User receives push notification (scheduled time)
   "Time to feed Max! 🐕"
   → User taps notification

2. Opens app to dashboard
   GET /api/tasks?pet_id=xxx&date=today
   ← { tasks: [{ id, name, completed: false }], ... }

3. User sees pending task highlighted
   - Visual indicator (unchecked circle)
   - Task name: "Feed Max"
   - Reminder time: "9:00 AM"

4. User completes real-world task (feeds pet)

5. User taps checkmark in app
   POST /api/tasks/:id/complete
   ← { completion, points_awarded: 10, streak: 5 }
   → Show immediate feedback:
     - Checkmark animation
     - "+10 points" tooltip
     - "5-day streak! 🔥" badge
     - Progress bar updates

6. If level-up triggered:
   ← { new_level: 3 }
   → Show celebration modal
     - "Level Up! You're now Attentive 🎉"
     - "Health Log unlocked!"
   → Send push notification

7. User closes app (session complete)
```

**Total interaction time: 10-15 seconds**

### 3. Level Progression Flow

```
1. User accumulates points through tasks and quizzes
   - Each task completion: +10 or +25 points
   - Each quiz correct: +15 points

2. Background process checks level-up condition
   - On task complete: if (user.total_points >= next_level_threshold)
   - Increment user.current_level
   - Update user.feature_flags with new unlocks

3. User sees level-up UI
   - Modal overlay (cannot dismiss for 3 sec)
   - New level title and number
   - List of unlocked features
   - "Continue" button

4. Dashboard updates with new features
   - Level 3: "Health Log" tab appears
   - Level 6: "Expenses" tab appears
   - Level 9: "Emergency" button appears
   - Level 12: "Get Insurance Quote" CTA appears
```

### 4. Quiz Flow

```
1. User navigates to Quizzes tab
   GET /api/quizzes/available
   ← { quizzes: [...] }

2. User selects a quiz
   GET /api/quizzes/:id
   ← { quiz: { title, question, options, category } }

3. User reads question and selects answer
   → Highlight selected option

4. User submits answer
   POST /api/quizzes/:id/attempt { selected_answer_index: 2 }
   ← { is_correct: true, explanation: "...", points_awarded: 15 }

5. Show result screen
   - Correct: Green checkmark + explanation + points
   - Incorrect: Red X + explanation + "Try again"

6. If correct and points trigger level-up:
   ← { new_level: 4 }
   → Show level-up modal
```

### 5. Insurance Conversion Flow (Level 12)

```
1. User reaches Level 12
   → "Get Insurance Quote" button unlocks on dashboard

2. User taps button
   → Navigate to /insurance/quote

3. Show conversion page
   - "Congratulations, Master Guardian!"
   - Pet details pre-filled
   - Consent checkbox: "Share my data with insurance partner"
   - "Get My Quote" button

4. User checks consent and submits
   POST /api/insurance/convert { pet_id, consent: true }
   ← { success: true, quote_url: "..." }

5. Redirect to partner's quote page
   → Open quote_url in new tab
   → Track conversion event in analytics
```

---

## Security & Privacy

### Authentication
- Passwords hashed with bcrypt (cost factor 12)
- JWT access tokens: 15-minute expiry
- JWT refresh tokens: 7-day expiry, stored in httpOnly cookie
- All endpoints except /auth/* require valid access token

### Input Validation
- Email: RFC 5322 format validation
- Password: Min 8 chars, max 128 chars
- File uploads: Max 5MB, MIME types [image/jpeg, image/png, image/webp]
- SQL injection prevention: Use parameterized queries only
- XSS prevention: React escaping + Content-Security-Policy header

### Rate Limiting
- Auth endpoints: 5 requests per 15 minutes per IP
- Task completion: 100 requests per hour per user
- Photo upload: 10 requests per hour per user
- All other endpoints: 1000 requests per hour per user

### CORS
- Allow origins: Production domain only (e.g., petcare.app)
- Credentials: true
- Methods: GET, POST, PATCH, DELETE
- Headers: Content-Type, Authorization

### Data Privacy
- GDPR compliance: User can request data export (JSON) or deletion
- Photo URLs: S3 signed URLs with 1-hour expiry
- No third-party tracking in MVP
- Push subscriptions encrypted at rest

### HTTPS
- Enforce HTTPS everywhere (required for PWA)
- HSTS header: max-age=31536000

---

## Testing Strategy

### Unit Tests (70% coverage target)
- **Progression Engine:** Point calculation, level-up logic, feature unlocks
- **Streak Calculation:** Daily rollover, missed days, longest streak
- **Quiz Scoring:** Answer validation, point awards
- **Auth:** Password hashing, token generation/validation
- **Task Scheduling:** Daily task generation, reminder times

### Integration Tests
- **Auth Flow:** Signup → Login → Refresh → Logout
- **Task Flow:** Create task → Schedule reminder → Mark complete → Award points
- **Onboarding Flow:** All 5 steps → Level 1 unlock
- **Level-Up Flow:** Accumulate points → Check threshold → Unlock features

### E2E Tests (Playwright or Cypress)
- **Critical Path 1:** Signup → Complete onboarding → Reach Level 1
- **Critical Path 2:** Login → Create task → Complete task → Check streak
- **Critical Path 3:** Complete tasks → Take quiz → Reach Level 3 → Use health log
- **Critical Path 4:** Reach Level 12 → Start insurance conversion

### Performance Tests
- Lighthouse CI: PWA score >90, Performance >80
- Load testing: 1000 concurrent users on task completion endpoint
- Database query performance: All queries <100ms

### Manual QA Checklist
- Test on Chrome, Firefox, Safari (desktop + mobile)
- Verify push notifications on Android and iOS
- Test offline mode: Complete task offline → Sync when online
- Verify streak accuracy across midnight boundary
- Test photo upload on slow network (3G simulation)

---

## Deployment & Operations

### Environment Variables
```
NODE_ENV=production
DATABASE_URL=postgresql://...
REDIS_URL=redis://...
S3_BUCKET=pet-photos
S3_ACCESS_KEY=...
S3_SECRET_KEY=...
JWT_SECRET=...
VAPID_PUBLIC_KEY=... (for Web Push)
VAPID_PRIVATE_KEY=...
FRONTEND_URL=https://petcare.app
```

### Database Indexes
```sql
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_pets_user_id ON pets(user_id);
CREATE INDEX idx_tasks_user_id ON tasks(user_id);
CREATE INDEX idx_task_completions_user_date ON task_completions(user_id, date);
CREATE INDEX idx_task_completions_completed_at ON task_completions(completed_at);
CREATE INDEX idx_quiz_attempts_user_id ON quiz_attempts(user_id);
```

### Cron Jobs (Task Scheduler)
- **Daily task generation:** Every midnight UTC, create TaskCompletion records for active daily tasks
- **Streak warnings:** Every day at 8 PM user timezone, send push notification if no tasks completed
- **Level-up notifications:** Real-time on task completion (not cron)

### Monitoring & Alerts
- Error rate >1% for 5 minutes → Alert
- API response time >500ms (p95) for 5 minutes → Alert
- Database connection pool exhaustion → Alert
- Failed push notification delivery >10% → Alert

### Backup & Recovery
- Database: Daily backups, 30-day retention
- Photos: S3 versioning enabled
- Recovery Time Objective (RTO): 4 hours
- Recovery Point Objective (RPO): 24 hours

---

## Success Metrics

### Engagement Metrics
- **Daily Active Users (DAU):** Unique users who open app per day
- **Task Completion Rate:** Tasks completed / tasks scheduled
- **Average Tasks per DAU:** Mean tasks completed per active user per day
- **Streak Distribution:** Histogram of current streak lengths

### Retention Metrics
- **D1 Retention:** % users who return 1 day after signup
- **D7 Retention:** % users who return 7 days after signup (Target: 40%)
- **D30 Retention:** % users who return 30 days after signup (Target: 25%)

### Onboarding Metrics
- **Onboarding Completion Rate:** % users who complete all 5 steps (Target: 70%)
- **Time to Complete Onboarding:** Median time from signup to Step 5 (Target: <3 min)
- **Drop-off by Step:** % users who abandon at each step

### Progression Metrics
- **Level Distribution:** % users at each level (1-12)
- **Days to Level 5:** Median days from signup to Level 5
- **Days to Level 12:** Median days from signup to Level 12
- **Quiz Completion Rate:** % available quizzes attempted

### Conversion Metrics
- **Insurance Conversion Rate:** % Level 12 users who click "Get Quote" (Target: 15%)
- **Quote Starts:** # users who land on insurance partner page
- **Time to Conversion:** Median days from signup to insurance click

### Technical Metrics
- **API Error Rate:** % failed requests (Target: <0.5%)
- **P95 Response Time:** 95th percentile API latency (Target: <300ms)
- **PWA Score:** Lighthouse PWA audit score (Target: >90)
- **Offline Success Rate:** % task completions synced successfully after offline

---

## Appendix: Business Logic Details

### Streak Calculation Rules
- Streak increments if at least 1 task completed on a given date
- Missed day resets streak to 0
- Timezone: User's timezone determines "day" boundaries
- Grace period: None (strict daily requirement)

### Point Award Rules
- Daily task: 10 points
- Periodic task: 25 points
- Quiz (correct): 15 points
- Quiz (incorrect): 0 points (can retake)
- No bonus points for streaks in MVP

### Health Score Calculation
- Formula: (tasks_completed_last_7_days / tasks_scheduled_last_7_days) * 100
- Updates daily at midnight user timezone
- Display: 0-100% or emoji (0-20%: 😟, 21-50%: 😐, 51-80%: 🙂, 81-100%: 😊)

### Feature Unlock Logic
- Check user.current_level against LevelThreshold table
- Update user.feature_flags on level-up
- Frontend: Hide locked features entirely (not grayed out)
- Backend: Return 403 if user attempts to access locked endpoint

### Onboarding Step Enforcement
- Cannot skip steps (UI disables "Next" until step completed)
- Backend validates step order on /complete-step
- If user refreshes, resume at current step (stored in OnboardingProgress)

---

## Out of Scope for MVP

**Explicitly not building:**
- Multi-pet support (single pet only)
- Social features (no friends, leaderboards, sharing)
- Vet appointment booking
- E-commerce integration
- Custom pet avatars/cosmetics
- Advanced analytics dashboard for users
- Native mobile apps (PWA only)
- Voice or smart speaker integration
- Wearable device integration
- Subscription or payment processing

These features can be added in future iterations after validating core engagement loop.

---

**End of Specification**

*This spec is designed for an AI coding agent to implement autonomously. Focus on the "what" (requirements) rather than the "how" (implementation details). Trust the agent to choose appropriate libraries, patterns, and code structure.*
