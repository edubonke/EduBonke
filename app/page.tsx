import Link from "next/link";
import BrandLogo, { BrandMark } from "./brand";

const modules = [
  ["College administration", "Configure campuses, staff memberships, roles, academic periods and institution settings."],
  ["Admissions", "Capture applications, track review decisions and prepare accepted applicants for enrolment."],
  ["Programmes & modules", "Maintain college-verified programme, NQF, SAQA, credit and curriculum references."],
  ["Students & enrolments", "Manage student profiles, status history, documents, classes and study periods."],
  ["Attendance & timetables", "Share upcoming classes and capture accountable session-level attendance."],
  ["Assessments", "Plan formative, summative and practical work and record competence outcomes."],
  ["POE & moderation", "Store protected evidence, track moderation decisions and retain accountable metadata."],
  ["Finance", "Track rand-denominated invoices, payments, balances and funding administration."],
  ["Communication", "Publish college notices and role-specific in-app notifications."],
  ["Reports", "Export operational registers and generate printable academic progress records."],
  ["Support", "Log and manage technical, data, training, billing and privacy support requests."],
  ["POPIA controls", "Record requests, consent decisions, data incidents and auditable changes."],
] as const;

export default function Home() {
  return (
    <main className="landing-shell">
      <header className="landing-nav">
        <Link className="brand" href="/" aria-label="EduBonke home">
          <BrandLogo />
        </Link>
        <nav aria-label="Primary navigation">
          <a href="#platform">Platform</a>
          <a href="#safeguards">Safeguards</a>
          <a href="#pilot">Pilot</a>
        </nav>
        <Link className="button button-small" href="/demo">
          Open interactive demo
        </Link>
      </header>

      <section className="hero" aria-labelledby="hero-title">
        <div className="hero-copy">
          <div className="eyebrow"><span /> South African college administration</div>
          <h1 id="hero-title">One secure workspace for every learner journey.</h1>
          <p>
            EduBonke connects admission, enrolment, delivery, assessment, POE evidence,
            reporting and privacy workflows for South African private colleges.
          </p>
          <div className="hero-actions">
            <Link className="button" href="/demo">Explore with dummy data</Link>
            <Link className="button button-secondary" href="/login">Open connected portal</Link>
          </div>
          <p className="prototype-note">The demo needs no account or backend · R0 prototype · Synthetic data only</p>
        </div>

        <div className="dashboard-preview" aria-label="Example EduBonke dashboard">
          <div className="preview-topbar">
            <BrandMark className="preview-logo" title="EduBonke" />
            <div><b>Mhlabeni Skills College — Demo</b><small>Johannesburg campus</small></div>
            <span className="status-chip">Protected</span>
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
        <span>Shared across devices</span><span>Role-based access</span><span>Auditable changes</span><span>POPIA-aware workflows</span>
      </section>

      <section className="section" id="platform" aria-labelledby="platform-title">
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

      <section className="security-section" id="safeguards" aria-labelledby="security-title">
        <div>
          <p className="eyebrow-text light">Built around responsible access</p>
          <h2 id="security-title">Privacy is part of the workflow, not a footer.</h2>
          <p>Every institution receives a separate workspace. PostgreSQL row-level policies enforce tenant and role boundaries before protected data is returned.</p>
        </div>
        <ul>
          <li><b>Authentication</b><span>Supabase Auth links protected actions to a verified account.</span></li>
          <li><b>Minimum access</b><span>Eight college roles receive different record and action permissions.</span></li>
          <li><b>Data-subject requests</b><span>Access, correction and deletion requests can be logged and tracked.</span></li>
          <li><b>Protected evidence</b><span>POE files are kept separately from searchable records with institution-level access checks.</span></li>
          <li><b>Accountability</b><span>Database triggers retain an institution-scoped audit history of important changes.</span></li>
        </ul>
      </section>

      <section className="pilot-section" id="pilot" aria-labelledby="pilot-title">
        <div className="section-index">02</div>
        <div>
          <p className="eyebrow-text">Controlled prototype</p>
          <h2 id="pilot-title">Designed to learn before live data is introduced.</h2>
        </div>
        <div className="pilot-steps">
          <article><b>1</b><h3>Create a test workspace</h3><p>An authorised college representative creates the institution and can issue email-bound invite codes.</p></article>
          <article><b>2</b><h3>Invite the pilot team</h3><p>Selected staff join from their own devices and receive only the permissions required for testing.</p></article>
          <article><b>3</b><h3>Measure the workflow</h3><p>The pilot records completion time, errors, support needs and the decision to proceed, revise or stop.</p></article>
        </div>
      </section>

      <footer>
        <BrandLogo className="brand" />
        <p>Every college. Every learner. One platform.</p>
        <p><Link href="/privacy">Prototype privacy notice</Link> · Working name · v1.1</p>
      </footer>
    </main>
  );
}
