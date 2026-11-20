import Link from "next/link";
import { PublicNavigation } from "./navigation-disclosure";
import BrandLogo, { BrandMark } from "./brand";

const modules = [
  ["College administration", "Configure campuses, staff memberships, roles, academic periods and institution settings."],
  ["Admissions", "Capture applications, track review decisions and prepare accepted applicants for enrolment."],
  ["Programmes & modules", "Maintain college-verified programme, NQF, SAQA, credit and curriculum references."],
  ["Students & enrolments", "Manage student profiles, status history, documents, classes and study periods."],
  ["Attendance & timetables", "Share upcoming classes and capture accountable session-level attendance."],
  ["Assessments", "Plan formative, summative and practical work and record competence outcomes."],
  ["POE & moderation", "Link sample evidence references to assessments and track moderation decisions."],
  ["Finance", "Track rand-denominated invoices, payments, balances and funding administration."],
  ["Communication", "Publish college notices and role-specific in-app notifications."],
  ["Reports", "Export operational registers and generate printable academic progress records."],
  ["Support", "Log and manage technical, data, training, billing and privacy support requests."],
  ["POPIA controls", "Record requests, consent decisions, data incidents and auditable changes."],
] as const;

export default function Home() {
  const pilotEmail = process.env.NEXT_PUBLIC_PILOT_EMAIL?.trim();
  const pilotUrl = pilotEmail
    ? `mailto:${pilotEmail}?subject=EduBonke%20college%20pilot%20request`
    : "https://github.com/edubonke/EduBonke/issues/new?template=pilot-request.yml";
  return (
    <div className="landing-shell">
      <a className="skip-link" href="#main-content">Skip to content</a>
      <header className="landing-nav">
        <Link className="brand" href="/" aria-label="EduBonke home">
          <BrandLogo />
        </Link>
        <PublicNavigation />
        <Link className="button button-small" href="/demo">
          Open interactive demo
        </Link>
      </header>

      <main id="main-content" tabIndex={-1}>
      <section className="hero" aria-labelledby="hero-title">
        <div className="hero-copy">
          <div className="eyebrow"><span /> South African college administration</div>
          <h1 id="hero-title">Track each learner from admission to assessment.</h1>
          <p>
            EduBonke connects admission, enrolment, delivery, assessment, POE evidence,
            reporting and privacy workflows for South African private colleges.
          </p>
          <div className="hero-actions">
            <Link className="button" href="/demo">Explore with dummy data</Link>
            <a className="button button-secondary" href="#pilot">Explore the pilot</a>
          </div>
          <p className="prototype-note">The demo needs no account or backend · R0 prototype · Synthetic data only</p>
        </div>

        <div className="dashboard-preview" aria-label="Example EduBonke dashboard">
          <div className="preview-topbar">
            <BrandMark className="preview-logo" title="EduBonke" />
            <div><b>Mhlabeni Skills College — Demo</b><small>Johannesburg campus</small></div>
            <span className="status-chip">Sample dashboard</span>
          </div>
          <div className="preview-heading">
            <div><small>Friday, 14 August</small><h2>Good morning, Nomsa</h2></div>
            <button type="button" aria-label="Add a learner">+ Add learner</button>
          </div>
          <div className="metric-grid">
            <article><small>Active learners</small><strong>248</strong><span>12 programmes</span></article>
            <article><small>Admissions queue</small><strong>14</strong><span className="positive">6 ready for review</span></article>
            <article><small>Evidence review</small><strong>9</strong><span>POE and workplace</span></article>
          </div>
          <div className="preview-panel">
            <div className="panel-title"><b>Today’s classes</b><span>View timetable</span></div>
            {[
              ["08:30", "Technical Support NQF 4", "Lab 2", "In progress"],
              ["11:00", "End User Computing NQF 3", "Room 4", "Next"],
              ["14:00", "Business Analysis NQF 5", "Room 1", "Later"],
            ].map((row) => (
              <div className="class-row" key={row[0]}>
                <time>{row[0]}</time><div><b>{row[1]}</b><small>{row[2]}</small></div><span>{row[3]}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="trust-strip" aria-label="Prototype principles">
        <span>Temporary browser workspace</span><span>Staff role previews</span><span>Sample audit history</span><span>POPIA-aware workflows</span>
      </section>

      <section className="section" id="platform" tabIndex={-1} aria-labelledby="platform-title">
        <div className="section-heading">
          <span className="section-index">01</span>
          <div><p className="eyebrow-text">Focused first release</p><h2 id="platform-title">The daily tools a college actually needs</h2></div>
          <p>Twelve connected operational areas replace scattered spreadsheets and message threads without pretending to be a regulator, accounting suite or large university system.</p>
        </div>
        <div className="module-grid">
          {modules.map(([title, description], index) => (
            <article key={title}>
              <span>{String(index + 1).padStart(2, "0")}</span><h3>{title}</h3><p>{description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="security-section" id="safeguards" tabIndex={-1} aria-labelledby="security-title">
        <div>
          <p className="eyebrow-text light">Built around responsible access</p>
          <h2 id="security-title">Privacy is part of the workflow, not a footer.</h2>
          <p>Explore a fictional college in your own browser tab. Role previews show which records each staff member works with. Refresh or reset the demo to clear changes.</p>
        </div>
        <ul>
          <li><b>Demo access</b><span>Open the student or staff workspace without an account.</span></li>
          <li><b>Minimum access</b><span>Switch between six staff roles to compare the summaries and reports each can use.</span></li>
          <li><b>Data-subject requests</b><span>Access, correction and deletion requests can be logged and tracked.</span></li>
          <li><b>Evidence references</b><span>Practise logging a file name and assessment reference. Selected files stay on your device.</span></li>
          <li><b>Accountability</b><span>The demo keeps a temporary history of changes made in the current staff workspace.</span></li>
        </ul>
      </section>

      <section className="pilot-section" id="pilot" tabIndex={-1} aria-labelledby="pilot-title">
        <div className="section-index">02</div>
        <div>
          <p className="eyebrow-text">Controlled prototype</p>
          <h2 id="pilot-title">Designed to learn before live data is introduced.</h2>
        </div>
        <div className="pilot-steps">
          <article><b>1</b><h3>Create a test workspace</h3><p>Choose one campus and one workflow to test with invented learner records.</p></article>
          <article><b>2</b><h3>Invite the pilot team</h3><p>Invite a registrar, assessor and moderator to try their role in the demonstration.</p></article>
          <article><b>3</b><h3>Measure the workflow</h3><p>The pilot records completion time, errors, support needs and the decision to proceed, revise or stop.</p></article>
        </div>
        <div className="pilot-request">
          <a className="button" href={pilotUrl}>Request a Pilot</a>
          <p>{pilotEmail ? "Opens an email to the EduBonke team." : "Opens a public GitHub form. Sign in to request a pilot. Share only general workflow information."}</p>
        </div>
      </section>

      </main>
      <footer>
        <BrandLogo className="brand" />
        <p>Every college. Every learner. One platform.</p>
        <p><Link href="/privacy">Prototype privacy notice</Link> · Working name · v1.1</p>
      </footer>
    </div>
  );
}
