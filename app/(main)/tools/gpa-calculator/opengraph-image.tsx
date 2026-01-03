import { ImageResponse } from "next/og";

export const runtime = "edge";

export const alt = "Academic GPA Calculator";
export const size = {
  width: 1200,
  height: 630,
};

export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#020617", // slate-950
          backgroundImage: "linear-gradient(to bottom right, #020617, #0f172a)",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: "32px",
            padding: "40px 80px",
            backgroundColor: "rgba(255,255,255,0.03)",
            boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)",
          }}
        >
          {/* Icon placeholder or simple shape */}
          <div
            style={{
              display: "flex",
              width: "80px",
              height: "80px",
              marginBottom: "20px",
              borderRadius: "20px",
              background: "linear-gradient(135deg, #10b981 0%, #059669 100%)", // emerald/teal
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <svg
              width="48"
              height="48"
              viewBox="0 0 24 24"
              fill="none"
              stroke="white"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="2" y="2" width="20" height="20" rx="2" ry="2" />
              <line x1="8" y1="2" x2="8" y2="22" />
              <line x1="16" y1="2" x2="16" y2="22" />
              <line x1="2" y1="8" x2="22" y2="8" />
              <line x1="2" y1="16" x2="22" y2="16" />
            </svg>
          </div>

          <h1
            style={{
              fontSize: "64px",
              fontWeight: 800,
              background:
                "linear-gradient(to bottom, #ffffff 0%, #94a3b8 100%)",
              backgroundClip: "text",
              color: "transparent",
              margin: 0,
              marginBottom: "10px",
              textAlign: "center",
              letterSpacing: "-0.02em",
            }}
          >
            GPA Calculator
          </h1>
          <p
            style={{
              fontSize: "24px",
              color: "#94a3b8", // slate-400
              margin: 0,
              textAlign: "center",
              maxWidth: "600px",
            }}
          >
            Precision Academic Tool for University Students
          </p>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
