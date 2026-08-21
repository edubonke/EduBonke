import type { Metadata } from "next";
import PortalClient from "../../portal/portal-client";
import "../../portal/portal.css";

export const metadata: Metadata = {
  title: "Staff and Admin Demo | EduBonke",
  description: "Preview EduBonke staff access levels with clearly labelled synthetic college information.",
};

export default function StaffDemoPage() {
  return <PortalClient demoMode staffDemo />;
}
