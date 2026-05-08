# InterviewlyAI🤖

> InterviewlyAI is an AI-powered interview simulation platform that conducts realistic, voice-driven mock interviews with dynamic question orchestration, resume-aware personalization, intelligent follow-up reasoning, asynchronous evaluation pipelines, and detailed performance analytics — designed to replicate real-world technical and behavioral interview experiences at scale.
---

🚀 **live demo** : https://interviewly-ai-black.vercel.app/login (use chrome)

## Table of Contents

- [About](#about)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Backend Deep Dive](#backend-deep-dive)
  - [Architecture Overview](#architecture-overview)
  - [Authentication & Security](#authentication--security)
  - [Interview Lifecycle](#interview-lifecycle)
  - [AI Question Engine](#ai-question-engine)
  - [Follow-Up Intelligence](#follow-up-intelligence)
  - [Asynchronous Evaluation Pipeline](#asynchronous-evaluation-pipeline)
  - [Resume Processing](#resume-processing)
  - [Interview Plan Builder](#interview-plan-builder)
  - [Report Generation](#report-generation)
  - [API Reference](#api-reference)
- [Frontend Overview](#frontend-overview)
- [Getting Started](#getting-started)
  - [Backend Setup](#backend-setup)
  - [Frontend Setup](#frontend-setup)

---

## About

InterviewlyAI simulates a real technical interview experience. After setting up a session with your target role, company, job description, and optional resume upload, the backend builds a personalized interview plan and drives you through three structured stages — **Intro**, **Technical**, and **Behavioral** — asking GPT-4o-mini-generated questions that adapt to your answers. Every answer is silently evaluated in the background via a Redis job queue, and when the interview ends you receive a detailed score report broken down by stage and question.

---

## Features

### Core
- JWT-secured user accounts with signup and login
- Create fully customizable interview sessions (role, company, JD, focus areas, resume)
- Multi-stage interview flow: **INTRO → TECHNICAL → BEHAVIORAL → END**
- Voice-driven answer input with live transcript (Web Speech API)
- Text-to-speech question read-out (Web Speech Synthesis)
- Session persistence across page refreshes (sessionStorage + server sync)

### AI & Intelligence
- GPT-4o-mini question generation with rich structured prompts
- Intelligent **follow-up classifier** — decides in real time whether the next question should be a `CLARIFICATION`, `DEEP_DIVE`, `CHALLENGE`, or move on (`NONE`)
- Follow-up quota enforcement (max 2 follow-ups per stage, 1 per base question)
- 20+ question categories auto-selected from role/JD/focus areas (DSA, OOP, Backend, Frontend, Database, Behavioral, etc.)
- Anti-repetition guard — last 3 questions injected into every prompt
- AI-generated resume summary used to personalize all questions
- Graceful fallback questions when OpenAI is unavailable

### Evaluation & Reports
- Per-answer async scoring (0–10) with `strengths` and `improvements` from GPT-4o-mini
- Redis-backed job queue with background consumer thread (fire-and-forget, non-blocking)
- Overall performance label: Strong / Good / Average / Needs Improvement
- Stage-level score breakdown (Intro / Technical / Behavioral)
- Per-question feedback view in the report

### Dashboard
- Progress stats: total interviews, completed count, average score, incomplete count
- Recent interviews list with status badges and quick navigation
- Draft form state persisted to localStorage

---

## Tech Stack

### Backend
| Layer | Technology |
|---|---|
| Language | Java 21 |
| Framework | Spring Boot 4.0.6 |
| Security | Spring Security + JWT (jjwt 0.12.7) |
| ORM | Spring Data JPA / Hibernate |
| Database | PostgreSQL |
| Cache / Queue | Redis (Spring Data Redis) |
| HTTP Client | Spring WebFlux `WebClient` |
| AI Model | OpenAI GPT-4o-mini |
| Resume Parsing | Apache Tika 2.9.2 |
| Boilerplate | Lombok |
| Build | Maven (Spring Boot Maven Plugin) |
| Infrastructure | Docker Compose (Redis) |

### Frontend
| Layer | Technology |
|---|---|
| Language | JavaScript (ES Modules) |
| Framework | React 19 |
| Routing | React Router DOM 7 |
| Styling | Tailwind CSS 4 |
| Build Tool | Vite 8 |
| Voice Input | Web Speech API (`SpeechRecognition`) |
| Voice Output | Web Speech Synthesis API |

---

## Project Structure

```
InterviewlyAI/
├── InterviewlyBE/
│   └── Backend/
│       ├── docker-compose.yml              # Redis for local dev
│       ├── pom.xml
│       └── src/main/java/com/khushay/Interviewly/
│           ├── InterviewlyApplication.java
│           ├── config/
│           │   ├── JwtAuthenticationFilter.java
│           │   ├── RedisConfig.java
│           │   └── SecurityConfig.java
│           ├── controller/
│           │   ├── AuthController.java
│           │   ├── DashboardController.java
│           │   ├── InterviewController.java
│           │   └── ReportController.java
│           ├── dto/
│           │   ├── AuthResponse.java
│           │   ├── DashboardResponse.java
│           │   ├── EvaluationJob.java
│           │   ├── EvaluationResult.java
│           │   ├── FollowUpDecision.java
│           │   ├── InterviewAnswerRequest.java
│           │   ├── InterviewCreatedResponse.java
│           │   ├── InterviewRequest.java
│           │   ├── InterviewSessionResponse.java
│           │   ├── InterviewStatusResponse.java
│           │   ├── LoginRequest.java
│           │   ├── MessageResponse.java
│           │   ├── QuestionFeedback.java
│           │   ├── RecentInterviewDto.java
│           │   ├── ReportResponse.java
│           │   └── SignupRequest.java
│           ├── model/
│           │   ├── Evaluation.java
│           │   ├── FollowUpType.java        # NONE | CLARIFICATION | DEEP_DIVE | CHALLENGE
│           │   ├── Interview.java
│           │   ├── InterviewPlanItem.java
│           │   ├── InterviewStage.java      # INTRO | TECHNICAL | BEHAVIORAL | END
│           │   ├── QuestionCategory.java    # 20+ categories
│           │   ├── QuestionType.java
│           │   ├── Response.java
│           │   └── User.java
│           ├── prompt/
│           │   ├── FollowUpPromptStrategy.java
│           │   └── PromptBuilder.java
│           ├── repository/
│           │   ├── EvaluationRepository.java
│           │   ├── InterviewRepository.java
│           │   ├── ResponseRepository.java
│           │   └── UserRepository.java
│           ├── service/
│           │   ├── AppUserDetailsService.java
│           │   ├── AuthService.java
│           │   ├── DashboardService.java
│           │   ├── EvaluationQueueConsumer.java   # Background Redis consumer thread
│           │   ├── EvaluationQueueProducer.java   # Publishes jobs post-transaction
│           │   ├── EvaluationService.java         # GPT-4o-mini scoring
│           │   ├── FallbackQuestionService.java   # OpenAI-failure resilience
│           │   ├── FollowUpClassifierService.java # AI follow-up intent classification
│           │   ├── InterviewPlanService.java      # Dynamic plan builder
│           │   ├── InterviewService.java          # Core interview state machine
│           │   ├── JwtService.java
│           │   ├── OpenAIService.java             # WebClient → GPT-4o-mini
│           │   ├── QuestionTypeStrategy.java
│           │   ├── ReportService.java
│           │   ├── ResumeParser.java              # Apache Tika extraction
│           │   └── ResumeSummarizer.java          # OpenAI resume summarization
│           ├── util/
│           │   ├── RedisQueues.java
│           │   └── ResumeMultipartFileHelper.java
│           └── resources/
│               ├── application.properties
│               └── db/migration/
│
└── InterviewlyFE/
    └── frontend/
        ├── index.html
        ├── vite.config.js
        ├── package.json
        └── src/
            ├── App.jsx
            ├── main.jsx
            ├── assets/                     # SVG icons, hero image
            ├── components/
            │   ├── landing-hero-panel.jsx
            │   └── navbar-brand.jsx
            ├── hooks/
            │   └── useSpeechRecognition.js
            ├── pages/
            │   ├── login.jsx
            │   ├── signup.jsx
            │   ├── dashboard.jsx           # Interview creation + progress stats
            │   ├── interview.jsx           # Live interview session
            │   ├── interviews.jsx          # All interviews list
            │   └── reports.jsx             # Detailed post-interview report
            ├── services/
            │   └── api.js                  # Centralized API client
            └── utils/
                └── speech.js              # TTS helpers
```

---

## Backend Deep Dive

The backend is the core of InterviewlyAI. It is a production-grade Spring Boot application built around a clean layered architecture with a strong emphasis on AI-driven adaptive behaviour, asynchronous processing, and interview state integrity.

### Architecture Overview

```
HTTP Request
     │
     ▼
JwtAuthenticationFilter  ←  SecurityConfig (stateless, BCrypt)
     │
     ▼
Controller (REST)
     │
     ▼
Service Layer
  ├── InterviewService       ← core interview state machine
  ├── InterviewPlanService   ← dynamic question plan builder
  ├── OpenAIService          ← WebClient → GPT-4o-mini
  ├── PromptBuilder          ← structured prompt assembly
  ├── FollowUpClassifierService  ← AI follow-up intent classifier
  ├── EvaluationQueueProducer    ← Redis RPUSH after TX commit
  ├── EvaluationQueueConsumer    ← background daemon thread, Redis LPOP
  ├── EvaluationService          ← GPT-4o-mini answer scoring
  ├── ResumeParser               ← Apache Tika PDF/DOCX extraction
  └── ResumeSummarizer           ← OpenAI resume summarization
     │
     ▼
Repository (Spring Data JPA)
     │
     ▼
PostgreSQL                         Redis (evaluation job queue)
```

### Authentication & Security

- **JWT tokens** issued on login, verified on every protected request via `JwtAuthenticationFilter`
- Passwords hashed with **BCryptPasswordEncoder**
- Fully **stateless** session policy (`SessionCreationPolicy.STATELESS`)
- CORS configured via `CorsConfigurationSource` — all origins permitted for local dev
- Only `/auth/**` endpoints are public; everything else requires a valid JWT

```java
// JwtAuthenticationFilter injects the authenticated principal into SecurityContext
// on every request, making the user identity available in all controllers via:
Authentication auth = SecurityContextHolder.getContext().getAuthentication();
```

### Interview Lifecycle

Each interview progresses through a well-defined state machine:

```
NOT_STARTED  ──►  IN_PROGRESS  ──►  COMPLETED
                      │
              INTRO (2 base q's)
                      │
              TECHNICAL (5 base q's)
                      │
              BEHAVIORAL (3 base q's)
                      │
                     END
```

**Stage question limits:**

| Stage | Base Questions | Max Follow-ups (per stage) | Max Follow-ups (per base) |
|---|---|---|---|
| INTRO | 2 | 2 | 1 |
| TECHNICAL | 5 | 2 | 1 |
| BEHAVIORAL | 3 | 2 | 1 |

- Interview state (stage, question index, follow-up counters, last question text) is **persisted to PostgreSQL** on every answer
- The active stage list and interview plan are kept in a `ConcurrentHashMap` in memory for the duration of a session; they are rebuilt from DB on restart
- Stage transition and follow-up logic live entirely in `InterviewService.submitAnswer()`

### AI Question Engine

`OpenAIService` wraps Spring WebFlux `WebClient` to call the OpenAI Chat Completions API (`gpt-4o-mini`) synchronously (`.block()`). Two token budgets are used:
- **80 tokens** for question generation (concise, single question)
- **400 tokens** for evaluation and follow-up classification responses

`PromptBuilder` assembles a multi-section structured prompt for every question that includes:

1. **Interview Context** — candidate name, role, company, JD, focus areas, resume summary
2. **Stage Rules** — strict instructions per stage (INTRO / TECHNICAL / BEHAVIORAL)
3. **Current Question Category** — one of 20+ `QuestionCategory` values with tailored instructions
4. **Realism Rules** — instructs the model to sound like a real interviewer, not AI-generated
5. **Conversational Variation** — anti-robotic tone guidelines
6. **Follow-Up Logic** — either new base question or typed follow-up intent (`CLARIFICATION`, `DEEP_DIVE`, `CHALLENGE`)
7. **Anti-Repetition** — last 3 asked questions injected to prevent topic or wording reuse
8. **Output Rules** — return only the question text, no labels or preamble, 1–2 lines max

**Question Categories** (selected dynamically from role + focus area + JD corpus):

| Domain | Categories |
|---|---|
| General | `INTRODUCTION`, `RESUME_EXPERIENCE`, `ROLE_FUNDAMENTAL`, `ROLE_SCENARIO` |
| DSA | `DSA_CONCEPT`, `DSA_PROBLEM` |
| OOP | `OOP_CONCEPT`, `OOP_DESIGN` |
| Backend | `BACKEND_FUNDAMENTAL`, `BACKEND_SCENARIO` |
| Frontend | `FRONTEND_FUNDAMENTAL`, `FRONTEND_SCENARIO` |
| Database | `DATABASE_CONCEPT`, `DATABASE_SCENARIO` |
| Projects | `PROJECT_DEEP_DIVE` |
| Behavioral | `TEAMWORK`, `CONFLICT`, `OWNERSHIP`, `STRENGTH_WEAKNESS`, `FAILURE`, `LEADERSHIP` |
| Closing | `END` |

When OpenAI fails for any reason, `FallbackQuestionService` provides a deterministic fallback question selected by a rotation key based on stage, question index, and follow-up count — so the interview never breaks.

### Follow-Up Intelligence

`FollowUpClassifierService` runs after every submitted answer to decide whether a follow-up is warranted. It calls GPT-4o-mini with a dedicated classifier prompt and maps the response to one of four types:

| Type | Meaning |
|---|---|
| `NONE` | Move to the next base question |
| `CLARIFICATION` | Candidate answer was vague or incomplete |
| `DEEP_DIVE` | Candidate mentioned an interesting concept worth exploring |
| `CHALLENGE` | Probe trade-offs, edge cases, or alternative reasoning |

The classifier is deliberately conservative — it is prompted *not* to follow up on every answer, only when there is genuine interviewer value. A follow-up is only triggered if:
- The candidate provided a non-empty, substantive answer
- The per-base follow-up quota (`followUpsIssuedForCurrentBase < 1`) is not exhausted
- The per-stage follow-up quota (`followUpsUsedInStage < 2`) is not exhausted

The classified type is then passed into `PromptBuilder` to generate a contextually targeted follow-up question.

### Asynchronous Evaluation Pipeline

Every submitted answer triggers an evaluation job that runs **entirely outside the HTTP request cycle**:

```
submitAnswer()
    │
    ├── Save Response to PostgreSQL
    │
    ├── Register TransactionSynchronization
    │        └── afterCommit() → EvaluationQueueProducer.publishEvaluationJob()
    │                                   └── Redis RPUSH (evaluation:queue)
    │
    └── Return next question to client immediately (non-blocking)


Background daemon thread (EvaluationQueueConsumer)
    │
    ├── Redis LPOP (evaluation:queue)  [polls every 500ms when empty]
    │
    └── EvaluationService.processEvaluation()
            └── GPT-4o-mini scoring prompt
                    └── Parse JSON { score, strengths, improvements }
                            └── Save Evaluation entity to PostgreSQL
```

Key design decisions:
- The evaluation job is published **after transaction commit** (via `TransactionSynchronizationManager`) to guarantee the `Response` row is visible to the consumer before the job is processed
- The consumer thread is a daemon started with `@PostConstruct` and torn down with `@PreDestroy` — no external messaging infrastructure needed beyond Redis
- Evaluation failures are caught and logged without affecting the live interview

The GPT-4o-mini evaluation prompt uses a strict rubric:

| Score | Meaning |
|---|---|
| 0–2 | Non-answer, irrelevant, or paraphrase of the question |
| 3–4 | Very shallow answer with minimal substance |
| 5–6 | Partially correct, limited depth or clarity |
| 7–8 | Solid, mostly correct, good technical detail |
| 9–10 | Highly accurate, deep, well-structured with strong reasoning |

### Resume Processing

When a resume is uploaded at interview creation:

1. `ResumeMultipartFileHelper` saves the raw file to disk under `uploads/`
2. `ResumeParser` (Apache Tika) extracts plain text from PDF or DOCX
3. `ResumeSummarizer` calls OpenAI to produce a concise summary of the candidate's experience
4. The summary is stored on the `Interview` entity and injected into every question prompt

This ensures questions like "Walk me through your experience with [technology from your resume]" are contextually grounded. The summary is generated **exactly once** per interview and reused for all subsequent prompts (guarded by a `null` check on `resumeSummary`).

### Interview Plan Builder

`InterviewPlanService.buildInterviewPlan()` constructs an ordered list of `InterviewPlanItem` objects before the first question is generated. The plan drives which `QuestionCategory` is selected for each slot:

- **INTRO stage**: always starts with `INTRODUCTION`; second slot is `RESUME_EXPERIENCE` (if resume present) or `ROLE_FUNDAMENTAL`
- **TECHNICAL stage**: always includes `ROLE_FUNDAMENTAL` and `ROLE_SCENARIO`; additional category pairs (DSA, OOP, Backend, Frontend, Database) are added by scanning the combined corpus of role + company + JD + focus areas for keyword signals
- **BEHAVIORAL stage**: fixed sequence of `TEAMWORK → CONFLICT → OWNERSHIP → STRENGTH_WEAKNESS → FAILURE → LEADERSHIP`
- **END**: always closes with a `END` category question

Each category appears at most once in the plan (enforced by a `LinkedHashSet`). This gives the interview a deterministic structure while remaining fully personalized to the candidate's context.

### Report Generation

`ReportService.generateReport()` assembles the final report dynamically from persisted `Response` and `Evaluation` entities:

- **Overall score**: average of all evaluation scores
- **Performance label**: Strong (≥8) / Good (≥6) / Average (≥4) / Needs Improvement (<4)
- **Stage breakdown**: average score per stage (INTRO / TECHNICAL / BEHAVIORAL) computed by response index
- **Per-question feedback**: question text, candidate answer, score, strengths, improvements

The report is generated **on demand** (no materialized view) so it always reflects the latest evaluation state.

### API Reference

All endpoints except `/auth/**` require `Authorization: Bearer <jwt>` header.

| Method | Path | Description |
|---|---|---|
| `POST` | `/auth/signup` | Register a new user |
| `POST` | `/auth/login` | Login and receive JWT + name |
| `POST` | `/interview` | Create a new interview session (multipart/form-data) |
| `GET` | `/interview/{id}/session` | Get or start the interview session (returns first question) |
| `POST` | `/interview/{id}/answer` | Submit an answer, receive next question |
| `GET` | `/dashboard` | Fetch progress stats and recent interviews |
| `GET` | `/report/{id}` | Fetch detailed post-interview report |

**POST `/interview`** — multipart fields:

| Field | Type | Required |
|---|---|---|
| `role` | String | Yes |
| `company` | String | No |
| `jobDescription` | String | No |
| `focusAreas` | JSON array string | No |
| `resume` | File (PDF/DOCX, max 5MB) | No |

---

## Frontend Overview

The frontend is a React 19 SPA built with Vite 8 and Tailwind CSS 4 with a dark, glassmorphism-style UI.

**Pages:**

| Page | Route | Description |
|---|---|---|
| Landing | `/` | Hero panel with product intro |
| Login | `/login` | JWT login form |
| Signup | `/signup` | User registration form |
| Dashboard | `/dashboard` | Interview creation form + progress stats + recent interviews |
| Interview Session | `/interview/:id` | Live interview — voice input, live transcript, stage badge, TTS read-out |
| All Interviews | `/interviews` | Full interview history with status filters |
| Report | `/reports/:id` | Score breakdown, stage performance, per-question feedback |

**Voice features** in the interview page:
- `useSpeechRecognition` hook wraps the `SpeechRecognition` Web API — microphone button toggles listening on/off, transcript is appended to the answer field in real time
- `speakText` / `stopSpeaking` utilities wrap `SpeechSynthesisUtterance` — every new question is automatically read aloud, with a manual replay button

**Session resilience**: the current question and stage are written to `sessionStorage` on every update, so a page refresh restores the last known state instantly while the app re-syncs with the server in the background.

---

## Getting Started

### Backend Setup

**Prerequisites:** Java 21, Maven, PostgreSQL, Docker (for Redis)

```bash
# 1. Start Redis
cd InterviewlyBE/Backend
docker-compose up -d

# 2. Create PostgreSQL database
createdb interviewly

# 3. Configure application.properties
#    Set: spring.datasource.url, username, password
#    Set: openai.api.key
#    Set: jwt.secret

# 4. Run the application
./mvnw spring-boot:run
# Server starts on http://localhost:8081
```

### Frontend Setup

**Prerequisites:** Node.js 18+

```bash
cd InterviewlyFE/frontend

# Install dependencies
npm install

# Set API base URL in .env
# VITE_API_BASE_URL=http://localhost:8081

# Start dev server
npm run dev
# App runs on http://localhost:5173
```

---

> Built with Java 21, Spring Boot, OpenAI GPT-4o-mini, Redis, PostgreSQL, React 19, and Tailwind CSS 4.
