import type { Metadata } from "next";
import Link from "next/link";
import BrandLogo from "../brand";
import "./demo.css";

export const metadata: Metadata = {
  title: "Choose a Demo | EduBonke",
  description: "Choose the EduBonke student or staff demonstration. Both use clearly labelled synthetic South African college data.",
};

const demos = [
  {
    audience: "Learner experience",
    title: "Student demo",
    description: "See the focused workspace a learner uses to follow their studies and communicate with the college.",
    features: ["Personal timetable and attendance", "Assessments, results and POE evidence", "Fee account, notices and support requests"],
    href: "/demo/student",
    action: "Open student demo",
    icon: "S",
  },
  {
    audience: "College operations",
    title: "Staff and admin demo",
    description: "Explore the operational workspace and switch between the access levels used by different staff members.",
    features: ["Six staff role previews", "Role-specific modules and protected actions", "Admissions, academics, finance and POPIA workflows"],
    href: "/demo/staff",
    action: "Open staff demo",
    icon: "A",
  },
] as const;

export default function DemoPage() {
  return (
    <main className="demo-choice-page">
      <header>
        <Link href="/" aria-label="EduBonke home"><BrandLogo /></Link>
        <Link className="demo-back-link" href="/">Return to the public site</Link>
      </header>
      <section className="demo-choice-intro">
        <p className="eyebrow-text">Interactive prototype</p>
        <h1>Choose whose EduBonke experience you want to explore.</h1>
        <p>These two demonstrations use the same invented college, but each person sees only the tools and information appropriate to their role.</p>
      </section>
      <section className="demo-choice-grid" aria-label="Available demonstrations">
        {demos.map((demo) => (
          <article key={demo.title}>
            <div className="demo-choice-icon" aria-hidden="true">{demo.icon}</div>
            <small>{demo.audience}</small>
            <h2>{demo.title}</h2>
            <p>{demo.description}</p>
            <ul>{demo.features.map((feature) => <li key={feature}>{feature}</li>)}</ul>
            <Link className="button" href={demo.href}>{demo.action}</Link>
          </article>
        ))}
      </section>
      <aside className="demo-safety-note">
        <b>Synthetic demonstration only</b>
        <span>No account is required. No personal information, uploaded file or form entry leaves this browser session.</span>
      </aside>
    </main>
  );
}
