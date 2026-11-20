import Link from "next/link";
import BrandLogo from "../brand";

export default function PrivacyPage() {
  return <div className="privacy-notice-page">
    <header><Link className="brand" href="/" aria-label="EduBonke home"><BrandLogo /></Link><span>Prototype privacy notice</span></header>
    <main>
      <p className="eyebrow-text">Public demonstration</p>
      <h1>How the EduBonke prototype handles information</h1>
      <div className="notice-banner"><b>Prototype restriction</b><p>Only invented or synthetic learner information may be entered. The prototype has not been approved for live college records.</p></div>
      <section><h2>Information processed</h2><p>The public demo runs without an account. Invented learner records and form entries stay in the current browser tab. GitHub Pages may log visitor IP addresses for site security.</p></section>
      <section><h2>Purpose</h2><p>Information is processed to test whether shared college-administration workflows are useful, understandable, secure and suitable for a controlled pilot. It must not be reused for unrelated marketing or automated decision-making.</p></section>
      <section><h2>Access and separation</h2><p>Student and staff previews show the records associated with their simulated role. A connected pilot requires separate verification of authentication and college-level access controls.</p></section>
      <section><h2>Requests and incidents</h2><p>The POPIA desk allows authorised staff to log access, correction, deletion, objection and restriction requests, purpose-specific consent records and suspected data incidents. A responsible privacy owner must review each item before action is taken.</p></section>
      <section><h2>Storage and retention</h2><p>Only evidence descriptions and file metadata enter the demo. Refreshing, resetting or closing the page clears your entries. CSVs, snapshots and records you download remain on your device until you remove them.</p></section>
      <section><h2>Separately configured connected testing</h2><p>A college that enables the optional connected portal processes tester accounts, invented records and selected files through its configured Supabase project. Its operator must provide its own contact, retention and access information before inviting testers.</p></section>
      <section><h2>Before an external pilot</h2><p>The responsible party, Information Officer contact details, operator agreement, approved retention periods, cross-border-data assessment, incident procedure and hosting region must be confirmed. This page is a product control, not legal advice or a completed compliance determination.</p></section>
      <Link className="button" href="/">Return to EduBonke</Link>
    </main>
  </div>;
}
