# Policy assessment API

JavaScript/Node.js REST API for importing policy spreadsheets into MongoDB, looking up policies, aggregating policies by user, scheduling messages, and exiting when host CPU crosses a configured threshold.

## Run

1. Install Node.js 20+ and MongoDB.
2. Copy `.env.example` to `.env`, then set `MONGODB_URI`.
3. Run `npm install` and `npm start`.
4. For automatic CPU-triggered restart, run under a process supervisor. Example: `pm2 start src/server.js --name policy-api --restart-delay 1000` (install PM2 separately). The app exits with code 1 when sampled host-wide CPU reaches 70%; a supervisor is required to restart an exited process.

## API

- `POST /api/upload` — multipart/form-data, field `file`, accepts `.xlsx` or `.csv`. Parsing runs in a Node worker thread. The first worksheet is read for XLSX files. Recognized header names include Agent Name, First Name/User, DOB, Address, Phone Number, State, Zip Code, Email, Gender, User Type, Account Name, Category Name/category_name, Company Name/company_name, Policy Number, Policy Start Date, and Policy End Date. Each row is upserted into separate `agents`, `users`, `accounts`, `lobs`, `carriers`, and `policies` collections. Re-imports update matching email/policy number.
- `GET /api/policies/search?username=Jane` — find policies by user's first name.
- `GET /api/policies/by-user` — returns a policy count and policy list grouped by user.
- `POST /api/messages` — JSON `{ "message": "...", "day": "YYYY-MM-DD", "time": "HH:mm" }`. Time is interpreted in the server's local timezone. The message and requested time are persisted in `scheduledmessages`; a one-second poll stamps `deliveredAt` when due. This records a scheduled message; connect a delivery action at that point if the assessment expects external delivery.
- `GET /health` — health status.

## Notes

The sample sheet was not present when this project was prepared. The importer uses common column aliases; adjust the alias map in `src/import-worker.js` if the supplied sheet uses different headings. `Agent` and `Account` are linked by IDs from the `User` document; policy references use IDs to LOB, Carrier, and User. CPU monitoring uses host-wide CPU counters, sampled every five seconds by default. For production, use a dedicated metrics library and supervise with PM2/systemd/container restart policy.

