import { ImageResponse } from "next/og";
import { getToolsContent } from "@/lib/content-repository";

export const runtime = "nodejs";

function clampText(value: string, max: number): string {
  const trimmed = value.trim();
  if (trimmed.length <= max) {
    return trimmed;
  }

  return `${trimmed.slice(0, Math.max(0, max - 1)).trimEnd()}...`;
}

export async function GET() {
  const tools = await getToolsContent();
  const seo = tools?.tools_index_seo;

  const title = clampText(
    seo?.seo_title || "Developer Tools | Free Browser Utilities",
    72
  );
  const description = clampText(
    seo?.seo_description ||
      "A practical suite of browser-based tools focused on speed and privacy.",
    120
  );

  const image = new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          backgroundColor: "#07090f",
          backgroundImage:
            "radial-gradient(circle at 15% 10%, rgba(0,240,160,0.2) 0, rgba(0,240,160,0) 42%), radial-gradient(circle at 85% 80%, rgba(56,189,248,0.2) 0, rgba(56,189,248,0) 46%)",
          color: "#ffffff",
          padding: "56px 64px",
          fontFamily:
            "Inter, ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              fontSize: 24,
              color: "#d4d4d8",
            }}
          >
            <div
              style={{
                width: 14,
                height: 14,
                borderRadius: 999,
                background: "#00f0a0",
                boxShadow: "0 0 22px rgba(0, 240, 160, 0.7)",
              }}
            />
            Portfolio Tools
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              border: "1px solid rgba(255,255,255,0.18)",
              borderRadius: 999,
              padding: "10px 18px",
              fontSize: 20,
              color: "#e4e4e7",
              background: "rgba(24,24,27,0.55)",
            }}
          >
            Tools Hub
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
          <h1
            style={{
              margin: 0,
              fontSize: 62,
              lineHeight: 1.05,
              fontWeight: 800,
              letterSpacing: "-0.02em",
              color: "#ffffff",
              maxWidth: 1040,
            }}
          >
            {title}
          </h1>

          <p
            style={{
              margin: 0,
              fontSize: 31,
              lineHeight: 1.28,
              fontWeight: 500,
              color: "#b4b4bb",
              maxWidth: 1000,
            }}
          >
            {description}
          </p>
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            fontSize: 21,
            color: "#a1a1aa",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span>Fast</span>
            <span style={{ color: "#3f3f46" }}>•</span>
            <span>Private</span>
            <span style={{ color: "#3f3f46" }}>•</span>
            <span>No Tracking</span>
          </div>
          <div>my-portfolio.tools</div>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );

  image.headers.set("Content-Type", "image/png");
  image.headers.set("Cache-Control", "public, max-age=0, s-maxage=31536000");
  return image;
}
