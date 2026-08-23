# EduBonke College Management Platform

EduBonke is a multi-tenant administration and academic operations platform designed for South African private-college workflows. Version 1.3 is a working, synthetic-data prototype that can run at R0 using GitHub Pages, with Supabase Free available for connected multi-device testing.

## Interactive demo

Open the deployed site and select **Explore with dummy data**, or visit:

```text
https://edubonke.github.io/EduBonke/demo/
```

The demo selector provides two separate experiences:

- **Student demo:** a learner-only view of personal studies, timetable, attendance, assessments, POE evidence, fees, announcements, support and POPIA requests.
- **Staff and admin demo:** the college operations workspace with switchable College Administrator, Academic Manager, Lecturer, Assessor, Moderator and Finance Officer access levels.

Neither demo needs an account, Supabase project or environment variables. Both load an invented college, people and operational records in the browser. Demonstration changes disappear after a refresh or **Reset demo**. The demos do not prove authentication, database security or cross-device sharing; use the connected portal for those tests.

## Functional areas

- Multi-college workspaces with row-level tenant isolation
- College onboarding, memberships and single-use invite codes
- College Administrator, Academic Manager, Lecturer, Assessor, Moderator, Finance Officer, Student and Workplace Supervisor roles
- Campuses, academic periods, programmes, modules and classes
- Applications, admissions decisions, student records and enrolments
- Controlled student CSV imports, student-account links and workplace placements
- Shared timetables, attendance sessions, manual registers and authenticated student QR check-in
- Formative, summative, practical, POE and workplace assessments
- Competence outcomes, moderation status and private evidence uploads
- Invoices, payments, balances and bursary/NSFAS administrative tracking
- Audience-filtered announcements and direct in-app notifications
- CSV operational reports and printable academic progress records
- Support tickets with comments, POPIA requests, consent records and data incidents
- Platform subscriptions, tenant register and audit history
- Responsive installable PWA shell for desktop, tablet and mobile
- Separate browser-only student and staff/admin demos with clearly labelled synthetic workspaces

## R0 architecture

- **Frontend:** Next.js static export hosted by GitHub Pages
- **Authentication:** Supabase Auth
- **Database:** Supabase PostgreSQL
- **Tenant security:** PostgreSQL row-level security policies
- **Private documents:** Supabase Storage with signed downloads
- **Automation:** GitHub Actions build, test and Pages deployment

No ChatGPT hosting, D1, R2, Vercel or paid service is required for prototype testing. The browser-only demo requires only GitHub Pages; the connected portal additionally requires Supabase Free.

## Set up the working prototype

Follow [`docs/ZERO_COST_SETUP.md`](docs/ZERO_COST_SETUP.md). The one-time setup creates a Supabase project, runs the supplied migration, adds two GitHub secrets and enables GitHub Pages.

## Local development

```bash
cp .env.example .env.local
npm install
npm run dev
```

Open `http://localhost:3000/demo/` to choose the student or staff demonstration, or `http://localhost:3000` for the landing page. Use Node.js 20.9 or newer.

Validation:

```bash
npm test
```

## Data restrictions

Use synthetic information only. Do not store real learner identities, contact details, academic results, disability data, financial information or POE evidence on the free prototype. Free-tier hosting is not a substitute for production backups, restore testing, monitoring, incident response, MFA enforcement, a POPIA operator agreement or formal data-residency review.

EduBonke does not claim to issue accredited certificates, validate programme accreditation, submit returns to DHET/QCTO/Umalusi, provide an official NSFAS integration, perform statutory accounting or replace payroll/ERP systems.

See [`docs/PRODUCTION_READINESS.md`](docs/PRODUCTION_READINESS.md) before any live-college pilot.
The exact implemented and excluded scope is listed in [`docs/FEATURE_MATRIX.md`](docs/FEATURE_MATRIX.md).
