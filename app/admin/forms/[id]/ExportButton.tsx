"use client";

import { Download } from "lucide-react";
import * as XLSX from "xlsx";
import { toast } from "sonner";
import { Submission, Form } from "@/lib/form-types";

interface ExportButtonProps {
  submissions: any[];
  form: any;
}

export function ExportButton({ submissions, form }: ExportButtonProps) {
  const handleExport = () => {
    try {
      if (!submissions || submissions.length === 0) {
        toast.error("No submissions to export");
        return;
      }

      // Prepare data for export
      const exportData = submissions.map((sub) => {
        const row: Record<string, any> = {};

        // Add form fields
        form.fields.forEach((field: any) => {
          if (field.type === "replicator") {
            // For replicator arrays, jsonify them to fit in one cell
            const items = sub.data[field.id];
            row[field.label] = Array.isArray(items)
              ? JSON.stringify(
                  items.map((item) => {
                    // Strip internal IDs for cleaner extraction
                    const { _tempId, ...rest } = item;
                    return rest;
                  })
                )
              : "";
          } else {
            row[field.label] = sub.data[field.id] || "";
          }
        });

        return row;
      });

      // Create worksheet
      const worksheet = XLSX.utils.json_to_sheet(exportData);

      // Auto-width columns (simple heuristic)
      const colWidths = Object.keys(exportData[0] || {}).map((key) => ({
        wch: Math.max(key.length, 20), // Minimum 20 chars
      }));
      worksheet["!cols"] = colWidths;

      // Create workbook
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Submissions");

      // Generate filename safely
      const safeName = form.name.replace(/[^a-z0-9]/gi, "_").toLowerCase();
      const fileName = `${safeName}_submissions_${
        new Date().toISOString().split("T")[0]
      }.xlsx`;

      // Write file
      XLSX.writeFile(workbook, fileName);
      toast.success("Export started!");
    } catch (error) {
      console.error("Export failed:", error);
      toast.error("Failed to export Excel file");
    }
  };

  return (
    <button
      onClick={handleExport}
      className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition-colors shadow-sm"
    >
      <Download size={16} />
      Export to Excel
    </button>
  );
}
