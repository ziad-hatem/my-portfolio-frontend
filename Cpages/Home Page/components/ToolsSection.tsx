import Link from "next/link";
import {
  ArrowRight,
  FileArchive,
  FileStack,
  ShieldCheck,
  Sparkles,
  Wrench,
} from "lucide-react";

const featuredTools = [
  {
    id: "image-to-pdf",
    title: "Image to PDF",
    description:
      "Combine JPG, PNG, and more into a single PDF directly in the browser.",
    link: "/tools/image-to-pdf",
    Icon: FileStack,
  },
  {
    id: "compress-pdf",
    title: "Compress PDF",
    description:
      "Reduce PDF size quickly for uploads and sharing without sending files to a server.",
    link: "/tools/compress-pdf",
    Icon: FileArchive,
  },
];

export default function ToolsSection() {
  return (
    <section className="relative py-20 px-4 sm:px-6 lg:px-8">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_100%,rgba(0,245,192,0.08),transparent_40%)]" />
      <div className="relative max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-12 gap-10 items-start">
          <div className="lg:col-span-4">
            <div className="inline-flex items-center gap-2 rounded-full border border-accent/30 bg-accent/10 px-3 py-1 text-xs uppercase tracking-[0.18em] text-accent mb-4">
              <Wrench size={12} aria-hidden="true" />
              Utilities
            </div>

            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-4">
              Useful Tools
            </h2>

            <p className="text-lg text-muted-foreground mb-6 leading-relaxed">
              A growing toolkit of practical utilities built for speed, privacy,
              and daily workflows.
            </p>

            <div className="inline-flex items-center gap-2 rounded-lg border border-border/70 bg-card/60 px-3 py-2 text-sm text-muted-foreground mb-7">
              <ShieldCheck size={16} className="text-accent" aria-hidden="true" />
              Runs locally in your browser
            </div>

            <Link
              href="/tools"
              className="inline-flex items-center gap-2 text-accent hover:gap-3 transition-all text-base font-medium"
            >
              <Sparkles size={16} aria-hidden="true" />
              <span>Explore All Tools</span>
              <ArrowRight size={18} aria-hidden="true" />
            </Link>
          </div>

          <div className="lg:col-span-8 grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {featuredTools.map((tool) => (
              <Link
                key={tool.id}
                href={tool.link}
                className="group rounded-2xl border border-border/80 bg-card/85 p-5 transition-all hover:border-accent/60 hover:translate-y-[-2px]"
              >
                <div className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-accent/30 bg-accent/10 mb-4">
                  <tool.Icon size={20} className="text-accent" aria-hidden="true" />
                </div>

                <h3 className="text-lg font-semibold text-foreground mb-2 group-hover:text-accent transition-colors">
                  {tool.title}
                </h3>

                <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                  {tool.description}
                </p>

                <span className="inline-flex items-center gap-2 text-sm font-medium text-accent">
                  Open Tool
                  <ArrowRight size={14} aria-hidden="true" />
                </span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
