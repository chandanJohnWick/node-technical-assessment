# Policy Assessment API

A modular TypeScript API built with NestJS, Fastify, and MongoDB. It imports XLSX/CSV data in a worker thread, stores each business entity in its own collection, and exposes policy search, per-user aggregation, scheduled messages, and CPU monitoring.

## Quick start

Requirements: Node.js 20+ and MongoDB running locally.

    npm ci
    Copy-Item .env.example .env
    npm run start:dev

The API uses port 3000 and MongoDB at `mongodb://127.0.0.1:27017/policy_assessment` by default. Edit `.env` to change either value.

Build and run the compiled app:

    npm run build
    npm start

## Deploy free on Render

1. Create a MongoDB Atlas free cluster and copy its connection URI. Add `0.0.0.0/0` to Atlas Network Access only if Render's outbound IPs cannot be allowlisted; use a database user with access only to this app's database.
2. In Render, choose **New → Blueprint**, connect this GitHub repository, and select `render.yaml`.
3. When prompted, enter the Atlas URI for `MONGODB_URI` as a secret. Deploy the Blueprint and wait for `/api/health` to pass.

Render free web services sleep after inactivity, so the first request can be slow. CPU monitoring exits the process at the configured threshold; Render manages process restarts. Use a paid always-on plan for reliable availability.

## Try it with Postman

Import `postman_collection.json`. Send **Upload sample workbook** and choose `sample-policies.xlsx` for its `file` field. The sample uses fictional data; the upload should report 3 rows imported.

Then try **Search Alice policies** (2 results) and **Aggregate policies by user** (Alice: 2, Bob: 1). Other requests cover the health check and scheduled message endpoint.

## API

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/health` | Health check |
| POST | `/api/upload` | Upload an XLSX or CSV file as multipart field `file` |
| GET | `/api/policies/search?username=Alice` | Find policies by user first name |
| GET | `/api/policies/by-user` | Count and group policies by user |
| POST | `/api/messages` | Save a scheduled message |

The message request body is `{ "message": "Reminder", "day": "YYYY-MM-DD", "time": "HH:mm" }`. Time is interpreted in the server's local timezone. The service records when the message becomes due; add a delivery provider if messages need to be sent externally.

## Project layout

- `src/agents`, `accounts`, `users`, `lobs`, `carriers`, `policies` — domain models and policy endpoints.
- `src/uploads` — Fastify multipart upload and worker-thread spreadsheet parsing.
- `src/messages` — scheduled-message API and due-time tracking.
- `src/cpu` — host CPU monitor. At the configured threshold the process exits; use PM2, systemd, or a container restart policy to restart it.

The importer recognizes common column labels such as Agent Name, First Name, DOB, Account Name, category_name, company_name, and Policy Number. Update the alias map in `src/uploads/import.worker.ts` if the assessment sheet uses different headers.
