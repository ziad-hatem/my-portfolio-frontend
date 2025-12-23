import { getForm, getSubmissions } from "@/lib/form-actions";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { SubmissionDetailModal } from "./SubmissionDetailModal";
import { ExportButton } from "./ExportButton";

export default async function FormSubmissionsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const form = await getForm(id);
  if (!form) notFound();

  const submissions = await getSubmissions(id);

  // Identify significant columns (simple fields)
  const columns = form.fields
    .filter((f) => ["text", "email"].includes(f.type))
    .slice(0, 4);

  return (
    <div className="p-8 max-w-7xl mx-auto text-white">
      <div className="mb-8">
        <Link
          href="/admin/forms"
          className="inline-flex items-center gap-2 text-zinc-400 hover:text-white mb-4 transition-colors"
        >
          <ArrowLeft size={16} /> Back to Forms
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{form.name}</h1>
            <p className="text-zinc-400 mt-1">
              Viewing {submissions.length} submissions
            </p>
          </div>
          <ExportButton submissions={submissions} form={form} />
        </div>
      </div>

      <div className="bg-zinc-900/30 border border-zinc-800 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-zinc-900 border-b border-zinc-800">
              <tr>
                <th className="px-6 py-4 font-medium text-zinc-400 uppercase tracking-wider text-xs">
                  Submitted At
                </th>
                {columns.map((col) => (
                  <th
                    key={col.id}
                    className="px-6 py-4 font-medium text-zinc-400 uppercase tracking-wider text-xs whitespace-nowrap"
                  >
                    {col.label}
                  </th>
                ))}
                <th className="px-6 py-4 font-medium text-zinc-400 uppercase tracking-wider text-xs text-right">
                  Data
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {submissions.map((sub) => (
                <tr
                  key={sub.submissionId}
                  className="hover:bg-zinc-900/50 transition-colors"
                >
                  <td className="px-6 py-4 text-zinc-300 font-mono text-xs whitespace-nowrap">
                    {new Date(sub.submittedAt).toLocaleString()}
                  </td>
                  {columns.map((col) => (
                    <td
                      key={col.id}
                      className="px-6 py-4 text-white max-w-[200px] truncate"
                    >
                      {String(sub.data[col.id] || "-")}
                    </td>
                  ))}
                  <td className="px-6 py-4 text-right">
                    <SubmissionDetailModal submission={sub} form={form} />
                  </td>
                </tr>
              ))}
              {submissions.length === 0 && (
                <tr>
                  <td
                    colSpan={columns.length + 2}
                    className="px-6 py-12 text-center text-zinc-500"
                  >
                    No submissions found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
