"use client";

import { useState, useEffect } from "react";
import { submitForm, verifySubmission } from "@/lib/form-actions";
import { toast } from "sonner";
import {
  Loader2,
  Send,
  CheckCircle2,
  X,
  UploadCloud,
  Plus,
  Trash2,
} from "lucide-react";
import { Form, FormField } from "@/lib/form-types";
import { StyledInput, StyledTextarea } from "@/components/ui/StyledInput";
import { processImageUpload } from "@/utils/imageUpload";
import { nanoid } from "nanoid";
import { motion, AnimatePresence } from "motion/react";
import confetti from "canvas-confetti";
import { useSearchParams } from "next/navigation";

// Helper type for serialized form (from Server Actions)
type SerializedForm = Omit<Form, "_id" | "createdAt"> & {
  _id: string;
  createdAt: string;
};

export function FormDisplay({ form }: { form: SerializedForm | Form }) {
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [uploadingState, setUploadingState] = useState<Record<string, boolean>>(
    {}
  );

  useEffect(() => {
    if (submitted) {
      const duration = 3 * 1000;
      const animationEnd = Date.now() + duration;
      const defaults = {
        startVelocity: 30,
        spread: 360,
        ticks: 60,
        zIndex: 60,
      };

      const randomInRange = (min: number, max: number) =>
        Math.random() * (max - min) + min;

      const interval: any = setInterval(function () {
        const timeLeft = animationEnd - Date.now();

        if (timeLeft <= 0) {
          return clearInterval(interval);
        }

        const particleCount = 50 * (timeLeft / duration);
        confetti({
          ...defaults,
          particleCount,
          origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
        });
        confetti({
          ...defaults,
          particleCount,
          origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
        });
      }, 250);

      return () => clearInterval(interval);
    }
  }, [submitted]);

  const handleInputChange = (fieldId: string, value: any) => {
    setFormData((prev) => ({ ...prev, [fieldId]: value }));
  };

  const handleReplicatorChange = (
    replicatorId: string,
    itemId: string,
    subFieldId: string,
    value: any
  ) => {
    setFormData((prev) => {
      const currentList = prev[replicatorId] || [];
      if (!Array.isArray(currentList)) return prev;

      const updatedList = currentList.map((item: any) => {
        if (item._tempId === itemId) {
          return { ...item, [subFieldId]: value };
        }
        return item;
      });
      return { ...prev, [replicatorId]: updatedList };
    });
  };

  const addReplicatorItem = (replicatorId: string, maxItems?: number) => {
    setFormData((prev) => {
      const currentList = prev[replicatorId] || [];
      if (maxItems && currentList.length >= maxItems) {
        toast.warning(`Maximum ${maxItems} items allowed.`);
        return prev;
      }
      return {
        ...prev,
        [replicatorId]: [...currentList, { _tempId: nanoid() }],
      };
    });
  };

  const removeReplicatorItem = (
    replicatorId: string,
    itemId: string,
    minItems?: number
  ) => {
    setFormData((prev) => {
      const currentList = prev[replicatorId] || [];
      if (minItems && currentList.length <= minItems) {
        toast.warning(`Minimum ${minItems} items required.`);
        return prev;
      }
      return {
        ...prev,
        [replicatorId]: currentList.filter((x: any) => x._tempId !== itemId),
      };
    });
  };

  const handleFileUpload = async (
    fieldId: string,
    file: File,
    isReplicator = false,
    replicatorData?: { repId: string; itemId: string; subId: string }
  ) => {
    const uploadKey = isReplicator
      ? `${replicatorData?.repId}-${replicatorData?.itemId}-${replicatorData?.subId}`
      : fieldId;

    setUploadingState((prev) => ({ ...prev, [uploadKey]: true }));
    try {
      const result = await processImageUpload(file);
      if (result.success && result.data) {
        if (isReplicator && replicatorData) {
          // @ts-ignore
          handleReplicatorChange(
            replicatorData.repId,
            replicatorData.itemId,
            replicatorData.subId,
            result.data
          );
        } else {
          handleInputChange(fieldId, result.data);
        }
        toast.success("File uploaded!");
      } else {
        toast.error(result.error || "Upload failed");
      }
    } catch (err) {
      console.error(err);
      toast.error("Upload error");
    } finally {
      setUploadingState((prev) => ({ ...prev, [uploadKey]: false }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation: Check minItems for Replicators
    for (const field of form.fields) {
      if (field.type === "replicator" && field.minItems) {
        const items = formData[field.id] || [];
        if (items.length < field.minItems) {
          toast.error(
            `${field.label} requires at least ${field.minItems} items.`
          );
          return;
        }
      }
    }

    setLoading(true);
    try {
      const result = await submitForm(form.formId, formData);
      if (result.success && result.submissionId) {
        setVerifying(true);
        const verification = await verifySubmission(result.submissionId);
        if (verification.exists) {
          setSubmitted(true);
          toast.success("Submission received!");
        } else {
          toast.error("Verification failed.");
        }
      } else {
        toast.error("Failed to submit form");
      }
    } catch (error) {
      console.error(error);
      toast.error("An unexpected error occurred");
    } finally {
      setLoading(false);
      setVerifying(false);
    }
  };

  if (submitted) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black overflow-hidden">
        {/* Expanding Green Circle Background */}
        <motion.div
          initial={{ scale: 0, opacity: 0.5 }}
          animate={{ scale: 30, opacity: 1 }}
          transition={{ duration: 1.5, ease: [0.22, 1, 0.36, 1] }}
          className="w-24 h-24 bg-green-500 rounded-full absolute"
        />

        {/* Content Container */}
        <div className="relative z-10 flex flex-col items-center">
          {/* Animated Checkmark Circle */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{
              delay: 0.4,
              type: "spring",
              stiffness: 200,
              damping: 20,
            }}
            className="w-40 h-40 bg-white rounded-full flex items-center justify-center mb-8 shadow-2xl"
          >
            <svg
              className="w-24 h-24 text-green-500"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <motion.path
                d="M20 6L9 17l-5-5"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 1 }}
                transition={{ delay: 0.8, duration: 0.5, ease: "easeOut" }}
              />
            </svg>
          </motion.div>

          {/* Text Animations */}
          <div className="text-center">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1, duration: 0.5 }}
              className="text-5xl font-extrabold text-white mb-4 drop-shadow-lg"
            >
              You're All Set!
            </motion.h2>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.3, duration: 0.5 }}
              className="text-white/90 text-xl font-medium"
            >
              Your submission has been cooked. 🍳
            </motion.p>
          </div>
        </div>
      </div>
    );
  }

  const searchParams = useSearchParams();
  const lang = searchParams?.get("lang");

  const isRtl =
    lang === "ar" ||
    /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/.test(
      form.name
    ) ||
    /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/.test(
      form.description || ""
    );

  const renderInput = (
    field: FormField,
    val: any,
    onChange: (v: any) => void,
    uploadKeyOverride?: string,
    replicatorCtx?: any
  ) => {
    if (field.type === "textarea") {
      return (
        <StyledTextarea
          label={field.label}
          placeholder={field.placeholder}
          required={field.required}
          value={val || ""}
          onChange={(e) => onChange(e.target.value)}
          className={isRtl ? "text-right font-bold placeholder:text-right" : ""}
          dir={isRtl ? "rtl" : "ltr"}
        />
      );
    }

    if (field.type === "image" || field.type === "video") {
      // Image/Video rendering logic remains the same, just checking context
      const uploadKey = uploadKeyOverride || field.id;
      return (
        <div className="space-y-3">
          <label className="text-base font-medium text-zinc-200 ps-1 block rtl:text-right rtl:font-bold">
            {field.label}
          </label>
          <div
            className={`border-2 border-zinc-800 border-dashed rounded-2xl p-8 transition-colors text-center relative ${
              val
                ? "bg-zinc-900/30"
                : "bg-zinc-900/20 hover:bg-zinc-900/40 hover:border-zinc-600"
            }`}
          >
            {val ? (
              <div className="relative">
                {field.type === "image" && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={val}
                    alt="Preview"
                    className="max-h-64 mx-auto rounded-xl shadow-lg"
                  />
                )}
                {field.type === "video" && (
                  <div className="text-green-500 flex flex-col items-center py-4">
                    <CheckCircle2 size={48} className="mb-3" />
                    <span className="text-lg font-medium">
                      Video attached successfully
                    </span>
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => onChange("")}
                  className="absolute -top-4 -end-4 bg-red-500 text-white rounded-full p-2 hover:bg-red-600 transition-colors shadow-md"
                >
                  <X size={16} />
                </button>
              </div>
            ) : (
              <>
                {uploadingState[uploadKey] ? (
                  <div className="flex flex-col items-center justify-center text-zinc-400 py-6">
                    <Loader2 className="animate-spin mb-3 w-8 h-8" />
                    <span className="text-sm">Uploading...</span>
                  </div>
                ) : (
                  <label className="cursor-pointer block py-4">
                    <input
                      type="file"
                      accept={field.type === "image" ? "image/*" : "video/*"}
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          if (replicatorCtx) {
                            handleFileUpload(
                              field.id,
                              file,
                              true,
                              replicatorCtx
                            );
                          } else {
                            handleFileUpload(field.id, file);
                          }
                        }
                      }}
                    />
                    <div className="bg-zinc-800/50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-zinc-400 group-hover:text-white transition-colors">
                      <UploadCloud size={32} />
                    </div>
                    <span className="text-zinc-300 font-medium block text-lg mb-1">
                      Click to upload {field.type}
                    </span>
                    <span className="text-zinc-500 text-sm block">
                      SVG, PNG, JPG or MP4
                    </span>
                  </label>
                )}
              </>
            )}
          </div>
        </div>
      );
    }

    return (
      <StyledInput
        type={field.type}
        label={field.label}
        placeholder={field.placeholder}
        required={field.required}
        value={val || ""}
        onChange={(e) => onChange(e.target.value)}
        className={isRtl ? "text-right font-bold placeholder:text-right" : ""}
        dir={isRtl ? "rtl" : "ltr"}
      />
    );
  };

  return (
    <div
      className="min-h-screen bg-black flex flex-col items-center justify-center p-4"
      dir={isRtl ? "rtl" : "ltr"}
    >
      <div
        className={`w-full max-w-3xl ${
          isRtl ? "font-arabic text-right font-bold" : ""
        }`}
      >
        <div className="mb-10 text-center space-y-3">
          <h1 className="text-4xl font-bold text-white tracking-tight">
            {form.name}
          </h1>
          {form.description && (
            <p className="text-lg text-zinc-400 max-w-2xl mx-auto leading-relaxed">
              {form.description}
            </p>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {form.fields &&
            form.fields.map((field) => (
              <div key={field.id} className="space-y-2">
                {field.type.startsWith("static") ? (
                  <div className="py-2 space-y-2">
                    {field.type === "static-text" && (
                      <h3 className="text-xl font-semibold text-white">
                        {field.label}
                      </h3>
                    )}
                    {field.content && field.type === "static-text" && (
                      <p className="text-zinc-300 text-base whitespace-pre-wrap leading-relaxed">
                        {field.content}
                      </p>
                    )}
                    {field.content && field.type === "static-image" && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={field.content}
                        alt={field.label}
                        className="w-full rounded-2xl border border-zinc-800"
                      />
                    )}
                  </div>
                ) : field.type === "replicator" ? (
                  <div className="space-y-4 p-6 border border-zinc-800 rounded-2xl bg-zinc-900/20">
                    <div className="flex justify-between items-center">
                      <label className="text-lg font-medium text-zinc-200 ps-1">
                        {field.label}
                      </label>
                      <span className="text-sm font-medium text-zinc-500 bg-zinc-900 px-2 py-1 rounded-md border border-zinc-800">
                        {(formData[field.id] || []).length} /{" "}
                        {field.maxItems || "∞"}
                      </span>
                    </div>

                    <div className="space-y-4">
                      {(formData[field.id] || []).map((item: any) => (
                        <div
                          key={item._tempId}
                          className="relative p-5 bg-zinc-950/50 border border-zinc-700/50 rounded-xl animate-in fade-in slide-in-from-top-2"
                        >
                          <button
                            type="button"
                            onClick={() =>
                              removeReplicatorItem(
                                field.id,
                                item._tempId,
                                field.minItems
                              )
                            }
                            className="absolute top-3 end-3 p-2 bg-zinc-900 rounded-lg text-zinc-400 hover:text-red-400 hover:bg-zinc-800 transition-colors"
                          >
                            <Trash2 size={18} />
                          </button>
                          <div className="space-y-5 pe-10">
                            {field.schema?.map((sub) => (
                              <div key={sub.id}>
                                {renderInput(
                                  sub,
                                  item[sub.id],
                                  (v) =>
                                    handleReplicatorChange(
                                      field.id,
                                      item._tempId,
                                      sub.id,
                                      v
                                    ),
                                  `${field.id}-${item._tempId}-${sub.id}`,
                                  {
                                    repId: field.id,
                                    itemId: item._tempId,
                                    subId: sub.id,
                                  }
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        addReplicatorItem(field.id, field.maxItems)
                      }
                      className="w-full py-4 border-2 border-dashed border-zinc-800 rounded-xl text-base font-medium text-zinc-400 hover:text-white hover:border-zinc-600 hover:bg-zinc-900/50 transition-all flex items-center justify-center gap-2 group"
                    >
                      <div className="bg-zinc-800 p-1 rounded-md group-hover:bg-zinc-700 transition-colors">
                        <Plus size={18} />
                      </div>
                      Add New Item
                    </button>
                  </div>
                ) : (
                  renderInput(field, formData[field.id], (v) =>
                    handleInputChange(field.id, v)
                  )
                )}
              </div>
            ))}

          <button
            type="submit"
            disabled={loading || verifying}
            className="w-full bg-white hover:bg-zinc-200 text-black text-lg font-bold py-5 rounded-2xl transition-all flex items-center justify-center gap-3 mt-10 shadow-lg shadow-white/5 active:scale-[0.99]"
          >
            {loading || verifying ? (
              <Loader2 className="animate-spin" size={24} />
            ) : (
              <Send size={24} />
            )}
            {verifying
              ? "Verifying..."
              : loading
              ? "Submitting..."
              : "Submit Response"}
          </button>
        </form>
      </div>
    </div>
  );
}
