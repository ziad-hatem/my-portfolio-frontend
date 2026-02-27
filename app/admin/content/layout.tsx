import { ReactNode } from "react";
import AdminContentNav from "./_components/AdminContentNav";

export const dynamic = "force-dynamic";

export default function AdminContentLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="relative min-h-screen px-4 py-8 md:px-8">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(0,245,192,0.09),transparent_45%),radial-gradient(circle_at_90%_0%,rgba(59,130,246,0.1),transparent_38%)]" />
      <div className="relative max-w-7xl mx-auto">
        <header className="mb-6">
          <p className="inline-flex rounded-full border border-accent/30 bg-accent/10 px-3 py-1 text-xs uppercase tracking-[0.2em] text-accent mb-3">
            Admin Console
          </p>
          <h1 className="text-3xl font-semibold text-foreground mb-2">Content Control Center</h1>
          <p className="text-sm text-muted-foreground mb-4">
            Manage home, projects, posts, and tools SEO with guided editors and advanced JSON.
          </p>
          <AdminContentNav />
        </header>

        {children}
      </div>
    </div>
  );
}
