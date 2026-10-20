# OctoFit Tracker architecture

OctoFit Tracker is a three-tier application for a school fitness program. The starter code includes API contracts and intentionally incomplete implementation points so you can use GitHub Copilot agent mode in a test-driven loop.

![Three-tier OctoFit architecture](../.github/images/octofit-architecture.svg)

## Tier boundaries

- **Presentation tier**: React 19, Vite, React Router, Bootstrap, and a shared API client in `octofit-tracker/frontend/src`.
- **Logic tier**: Express and TypeScript routes/services in `octofit-tracker/backend/src` expose `/api/*` behavior on port `8000`.
- **Data tier**: Mongoose models and seed data in `octofit-tracker/backend/src/models` and `src/scripts/seed.ts` persist to MongoDB on port `27017`.

## Ports and environment rules

- MongoDB: `27017`
- Express API: `8000`
- Vite frontend: `5173`
- The browser calls relative `/api` paths. Vite proxies them to `http://localhost:8000`, so the unauthenticated API port stays private in Codespaces. `VITE_API_BASE_URL` can override the base URL.

## API contract

| Capability | Method and path | Expected behavior |
| --- | --- | --- |
| Activity tracking | `GET /api/activities`, `POST /api/activities` | List and create valid activity records. POST accepts `userId`, `teamId`, `type`, and `minutes`; `userId` and `teamId` must be well-formed IDs for an existing user and team; otherwise respond with a deliberate 4xx (never a 500 from a cast error). A created activity stores the submitted `user`, `team`, `type`, and `minutes` plus computed `points` and `occurredAt`. |
| Teams | `GET /api/teams`, `POST /api/teams` | List and create teams with members. Created and listed teams keep the submitted `name` and `mascot`. Reject a team without a name with `400`. |
| Leaderboard | `GET /api/leaderboard` | Return teams ordered by the sum of their activity points, highest first. Each entry has `teamName`, `totalPoints`, and a 1-based `rank`. |
| Workout suggestions | `GET /api/workouts/suggestions/:userEmail` | Recommend workouts from recent activity patterns for the matching seeded user's email address. The first suggestion's `focus` matches that user's goal or recent activity, with a `reason` explaining why. An email with no matching user returns a deliberate 4xx (for example, `404`). |

## Implementation decisions

Record your plan here before editing code.

- Presentation tier decision: 
Build a route-driven React UI that fetches each capability from the Express API, renders data from the response payload, and handles loading, empty, and failure states with accessible roles such as status and alert. Keep component behavior simple and focused on display logic rather than business rules.
- Logic tier decision:
Keep validation and orchestration in the Express service layer so routes remain thin and consistent. Reuse a shared error flow that turns invalid input and missing resources into deliberate 4xx responses instead of leaking raw cast exceptions and 500s.
- Data tier decision:
Define the data model in Mongoose with required fields, references, and seed fixtures that match the real contract. Use lean queries for reads and keep the persistence layer responsible for schema constraints and seeded sample records, not UI concerns.
- Activity tracking approach:
Accept activity payloads with userId, teamId, type, and minutes, validate that both IDs are valid and resolve to existing user/team records, and create the activity with user and team references plus computed points and occurredAt. Reject malformed IDs and missing references with explicit 4xx errors.
- Team management approach:
Require a meaningful team name on create and store the submitted name and mascot while preserving the members list as a reference array. List teams with members attached so the frontend can render the roster without additional transformation logic.
- Leaderboard approach:
Aggregate activity points by team, sort descending by totalPoints, and assign a 1-based rank to each result. This keeps the API response deterministic and ensures the frontend can display ordered rankings without extra sorting logic.
- Workout suggestions approach:
Resolve a user by email, inspect that user’s goal and recent activity pattern, and select the best matching workout by focus and reason. If no user matches, return a clear 4xx such as 404 rather than silently returning unrelated data.

## Test plan

Record the commands you run and what each failure means.

- Data-tier command: `npm run test:data --prefix octofit-tracker/backend`

This checks that the schema, seed data, and model constraints match the data contract. A failure here usually means the Mongoose fields, required values, or seed relationship setup are still wrong.

- API command: `npm run test:api --prefix octofit-tracker/backend`

This checks end-to-end behavior for the Express routes: creation, validation, error codes, leaderboard sort order, and workout matching. A failure here usually means the service logic or route-level validation is not aligned with the API contract.

- Frontend command: `npm test --prefix octofit-tracker/frontend`

This checks the React UI contract: route rendering, loading states, empty states, accessible alerts, and the fetch calls to the correct API endpoints. A failure here usually means the UI is not handling API responses or user states correctly.

- Backend build command: `npm run build --prefix octofit-tracker/backend`

This confirms the TypeScript backend compiles cleanly and that the service and route contracts are structurally valid. A failure here usually points to type mismatches or invalid imports.

- Frontend build command: `npm run build --prefix octofit-tracker/frontend`

This confirms the Vite/React app compiles successfully and that the presentation tier is consistent with the expected component structure. A failure here usually indicates invalid JSX, typing issues, or bad API assumptions in the frontend code.
