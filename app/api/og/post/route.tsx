import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";

export const runtime = "edge";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const title = searchParams.get("title") || "Blog Post";
    const image = searchParams.get("image");
    const author = searchParams.get("author");

    // Generate a unique ETag based on the parameters
    const etag = `"${Buffer.from(`${title}-${image}-${author}`).toString("base64")}"`;

    // Check if client has cached version
    const ifNoneMatch = request.headers.get("if-none-match");
    if (ifNoneMatch === etag) {
      return new Response(null, {
        status: 304,
        headers: {
          "ETag": etag,
          "Cache-Control": "public, max-age=604800, s-maxage=604800, stale-while-revalidate=86400, immutable",
        }
      });
    }

    // Fetch the logo
    const logoUrl = new URL("/logo.png", request.url).toString();

    // For external images, use Next.js image optimizer as proxy
    // This converts S3 URLs to work with ImageResponse
    const processedImageUrl = image
      ? new URL(`/_next/image?url=${encodeURIComponent(image)}&w=1200&q=75`, request.url).toString()
      : null;

    return new ImageResponse(
      (
        <div
          style={{
            width: "100%",  
            height: "100%",
            display: "flex",
            flexDirection: "column",
            backgroundColor: "#0a0a0a",
            position: "relative",
          }}
        >
          {/* Post Image Background */}
          {processedImageUrl && (
            <div
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                display: "flex",
              }}
            >
              <img
                src={processedImageUrl}
                alt="Post"
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  opacity: 0.4,
                }}
              />
            </div>
          )}

          {/* Gradient Overlay */}
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background:
                "linear-gradient(to bottom, rgba(10,10,10,0.1), rgba(10,10,10,0.5))",
              display: "flex",
            }}
          />

          {/* Content Container */}
          <div
            style={{
              position: "relative",
              width: "100%",
              height: "100%",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              padding: "60px",
            }}
          >
            {/* Logo at Top */}
            <div
              style={{
                display: "flex",
                alignItems: "flex-start",
              }}
            >
              <img
                src={logoUrl}
                alt="Logo"
                width={"266px"}
                height={"60px"}
                className="object-contain"
              />
            </div>

            {/* Post Info at Bottom */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "16px",
              }}
            >
              {author && (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    fontSize: "24px",
                    color: "#a1a1aa",
                  }}
                >
                  <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                    <circle cx="12" cy="7" r="4"></circle>
                  </svg>
                  <span>{author}</span>
                </div>
              )}
              <h1
                style={{
                  fontSize: "64px",
                  fontWeight: "bold",
                  color: "#ffffff",
                  margin: 0,
                  lineHeight: 1.2,
                  maxWidth: "90%",
                }}
              >
                {title}
              </h1>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  fontSize: "24px",
                  color: "#a1a1aa",
                }}
              >
                <span>Blog by Ziad Hatem</span>
              </div>
            </div>
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
        headers: {
          // Cache for 7 days on browser and CDN
          // immutable tells browser this will never change for this URL
          "Cache-Control": "public, max-age=604800, s-maxage=604800, stale-while-revalidate=86400, immutable",
          // ETag for efficient cache validation
          "ETag": etag,
          // CDN-Cache-Control for Vercel/Cloudflare edge caching
          "CDN-Cache-Control": "public, max-age=31536000, immutable",
          // Vercel-specific edge caching (1 year)
          "Vercel-CDN-Cache-Control": "max-age=31536000",
        },
      }
    );
  } catch (error) {
    console.error("Error generating OG image:", error);
    return new Response("Failed to generate image", { status: 500 });
  }
}
