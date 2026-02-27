"use client";

import React, { useMemo, useState } from "react";
import {
  AlertCircle,
  ArrowUpRight,
  CheckCircle2,
  Clock3,
  Github,
  Globe,
  Linkedin,
  Loader2,
  Mail,
  MessageSquareText,
  Send,
  Sparkles,
} from "lucide-react";

interface ContactFormData {
  name: string;
  email: string;
  subject: string;
  message: string;
}

interface FormErrors {
  name?: string;
  email?: string;
  subject?: string;
  message?: string;
}

const SUBJECT_TEMPLATES = [
  "New project inquiry",
  "Website redesign request",
  "Product collaboration",
  "Freelance availability",
];

const EMAIL_ADDRESS = "contact@ziadhatem.dev";

function validateForm(values: ContactFormData): FormErrors {
  const errors: FormErrors = {};

  if (values.name.trim().length < 2) {
    errors.name = "Please enter your full name.";
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim())) {
    errors.email = "Please enter a valid email address.";
  }

  if (values.subject.trim().length < 4) {
    errors.subject = "Subject should be at least 4 characters.";
  }

  if (values.message.trim().length < 20) {
    errors.message = "Message should be at least 20 characters.";
  }

  return errors;
}

function inputClass(hasError: boolean): string {
  return [
    "w-full rounded-xl border bg-background/70 px-4 py-3 text-sm text-foreground",
    "outline-none transition-all",
    hasError
      ? "border-destructive/70 focus:border-destructive"
      : "border-border/80 focus:border-accent/70 focus:ring-2 focus:ring-accent/20",
  ].join(" ");
}

export function ContactPage() {
  const [formData, setFormData] = useState<ContactFormData>({
    name: "",
    email: "",
    subject: "",
    message: "",
  });
  const [touched, setTouched] = useState<Record<keyof ContactFormData, boolean>>({
    name: false,
    email: false,
    subject: false,
    message: false,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<{
    type: "success" | "error" | null;
    message: string;
  }>({ type: null, message: "" });

  const errors = useMemo(() => validateForm(formData), [formData]);
  const isFormValid = useMemo(
    () => Object.keys(errors).length === 0,
    [errors]
  );

  const setField = (field: keyof ContactFormData, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const setFieldTouched = (field: keyof ContactFormData) => {
    setTouched((prev) => ({
      ...prev,
      [field]: true,
    }));
  };

  const setAllTouched = () => {
    setTouched({
      name: true,
      email: true,
      subject: true,
      message: true,
    });
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!isFormValid) {
      setAllTouched();
      setSubmitStatus({
        type: "error",
        message: "Please fix the highlighted fields before sending.",
      });
      return;
    }

    setIsSubmitting(true);
    setSubmitStatus({ type: null, message: "" });

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
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
          throw new Error("Too many attempts. Please wait one minute and try again.");
        }

        throw new Error(data.error || "Failed to send message.");
      }

      setSubmitStatus({
        type: "success",
        message:
          "Message sent successfully. Thanks for reaching out. I will reply as soon as possible.",
      });

      setFormData({
        name: "",
        email: "",
        subject: "",
        message: "",
      });
      setTouched({
        name: false,
        email: false,
        subject: false,
        message: false,
      });
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
    }
  };

  return (
    <div className="relative min-h-screen pb-12 pt-[150px]! overflow-hidden">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_0%,rgba(0,245,192,0.16),transparent_40%),radial-gradient(circle_at_90%_5%,rgba(59,130,246,0.12),transparent_36%)]" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <section className="rounded-3xl border border-border/80 bg-card/70 p-6 md:p-10 mb-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-accent/35 bg-accent/10 px-3 py-1 text-xs text-accent mb-4 uppercase tracking-[0.18em]">
            <Sparkles size={12} aria-hidden="true" />
            Contact
          </div>

          <h1 className="text-4xl md:text-5xl text-foreground leading-tight mb-4">
            Let&apos;s build something meaningful together
          </h1>

          <p className="text-muted-foreground max-w-3xl mb-6">
            Share your goals, timeline, and vision. I usually respond within one
            business day with clear next steps.
          </p>

          <div className="flex flex-wrap gap-3 text-xs">
            <span className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-background/60 px-3 py-1 text-muted-foreground">
              <Clock3 size={12} aria-hidden="true" />
              Typical response: 24 hours
            </span>
            <span className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-background/60 px-3 py-1 text-muted-foreground">
              <MessageSquareText size={12} aria-hidden="true" />
              Project inquiries and collaborations
            </span>
          </div>
        </section>

        <div className="grid gap-6 lg:grid-cols-12">
          <aside className="lg:col-span-5 space-y-4">
            <article className="rounded-2xl border border-border/80 bg-card/80 p-5">
              <h2 className="text-xl text-foreground mb-2">Direct Channels</h2>
              <p className="text-sm text-muted-foreground mb-4">
                Reach out through any of these channels if you prefer.
              </p>

              <div className="space-y-3">
                <a
                  href={`mailto:${EMAIL_ADDRESS}`}
                  className="group flex items-center justify-between gap-3 rounded-xl border border-border/70 bg-background/55 px-4 py-3 hover:border-accent/60 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
                      <Mail size={18} className="text-accent" />
                    </div>
                    <div>
                      <p className="text-foreground text-sm">Email</p>
                      <p className="text-xs text-muted-foreground">{EMAIL_ADDRESS}</p>
                    </div>
                  </div>
                  <ArrowUpRight
                    size={16}
                    className="text-muted-foreground group-hover:text-accent transition-colors"
                  />
                </a>

                <a
                  href="https://www.linkedin.com/in/ziadhatem2026/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-center justify-between gap-3 rounded-xl border border-border/70 bg-background/55 px-4 py-3 hover:border-accent/60 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
                      <Linkedin size={18} className="text-accent" />
                    </div>
                    <div>
                      <p className="text-foreground text-sm">LinkedIn</p>
                      <p className="text-xs text-muted-foreground">in/ziadhatem2026</p>
                    </div>
                  </div>
                  <ArrowUpRight
                    size={16}
                    className="text-muted-foreground group-hover:text-accent transition-colors"
                  />
                </a>

                <a
                  href="https://github.com/ziad-hatem"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-center justify-between gap-3 rounded-xl border border-border/70 bg-background/55 px-4 py-3 hover:border-accent/60 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
                      <Github size={18} className="text-accent" />
                    </div>
                    <div>
                      <p className="text-foreground text-sm">GitHub</p>
                      <p className="text-xs text-muted-foreground">github.com/ziad-hatem</p>
                    </div>
                  </div>
                  <ArrowUpRight
                    size={16}
                    className="text-muted-foreground group-hover:text-accent transition-colors"
                  />
                </a>

                <a
                  href="https://ziadhatem.dev"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-center justify-between gap-3 rounded-xl border border-border/70 bg-background/55 px-4 py-3 hover:border-accent/60 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
                      <Globe size={18} className="text-accent" />
                    </div>
                    <div>
                      <p className="text-foreground text-sm">Portfolio</p>
                      <p className="text-xs text-muted-foreground">ziadhatem.dev</p>
                    </div>
                  </div>
                  <ArrowUpRight
                    size={16}
                    className="text-muted-foreground group-hover:text-accent transition-colors"
                  />
                </a>
              </div>
            </article>
          </aside>

          <section className="lg:col-span-7 rounded-2xl border border-border/80 bg-card/85 p-5 md:p-7">
            <div className="mb-5">
              <h2 className="text-2xl text-foreground mb-2">Send a Message</h2>
              <p className="text-sm text-muted-foreground">
                Share enough context so I can reply with practical next steps.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="name" className="block text-sm text-foreground mb-2">
                    Name
                  </label>
                  <input
                    id="name"
                    name="name"
                    type="text"
                    value={formData.name}
                    onChange={(event) => setField("name", event.target.value)}
                    onBlur={() => setFieldTouched("name")}
                    className={inputClass(Boolean(touched.name && errors.name))}
                    placeholder="Your full name"
                    autoComplete="name"
                  />
                  {touched.name && errors.name ? (
                    <p className="text-xs text-destructive mt-1">{errors.name}</p>
                  ) : null}
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm text-foreground mb-2">
                    Email
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={(event) => setField("email", event.target.value)}
                    onBlur={() => setFieldTouched("email")}
                    className={inputClass(Boolean(touched.email && errors.email))}
                    placeholder="you@company.com"
                    autoComplete="email"
                  />
                  {touched.email && errors.email ? (
                    <p className="text-xs text-destructive mt-1">{errors.email}</p>
                  ) : null}
                </div>
              </div>

              <div>
                <label htmlFor="subject" className="block text-sm text-foreground mb-2">
                  Subject
                </label>
                <input
                  id="subject"
                  name="subject"
                  type="text"
                  value={formData.subject}
                  onChange={(event) => setField("subject", event.target.value)}
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

                {touched.subject && errors.subject ? (
                  <p className="text-xs text-destructive mt-1">{errors.subject}</p>
                ) : null}
              </div>

              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <label htmlFor="message" className="block text-sm text-foreground">
                    Message
                  </label>
                  <span className="text-xs text-muted-foreground">
                    {formData.message.trim().length} / 20+ characters
                  </span>
                </div>
                <textarea
                  id="message"
                  name="message"
                  value={formData.message}
                  onChange={(event) => setField("message", event.target.value)}
                  onBlur={() => setFieldTouched("message")}
                  rows={7}
                  className={inputClass(Boolean(touched.message && errors.message)) + " resize-y min-h-[160px]"}
                  placeholder="Briefly describe your project, timeline, and goals..."
                />
                {touched.message && errors.message ? (
                  <p className="text-xs text-destructive mt-1">{errors.message}</p>
                ) : null}
              </div>

              {submitStatus.type ? (
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
                    <CheckCircle2 className="text-emerald-300 mt-0.5 flex-shrink-0" size={18} />
                  ) : (
                    <AlertCircle className="text-destructive mt-0.5 flex-shrink-0" size={18} />
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
              ) : null}

              <button
                type="submit"
                disabled={isSubmitting}
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
        </div>
      </div>
    </div>
  );
}
