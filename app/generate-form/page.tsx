"use client";

import { useState } from "react";
import { createForm } from "@/lib/form-actions";
import { toast } from "sonner";
import { Copy, Plus, Loader2, AlertCircle, GripVertical } from "lucide-react";
import { StyledInput } from "@/components/ui/StyledInput";
import { FormField, FieldType } from "@/lib/form-types";
import { nanoid } from "nanoid";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { SortableField } from "@/components/ui/SortableField";

const FIELD_GROUPS = [
  {
    title: "Inputs",
    items: [
      { type: "text", label: "Text" },
      { type: "email", label: "Email" },
      { type: "textarea", label: "Long Text" },
    ],
  },
  {
    title: "Media Uploads",
    items: [
      { type: "image", label: "Image" },
      { type: "video", label: "Video" },
    ],
  },
  {
    title: "Static Content",
    items: [
      { type: "static-text", label: "Heading/Text" },
      { type: "static-image", label: "Display Image" },
    ],
  },
  {
    title: "Advanced",
    items: [{ type: "replicator", label: "Team/List" }],
  },
];

export default function GenerateFormPage() {
  const [formName, setFormName] = useState("");
  const [fields, setFields] = useState<FormField[]>([
    {
      id: nanoid(6),
      type: "text",
      label: "Full Name",
      required: true,
      placeholder: "John Doe",
    },
  ]);
  const [generatedLink, setGeneratedLink] = useState("");
  const [loading, setLoading] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const getOrigin = () =>
    typeof window !== "undefined" ? window.location.origin : "";

  const addField = (type: FieldType) => {
    const newField: FormField = {
      id: nanoid(6),
      type,
      label:
        type === "replicator"
          ? "Team Members"
          : type.startsWith("static")
          ? "Section Title"
          : `New ${type.charAt(0).toUpperCase() + type.slice(1)}`,
      required: false,
      placeholder: "",
      schema: type === "replicator" ? [] : undefined,
    };
    setFields([...fields, newField]);
  };

  const removeField = (id: string) => {
    setFields(fields.filter((f) => f.id !== id));
  };

  const updateField = (id: string, updates: Partial<FormField>) => {
    setFields(fields.map((f) => (f.id === id ? { ...f, ...updates } : f)));
  };

  // Sub-field handlers for Replicator
  const addSubField = (parentId: string, type: FieldType) => {
    setFields(
      fields.map((f) => {
        if (f.id === parentId && f.schema) {
          return {
            ...f,
            schema: [
              ...f.schema,
              {
                id: nanoid(6),
                type,
                label: `New ${type}`,
                required: true,
              },
            ],
          };
        }
        return f;
      })
    );
  };

  const removeSubField = (parentId: string, subFieldId: string) => {
    setFields(
      fields.map((f) => {
        if (f.id === parentId && f.schema) {
          return {
            ...f,
            schema: f.schema.filter((sf) => sf.id !== subFieldId),
          };
        }
        return f;
      })
    );
  };

  const updateSubField = (
    parentId: string,
    subFieldId: string,
    updates: Partial<FormField>
  ) => {
    setFields(
      fields.map((f) => {
        if (f.id === parentId && f.schema) {
          return {
            ...f,
            schema: f.schema.map((sf) =>
              sf.id === subFieldId ? { ...sf, ...updates } : sf
            ),
          };
        }
        return f;
      })
    );
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setFields((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const handleCreate = async () => {
    if (!formName) {
      toast.error("Please enter a form name");
      return;
    }
    setLoading(true);
    try {
      const result = await createForm(formName, fields);
      if (result.success) {
        const link = `${getOrigin()}/form/${result.formId}`;
        setGeneratedLink(link);
        toast.success("Form created successfully!");
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to create form");
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedLink);
    toast.success("Link copied!");
  };

  return (
    <div className="min-h-screen bg-black/90 p-6 md:p-12 overflow-y-auto">
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Helper Sidebar */}
        <div className="hidden lg:col-span-3 lg:flex flex-col gap-6 sticky top-12 h-[calc(100vh-6rem)] overflow-y-auto pr-2">
          <h2 className="text-xl font-bold text-white">Toolbox</h2>
          {FIELD_GROUPS.map((group) => (
            <div key={group.title} className="space-y-2">
              <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest">
                {group.title}
              </h3>
              <div className="grid grid-cols-1 gap-2">
                {group.items.map((item) => (
                  <button
                    key={item.type}
                    onClick={() => addField(item.type as FieldType)}
                    className="flex items-center gap-3 p-3 rounded-lg border border-zinc-800 bg-zinc-900/40 hover:bg-zinc-800 hover:border-zinc-700 transition-all text-zinc-400 hover:text-white group text-left"
                  >
                    <div className="bg-zinc-800 group-hover:bg-zinc-700 p-1.5 rounded transition-colors">
                      <Plus size={14} />
                    </div>
                    <span className="text-sm font-medium">{item.label}</span>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Builder Column */}
        <div className="col-span-1 lg:col-span-6 space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold text-white tracking-tight">
              Form Builder
            </h1>
            <span className="text-xs bg-zinc-900 text-zinc-500 px-3 py-1 rounded-full">
              {fields.length} blocks
            </span>
          </div>

          <StyledInput
            label="Form Name"
            placeholder="e.g. Talent Application"
            value={formName}
            onChange={(e) => setFormName(e.target.value)}
            autoFocus
          />

          <div className="space-y-4 min-h-[400px]">
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={fields.map((f) => f.id)}
                strategy={verticalListSortingStrategy}
              >
                {fields.map((field) => (
                  <SortableField
                    key={field.id}
                    field={field}
                    onRemove={removeField}
                    onUpdate={updateField}
                    onAddSubField={addSubField}
                    onRemoveSubField={removeSubField}
                    onUpdateSubField={updateSubField}
                  />
                ))}
              </SortableContext>
            </DndContext>

            {fields.length === 0 && (
              <div className="h-40 border-2 border-dashed border-zinc-900 rounded-xl flex items-center justify-center text-zinc-600">
                Select fields from the Toolbox to start
              </div>
            )}
          </div>
        </div>

        {/* Action / Preview Column */}
        <div className="lg:col-span-3 lg:sticky lg:top-12 h-fit space-y-6">
          <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-6 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500" />

            <h2 className="text-xl font-bold text-white mb-6">
              Finalize & Share
            </h2>

            {!generatedLink ? (
              <button
                onClick={handleCreate}
                disabled={loading}
                className="w-full bg-white hover:bg-zinc-200 text-black font-semibold py-4 rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <Loader2 className="animate-spin" size={20} />
                ) : (
                  <Plus size={20} />
                )}
                {loading ? "Generating..." : "Create Form"}
              </button>
            ) : (
              <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg flex items-start gap-3">
                  <AlertCircle
                    className="text-green-500 shrink-0 mt-0.5"
                    size={18}
                  />
                  <div>
                    <p className="text-sm font-medium text-green-500">Live</p>
                    <p className="text-xs text-zinc-400 mt-1">
                      Ready to collect submissions.
                    </p>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-2">
                    Share Link
                  </label>
                  <div className="p-4 bg-zinc-900/50 rounded-lg border border-zinc-800 break-all text-sm text-zinc-300 font-mono">
                    {generatedLink}
                  </div>
                </div>

                <button
                  onClick={copyToClipboard}
                  className="w-full bg-blue-600 hover:bg-blue-500 text-white font-medium py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  <Copy size={18} /> Copy Link
                </button>

                <button
                  onClick={() => {
                    setGeneratedLink("");
                    setFormName("");
                    setFields([]);
                  }}
                  className="w-full bg-transparent hover:bg-zinc-900 text-zinc-400 font-medium py-3 rounded-lg transition-colors text-sm"
                >
                  Create Another
                </button>
              </div>
            )}
          </div>

          {/* Mobile Toolbox (only visible on small screens) */}
          <div className="lg:hidden grid grid-cols-2 gap-2">
            {/* @ts-ignore */}
            {FIELD_GROUPS.flatMap((g) => g.items).map((item) => (
              <button
                /* @ts-ignore */
                key={`mob-${item.type}`} /* @ts-ignore */
                onClick={() => addField(item.type as FieldType)}
                className="p-3 bg-zinc-900 border border-zinc-800 rounded text-zinc-400 text-sm"
              >
                {/* @ts-ignore */}+ {item?.label || ""}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
