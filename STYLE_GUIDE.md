# Worxstance Project Style Guide

This document serves as the single source of truth for development standards, architectural patterns, and content guidelines for the Worxstance Career Workspace. It is derived from the project's `.cursorrules` and background documentation.

## 1. Project Overview

**Mission:** To provide an AI-powered job-search and career-success workspace that empowers users through every stage of their career journey.

**Core Features (The 9 Tools):**
The application is organized around 9 core tools:
1.  **Job Discovery** (Job Search & Matching)
2.  **Networking CRM** (Strategic Outreach Manager)
3.  **Skill Gap Analyzer**
4.  **AI Resume Tailor**
5.  **AI Cover Letter Generator**
6.  **STAR Story Builder** (Behavioral Interview Prep)
7.  **Mock Interview Simulator**
8.  **Follow-Up Manager** (Post-Interview CRM)
9.  **Offer Negotiator** (Total Compensation Calculator & Scripts)

**Reference Documentation:**
Before starting major work, consult the `/background` directory for strategy and structure:
-   `project-plan.pdf`: Overall project roadmap.
-   `content-blueprint.pdf`: Content strategy.
-   `project-style-guide.pdf`: Detailed design and voice guidelines.
-   `folder-structure.pdf`: File organization.
-   `structure-outputs.pdf`: Data schemas for AI outputs.
-   `ideal-customer-profile.pdf`: Target audience definition.

---

## 2. Architecture & File Structure

**Design Pattern:** Feature-Sliced Design.

**Directory Structure:**
-   **`src/features/`**: Contains all feature-specific logic, UI, and state. Must use the numeric prefix pattern:
    -   `01_job_discovery`
    -   `02_networking`
    -   `03_skill_gap_analyzer`
    -   `04_ai_resume_tailor`
    -   `05_ai_cover_letter_generator`
    -   `06_star_story_builder`
    -   `07_mock_interview_simulator`
    -   `08_post_interview_follow_up`
    -   `09_offer_negotiator`
-   **`src/components/`**: Strictly for general, reusable UI components (e.g., buttons, inputs, modals). *No business logic.*
-   **`src/hooks/`**: Shared custom hooks (e.g., `useFirestore`, `useGemini`).
-   **`src/contexts/`**: Global state providers (e.g., Auth, Master Profile).
-   **`backend/`** or **`functions/`**: Server-side logic.

**Rules:**
-   Do not cross-import feature-specific logic into shared components.
-   Keep feature folders self-contained.

---

## 3. Tech Stack & Coding Standards

-   **Language**: TypeScript (`.tsx`, `.ts`) exclusively.
-   **Framework**: React (Functional Components with Hooks).
-   **Styling**: **Tailwind CSS** exclusively.
    -   Do not use `.css` files or CSS modules.
    -   Do not use large inline style objects.
-   **State Management**:
    -   Use **Context API** for global state (Auth, Master Profile, Job List).
    -   Avoid redundant local state for data that belongs in a global context.
    -   Defined contexts live in `src/contexts/`.

---

## 4. Data & Backend Integration

**Database**: Firebase Firestore.

**Access Patterns:**
-   **Must** use the custom `useFirestore` hook for all database interactions (`get`, `set`, `onSnapshot`).
-   **Never** call Firestore SDK functions (`doc`, `collection`) directly in components.

**Path Structure:**
-   **Enforcement**: All paths must be dynamically constructed.
-   **Pattern**: `/artifacts/${__app_id}/users/${userId}/...`
-   Do not hardcode paths.

**Authentication Guards:**
-   All database operations must be guarded by the `isAuthReady` flag from the Auth Context.
-   Pattern: `if (!isAuthReady) return;`

---

## 5. AI Integration (Gemini)

**Client**: Google Gemini API.

**Implementation:**
-   **Must** use the `useGemini` hook.
-   **Model**: `gemini-2.5-flash-preview-09-2025`.

**Requirements:**
1.  **Structured Output**: All feature tools (01-09) must request structured JSON output using a defined `responseSchema`.
2.  **Grounding**:
    -   **Job Discovery (01)** and **Offer Negotiator (09)** must include the Google Search tool in the payload: `tools: [{"google_search": {}}]`.
3.  **Privacy**:
    -   Do not log sensitive compensation data unless critical.
    -   Include disclaimers that output is educational, not legal/financial advice.

---

## 6. Telemetry & Analytics

**Stack:**
-   **Google Analytics 4**: Marketing traffic.
-   **Stripe**: Billing and financial metrics.
-   **PostHog**: In-app engagement and feature usage.
-   **Sentry**: Error logging.
-   **Firestore Counters**: Usage limits (e.g., free tier limits).

**Implementation:**
-   Use shared helpers in `src/lib/` (e.g., `src/lib/analytics.ts`).
-   Do not implement ad-hoc tracking calls inline.

---

## 7. Voice & Tone

**Brand Persona**: Confident, empathetic, practical coach.

**Guidelines:**
-   **Audience**: Serious job seekers.
-   **Tone**: Encouraging but realistic; professional but accessible.
-   **Copy**: Actionable and personalized.
-   **Outreach**: Follow structures in `content/email-sequence.pdf` and `content/strategic-outreach.pdf`.

---

*This file is maintained by the development team. Refer to `.cursorrules` for automated enforcement of these policies.*

