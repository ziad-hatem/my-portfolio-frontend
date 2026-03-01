import { ImageResponse } from "next/og";
import { getPublicToolsContent } from "@/lib/content-service";

export const runtime = "nodejs";

function clampText(value: string, max: number): string {
  const trimmed = value.trim();
  if (trimmed.length <= max) {
    return trimmed;
  }

  return `${trimmed.slice(0, Math.max(0, max - 1)).trimEnd()}...`;
}

function splitTextLines(
  value: string,
  maxCharsPerLine: number,
  maxLines: number
): string[] {
  const normalized = value.replace(/\s+/g, " ").trim();
  if (!normalized) {
    return [""];
  }

  const words = normalized.split(" ");
  const lines: string[] = [];
  let currentLine = "";

  for (const word of words) {
    if (word.length > maxCharsPerLine) {
      if (currentLine) {
        lines.push(currentLine);
        currentLine = "";
        if (lines.length >= maxLines) {
          break;
        }
      }

      const segments = word.match(new RegExp(`.{1,${maxCharsPerLine}}`, "g")) || [word];
      for (const segment of segments) {
        lines.push(segment);
        if (lines.length >= maxLines) {
          break;
        }
      }
      if (lines.length >= maxLines) {
        break;
      }
      continue;
    }

    const candidate = currentLine ? `${currentLine} ${word}` : word;
    if (candidate.length <= maxCharsPerLine) {
      currentLine = candidate;
      continue;
    }

    lines.push(currentLine);
    if (lines.length >= maxLines) {
      break;
    }
    currentLine = word;
  }

  if (currentLine && lines.length < maxLines) {
    lines.push(currentLine);
  }

  if (lines.length === 0) {
    lines.push(normalized.slice(0, maxCharsPerLine));
  }

  const consumed = lines.join(" ").length;
  if (normalized.length > consumed) {
    const lastIndex = lines.length - 1;
    if (lastIndex >= 0) {
      const lastLine = lines[lastIndex];
      lines[lastIndex] =
        lastLine.length >= maxCharsPerLine
          ? `${lastLine.slice(0, Math.max(0, maxCharsPerLine - 1))}...`
          : `${lastLine}...`;
    }
  }

  return lines.slice(0, maxLines);
}

function getSiteLabel(): string {
  const fallback = "ziadhatem.dev";
  const source = process.env.NEXT_PUBLIC_FRONTEND_URL?.trim();

  if (!source) {
    return fallback;
  }

  try {
    const host = new URL(source).hostname.replace(/^www\./i, "");
    if (!host || host === "localhost" || /^\d+\.\d+\.\d+\.\d+$/.test(host)) {
      return fallback;
    }

    return host;
  } catch {
    return fallback;
  }
}

export async function GET() {
  const tools = await getPublicToolsContent();
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
  const titleLines = splitTextLines(title, 28, 2);
  const descriptionLines = splitTextLines(description, 50, 2);
  const siteLabel = getSiteLabel();

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

        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 8,
              maxWidth: 1040,
            }}
          >
            {titleLines.map((line, index) => (
              <div
                key={`title-line-${index}`}
                style={{
                  margin: 0,
                  fontSize: 58,
                  lineHeight: 1.05,
                  fontWeight: 800,
                  letterSpacing: "-0.02em",
                  color: "#ffffff",
                }}
              >
                {line}
              </div>
            ))}
          </div>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 5,
              maxWidth: 1000,
            }}
          >
            {descriptionLines.map((line, index) => (
              <div
                key={`description-line-${index}`}
                style={{
                  margin: 0,
                  fontSize: 30,
                  lineHeight: 1.22,
                  fontWeight: 500,
                  color: "#b4b4bb",
                }}
              >
                {line}
              </div>
            ))}
          </div>
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
            <span style={{ color: "#3f3f46" }}>|</span>
            <span>Private</span>
            <span style={{ color: "#3f3f46" }}>|</span>
            <span>No Tracking</span>
          </div>
          <div>{siteLabel}</div>
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
