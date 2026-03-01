import { Resend } from "resend";
import { NextRequest, NextResponse } from "next/server";
import { rateLimit } from "@/lib/rate-limit";

const contactRateLimiter = rateLimit({
  interval: 60 * 1000,
  uniqueTokenPerInterval: 500,
  prefix: "portfolio:rate-limit:contact",
});

import { isValidEmail } from "@/utils/validateEmail";

let resendClient: Resend | null = null;

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function getRequesterIp(request: NextRequest): string {
  // Prefer infrastructure-provided headers that cannot be spoofed by the client
  const vercelForwardedFor = request.headers.get("x-vercel-forwarded-for");
  const realIp = request.headers.get("x-real-ip");
  const forwardedFor = request.headers.get("x-forwarded-for");

  if (vercelForwardedFor) {
    return vercelForwardedFor.split(",")[0].trim();
  }

  if (realIp) {
    return realIp.trim();
  }

  if (forwardedFor) {
    return forwardedFor.split(",")[0].trim();
  }

  // @ts-expect-error NextRequest may expose ip depending on runtime adapter
  return request.ip || "anonymous";
}

function getEnvValue(name: string): string {
  return (process.env[name] || "").trim();
}

interface ContactMailConfig {
  resendApiKey: string;
  toEmail: string;
  fromEmail: string;
  confirmationFromEmail: string;
}

function getContactMailConfig():
  | { success: true; data: ContactMailConfig }
  | { success: false; error: string } {
  const resendApiKey = getEnvValue("RESEND_API_KEY");
  const toEmail = getEnvValue("CONTACT_TO_EMAIL");
  const fromEmail = getEnvValue("CONTACT_FROM_EMAIL");
  const confirmationFromEmail =
    getEnvValue("CONTACT_CONFIRMATION_FROM_EMAIL") || fromEmail;

  const missing = [
    !resendApiKey ? "RESEND_API_KEY" : null,
    !toEmail ? "CONTACT_TO_EMAIL" : null,
    !fromEmail ? "CONTACT_FROM_EMAIL" : null,
  ].filter(Boolean) as string[];

  if (missing.length > 0) {
    return {
      success: false,
      error: `Server configuration error: missing ${missing.join(", ")}`,
    };
  }

  return {
    success: true,
    data: {
      resendApiKey,
      toEmail,
      fromEmail,
      confirmationFromEmail,
    },
  };
}

interface ContactPayload {
  name: string;
  email: string;
  subject: string;
  message: string;
}

function parseAndValidatePayload(
  payload: unknown,
):
  | { success: true; data: ContactPayload }
  | { success: false; status: number; error: string } {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return {
      success: false,
      status: 400,
      error: "Invalid payload format",
    };
  }

  const body = payload as Record<string, unknown>;
  const name =
    typeof body.name === "string" ? body.name.trim().slice(0, 120) : "";
  const email =
    typeof body.email === "string" ? body.email.trim().slice(0, 200) : "";
  const subject =
    typeof body.subject === "string" ? body.subject.trim().slice(0, 200) : "";
  const message =
    typeof body.message === "string" ? body.message.trim().slice(0, 8000) : "";

  if (!name || !email || !subject || !message) {
    return {
      success: false,
      status: 400,
      error: "name, email, subject, and message are required",
    };
  }

  if (!isValidEmail(email)) {
    return {
      success: false,
      status: 400,
      error: "Invalid email format",
    };
  }

  return {
    success: true,
    data: {
      name,
      email,
      subject,
      message,
    },
  };
}

export async function POST(request: NextRequest) {
  try {
    const identifier = getRequesterIp(request);
    try {
      await contactRateLimiter.check(identifier, 6);
    } catch (error) {
      if (error instanceof Error && error.message === "Rate limit exceeded") {
        return NextResponse.json(
          { success: false, error: "Rate limit exceeded" },
          { status: 429 },
        );
      }

      console.error("[Contact API] Rate limiter backend failure:", error);
      // Fail open so transient limiter backend issues do not block legitimate contact requests.
    }

    let rawBody: unknown;
    try {
      rawBody = await request.json();
    } catch {
      return NextResponse.json(
        { success: false, error: "Invalid JSON body" },
        { status: 400 },
      );
    }

    const payloadResult = parseAndValidatePayload(rawBody);
    if (!payloadResult.success) {
      return NextResponse.json(
        { success: false, error: payloadResult.error },
        { status: payloadResult.status },
      );
    }

    const configResult = getContactMailConfig();
    if (!configResult.success) {
      console.error("[Contact API] Missing mail configuration");
      return NextResponse.json(
        { success: false, error: configResult.error },
        { status: 500 },
      );
    }

    const { name, email, subject, message } = payloadResult.data;
    const { resendApiKey, toEmail, fromEmail } = configResult.data;
    if (!resendClient) {
      resendClient = new Resend(resendApiKey);
    }
    const resend = resendClient;

    const escapedName = escapeHtml(name);
    const escapedEmail = escapeHtml(email);
    const escapedSubject = escapeHtml(subject);
    const escapedMessage = escapeHtml(message);
    const escapedIdentifier = escapeHtml(identifier);

    const notification = await resend.emails.send({
      from: fromEmail,
      to: [toEmail],
      replyTo: email,
      subject: `Portfolio Contact: ${subject}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333; border-bottom: 2px solid #00f5c0; padding-bottom: 10px;">
            New Contact Form Submission
          </h2>
          <div style="margin: 20px 0;">
            <p style="margin: 10px 0;"><strong>From:</strong> ${escapedName}</p>
            <p style="margin: 10px 0;"><strong>Email:</strong> ${escapedEmail}</p>
            <p style="margin: 10px 0;"><strong>Subject:</strong> ${escapedSubject}</p>
            <p style="margin: 10px 0;"><strong>IP:</strong> ${escapedIdentifier}</p>
          </div>
          <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #555;">Message:</h3>
            <p style="color: #333; line-height: 1.6; white-space: pre-wrap;">${escapedMessage}</p>
          </div>
        </div>
      `,
    });

    if (notification.error) {
      console.error(
        "[Contact API] Notification send failure:",
        notification.error,
      );
      return NextResponse.json(
        { success: false, error: "Failed to send email" },
        { status: 502 },
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: "Email sent successfully",
        id: notification.data?.id,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("[Contact API] Unexpected failure:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}
