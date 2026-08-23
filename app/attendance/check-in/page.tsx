"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import BrandLogo from "../../brand";
import { getSupabase, isSupabaseConfigured } from "../../../lib/supabase";

type State = "checking" | "signed-out" | "success" | "error";

export default function AttendanceCheckInPage() {
  const [state, setState] = useState<State>("checking");
  const [message, setMessage] = useState("Verifying your signed-in student account…");

  useEffect(() => {
    let active = true;
    async function checkIn() {
      try {
        if (!isSupabaseConfigured) throw new Error("The Supabase backend is not configured.");
        const token = new URLSearchParams(location.search).get("token") ?? "";
        if (!/^[0-9a-f]{48}$/i.test(token)) throw new Error("The attendance QR is invalid.");
        const supabase = getSupabase();
        const { data: authData, error: authError } = await supabase.auth.getUser();
        if (authError || !authData.user) {
          if (active) { setState("signed-out"); setMessage("You must sign in to the student portal before scanning the attendance QR. No attendance was recorded."); }
          return;
        }
        const { data, error } = await supabase.rpc("check_in_attendance", { p_token: token });
        if (error) throw error;
        const row = (data as Array<Record<string, unknown>> | null)?.[0] ?? {};
        if (active) {
          setState("success");
          setMessage(`Attendance recorded as ${String(row.attendance_status ?? "present").replaceAll("_", " ")} for ${String(row.session_topic ?? "this session")}.`);
        }
      } catch (error) {
        if (active) { setState("error"); setMessage(errorMessage(error)); }
      }
    }
    void checkIn();
    return () => { active = false; };
  }, []);

  return (
    <main className="configuration-page attendance-check-in-page">
      <div>
        <Link className="brand" href="/" aria-label="EduBonke home"><BrandLogo /></Link>
        <p className="eyebrow-text">Authenticated attendance</p>
        <h1>{state === "success" ? "You are checked in." : state === "signed-out" ? "Sign in before scanning." : state === "error" ? "Check-in unsuccessful." : "Checking your register…"}</h1>
        <p className={`qr-message ${state === "success" ? "success" : ""}`} role="status">{message}</p>
        {state === "signed-out" ? <><p>Sign in first, then return to Attendance and scan the facilitator’s QR again.</p><Link className="button" href="/login">Sign in to EduBonke</Link></> : <Link className="button" href="/portal">Return to my portal</Link>}
      </div>
    </main>
  );
}

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : typeof error === "object" && error && "message" in error ? String(error.message) : "The attendance request could not be completed.";
}
