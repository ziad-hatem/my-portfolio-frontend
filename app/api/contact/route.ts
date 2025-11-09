import { Resend } from "resend";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  // Initialize Resend only when the route is called
  const resend = new Resend(process.env.RESEND_API_KEY || "");
  try {
    const body = await request.json();
    const { name, email, subject, message } = body;

    // Validate required fields
    if (!name || !email || !subject || !message) {
      return NextResponse.json(
        { error: "All fields are required" },
        { status: 400 }
      );
    }

    // Send email to yourself (notification)
    const { data, error } = await resend.emails.send({
      from: "Portfolio Contact Form <contact@ziadhatem.dev>", // Replace with your verified domain
      to: ["contact@ziadhatem.dev"], // Your email
      replyTo: email, // The sender's email for easy reply
      subject: `Portfolio Contact: ${subject}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333; border-bottom: 2px solid #4F46E5; padding-bottom: 10px;">
            New Contact Form Submission
          </h2>

          <div style="margin: 20px 0;">
            <p style="margin: 10px 0;"><strong>From:</strong> ${name}</p>
            <p style="margin: 10px 0;"><strong>Email:</strong> ${email}</p>
            <p style="margin: 10px 0;"><strong>Subject:</strong> ${subject}</p>
          </div>

          <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #555;">Message:</h3>
            <p style="color: #333; line-height: 1.6; white-space: pre-wrap;">${message}</p>
          </div>

          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; color: #888; font-size: 12px;">
            <p>This email was sent from your portfolio contact form.</p>
          </div>
        </div>
      `,
    });

    if (error) {
      console.error("Resend error:", error);
      return NextResponse.json(
        { error: "Failed to send email" },
        { status: 500 }
      );
    }

    // Send confirmation email to the sender
    const confirmationResult = await resend.emails.send({
      from: "Ziad Hatem <contact@ziadhatem.dev>",
      to: [email], // Send to the person who submitted the form
      subject: "Thank you for contacting me!",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">


          <h2 style="color: #333; border-bottom: 2px solid #4F46E5; padding-bottom: 10px; text-align: center;">
            Thank You for Reaching Out!
          </h2>

          <div style="margin: 20px 0;">
            <p style="color: #333; line-height: 1.6;">Hi ${name},</p>
            <p style="color: #333; line-height: 1.6;">
              Thank you for contacting me! I've received your message and will get back to you as soon as possible.
            </p>
          </div>

          <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #555;">Your Message Summary:</h3>
            <p style="margin: 10px 0;"><strong>Subject:</strong> ${subject}</p>
            <p style="color: #333; line-height: 1.6; white-space: pre-wrap;"><strong>Message:</strong><br/>${message}</p>
          </div>

          <div style="margin: 20px 0;">
            <p style="color: #333; line-height: 1.6;">
              I typically respond within 24-48 hours. If you need to reach me urgently, feel free to send another message.
            </p>
            <p style="color: #333; line-height: 1.6;">
              Best regards,<br/>
              <strong>Ziad Hatem</strong>
            </p>
          </div>

          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; color: #888; font-size: 12px; text-align: center;">
            <p>This is an automated confirmation email. Please do not reply to this email.</p>
          </div>
        </div>
      `,
    });

    // Log if confirmation email fails, but don't fail the entire request
    if (confirmationResult.error) {
      console.error("Confirmation email error:", confirmationResult.error);
    }

    return NextResponse.json(
      { message: "Email sent successfully", id: data?.id },
      { status: 200 }
    );
  } catch (error) {
    console.error("Contact form error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
