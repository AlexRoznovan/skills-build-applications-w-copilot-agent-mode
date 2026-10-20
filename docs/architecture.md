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

- Presentation tier decision: Keep the React UI route-driven and data-focused, with each capability rendering API responses and showing accessible loading, empty, and failure states instead of placeholder text.
- Logic tier decision: Keep Express routes thin and move validation, lookup, and aggregation logic into the service layer so each /api endpoint returns predictable 4xx responses rather than uncaught cast errors or 500s.
- Data tier decision: Define required Mongoose fields, references, and seeded fixtures for users, teams, activities, and workouts so the persistence layer matches the API contract and supports the frontend consistently.
- Activity tracking approach: Validate userId and teamId against real records, store the linked user and team references, and compute points plus occurredAt from the submitted data so created activities match the contract.
- Team management approach: Require a meaningful team name, preserve the mascot and members array, and return a 400 when the required fields are missing so team creation stays safe and explicit.
- Leaderboard approach: Aggregate activity points by team, sort totals descending, and assign a 1-based rank so the leaderboard reflects the highest-scoring teams in order.
- Workout suggestions approach: Resolve the seeded user by email, match the recommendation to their goal or recent activity pattern, and return a deliberate 4xx for unknown addresses instead of unrelated suggestions.

## Test plan

Record the commands you run and what each failure means.

- Data-tier command: `npm run test:data --prefix octofit-tracker/backend` — validates schema rules, required fields, seed data integrity, and the Mongo-backed contract for users, teams, activities, and workouts.
- API command: `npm run test:api --prefix octofit-tracker/backend` — validates route behavior, input validation, error handling, leaderboard ordering, and workout suggestion matching for seeded users.
- Frontend command: `npm test --prefix octofit-tracker/frontend` — validates render behavior for activities, teams, leaderboard, and workout suggestions, including loading, empty, and error states.
- Backend build command: `npm run build --prefix octofit-tracker/backend` — ensures the TypeScript backend compiles cleanly after the logic tier changes.
- Frontend build command: `npm run build --prefix octofit-tracker/frontend` — ensures the React/Vite presentation tier compiles and bundles correctly with the expected API contract.
