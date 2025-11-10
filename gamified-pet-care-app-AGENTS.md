# AGENTS.md - Development Guidelines

Timeless guidance for AI agents and developers working on the Gamified Pet Care App.

---

## What This Project Is

A Progressive Web App (PWA) that gamifies real pet care tasks to drive engagement. Users manage their actual pet (not virtual), completing real-world care activities tracked through a 12-level progression system. Built with React/TypeScript frontend, Node.js/Express backend, PostgreSQL database.

**Core goal:** Create engaged, responsible pet owners, culminating in insurance conversion at Level 12.

**Reference documents:**
- `gamified-pet-care-app-spec.md` - Complete technical specification
- `gamified-pet-care-app-plan.md` - 15-phase implementation plan
- `README.md` - Current status, what works now, how to run/test
- `TESTING.md` - Manual QA procedures for each feature

---

## Test-Driven Development (CRITICAL)

### The Iron Law

**NO PRODUCTION CODE WITHOUT A FAILING TEST FIRST**

Write code before the test? Delete it. Start over. No exceptions.

### Red-Green-Refactor Cycle

1. **RED - Write Failing Test**
   - Write one minimal test showing expected behavior
   - One behavior per test, clear name, real code (avoid mocks unless necessary)

2. **Verify RED - Watch It Fail**
   - MANDATORY. Run test, confirm failure (not error)
   - Test passes immediately? You're testing existing behavior. Fix test.

3. **GREEN - Minimal Code**
   - Write simplest code to pass the test
   - Just enough to pass, no extra features

4. **Verify GREEN - Watch It Pass**
   - MANDATORY. Run test, confirm success
   - Run all tests to ensure nothing broke
   - Test fails? Fix code, not test

5. **REFACTOR - Clean Up**
   - After green: remove duplication, improve names
   - Keep tests green, don't add behavior

### Why TDD Order Matters

Tests written after pass immediately. Passing immediately proves nothing - might test wrong thing, might miss edge cases. Test-first forces you to see the test fail, proving it actually tests something.

As Simon Willison writes: "If your project has a robust, comprehensive and stable test suite agentic coding tools can fly with it. Without tests? Your agent might claim something works without having actually tested it at all."

### Red Flags

- Code before test → DELETE CODE, start over
- Test after implementation → Wrong order, delete and restart
- Test passes immediately → Test is wrong, fix it
- "Already manually tested" → Not systematic, write test
- "Too simple to test" → Simple code breaks, test takes 30 seconds

---

## Verification Discipline (CRITICAL)

### The Iron Law

**NO COMPLETION CLAIMS WITHOUT FRESH VERIFICATION EVIDENCE**

If you haven't run the verification command in this message, you cannot claim it passes.

### Before Claiming Anything

1. **Identify** - What command proves this claim?
2. **Run** - Execute full command, fresh and complete
3. **Read** - Full output, check exit code, count failures
4. **Verify** - Does output confirm the claim?
5. **Only then** - Make the claim

Skip any step = lying, not verifying.

### What Requires Verification

| Claim | Requires | Not Sufficient |
|-------|----------|----------------|
| Tests pass | `npm test` output: 0 failures | Previous run, "should pass" |
| Linter clean | `npm run lint` output: 0 errors | Partial check |
| Build succeeds | `npm run build` exit code: 0 | Linter passing |
| Feature works | Manual test steps completed | Code changed |
| Phase complete | All objectives verified | Tests passing alone |

### Red Flags - Never Say

- "Should work now" → Run verification
- "Probably passes" → Run verification
- "Tests passed" without showing output → Show output
- "Great, done!" before verification → Verify first
- Any wording implying success without having run verification

---

## Development Workflow

### Basic Hygiene

- **Restart servers** after code changes (especially backend)
- **Verify changes work** before moving on (run it, test it, check logs)
- **Install dependencies immediately** when adding imports
- **Make incremental changes** - small, verifiable steps
- **Check existing functionality** still works after changes (basic regression)

### When to Escalate

Only escalate for external blockers:
- API key needed or invalid
- Network/infrastructure down
- Critical decision requiring user context you can't determine

Don't escalate for: code errors, test failures, debugging, design decisions within spec constraints.

### Framework-Specific Patterns (CRITICAL)

#### Backend (Express + TypeScript)

**Hot Reload:**
- Backend changes require full restart
- After changing `src/**/*.ts`, run: `npm run dev` (or kill and restart)
- Don't assume auto-reload works

**Database Migrations:**
- Always run migrations before testing: `npm run migrate`
- New migrations = new schema = must apply before app starts
- Check migration status: `npm run migrate:status`

**Environment Variables:**
- Backend fails silently if .env missing
- Check `.env.example` for required vars
- Never commit `.env` (gitignored), always commit `.env.example`

#### Frontend (React + TypeScript)

**Hot Reload:**
- Frontend changes hot reload automatically ✅
- If broken: `rm -rf node_modules/.cache && npm start`

**State Management:**
- Use React Context for global state (user, pet, progression)
- Don't over-optimize - start simple, refactor if needed

#### PWA Considerations

**Service Worker:**
- Changes to `src/sw.js` require:
  1. Rebuild: `npm run build`
  2. Unregister old SW in DevTools
  3. Hard refresh (Cmd+Shift+R)
- Test offline: DevTools → Network → Offline checkbox

**IndexedDB:**
- Clear between tests: DevTools → Application → IndexedDB → Delete
- Check data: DevTools → Application → IndexedDB → Expand tables

#### PostgreSQL

**Connection Pool:**
- Pool exhaustion = app hangs
- Always release connections: use `try/finally` with `client.release()`
- Max connections: 20 (default), tune if needed

**Queries:**
- Always use parameterized queries: `db.query('SELECT * FROM users WHERE email = $1', [email])`
- Never string interpolation: VULNERABLE to SQL injection

---

## Phase Wrap-Up Protocol (CRITICAL)

Every phase, feature, and fix requires this protocol before claiming complete.

### Before Saying "Phase Complete"

1. **Run verification commands and show output:**
   ```bash
   npm test                    # Show "X/X pass"
   npm run lint               # Show "0 errors"
   npm run build              # Show "exit 0"
   npm run test:integration   # Show all pass
   ```

2. **Verify phase objectives:**
   - Read plan objectives for this phase line by line
   - Check each off with evidence (test output, manual verification)
   - If any incomplete, state what remains

3. **Update documentation:**
   - `README.md` - Update "Current Status" section (what phase complete, what works, what's next)
   - `TESTING.md` - Add manual QA steps for new features this phase
   - Spec/Plan - If implementation differed from plan, update source document

4. **Proactively say: "Let's wrap up Phase X"**
   - Don't wait for user to ask
   - Signal clearly when objectives met

5. **Walk through testing steps:**
   - Specific: "Run `npm start`, navigate to /dashboard, click task checkbox, verify checkmark appears"
   - Not vague: "Test the feature"

6. **Wait for user confirmation**
   - User must verify manual testing passed
   - Never proceed to next phase without explicit confirmation

7. **Offer to commit:**
   - Suggest clear commit message describing what was built
   - Reference phase number/name

### Never Proceed to Next Phase Without User Confirmation

### Red Flags - Never Say

- "Should work now"
- "Tests passed" (without showing output)
- "Phase complete, moving to Phase X" (without user confirmation)
- "Everything looks good" (without verification)

### Applies to All Work

- **Full phases** - Comprehensive wrap-up with all steps
- **Individual features** - Lighter wrap-up, still verify and document
- **Bug fixes** - Verify bug fixed, update docs if needed
- **Tiny fixes** - Minimal but still intentional wrap-up

Scale protocol to work size, but always verify and signal completion clearly.

---

## Code Review Protocol

### When to Request Review

Request code review when:
- Completing a major phase (Phases 1, 3, 5, 8, 11, 15)
- Implementing complex architecture decisions
- Uncertain about implementation approach
- After refactoring critical code paths

### How to Request Review

**If you CAN spawn sub-agents:**

Use this prompt:
> "Please dispatch two subagents to carefully review Phase X. Tell them they're competing with another agent. Make sure they look at both architecture and implementation. Whomever finds more issues gets promoted."

**If you CANNOT spawn sub-agents:**

Tell the user to follow manual review process (open two separate agent sessions, give them code and spec, compare findings).

### What Reviewers Examine

- **Architecture:** Match spec? Simpler approaches? Right abstractions? Maintainable?
- **Implementation:** Logic errors? Edge cases? Error handling? Performance? Readable? Security?
- **Testing:** Coverage adequate? Edge cases tested? Tests verify correctly?
- **Consistency:** Follows project standards? Matches existing patterns? Clear logs/errors?

### Respond to Findings

For each issue: **Acknowledge** → **Assess** validity → **Act** (fix or explain) → **Verify** fixes work

Document what was addressed and what was determined to be non-issues (with reasoning).

### Skip Review For

- Trivial changes (typo fixes, simple refactors)
- Experimental/throwaway code
- Pure documentation updates

---

## Documentation Strategy

### Standard Docs (3 files)

1. **README.md** - What this is, current status, how to run/test, progress
2. **AGENTS.md** - How to work on this project (this file)
3. **TESTING.md** - Manual QA procedures for each feature

### Keep README.md Current

Update after each phase:

```markdown
## Current Status

**Phases 0-3 Complete** - Working onboarding and authentication!

**What works right now:**
- User signup/login with JWT
- Pet profile creation with photo upload
- 5-step gamified onboarding → Level 1

**Try it:**
1. `npm run dev` (backend on :3001)
2. `cd client && npm start` (frontend on :3000)
3. Signup → Complete onboarding → Reach Level 1!

**Next:** Phase 4 - Task Management System
```

### Keep Spec/Plan in Sync (CRITICAL)

**When implementation differs from spec/plan, update the source document immediately.**

Update when:
- Architectural decisions differ from spec
- Core flow changes
- Component additions/removals
- Performance considerations discovered

Where to update:
- `gamified-pet-care-app-spec.md` - Architecture, data models, API endpoints
- `gamified-pet-care-app-plan.md` - Phase descriptions, "Done means", "Test it" criteria

Add "Implementation Decisions" section to spec:
- Document reasoning, not just what changed
- Preserves context for future agents/sessions

**Do this before committing the implementation.**

### Avoid Creating

- `STATUS.md` (use README instead)
- `CHANGELOG.md` (use git commits)
- Redundant architecture diagrams
- Phase-specific temporary docs

---

## Version Control

### Commit Workflow

- Commit after completing meaningful progress (passing test, working feature)
- Show proposed commit message in code block for user review
- Only commit after user approves
- Commit frequently - small, logical units

### Commit Message Format

```
type: brief description

- Key change 1
- Key change 2
- Key change 3
```

Types: `feat`, `fix`, `refactor`, `test`, `docs`, `chore`

### Branch Strategy

- Current branch: `claude/repo-review-011CUzkZjmZWd955ytQxk93G`
- Never commit directly to main
- Feature branches: `feature/description` or `fix/description`

### Never Commit

- API keys, secrets, `.env` files
- `node_modules`, built artifacts (`dist/`, `build/`)
- IDE settings (`.vscode/`, `.idea/`)
- Agent instruction files (keep in planning repo, not code repo)

### Always Commit

- `.env.example` (with placeholder values)
- Dependency files (`package.json`, `package-lock.json`)
- Database migrations
- Documentation updates

---

## Error Handling & Logging

### Error Handling

**Everything can fail. Handle explicitly, never silently.**

- Fail fast with clear error messages
- Log errors with enough context for debugging
- User-facing errors suggest what to do next
- Verbose errors > silent failures

Example:
```typescript
try {
  const user = await UserModel.findByEmail(email);
  if (!user) {
    throw new Error(`User not found: ${email}`);
  }
  return user;
} catch (error) {
  logger.error(`Failed to find user: ${email}`, { error });
  throw new Error(`Database error: ${error.message}`);
}
```

### Logging Standards

**Include timestamps in all logs:**

Format: `[HH:MM:SS] [PREFIX] message`

Benefits:
- Easy to identify fresh terminal sessions
- Track performance and timing
- Essential for debugging async operations

Example:
```typescript
console.log(`[${new Date().toLocaleTimeString()}] [AUTH] User logged in: ${userId}`);
```

Implement consistently across backend and frontend.

---

## Code Style & Quality

### Write Simple, Elegant Code

- **DRY** (Don't Repeat Yourself) and **YAGNI** (You Aren't Gonna Need It)
- Avoid complicated dependencies
- Give great names - names should reveal intent
- One function does one thing
- Extract complex logic into named functions

### Dependencies

- Default to stdlib/built-ins first
- For new packages: explain why, what it does, alternatives considered
- Minimize dependencies - each one is a liability
- Prefer well-maintained, widely-used packages

### Code Comments

- Explain "why", not "what"
- Document non-obvious decisions
- Flag assumptions: "Assuming X because Y"
- Update comments when code changes

### When Requirements Unclear

- Make most reasonable assumption and state it explicitly
- Proceed with implementation rather than blocking
- Document assumptions in code comments and commit messages
- Flag clearly: "Assuming X because Y"

---

## Testing Strategy

### Unit Tests

Focus on business logic:
- Progression engine (point calculation, level-up, feature unlocks)
- Streak calculation (daily rollover, missed days, longest streak)
- Quiz scoring (answer validation, point awards)
- Auth (password hashing, token generation/validation)
- Task scheduling (daily task generation, reminder times)

### Integration Tests

Test API endpoints:
- Auth flow (signup → login → refresh → logout)
- Task flow (create → schedule → mark complete → award points)
- Onboarding flow (all 5 steps → Level 1 unlock)
- Level-up flow (accumulate points → check threshold → unlock features)

### E2E Tests

Critical paths only:
- Signup → Complete onboarding → Reach Level 1
- Login → Create task → Complete task → Check streak
- Complete tasks → Take quiz → Reach Level 3 → Use health log
- Reach Level 12 → Start insurance conversion

### Manual Testing

**Always include manual test steps:**
- Specific commands to run
- Exact UI actions to perform
- Expected results to verify
- Update `TESTING.md` with new features

Example:
```markdown
## Test Task Completion (Phase 4)

1. Start backend: `npm run dev`
2. Start frontend: `cd client && npm start`
3. Login as test user
4. Navigate to Dashboard
5. Click checkbox next to "Feed Max"
6. **Expected:** Checkmark animation, "+10 points" tooltip, streak badge updates
```

---

## Security Best Practices

### Authentication & Authorization

- Hash passwords with bcrypt (cost factor 12)
- Use JWT with short expiry (15 min access, 7 day refresh)
- Verify tokens on every protected endpoint
- Check user owns resource before allowing access (prevent accessing other users' pets)

### Input Validation

- Validate all user inputs (email format, password length, file types)
- Sanitize inputs to prevent XSS
- Use parameterized queries to prevent SQL injection
- Limit file upload sizes (5MB max for photos)

### Rate Limiting

Apply rate limits:
- Auth endpoints: 5 requests per 15 minutes per IP
- Task completion: 100 requests per hour per user
- Photo upload: 10 requests per hour per user

### Security Headers

Use Helmet middleware for:
- Content-Security-Policy (CSP)
- HTTP Strict Transport Security (HSTS)
- X-Frame-Options
- X-Content-Type-Options

### Never Log

- Passwords (even hashed)
- JWT tokens
- Credit card numbers
- Any PII beyond user ID

---

## Performance Considerations

### Database

- Add indexes on frequently queried fields: `user_id`, `pet_id`, `date`, `completed_at`
- Use connection pooling (max 20 connections)
- Release connections in `finally` blocks
- Keep queries simple, optimize only if slow (>100ms)

### Frontend

- Lazy load images (task history, pet photos)
- Use React.memo for expensive components
- Code split routes: `React.lazy(() => import('./pages/Dashboard'))`
- Compress images before upload (client-side)

### Caching

- Redis for frequently accessed data:
  - User session state
  - Current streak values
  - Daily task lists
- Cache TTL: 1 hour for user data, 5 min for dynamic data

---

## Getting Started for New Agent

### First, Read These Files In Order

1. **README.md** - Current status, what's built, what works, what's next
2. **AGENTS.md** (this file) - How to work on this project
3. **`gamified-pet-care-app-spec.md`** - Complete technical specification
4. **`gamified-pet-care-app-plan.md`** - 15-phase implementation plan
5. **TESTING.md** - Manual QA procedures for each feature

### Then, Verify Everything Works

1. Install dependencies:
   ```bash
   npm install
   cd client && npm install
   ```

2. Set up database:
   ```bash
   createdb petcare_dev
   npm run migrate
   ```

3. Configure environment:
   ```bash
   cp .env.example .env
   # Add required values to .env
   ```

4. Start application:
   ```bash
   npm run dev          # Backend on :3001
   cd client && npm start  # Frontend on :3000
   ```

5. Test current features (see README.md "Try it" section)

6. Run test suite:
   ```bash
   npm test            # All tests should pass
   npm run lint        # Should show 0 errors
   ```

### Continue Implementation

1. Check README.md "Current Status" - what phase is next?
2. Read next phase in implementation plan
3. Follow TDD: Write test → Verify fail → Implement → Verify pass
4. Follow wrap-up protocol before claiming phase complete
5. Update docs as you go (README, TESTING.md, spec if needed)
6. Commit after completing phase (with user approval)

---

## Key Lessons Learned

(This section will be populated during implementation as technical insights emerge)

**Example entries:**
- "React Context rerenders excessively when storing entire pet object - use separate contexts for pet data vs. pet actions"
- "PostgreSQL TIMESTAMP stores UTC, but need to display in user's timezone - convert on query with AT TIME ZONE"
- "Service worker caches aggressively - always increment version number when deploying updates"

---

**End of AGENTS.md**

*This document guides timeless development practices. For current project status, see README.md. For requirements, see spec and plan documents.*
