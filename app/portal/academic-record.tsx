"use client";

import { useEffect, useRef } from "react";
import { formatDate, human, type WorkspaceData } from "../../lib/platform";

type Row = Record<string, unknown>;

export default function AcademicRecord({ student, data, onBack }: {
  student: Row;
  data: WorkspaceData;
  onBack: () => void;
}) {
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => { heading.current?.focus(); }, []);

  const results = (data.assessment_results ?? []).filter(row => row.student_id === student.id);
  const assessments = new Map((data.assessments ?? []).map(row => [row.id, row.title]));
  const evidence = (data.evidence_documents ?? []).filter(row => row.student_id === student.id);
  const moderation = data.moderation_records ?? [];

  return (
    <article className="academic-record" aria-labelledby="academic-record-title">
      <div className="record-actions">
        <button className="secondary-action" type="button" onClick={onBack}>Back to reports</button>
        <button className="primary-action" type="button" onClick={() => window.print()}>Print record</button>
      </div>
      <h2 id="academic-record-title" tabIndex={-1} ref={heading}>Academic progress record</h2>
      <p><strong>{String(student.first_name)} {String(student.last_name)}</strong> · {String(student.student_number)}</p>
      {results.length ? (
        <table>
          <caption>Assessment outcomes and moderation</caption>
          <thead><tr>{["Assessment", "Outcome", "Score", "Assessed", "Moderation"].map(label => <th scope="col" key={label}>{label}</th>)}</tr></thead>
          <tbody>{results.map(result => {
            const decisions = moderation.filter(row => row.assessment_result_id === result.id);
            return (
              <tr key={String(result.id)}>
                <th scope="row">{String(assessments.get(result.assessment_id) ?? "Assessment unavailable")}</th>
                <td>{human(result.outcome)}</td>
                <td>{String(result.score ?? "—")}</td>
                <td>{formatDate(result.assessed_at)}</td>
                <td>{human(result.moderation_status)}{decisions.map(row => (
                  <div key={String(row.id)}>{human(row.decision)} · {formatDate(row.moderated_at ?? row.created_at)}</div>
                ))}</td>
              </tr>
            );
          })}</tbody>
        </table>
      ) : <p>No assessment results have been recorded for this learner.</p>}
      {evidence.length > 0 && <section><h3>Evidence references</h3><ul>{evidence.map(row => (
        <li key={String(row.id)}>{String(row.title)} · {String(row.file_name)} · {human(row.status)}</li>
      ))}</ul></section>}
      <p className="scope-note">Prototype academic progress record for evaluation. Formal certification is issued by the appropriate authority.</p>
    </article>
  );
}
