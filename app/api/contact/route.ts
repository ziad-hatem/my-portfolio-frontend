import { Resend } from "resend";
import { NextRequest, NextResponse } from "next/server";
import { rateLimit } from "@/lib/rate-limit";

const contactRateLimiter = rateLimit({
  interval: 60 * 1000,
  uniqueTokenPerInterval: 500,
  prefix: "portfolio:rate-limit:contact",
});

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function getRequesterIp(request: NextRequest): string {
  const forwardedFor = request.headers.get("x-forwarded-for");
  const realIp = request.headers.get("x-real-ip");

  if (forwardedFor) {
    return forwardedFor.split(",")[0].trim();
  }

  if (realIp) {
    return realIp.trim();
  }

  // @ts-expect-error NextRequest may expose ip depending on runtime adapter
  return request.ip || "anonymous";
}

function getRequiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required env var: ${name}`);
  }
  return value;
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
          { status: 429 }
        );
      }

      console.error("[Contact API] Rate limiter backend failure:", error);
      // Fail open so transient limiter backend issues do not block legitimate contact requests.
    }

    const body = await request.json();
    const { name, email, subject, message } = body ?? {};

    if (!name || !email || !subject || !message) {
      return NextResponse.json(
        { success: false, error: "name, email, subject, and message are required" },
        { status: 400 }
      );
    }

    if (
      typeof name !== "string" ||
      typeof email !== "string" ||
      typeof subject !== "string" ||
      typeof message !== "string"
    ) {
      return NextResponse.json(
        { success: false, error: "Invalid payload format" },
        { status: 400 }
      );
    }

    if (!isValidEmail(email)) {
      return NextResponse.json(
        { success: false, error: "Invalid email format" },
        { status: 400 }
      );
    }

    const sanitizedName = name.trim().slice(0, 120);
    const sanitizedEmail = email.trim().slice(0, 200);
    const sanitizedSubject = subject.trim().slice(0, 200);
    const sanitizedMessage = message.trim().slice(0, 8000);

    if (!sanitizedName || !sanitizedSubject || !sanitizedMessage) {
      return NextResponse.json(
        { success: false, error: "Invalid payload values" },
        { status: 400 }
      );
    }

    const resend = new Resend(getRequiredEnv("RESEND_API_KEY"));
    const toEmail = getRequiredEnv("CONTACT_TO_EMAIL");
    const fromEmail = getRequiredEnv("CONTACT_FROM_EMAIL");
    const confirmationFromEmail = getRequiredEnv("CONTACT_CONFIRMATION_FROM_EMAIL");

    const notification = await resend.emails.send({
      from: fromEmail,
      to: [toEmail],
      replyTo: sanitizedEmail,
      subject: `Portfolio Contact: ${sanitizedSubject}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333; border-bottom: 2px solid #4F46E5; padding-bottom: 10px;">
            New Contact Form Submission
          </h2>
          <div style="margin: 20px 0;">
            <p style="margin: 10px 0;"><strong>From:</strong> ${sanitizedName}</p>
            <p style="margin: 10px 0;"><strong>Email:</strong> ${sanitizedEmail}</p>
            <p style="margin: 10px 0;"><strong>Subject:</strong> ${sanitizedSubject}</p>
            <p style="margin: 10px 0;"><strong>IP:</strong> ${identifier}</p>
          </div>
          <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #555;">Message:</h3>
            <p style="color: #333; line-height: 1.6; white-space: pre-wrap;">${sanitizedMessage}</p>
          </div>
        </div>
      `,
    });

    if (notification.error) {
      console.error("[Contact API] Notification send failure:", notification.error);
      return NextResponse.json(
        { success: false, error: "Failed to send email" },
        { status: 502 }
      );
    }

    const confirmation = await resend.emails.send({
      from: confirmationFromEmail,
      to: [sanitizedEmail],
      subject: "Thanks for reaching out",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333; border-bottom: 2px solid #4F46E5; padding-bottom: 10px; text-align: center;">
            Thanks for your message
          </h2>
          <p style="color: #333; line-height: 1.6;">Hi ${sanitizedName},</p>
          <p style="color: #333; line-height: 1.6;">
            Your message was received successfully. I will respond as soon as possible.
          </p>
          <div style="background-color: #f5f5f5; padding: 16px; border-radius: 8px; margin: 16px 0;">
            <p style="margin: 0;"><strong>Subject:</strong> ${sanitizedSubject}</p>
          </div>
        </div>
      `,
    });

    if (confirmation.error) {
      console.error("[Contact API] Confirmation send failure:", confirmation.error);
    }

    return NextResponse.json(
      { success: true, message: "Email sent successfully", id: notification.data?.id },
      { status: 200 }
    );
  } catch (error) {
    console.error("[Contact API] Unexpected failure:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
