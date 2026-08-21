# Production Readiness Gates

EduBonke v1.0 is a functional prototype, not a live-college production service. The following gates must be completed before real personal information is introduced.

## Governance and POPIA

- Confirm each college’s responsible-party role and EduBonke’s operator role in writing.
- Appoint and register the Information Officer where required.
- Complete a purpose, lawful-basis and data-minimisation assessment for each data category.
- Approve privacy notices, retention schedules, data-subject procedures and operator agreements.
- Complete a documented cross-border/data-residency assessment for the selected Supabase region.
- Establish incident escalation, regulator notification and data-subject notification procedures.

## Identity and access

- Require MFA for Super Admin, College Administrator and other privileged roles.
- Establish joiner, mover and leaver processes with periodic access reviews.
- Use institution-controlled email domains where practical.
- Test row-level security using separate users for every role.
- Add separation-of-duties checks for finance, assessment and moderation.

## Infrastructure and continuity

- Move from free plans to supported paid services with contractual availability commitments.
- Configure automated database backups and private-object versioning.
- Complete a restore drill and record recovery time and recovery point results.
- Add external uptime monitoring, error tracking, log retention and security alerting.
- Add upload malware scanning and quarantine before accepting real evidence files.
- Establish environment separation for development, testing and production.
- Maintain infrastructure and database migrations in version control.

## Academic and regulatory validation

- Validate qualification, programme, module, NQF, credit and external-reference data with the college.
- Obtain assessor and moderator approval for outcome and evidence workflows.
- Define controlled transcript and certificate processes. The prototype must not issue accredited certificates.
- Validate any DHET, QCTO, Umalusi, ETQA or NSFAS export against the current regulator specification before use.
- Do not describe EduBonke as regulator-approved without written confirmation from the relevant authority.

## Finance

- Review invoice, payment, tax and credit-note requirements with a South African accountant.
- Integrate a compliant payment provider instead of storing card details.
- Reconcile the EduBonke ledger against the appointed accounting system.
- Treat bursary and NSFAS fields as administrative tracking until an official integration is contracted and tested.

## Pilot controls

- Start with one design-partner college and synthetic data.
- Validate imports with record counts, duplicate checks, approvals and rollback.
- Train users by role and document acceptance criteria.
- Run adoption and control reviews at two weeks and six weeks.
- Approve or reject live go-live through a documented decision gate.
