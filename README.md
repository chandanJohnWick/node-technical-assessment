# Policy assessment API

JavaScript/Node.js REST API for importing policy spreadsheets into MongoDB, finding policies by user, aggregating policies per user, scheduling messages, and exiting when sampled host CPU reaches a configured threshold.

## Run locally (Windows)

1. Install Node.js 20+ and MongoDB Community Server. During setup, enable the MongoDB Windows service, or start `mongod` manually.
2. Confirm MongoDB is listening on `mongodb://127.0.0.1:27017`.
3. From this project folder, run `Copy-Item .env.example .env` (PowerShell), then run `npm install` and `npm start`.
4. The API listens at `http://localhost:3000` by default.

The sample workbook is `sample-policies.xlsx`; it contains synthetic data only: Alice has two policies and Bob has one. Uploading is repeat-safe for matching email addresses and policy numbers.

## Postman walkthrough

1. **Upload the sheet**: `POST http://localhost:3000/api/upload`. Select **Body → form-data**, add key `file`, change its type from Text to **File**, and choose `sample-policies.xlsx`. Expected response: `{"imported":3}`.
2. **Search Alice's policies**: `GET http://localhost:3000/api/policies/search?username=Alice`. Expected `count` is 2.
3. **Aggregate by user**: `GET http://localhost:3000/api/policies/by-user`. Expected groups include Alice with 2 policies and Bob with 1.
4. **Schedule a message**: `POST http://localhost:3000/api/messages`, Body → raw → JSON, for example:
   ```json
   { "message": "Sample reminder", "day": "2026-10-03", "time": "14:30" }
   ```
   The message is saved with `scheduledAt`; the app marks `deliveredAt` once due. Time is interpreted in the server's local timezone.
5. **Health check**: `GET http://localhost:3000/health`.

Alternatively, upload with PowerShell:

```powershell
curl.exe -F "file=@sample-policies.xlsx" http://localhost:3000/api/upload
```

## API reference

- `POST /api/upload` — multipart/form-data field `file`; accepts `.xlsx` and `.csv`. Parsing runs in a Node worker thread. XLSX uses the first worksheet. Supported columns include Agent Name, First Name/User, DOB, Address, Phone Number, State, Zip Code, Email, Gender, User Type, Account Name, Category Name/category_name, Company Name/company_name, Policy Number, Policy Start Date, and Policy End Date. Data is stored in separate `agents`, `users`, `accounts`, `lobs`, `carriers`, and `policies` collections.
- `GET /api/policies/search?username=Alice` — case-insensitive exact match against user's first name, then returns linked policies.
- `GET /api/policies/by-user` — policy count and policy list grouped by user.
- `POST /api/messages` — JSON body `{ "message": "...", "day": "YYYY-MM-DD", "time": "HH:mm" }`.
- `GET /health` — health status.

## CPU restart behavior

The monitor samples host-wide CPU counters every five seconds by default and exits with code 1 at or above 70%. Run under a supervisor such as PM2, systemd, or a container restart policy for automatic restart. Example with PM2: `pm2 start src/server.js --name policy-api --restart-delay 1000`.

## Notes

The original assessment sample sheet was not available, so the importer uses common header aliases; adjust the alias map in `src/import-worker.js` if needed. Agent and Account link from User by IDs; Policy references LOB, Carrier, and User IDs. The scheduled-message endpoint stores the record and due timestamp; connect a delivery action if external message delivery is expected. No live hosting deployment or MongoDB credentials are included.
