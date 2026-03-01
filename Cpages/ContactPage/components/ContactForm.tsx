"use client";

import React, { useMemo, useState, useRef, useEffect } from "react";
import { AlertCircle, CheckCircle2, Loader2, Send } from "lucide-react";
import {
  ContactFormData,
  validateContactForm,
} from "@/utils/validateContactForm";

const SUBJECT_TEMPLATES = [
  "New project inquiry",
  "Website redesign request",
  "Product collaboration",
  "Freelance availability",
];

function inputClass(hasError: boolean): string {
  return [
    "w-full rounded-xl border bg-background/70 px-4 py-3 text-sm text-foreground",
    "outline-none transition-all",
    hasError
      ? "border-destructive/70 focus:border-destructive"
      : "border-border/80 focus:border-accent/70 focus:ring-2 focus:ring-accent/20",
  ].join(" ");
}

export function ContactForm() {
  const [formData, setFormData] = useState<ContactFormData>({
    name: "",
    email: "",
    subject: "",
    message: "",
  });
  const [touched, setTouched] = useState<
    Record<keyof ContactFormData, boolean>
  >({
    name: false,
    email: false,
    subject: false,
    message: false,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const submittingRef = useRef(false);
  const [submitStatus, setSubmitStatus] = useState<{
    type: "success" | "error" | null;
    message: string;
  }>({ type: null, message: "" });

  const errors = useMemo(() => validateContactForm(formData), [formData]);
  const isFormValid = useMemo(() => Object.keys(errors).length === 0, [errors]);

  // Handle auto-dismiss of success status
  useEffect(() => {
    if (submitStatus.type === "success") {
      const timer = setTimeout(() => {
        setSubmitStatus({ type: null, message: "" });
      }, 8000);
      return () => clearTimeout(timer);
    }
  }, [submitStatus.type]);

  const setField = (field: keyof ContactFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const setFieldTouched = (field: keyof ContactFormData) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  };

  const setAllTouched = () => {
    setTouched({ name: true, email: true, subject: true, message: true });
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!isFormValid) {
      setAllTouched();
      return;
    }

    if (submittingRef.current) return;
    submittingRef.current = true;
    setIsSubmitting(true);
    setSubmitStatus({ type: null, message: "" });

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name.trim(),
          email: formData.email.trim(),
          subject: formData.subject.trim(),
          message: formData.message.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 429) {
          throw new Error(
            "Too many attempts. Please wait one minute and try again.",
          );
        }
        throw new Error(data.error || "Failed to send message.");
      }

      setSubmitStatus({
        type: "success",
        message: "Message sent successfully. Thanks for reaching out!",
      });

      setFormData({ name: "", email: "", subject: "", message: "" });
      setTouched({ name: false, email: false, subject: false, message: false });
    } catch (error) {
      setSubmitStatus({
        type: "error",
        message:
          error instanceof Error
            ? error.message
            : "Failed to send message. Please try again or email directly.",
      });
    } finally {
      setIsSubmitting(false);
      submittingRef.current = false;
    }
  };

  const hasAnyTouched = Object.values(touched).some(Boolean);

  return (
    <section
      className="lg:col-span-7 rounded-2xl border border-border/80 bg-card/85 p-5 md:p-7"
      data-aos="fade-up"
      data-aos-delay="110"
    >
      <div className="mb-5">
        <h2 className="text-2xl text-foreground mb-2">Send a Message</h2>
        <p className="text-sm text-muted-foreground">
          Share enough context so I can reply with practical next steps.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="name"
              className="block text-sm text-foreground mb-2"
            >
              Name
            </label>
            <input
              id="name"
              name="name"
              type="text"
              maxLength={120}
              value={formData.name}
              onChange={(e) => setField("name", e.target.value)}
              onBlur={() => setFieldTouched("name")}
              className={inputClass(Boolean(touched.name && errors.name))}
              placeholder="Your full name"
              autoComplete="name"
            />
            {touched.name && errors.name && (
              <p className="text-xs text-destructive mt-1">{errors.name}</p>
            )}
          </div>

          <div>
            <label
              htmlFor="email"
              className="block text-sm text-foreground mb-2"
            >
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              maxLength={200}
              value={formData.email}
              onChange={(e) => setField("email", e.target.value)}
              onBlur={() => setFieldTouched("email")}
              className={inputClass(Boolean(touched.email && errors.email))}
              placeholder="you@company.com"
              autoComplete="email"
            />
            {touched.email && errors.email && (
              <p className="text-xs text-destructive mt-1">{errors.email}</p>
            )}
          </div>
        </div>

        <div>
          <label
            htmlFor="subject"
            className="block text-sm text-foreground mb-2"
          >
            Subject
          </label>
          <input
            id="subject"
            name="subject"
            type="text"
            maxLength={200}
            value={formData.subject}
            onChange={(e) => setField("subject", e.target.value)}
            onBlur={() => setFieldTouched("subject")}
            className={inputClass(Boolean(touched.subject && errors.subject))}
            placeholder="What would you like to build?"
          />

          <div className="flex flex-wrap gap-2 mt-2">
            {SUBJECT_TEMPLATES.map((template) => (
              <button
                key={template}
                type="button"
                onClick={() => {
                  setField("subject", template);
                  setFieldTouched("subject");
                }}
                className="rounded-full border border-border/70 bg-background/60 px-3 py-1 text-xs text-muted-foreground hover:text-foreground hover:border-accent/60 transition-colors"
              >
                {template}
              </button>
            ))}
          </div>

          {touched.subject && errors.subject && (
            <p className="text-xs text-destructive mt-1">{errors.subject}</p>
          )}
        </div>

        <div>
          <div className="flex items-center justify-between gap-2 mb-2">
            <label htmlFor="message" className="block text-sm text-foreground">
              Message
            </label>
            <span className="text-xs text-muted-foreground">
              {formData.message.trim().length} / 8000
            </span>
          </div>
          <textarea
            id="message"
            name="message"
            maxLength={8000}
            value={formData.message}
            onChange={(e) => setField("message", e.target.value)}
            onBlur={() => setFieldTouched("message")}
            rows={7}
            className={
              inputClass(Boolean(touched.message && errors.message)) +
              " resize-y min-h-[160px]"
            }
            placeholder="Briefly describe your project, timeline, and goals..."
          />
          {touched.message && errors.message && (
            <p className="text-xs text-destructive mt-1">{errors.message}</p>
          )}
        </div>

        {submitStatus.type && (
          <div
            className={[
              "flex items-start gap-3 rounded-xl border px-4 py-3",
              submitStatus.type === "success"
                ? "border-emerald-400/30 bg-emerald-500/10"
                : "border-destructive/40 bg-destructive/10",
            ].join(" ")}
            role={submitStatus.type === "error" ? "alert" : "status"}
            aria-live={submitStatus.type === "error" ? "assertive" : "polite"}
          >
            {submitStatus.type === "success" ? (
              <CheckCircle2
                className="text-emerald-300 mt-0.5 shrink-0"
                size={18}
              />
            ) : (
              <AlertCircle
                className="text-destructive mt-0.5 shrink-0"
                size={18}
              />
            )}
            <p
              className={
                submitStatus.type === "success"
                  ? "text-emerald-100 text-sm"
                  : "text-destructive text-sm"
              }
            >
              {submitStatus.message}
            </p>
          </div>
        )}

        <button
          type="submit"
          disabled={isSubmitting || (!isFormValid && hasAnyTouched)}
          className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-accent px-5 py-3 text-sm font-medium text-accent-foreground hover:bg-accent/90 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="animate-spin" size={18} />
              Sending...
            </>
          ) : (
            <>
              Send Message
              <Send size={18} />
            </>
          )}
        </button>
      </form>
    </section>
  );
}
