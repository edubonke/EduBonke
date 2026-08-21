import type { Metadata } from "next";
import StudentDemoClient from "./student-demo-client";
import "../../portal/portal.css";

export const metadata: Metadata = {
  title: "Student Demo | EduBonke",
  description: "Explore the EduBonke learner workspace with clearly labelled synthetic student information.",
};

export default function StudentDemoPage() {
  return <StudentDemoClient />;
}
