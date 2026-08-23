# EduBonke v1.3 Feature Matrix

This matrix describes what the R0 prototype actually does. “Working” means the feature has a user interface, database model and relevant row-level access controls after the supplied Supabase migration is installed.

| Area | Status | Implemented scope | Deliberate boundary |
| --- | --- | --- | --- |
| Standalone demonstrations | Working | Separate no-account student and staff/admin demos with invented college, users, personal learner views and six switchable staff access levels | Changes are temporary; authentication, RLS and multi-device sharing are not exercised |
| Accounts | Working | Email/password sign-up, confirmation, sign-in, reset and session sharing across devices | MFA enforcement is a production gate |
| Multi-college access | Working | Separate workspaces, college switcher, single-use email-bound invites and eight roles | Bulk identity provisioning is not included |
| Academic setup | Working | Campuses, academic periods, programmes, modules and classes | Accreditation references are college-supplied, not independently validated |
| Admissions | Working | Application capture, pipeline and decision status | No public application form or automated applicant messaging |
| Student records | Working | Registration, controlled CSV upsert, status changes, enrolments, class links and student account links | Synthetic data only on the R0 deployment |
| Workplace learning | Working | Student-to-employer and authorised supervisor placements with scoped supervisor access | No employer contracting or payroll functions |
| Timetable | Working | Shared dated sessions, times, venues and class/module links | No calendar-provider synchronisation |
| Attendance | Working | Sessions, manual corrections and short-lived QR check-in restricted to a signed-in, linked and actively enrolled student | A QR check-in reduces register administration but does not by itself prove physical presence; no biometric or geolocation tracking |
| Assessment | Working | Assessment plans, scores, outcomes and assessor feedback | No automatic academic judgement |
| POE and moderation | Working | Private uploads, signed downloads, evidence review and separate moderation decisions | No malware scanning on the free prototype |
| Finance | Working | Rand invoices, payments, balances and funding administration | Not statutory accounting, a payment gateway or official NSFAS integration |
| Communication | Working | Audience-filtered announcements and direct in-app notifications | Email, SMS and WhatsApp delivery are not included at R0 |
| Reporting | Working | CSV registers, printable progress records and authorised JSON workspace snapshots | No accredited certificates or automatic regulator submissions |
| Support | Working | Ticket creation, statuses and threaded comments | No external service-desk integration |
| POPIA operations | Working | Request, consent and incident registers plus minimised audit history | Legal governance and Information Officer duties remain with the college |
| Offline/installability | Partial | Installable PWA shell and cached static routes | Shared records still require an internet connection to Supabase |
| Backups and monitoring | Not production-ready | Manual authorised exports are available | Automated backups, restore tests, uptime monitoring and alerting require the production migration |
| External integrations | Not included | None claimed | DHET, QCTO, Umalusi, ETQA, NSFAS, payroll, ERP and messaging integrations require separate specifications and agreements |

The free deployment is suitable only for synthetic evaluation. Completion of `PRODUCTION_READINESS.md` is mandatory before any real learner information is used.
