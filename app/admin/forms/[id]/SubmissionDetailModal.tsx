"use client";

import { useState, useEffect } from "react";
import { Eye, X } from "lucide-react";
import { Form } from "@/lib/form-types";

// Helper type for serialized form (from Server Actions)
type SerializedForm = Omit<Form, "_id" | "createdAt"> & {
  _id: string;
  createdAt: string;
};

export function SubmissionDetailModal({
  submission,
  form,
}: {
  submission: any;
  form: SerializedForm | Form;
}) {
  const [isOpen, setIsOpen] = useState(false);

  // Close on Escape key
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsOpen(false);
    };
    if (isOpen) window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [isOpen]);

  // Update body scroll
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center gap-2 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 rounded text-xs text-white transition-colors"
      >
        <Eye size={14} /> Details
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={() => setIsOpen(false)}
          />

          {/* Modal Content */}
          <div className="bg-zinc-950 border border-zinc-800 rounded-2xl w-full max-w-2xl max-h-[85vh] shadow-2xl relative flex flex-col animate-in zoom-in-95 duration-200 z-10">
            {/* Header */}
            <div className="p-6 border-b border-zinc-800 flex justify-between items-center shrink-0">
              <div>
                <h3 className="text-xl font-bold text-white">
                  Submission Details
                </h3>
                <p className="text-xs text-zinc-500 font-mono mt-1">
                  {submission.submissionId}
                </p>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="bg-zinc-900 text-zinc-400 hover:text-white hover:bg-zinc-800 p-2 rounded-full transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Scrollable Body */}
            <div className="p-6 overflow-y-auto custom-scrollbar">
              <div className="grid gap-8">
                {form.fields
                  .filter((f) => !f.type.startsWith("static"))
                  .map((field) => (
                    <div key={field.id} className="space-y-3">
                      <div className="flex items-baseline justify-between border-b border-zinc-900 pb-2">
                        <label className="text-xs uppercase tracking-wider font-bold text-zinc-500">
                          {field.label}
                        </label>
                        <span className="text-[10px] text-zinc-700 font-mono uppercase">
                          {field.type}
                        </span>
                      </div>

                      {field.type === "image" || field.type === "video" ? (
                        submission.data[field.id] ? (
                          field.type === "image" ? (
                            <div className="bg-zinc-900/50 p-2 rounded-xl border border-zinc-800 inline-block">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={submission.data[field.id]}
                                alt="Submitted Content"
                                className="max-w-full max-h-[300px] rounded-lg"
                              />
                            </div>
                          ) : (
                            <div className="p-4 bg-zinc-900/50 border border-zinc-800 rounded-lg flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center text-green-500">
                                <Eye size={20} />
                              </div>
                              <div>
                                <p className="text-sm font-medium text-white">
                                  Video Attached
                                </p>
                                <p className="text-xs text-zinc-500 max-w-[200px] truncate">
                                  {submission.data[field.id].substring(0, 50)}
                                  ...
                                </p>
                              </div>
                            </div>
                          )
                        ) : (
                          <div className="text-zinc-600 italic text-sm">
                            No file uploaded
                          </div>
                        )
                      ) : field.type === "replicator" ? (
                        <div className="space-y-3 pl-2 border-l-2 border-zinc-800">
                          {(submission.data[field.id] || []).map(
                            (item: any, idx: number) => (
                              <div
                                key={idx}
                                className="bg-zinc-900/50 p-4 rounded-xl border border-zinc-800/50 space-y-3"
                              >
                                <div className="text-xs text-blue-500 font-mono mb-2">
                                  #{idx + 1}
                                </div>
                                {field.schema?.map((sub) => (
                                  <div
                                    key={sub.id}
                                    className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-sm"
                                  >
                                    <span className="text-zinc-500 font-medium">
                                      {sub.label}
                                    </span>
                                    <div className="sm:col-span-2 text-zinc-200">
                                      {sub.type === "image" && item[sub.id] ? (
                                        // eslint-disable-next-line @next/next/no-img-element
                                        <img
                                          src={item[sub.id]}
                                          alt="Sub item"
                                          className="h-16 w-16 object-cover rounded border border-zinc-700"
                                        />
                                      ) : (
                                        <span className="break-words">
                                          {String(item[sub.id] || "-")}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )
                          )}
                          {(!submission.data[field.id] ||
                            submission.data[field.id].length === 0) && (
                            <div className="text-zinc-600 italic text-sm">
                              No items in list
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="text-sm text-zinc-200 whitespace-pre-wrap leading-relaxed select-text">
                          {String(submission.data[field.id] || "") || (
                            <span className="text-zinc-700 italic">Empty</span>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
              </div>

              {/* Metadata Section */}
              {submission.metadata && (
                <div className="mt-8 pt-8 border-t border-zinc-800">
                  <h4 className="text-sm font-bold text-zinc-400 uppercase tracking-wider mb-4">
                    Device & Location
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-zinc-900/30 p-4 rounded-xl border border-zinc-800">
                      <div className="text-xs text-zinc-500 mb-1">
                        IP Address
                      </div>
                      <div className="text-sm text-zinc-300 font-mono">
                        {submission.metadata.ip || "Unknown"}
                      </div>
                    </div>

                    {/* IP Location Data */}
                    {submission.metadata.ipInfo &&
                      submission.metadata.ipInfo.status === "success" && (
                        <>
                          <div className="bg-zinc-900/30 p-4 rounded-xl border border-zinc-800">
                            <div className="text-xs text-zinc-500 mb-1">
                              Network Location
                            </div>
                            <div className="text-sm text-zinc-300">
                              {submission.metadata.ipInfo.city},{" "}
                              {submission.metadata.ipInfo.country}
                              <div className="text-xs text-zinc-500 mt-1">
                                {submission.metadata.ipInfo.regionName},{" "}
                                {submission.metadata.ipInfo.timezone}
                              </div>
                            </div>
                          </div>
                          <div className="bg-zinc-900/30 p-4 rounded-xl border border-zinc-800">
                            <div className="text-xs text-zinc-500 mb-1">
                              ISP / Org
                            </div>
                            <div className="text-sm text-zinc-300">
                              {submission.metadata.ipInfo.isp}
                              {submission.metadata.ipInfo.org !==
                                submission.metadata.ipInfo.isp && (
                                <span className="text-zinc-500 block text-xs">
                                  {submission.metadata.ipInfo.org}
                                </span>
                              )}
                            </div>
                          </div>
                        </>
                      )}
                    <div className="bg-zinc-900/30 p-4 rounded-xl border border-zinc-800">
                      <div className="text-xs text-zinc-500 mb-1">Language</div>
                      <div className="text-sm text-zinc-300">
                        {submission.metadata.language || "-"}
                      </div>
                    </div>
                    <div className="col-span-full bg-zinc-900/30 p-4 rounded-xl border border-zinc-800">
                      <div className="text-xs text-zinc-500 mb-1">
                        User Agent
                      </div>
                      <div className="text-xs text-zinc-400 font-mono break-all leading-relaxed">
                        {submission.metadata.userAgent || "-"}
                      </div>
                    </div>
                    <div className="bg-zinc-900/30 p-4 rounded-xl border border-zinc-800">
                      <div className="text-xs text-zinc-500 mb-1">
                        Screen Resolution
                      </div>
                      <div className="text-sm text-zinc-300">
                        {submission.metadata.screen
                          ? `${submission.metadata.screen.width} x ${submission.metadata.screen.height}`
                          : "-"}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-zinc-800 bg-zinc-900/50 rounded-b-2xl flex justify-end">
              <button
                onClick={() => setIsOpen(false)}
                className="px-4 py-2 bg-white text-black text-sm font-semibold rounded-lg hover:bg-zinc-200 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
