# Taleem

**Multi-tenant school management SaaS for Pakistan.**

Each school is an isolated tenant on one platform. Greenwood never sees City Model data. Admins, teachers, accountants, parents, and students work in **English and Urdu**, with fees and payroll in **PKR (paisa, never floats)**.

> School management for Pakistan, built for many schools on one platform.

---

## What it does today

| Area | Capabilities |
| --- | --- |
| **Multi-tenant SaaS** | Subdomain per school (`greenwood.localhost:3000`), Super Admin for plans, tenants, and platform billing |
| **School setup** | Academic years, classes, sections, subjects, branding (logo, header/footer) |
| **Students & staff** | Admissions/records, guardians, CSV import, role-based access (Admin, Teacher, Accountant, Parent, Student) |
| **Attendance** | Daily registers, status tracking, absence alert path (WhatsApp/SMS ready) |
| **Fees** | Fee structures, monthly challans, auto-invoice schedule, partial/overdue, reminders, parent pay page (`/pay/[id]`) — cash/bank manual; JazzCash / EasyPaisa sandbox hooks |
| **Exams** | Exams, marks entry, grades, bilingual report cards (plan-gated) |
| **Timetable** | Weekly timetable by class/section (plan-gated) |
| **Payroll** | Staff payroll records in PKR (plan-gated) |
| **Certificates** | School-branded certificates (plan-gated) |
| **Announcements** | School notices with broadcast path (SMS / WhatsApp plan flags) |
| **Social posts** | Composer for Facebook, Instagram, WhatsApp, YouTube, TikTok, X — draft, schedule, mark published (live OAuth posting not wired yet) |
| **Portals** | Parent and student portals (plan-gated) |
| **Reports** | School overview dashboards; Super Admin platform reports |
| **i18n** | Full EN / اردو via `next-intl` |

### Plans (seed defaults)

| Plan | Monthly | Max students | Highlights |
| --- | --- | --- | --- |
| **Starter** | PKR 4,999 | 200 | Core ops + WhatsApp alert flag |
| **Standard** | PKR 9,999 | 2,500 | Exams, timetable, payroll, certificates, portals, SMS broadcast |

Feature flags: `payroll`, `certificates`, `timetable`, `parentPortal`, `studentPortal`, `smsBroadcast`, `whatsappAlerts`, `exams`.

---

## Stack

- **Next.js 14** (App Router) + TypeScript + Tailwind + Radix UI  
- **PostgreSQL** + **Prisma** (shared DB, tenant isolation via `schoolId`)  
- **NextAuth** (credentials)  
- **next-intl** (English / Urdu)  
- **Vitest** for unit tests  
- Docker Compose for local Postgres  

---

## Quick start

```bash
# 1. Postgres
npm run db:up

# 2. Env
cp .env.example .env

# 3. Schema + demo tenants
npm install
npx prisma migrate dev   # or: npm run db:push
npm run db:seed

# 4. App
npm run dev
```

Open:

| URL | Purpose |
| --- | --- |
| `http://localhost:3000` | Platform marketing / onboarding |
| `http://greenwood.localhost:3000` | Demo school (seed) |
| `http://citymodel.localhost:3000` | Second demo tenant |
| `http://localhost:3000/super-admin` | Platform owner |

Seeded credentials are printed by `npm run db:seed` (check terminal output).

Useful scripts: `npm test`, `npm run db:studio`, `npm run db:seed:history`.

---

## Architecture notes

- **One database, many schools** — every school-scoped row carries `schoolId`; APIs and UI never cross tenants.
- **Money** — amounts stored as integer **paisa** (`1 PKR = 100`).
- **Hosts** — `PLATFORM_DOMAIN` drives subdomain parsing (e.g. `localhost:3000` locally, `yourdomain.com` in production with wildcard DNS).
- **Cron** — `/api/cron/invoices` and `/api/cron/platform-billing` (Bearer `CRON_SECRET`) for monthly fee invoices and SaaS billing.
- **Uploads** — local `uploads/` today; S3-compatible env placeholders for production.

See [docs/INTEGRATIONS.md](docs/INTEGRATIONS.md) for vendor wiring (JazzCash, EasyPaisa, WhatsApp, SMS, email, social OAuth, S3).

---

## Future add-ons

Core school ops already run without these. They sit on existing data, notifications, and report interfaces.

### A. Production integrations (interfaces exist)

| Add-on | Status / intent |
| --- | --- |
| **JazzCash / EasyPaisa (school fees)** | Sandbox stubs → live merchant per school |
| **Platform billing gateway** | Manual SaaS payments → Taleem’s own JazzCash/EasyPaisa/bank |
| **WhatsApp Cloud API** | Absence, fee reminders, announcements (approved PK templates) |
| **SMS** | Twilio or Pakistan aggregator; fallback when WhatsApp fails |
| **Transactional email** | Password reset, receipts, invoices (SMTP / Resend / SES) |
| **Social OAuth publish** | One-click post to Meta, YouTube, TikTok, X |
| **Object storage** | S3 / R2 / MinIO for logos, certificates, social media |
| **Wildcard hosting** | `*.taleem.pk` (or your domain) + SSL + Vercel/server cron |

Details: [docs/INTEGRATIONS.md](docs/INTEGRATIONS.md).

### B. AI modules (planned product layer)

Positioning: *Taleem runs your school today. AI is the next layer — English and Urdu, for Pakistan schools.*

| Module | What it adds |
| --- | --- |
| **School AI assistant** | Chat for admin / teacher / limited parent questions on *that* school’s data only |
| **Exam / paper generator** | Draft MCQ / short / long papers EN+UR; staff review before print |
| **AI report drafts** | Principal monthly narrative, class performance summary, platform digest |
| **Smart message drafts** | WhatsApp / SMS / email copy for absences, fees, announcements |
| **Social caption writer** | EN+UR captions and hashtags for the existing social composer |
| **Report-card remarks** | Suggested bilingual remarks after marks entry |
| **Attendance & dropout early warning** | Flag rising absences / fee default; suggest parents to call |
| **Fee recovery assistant** | Reminder schedule and tone; accountant still confirms send |
| **Timetable helper** | Draft week + clash warnings |
| **Lesson plans & homework** | Teacher copilot from subject/class |
| **Bilingual content helper** | School-tone EN ↔ UR rewrite for notices and certificates |
| **Parent portal Q&A** | Fees / results / timetable answers from the child’s records |
| **Admissions enquiry bot** | Public FAQ + lead capture into admissions |

**Guardrails:** tenant isolation; draft → review → send/print; never invent marks, money, or attendance; sellable as an **AI pack** so Starter stays cheaper.

Suggested build order and more detail: [docs/AI-ROADMAP.md](docs/AI-ROADMAP.md).

### C. Product expansions (roadmap)

- Mobile apps (parent / teacher) on top of existing APIs  
- Biometric / QR attendance devices  
- Library, transport, and inventory modules  
- Multi-campus under one school group  
- Deeper LMS (assignments, content) alongside exams  
- Bank IBAN on challans + payment-proof upload  

---

## Docs

| Doc | Contents |
| --- | --- |
| [docs/INTEGRATIONS.md](docs/INTEGRATIONS.md) | Live vendor checklist (payments, WhatsApp, SMS, email, social, storage, cron) |
| [docs/AI-ROADMAP.md](docs/AI-ROADMAP.md) | AI add-on specs and build order |

---

## License

Private / proprietary unless otherwise noted. Contact the maintainer for deployment or partnership.
