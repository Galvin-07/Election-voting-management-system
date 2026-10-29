# Election Voting Management System – Candidate Module

## Run
1. Install Node.js 16+ (no other dependencies needed).
2. In this folder: `node server.js`
3. Open http://localhost:3000

Data is saved to `candidates.json` (created automatically).

## REST API
| Operation | Method & URL |
|---|---|
| Add candidate | POST /api/candidates  `{id, name, party, constituency}` |
| View all | GET /api/candidates |
| Search (ID / name / party) | GET /api/candidates?q=term |
| Get one | GET /api/candidates/:id |
| Update (name, party, constituency) | PUT /api/candidates/:id |
| Delete | DELETE /api/candidates/:id |
