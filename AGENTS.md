# Project architecture

- Compute displayed payment due dates through `src/lib/payment-due.ts`; database payment status remains the source of truth for debt state.
- Dashboard sections use the index route's validated `tab` search parameter and stay mounted while hidden so navigation preserves panel state and subscriptions.
- Apply UI-language typography through a presentation-only document language bridge so Georgian headings, including portaled dialogs, use the bundled Georgian font.
- Derive dashboard financial summaries in a pure presentation module using paidOf/remainingOf and database statuses, never recomputing overdue status.
- Share one Index-owned useSchedule instance between Home and SchedulePanel so schedule edits refresh both views without changing hook write logic.
- Parse bank files only in the browser and keep matching/allocation in a pure module; source statements must never reach storage or the server.
- Apply bank imports through an owner-scoped atomic SQL RPC with payment row locks and expected-paid checks; ledger, allocations and optional aliases commit together to prevent duplicate or stale reconciliation.
- Keep bank import table types in a feature-owned client module rather than editing generated integration files; generated types remain platform-managed.
- Fetch complete paginated payment balances at bank review time, independent of dashboard hook row limits; every unpaid historical month must participate in allocations.- Bank imports are undoable per batch: the apply RPC records server-built allocations with previous payment dates and a batch id; undo runs in one SQL transaction and refuses if a payment changed since.

- Scope workspace tokens and shared-control refinements through html[data-app-ui], restored on unmount, so public pages keep their existing presentation.
- Scope sign-in and registration appearance through a restored data-public-ui document boundary; reusable presentation helpers own image loading and motion so routes keep their auth, fields and metadata unchanged.
- Use responsive generated WebP atmosphere with local blurred placeholders and current-variant preload; dashboard imagery stays fixed behind opaque workspace surfaces to preserve readability.
