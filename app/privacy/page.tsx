import Link from "next/link";
import BrandLogo from "../brand";

export default function PrivacyPage() {
  return <main className="privacy-notice-page">
    <header><Link className="brand" href="/" aria-label="EduBonke home"><BrandLogo /></Link><span>Prototype privacy notice</span></header>
    <article>
      <p className="eyebrow-text">Version 1.0 · 15 August 2026</p>
      <h1>How the EduBonke prototype handles information</h1>
      <div className="notice-banner"><b>Prototype restriction</b><p>Only invented or synthetic learner information may be entered. The prototype has not been approved for live college records.</p></div>
      <section><h2>Information processed</h2><p>Supabase Auth processes the tester’s email address, display name and account identifier. The database stores information deliberately entered by authorised testers, including synthetic application, student, enrolment, attendance, assessment, evidence, finance, support and privacy records.</p></section>
      <section><h2>Purpose</h2><p>Information is processed to test whether shared college-administration workflows are useful, understandable, secure and suitable for a controlled pilot. It must not be reused for unrelated marketing or automated decision-making.</p></section>
      <section><h2>Access and separation</h2><p>PostgreSQL row-level security restricts records by institution membership, role and linked student account before information is returned to the browser. Important database changes are recorded in an institution-scoped audit history.</p></section>
      <section><h2>Requests and incidents</h2><p>The POPIA desk allows authorised staff to log access, correction, deletion, objection and restriction requests, purpose-specific consent records and suspected data incidents. A responsible privacy owner must review each item before action is taken.</p></section>
      <section><h2>Storage and retention</h2><p>Structured records are held in Supabase PostgreSQL and uploaded files are kept in a private Supabase Storage bucket. Prototype records should be deleted after the test decision and agreed evidence-retention period. Automated production backups and restoration testing are not included in the R0 setup.</p></section>
      <section><h2>Before an external pilot</h2><p>The responsible party, Information Officer contact details, operator agreement, approved retention periods, cross-border-data assessment, incident procedure and hosting region must be confirmed. This page is a product control, not legal advice or a completed compliance determination.</p></section>
      <Link className="button" href="/">Return to EduBonke</Link>
    </article>
  </main>;
}
