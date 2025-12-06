# 02 – Networking CRM (Strategic Outreach Manager)

Implements the pipeline described in `background/project-plan.pdf` §2.2 and follows the tone + structure guidance from:

- `background/project-style-guide.pdf`
- `content/email-sequence.pdf`
- `content/strategic-outreach.pdf`
- `background/structure-outputs.pdf`

## Key Pieces

| File | Purpose |
| --- | --- |
| `NetworkingCRM.tsx` | Kanban UI (New → Warm → Meeting → Closed), bulk send composer, ICP template surface. |
| `OutreachGenerator.tsx` | `useGemini` helper that enforces structured JSON output for outreach drafts. |
| `schemas.ts` | Zod + JSON schema definitions for Gemini responses. |

## Data Model

Stored in Firestore per user namespace: `/artifacts/${__app_id}/users/${userId}/`.

- `networking_tracker`: `NetworkingContact` documents with activity feed arrays for each contact.
- `outreach_sequences`: `OutreachSequence` docs for AI-generated drafts, manual bulk sends, and status tracking.
- `usage_counters`: Shared collection (via `useUsageCounters`) for enforcing free-tier bulk send limits.

## Context & Hooks

- `NetworkingContext.tsx`: subscribes to both collections, exposes CRUD helpers, logs PostHog events via `src/lib/analytics.ts`, and offers `bulkSendWithTemplate` with counter enforcement.
- `useUsageCounters.ts`: shared counter helper built on top of `useFirestore`.

## UX Overview

1. **Pipeline View** – Column layout with priority tags, recent activity chips, quick stage advancement.
2. **Contact Intake** – Form references Firestore path + ICP tags.
3. **ICP Template Card** – Reminds writers of blueprint guidance (mutual value, proof point, CTA).
4. **AI Outreach Generator** – Structured prompts referencing Master Profile data, displays subject/opener/body/CTA with personalization notes.
5. **Bulk Send Panel** – Allows selecting contacts across stages, editing template snippets, and triggers `bulkSendWithTemplate`.

## AI + Analytics

- All Gemini calls run through `useGemini`, `responseSchema` defined in `schemas.ts`.
- PostHog client initialized in `src/lib/analytics.ts`; events fired for contact creation, stage change, AI drafts, bulk sends.
- Usage counters guard the “bulk send” CTA (default 20/day for free tier; see `useUsageCounters`).

## Testing

Corresponding Vitest suites live under `src/test/` to cover:

- Pipeline rendering and stage badges (`NetworkingCRM.test.tsx`).
- Gemini draft flow and save CTA (`OutreachGenerator.test.tsx`).

Extend these tests whenever schema/UX updates land. 
