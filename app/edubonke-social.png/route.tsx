import { ImageResponse } from "next/og";
import { BrandMark } from "../brand";

export const dynamic = "force-static";
const size = { width: 1200, height: 630 };

export function GET() {
  return new ImageResponse(
    <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", width: "100%", height: "100%", padding: "60px 76px", background: "#f6f3ec", color: "#132a32", borderBottom: "18px solid #087f75" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 20, fontSize: 62 }}>
        <BrandMark width={100} height={75} /><span>EduBonke</span>
      </div>
      <div style={{ display: "flex", flexDirection: "column", fontSize: 66, letterSpacing: -2 }}>
        <span>College administration for</span><span>South African private colleges</span>
      </div>
      <div style={{ display: "flex", fontSize: 30, color: "#075d58" }}>Admissions · Learner records · Moderation</div>
    </div>, size
  );
}
