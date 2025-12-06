# Worxstance

**An AI-powered job-search and career-success workspace that empowers users through every stage of their career journey.**

Worxstance brings together everything you need—from job discovery to offer negotiation—powered by AI that understands your career goals. Stop juggling spreadsheets and scattered tools. Own your job search with one comprehensive workspace.

---

## 🎯 Mission

To provide a unified, AI-powered platform that guides serious job seekers through the entire job search lifecycle, from discovery to negotiation, with intelligent automation, personalized insights, and strategic career coaching.

---

## 🛠️ The 9 Core Tools

Worxstance is organized around 9 integrated feature tools that work together to create a seamless job search experience:

### 1. **Job Discovery** (Job Search & Matching)
AI-powered job search that combines multiple data sources (Adzuna, Jooble, Google Search Grounding) to find relevant opportunities. Features intelligent match scoring based on skills, experience, role relevance, and location. Automatically extracts required and preferred skills from job descriptions and provides detailed match breakdowns.

### 2. **Networking CRM** (Strategic Outreach Manager)
Centralized relationship management for professional networking. Track contacts, manage outreach sequences, and automate follow-ups. Generate personalized connection requests, LinkedIn messages, and email templates based on your Master Profile and target opportunities.

### 3. **Skill Gap Analyzer**
Identify the skills you need to develop to match your target roles. Compare your current skill set against job requirements, receive personalized learning recommendations, and track your progress as you upskill. Get actionable insights on which skills will have the biggest impact on your job search.

### 4. **AI Resume Tailor**
Automatically optimize your resume for specific job descriptions. The AI analyzes job requirements and rewrites your summary, achievements, and experience entries to highlight relevant keywords and accomplishments. Maintains authenticity while maximizing ATS compatibility and human appeal.

### 5. **AI Cover Letter Generator**
Generate compelling, personalized cover letters tailored to each job application. The AI crafts persuasive narratives that connect your experience to the role's requirements, incorporating your STAR stories and demonstrating cultural fit.

### 6. **STAR Story Builder** (Behavioral Interview Prep)
Build and refine your Situation-Task-Action-Result stories for behavioral interviews. Organize your accomplishments into a searchable library, get AI suggestions for improvement, and practice articulating your experiences with confidence.

### 7. **Mock Interview Simulator**
Practice interviews with AI-powered questions based on your target roles. Receive real-time feedback on your responses, practice common behavioral and technical questions, and build confidence before the real interview.

### 8. **Follow-Up Manager** (Post-Interview CRM)
Never miss a follow-up opportunity. Automated reminders, email templates, and tracking for post-interview communications. Manage thank-you notes, status check-ins, and relationship nurturing across all your applications.

### 9. **Offer Negotiator** (Total Compensation Calculator & Scripts)
Navigate offer negotiations with confidence. Calculate total compensation value, compare offers, and generate negotiation scripts tailored to your situation. Get AI-powered advice on salary, benefits, equity, and other compensation elements (educational purposes only).

---

## 🏗️ Architecture

### Design Pattern
**Feature-Sliced Design** - All application logic, UI, and state are organized under feature-specific folders with numeric prefixes (01-09).

### Tech Stack

#### Frontend
- **React 18** with TypeScript
- **Vite** - Build tool and dev server
- **React Router** - Client-side routing
- **Tailwind CSS** - Utility-first styling
- **React Hook Form** - Form management with Zod validation
- **Lucide React** - Icon library

#### Backend & Services
- **Firebase Authentication** - User authentication
- **Firebase Firestore** - Database with real-time updates
- **Firebase Hosting** - Static site hosting
- **Firebase Analytics** - Usage tracking

#### AI & External APIs
- **Google Gemini 2.5 Flash** - AI-powered analysis and content generation
- **Adzuna API** - Job board integration
- **Jooble API** - Job board integration
- **Google Search Grounding** - Real-time web search for job discovery

#### Development Tools
- **TypeScript** - Type safety
- **Vitest** - Unit testing
- **Cypress** - E2E testing
- **ESLint** - Code linting

---

## 📁 Project Structure

```
Worxstance/
├── src/
│   ├── features/              # Feature modules (01-09)
│   │   ├── 01_job_discovery/
│   │   ├── 02_networking/
│   │   ├── 03_skill_gap_analyzer/
│   │   ├── 04_ai_resume_tailor/
│   │   ├── 05_ai_cover_letter_generator/
│   │   ├── 06_star_story_builder/
│   │   ├── 07_mock_interview_simulator/
│   │   ├── 08_post_interview_follow_up/
│   │   ├── 09_offer_negotiator/
│   │   └── master_profile/   # Master Profile editor
│   ├── components/           # Reusable UI components
│   │   ├── common/           # Common components
│   │   └── ui/               # UI primitives
│   ├── contexts/             # React Context providers
│   │   ├── AuthContext.tsx
│   │   ├── MasterProfileContext.tsx
│   │   └── JobTrackerContext.tsx
│   ├── hooks/                # Custom React hooks
│   │   ├── useFirestore.ts  # Firestore abstraction
│   │   ├── useGemini.ts      # Gemini API wrapper
│   │   └── useLocalStorage.ts
│   ├── lib/                  # Shared utilities
│   │   ├── firebase.ts       # Firebase initialization
│   │   ├── types.ts          # TypeScript interfaces
│   │   ├── utils.ts          # Helper functions
│   │   └── jobBoardConfig.ts # Job board API config
│   ├── pages/                # Page components
│   │   ├── Dashboard.tsx
│   │   ├── Login.tsx
│   │   ├── LandingPage.tsx
│   │   └── MasterProfile.tsx
│   └── App.tsx               # Main app component
├── background/               # Reference documentation (PDFs)
├── content/                  # Content templates and guides
├── public/                   # Static assets
├── functions/                # Firebase Cloud Functions (if needed)
└── cypress/                  # E2E tests
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** 18+ and npm
- **Firebase account** with a project set up
- **Google Gemini API key** (optional for development, required for AI features)
- **Job board API keys** (optional):
  - Adzuna App ID and App Key
  - Jooble API Key

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd Worxstance
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   
   Create a `.env` file in the root directory:
   ```env
   # Required: Firebase Configuration
   VITE_FIREBASE_API_KEY=your_api_key
   VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=your_project_id
   VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   VITE_FIREBASE_APP_ID=your_app_id
   VITE_FIREBASE_MEASUREMENT_ID=your_measurement_id  # Optional

   # Required: Application ID
   VITE_APP_ID=your_app_id

   # Optional: AI and Job Board APIs
   VITE_GEMINI_API_KEY=your_gemini_api_key
   VITE_ADZUNA_APP_ID=your_adzuna_app_id
   VITE_ADZUNA_APP_KEY=your_adzuna_app_key
   VITE_JOOBLE_API_KEY=your_jooble_api_key
   ```

   **Note:** The app supports both `VITE_FIREBASE_*` and `VITE_APP_FIREBASE_*` naming conventions for Firebase variables.

4. **Start the development server**
   ```bash
   npm run dev
   ```

   The app will open in Chrome at `http://localhost:5173`

### Building for Production

```bash
npm run build
```

The production build will be in the `dist/` directory, ready for deployment to Firebase Hosting.

### Deploy to Firebase

```bash
firebase deploy
```

---

## 🔑 Key Features

### Master Profile
The single source of truth for your professional information:
- Personal information and contact details
- Work experience with achievements
- Education history
- Certifications
- Skills inventory
- Summary and career objectives

All tools reference the Master Profile to personalize outputs and recommendations.

### Job Tracking Dashboard
Centralized hub for managing your job applications:
- Track job postings with status (Open, Applied, Interview, Offer, Rejected)
- View match scores and detailed breakdowns
- Quick actions: Build resume, generate cover letter, view posting
- Manual job entry with automatic detail extraction
- Status management throughout the hiring process

### AI-Powered Intelligence
- **Structured Output**: All AI responses use defined schemas for reliable parsing
- **Web Grounding**: Job Discovery and Offer Negotiator use Google Search for real-time data
- **Skill Extraction**: Automatically identifies required and preferred skills from job descriptions
- **Match Scoring**: Multi-factor analysis (skills, experience, role relevance, location)

---

## 🧪 Testing

### Run Unit Tests
```bash
npm test
```

### Run E2E Tests
```bash
npm run cypress:open
```

---

## 📝 Development Guidelines

### Code Style
- **TypeScript**: All new code must be in TypeScript
- **Functional Components**: Use React hooks, no class components
- **Tailwind CSS**: Exclusive use of utility classes, no separate CSS files
- **Feature-Sliced Design**: All feature logic in `src/features/XX_module_name/`

### State Management
- **Context API**: For global state (Auth, Master Profile, Job Tracker)
- **Local State**: React hooks for component-specific state
- **Firestore**: All database operations through `useFirestore` hook

### AI Integration
- **useGemini Hook**: All Gemini API calls must use this hook
- **Structured Output**: All AI features must define and use `responseSchema`
- **Error Handling**: Graceful degradation with user-friendly messages

### Database Access
- **Dynamic Paths**: All Firestore paths use `__app_id` and `userId` variables
- **Auth Guards**: Database operations only after `isAuthReady` is true
- **Pattern**: `/artifacts/${__app_id}/users/${userId}/...`

### Environment Variables
- All sensitive keys in `.env` file (never commit)
- Use `import.meta.env.VITE_*` to access variables
- Validate required config on app initialization

---

## 🔒 Security & Privacy

- **Firebase Security Rules**: Enforce user data isolation
- **API Keys**: Never exposed in client-side code
- **User Data**: All data scoped to authenticated users
- **Compensation Data**: Minimal logging, clear disclaimers
- **CORS**: Handled appropriately for external APIs

---

## 📊 Analytics & Telemetry

- **Google Analytics 4**: Marketing traffic and conversion tracking
- **PostHog**: In-app engagement and feature usage
- **Sentry**: Error logging and monitoring
- **Firestore Counters**: Usage limits for free tier enforcement
- **Stripe**: Billing and subscription metrics

---

## 🗺️ Roadmap

### MVP Wave 1 (Current)
- ✅ Job Discovery with AI matching
- ✅ Master Profile editor
- ✅ AI Resume Tailor
- ✅ Job Tracking Dashboard
- ✅ Skill Gap Analyzer

### MVP Wave 2 (Planned)
- Networking CRM
- AI Cover Letter Generator
- STAR Story Builder

### MVP Wave 3 (Planned)
- Mock Interview Simulator
- Follow-Up Manager
- Offer Negotiator

---

## 🤝 Contributing

This is a private project. For questions or suggestions, please contact the project maintainers.

---

## 📄 License

[Add your license information here]

---

## 🙏 Acknowledgments

Built with:
- [React](https://react.dev/)
- [Firebase](https://firebase.google.com/)
- [Google Gemini](https://deepmind.google/technologies/gemini/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Vite](https://vitejs.dev/)

---

## 📚 Additional Resources

- **Project Documentation**: See `/background` directory for detailed planning documents
- **Content Guidelines**: See `/content` directory for templates and style guides
- **Style Guide**: See `STYLE_GUIDE.md` for development standards

---

**Worxstance** - Own your job search. Own your career.

