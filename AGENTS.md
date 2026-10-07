# Project architecture

- Compute displayed payment due dates through `src/lib/payment-due.ts`; database payment status remains the source of truth for debt state.
- Dashboard sections use the index route's validated `tab` search parameter and stay mounted while hidden so navigation preserves panel state and subscriptions.
- Apply UI-language typography through a presentation-only document language bridge so Georgian headings, including portaled dialogs, use the bundled Georgian font.
- Derive dashboard financial summaries in a pure presentation module using paidOf/remainingOf and database statuses, never recomputing overdue status.
- Share one Index-owned useSchedule instance between Home and SchedulePanel so schedule edits refresh both views without changing hook write logic.