# Due Date Changes — LJ Hooker City Residential

Single-page reporting dashboard: **Jobs where due date changed**, built with React + TypeScript + Vite and antd, styled with the LJ Hooker office-site brand tokens (Vintage Leather `#5E211C`, Linen `#FFF9EB`, Instrument Sans, pill buttons).

```sh
npm install
npm run dev     # http://localhost:5173
npm test        # change-detection unit tests
npm run build
```

## How the data flows

1. **Sync job (not built):** every 4 hours in business hours, call PropertyMe `GET /jobtasks` (ChangedJobTaskRequest) and append each returned task to a history table as a snapshot (`JobTaskSnapshot`: `retrievedAt` + the raw payload).
2. **Change detection:** `src/domain/detectDueDateChanges.ts` compares each snapshot with the previous snapshot of the same job task and emits a `DueDateChange` when `DueDate` differs. In production this would be a `LAG()` query or run in the sync job.
3. **Report API (mocked):** `src/api/dueDateChanges.ts` stands in for `GET /api/reports/due-date-changes?from=&to=`. It is backed by generated history in `src/data/mockHistory.ts`.

## Caveat: "Changed by"

The PropertyMe JobTask payload has **no "updated by" field**. `changedBy` currently uses `ManagerName` from the snapshot carrying the new date, which is the *assigned* manager, not necessarily the person who made the edit. To report the true editor you need an audit/activity source from PropertyMe, if one is available.

Also, with 4-hourly polling, several edits to the same job between polls collapse into one change (first → last).
