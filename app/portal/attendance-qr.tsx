"use client";

import { BrowserQRCodeReader } from "@zxing/browser";
import Image from "next/image";
import QRCode from "qrcode";
import { useCallback, useEffect, useRef, useState } from "react";
import { getSupabase } from "../../lib/supabase";

type SessionOption = { id: string; label: string; status: string };
type ActiveQr = { sessionId: string; topic: string; url: string; expiresAt: string; demo: boolean };
type RpcRow = Record<string, unknown>;

export function StaffAttendanceQr({
  sessions,
  demoMode,
  onRefresh,
}: {
  sessions: SessionOption[];
  demoMode: boolean;
  onRefresh(): Promise<void>;
}) {
  const [activeQr, setActiveQr] = useState<ActiveQr | null>(null);
  const [qrImage, setQrImage] = useState("");
  const [remaining, setRemaining] = useState(0);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!activeQr) return;
    let current = true;
    void QRCode.toDataURL(activeQr.url, {
      width: 320,
      margin: 2,
      errorCorrectionLevel: "M",
      color: { dark: "#132a32", light: "#ffffff" },
    }).then((image) => { if (current) setQrImage(image); }).catch(() => { if (current) setMessage("The QR image could not be generated."); });
    return () => { current = false; };
  }, [activeQr]);

  useEffect(() => {
    if (!activeQr) return;
    const update = () => setRemaining(Math.max(0, Math.ceil((new Date(activeQr.expiresAt).getTime() - Date.now()) / 1000)));
    update();
    const timer = window.setInterval(update, 1000);
    return () => window.clearInterval(timer);
  }, [activeQr]);

  async function start(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const sessionId = String(new FormData(form).get("session_id") ?? "");
    const selected = sessions.find((session) => session.id === sessionId);
    if (!selected) return;
    setBusy(true); setMessage("");
    try {
      let token: string;
      let expiresAt: string;
      let topic = selected.label;
      if (demoMode) {
        token = crypto.randomUUID().replaceAll("-", "").slice(0, 48).padEnd(48, "0");
        expiresAt = new Date(Date.now() + 5 * 60_000).toISOString();
      } else {
        const { data, error } = await getSupabase().rpc("start_attendance_qr", { p_session_id: sessionId, p_valid_minutes: 5 });
        if (error) throw error;
        const row = ((data as RpcRow[] | null)?.[0] ?? {}) as RpcRow;
        token = String(row.check_in_token ?? "");
        expiresAt = String(row.check_in_expires_at ?? "");
        topic = String(row.session_topic ?? selected.label);
      }
      const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
      const url = `${location.origin}${basePath}/attendance/check-in/?token=${encodeURIComponent(token)}`;
      setQrImage("");
      setActiveQr({ sessionId, topic, url, expiresAt, demo: demoMode });
      setMessage(demoMode ? "Demonstration QR created. It does not write attendance." : "Authenticated student check-in is open for five minutes.");
      await onRefresh();
    } catch (error) {
      setMessage(errorMessage(error));
    } finally { setBusy(false); }
  }

  async function stop() {
    if (!activeQr) return;
    setBusy(true); setMessage("");
    try {
      if (!demoMode) {
        const { error } = await getSupabase().rpc("stop_attendance_qr", { p_session_id: activeQr.sessionId });
        if (error) throw error;
      }
      setActiveQr(null);
      setMessage("QR check-in closed.");
      await onRefresh();
    } catch (error) { setMessage(errorMessage(error)); }
    finally { setBusy(false); }
  }

  return (
    <section className="portal-card form-card qr-attendance-card">
      <small>AUTHENTICATED STUDENT ACTION</small>
      <h2>Display attendance QR</h2>
      <p>Only a student who is already signed in, linked and enrolled in this class can check in.</p>
      <form onSubmit={start}>
        <label>Open attendance session
          <select name="session_id" defaultValue="" required>
            <option value="">Select an open register</option>
            {sessions.filter((session) => session.status === "open").map((session) => <option key={session.id} value={session.id}>{session.label}</option>)}
          </select>
        </label>
        <button className="primary-action" disabled={busy}>{busy ? "Please wait…" : activeQr ? "Replace QR" : "Start five-minute QR"}</button>
      </form>
      {message && <p className="qr-message" role="status">{message}</p>}
      {activeQr && <div className="qr-display">
        <b>{activeQr.topic}</b>
        {qrImage && remaining > 0 ? <Image src={qrImage} alt="Attendance QR code" width={320} height={320} unoptimized /> : <div className="qr-expired">QR expired</div>}
        <strong>{remaining > 0 ? `${Math.floor(remaining / 60)}:${String(remaining % 60).padStart(2, "0")}` : "Expired"}</strong>
        <span>{activeQr.demo ? "Synthetic staff demonstration" : "Students must scan from their signed-in EduBonke portal"}</span>
        <div className="qr-actions">
          <button type="button" onClick={() => void onRefresh()}>Refresh check-ins</button>
          <button type="button" onClick={() => void stop()} disabled={busy}>Close QR</button>
        </div>
      </div>}
    </section>
  );
}

export function StudentAttendanceScanner({ onRecorded }: { onRecorded(): Promise<void> }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [scanning, setScanning] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [successful, setSuccessful] = useState(false);

  const record = useCallback(async (scannedValue: string) => {
    setBusy(true); setMessage(""); setSuccessful(false);
    try {
      const token = attendanceToken(scannedValue);
      const supabase = getSupabase();
      const { data: authData, error: authError } = await supabase.auth.getUser();
      if (authError || !authData.user) throw new Error("You must be signed in before scanning the attendance QR.");
      const { data, error } = await supabase.rpc("check_in_attendance", { p_token: token });
      if (error) throw error;
      const row = ((data as RpcRow[] | null)?.[0] ?? {}) as RpcRow;
      const status = String(row.attendance_status ?? "present").replaceAll("_", " ");
      const topic = String(row.session_topic ?? "attendance session");
      setSuccessful(true);
      setMessage(`Attendance recorded as ${status} for ${topic}.`);
      await onRecorded();
    } catch (error) {
      setMessage(errorMessage(error));
    } finally { setBusy(false); setScanning(false); }
  }, [onRecorded]);

  useEffect(() => {
    if (!scanning || !videoRef.current) return;
    const reader = new BrowserQRCodeReader();
    let stopped = false;
    let controls: { stop(): void } | null = null;
    void reader.decodeFromVideoDevice(undefined, videoRef.current, (result, _error, callbackControls) => {
      controls = callbackControls;
      if (result && !stopped) {
        stopped = true;
        callbackControls.stop();
        void record(result.getText());
      }
    }).then((activeControls) => { controls = activeControls; }).catch((error) => {
      setScanning(false);
      setMessage(`Camera scanning could not start: ${errorMessage(error)}`);
    });
    return () => { stopped = true; controls?.stop(); };
  }, [record, scanning]);

  async function pasteLink(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const value = String(new FormData(form).get("attendance_url") ?? "");
    await record(value);
    form.reset();
  }

  return (
    <section className="portal-card qr-student-card">
      <div className="card-heading"><div><small>MY REGISTER</small><h2>Scan register QR</h2></div></div>
      <p>You must already be signed in. The camera scans only an EduBonke attendance URL and no attendance is written until Supabase verifies your account and class enrolment.</p>
      <button className="primary-action" disabled={busy} onClick={() => setScanning((value) => !value)}>{scanning ? "Stop camera" : busy ? "Checking attendance…" : "Open QR scanner"}</button>
      {scanning && <div className="qr-camera"><video ref={videoRef} muted playsInline /><span>Point the camera at the facilitator’s EduBonke QR code.</span></div>}
      <details className="qr-fallback"><summary>Camera unavailable?</summary><form onSubmit={pasteLink}><label>Paste the EduBonke attendance URL<input name="attendance_url" type="url" required /></label><button className="primary-action" disabled={busy}>Check in securely</button></form></details>
      {message && <p className={`qr-message ${successful ? "success" : ""}`} role="status">{message}</p>}
    </section>
  );
}

export function attendanceToken(scannedValue: string) {
  const url = new URL(scannedValue.trim());
  if (url.origin !== location.origin || !url.pathname.endsWith("/attendance/check-in/")) throw new Error("Scan the EduBonke attendance QR displayed by your facilitator.");
  const token = url.searchParams.get("token") ?? "";
  if (!/^[0-9a-f]{48}$/i.test(token)) throw new Error("The attendance QR is invalid.");
  return token;
}

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : typeof error === "object" && error && "message" in error ? String(error.message) : "The attendance request could not be completed.";
}
