"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { FormField } from "@/lib/form-types";
import { StyledInput } from "@/components/ui/StyledInput";
import { X, GripVertical, Plus } from "lucide-react";
import { nanoid } from "nanoid";

interface SortableFieldProps {
  field: FormField;
  onRemove: (id: string) => void;
  onUpdate: (id: string, updates: Partial<FormField>) => void;
  onAddSubField?: (parentId: string, type: any) => void;
  onRemoveSubField?: (parentId: string, subFieldId: string) => void;
  onUpdateSubField?: (parentId: string, subFieldId: string, updates: Partial<FormField>) => void;
}

export function SortableField({ 
    field, 
    onRemove, 
    onUpdate,
    onAddSubField,
    onRemoveSubField,
    onUpdateSubField
}: SortableFieldProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: field.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const isStatic = field.type.startsWith("static");
  const isReplicator = field.type === "replicator";

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="bg-zinc-900/40 border border-zinc-800 rounded-xl p-4 relative group hover:border-zinc-700 transition-colors mb-4"
    >
        {/* Drag Handle */}
        <div 
            {...attributes} 
            {...listeners}
            className="absolute left-3 top-1/2 -translate-y-1/2 cursor-grab text-zinc-600 hover:text-zinc-400 p-1"
        >
            <GripVertical size={20} />
        </div>

        <div className="pl-8">
            <button
                onClick={() => onRemove(field.id)}
                className="absolute top-2 right-2 text-zinc-600 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
            >
                <X size={16} />
            </button>

            <div className="grid grid-cols-2 gap-4 mb-3">
                <div className="col-span-2 flex items-center gap-2">
                    <span className="text-xs text-blue-500 bg-blue-500/10 px-2 py-1 rounded uppercase font-bold tracking-wider">{field.type.replace('-', ' ')}</span>
                </div>

                <StyledInput
                    label={isStatic ? "Content / Title" : "Label"}
                    value={field.label}
                    onChange={(e) => onUpdate(field.id, { label: e.target.value })}
                    placeholder={isStatic ? "e.g. Welcome Video" : "Field Label"}
                />
                
                {!isStatic && (
                    <StyledInput
                        label="Placeholder"
                        value={field.placeholder || ""}
                        onChange={(e) => onUpdate(field.id, { placeholder: e.target.value })}
                         disabled={isReplicator}
                    />
                )}

                {isStatic && (
                    <div className="col-span-2">
                         <StyledInput
                            label={field.type === 'static-text' ? 'Text Content' : 'Image/Video URL'}
                            value={field.content || ""}
                            onChange={(e) => onUpdate(field.id, { content: e.target.value })}
                            placeholder={field.type === 'static-text' ? "Enter display text..." : "https://..."}
                        />
                    </div>
                )}

                 {isReplicator && (
                     <div className="col-span-2 space-y-3 border-t border-zinc-800 pt-3 mt-1">
                         <div className="flex justify-between items-center gap-4">
                            <label className="text-xs font-semibold text-zinc-400">Replicator Limits</label>
                            <div className="flex items-center gap-2">
                                <StyledInput 
                                    type="number"
                                    className="w-20 py-1 text-xs"
                                    placeholder="Min"
                                    value={field.minItems || ""}
                                    onChange={(e) => onUpdate(field.id, { minItems: parseInt(e.target.value) || undefined })}
                                    label="Min"
                                />
                                <StyledInput 
                                    type="number"
                                    className="w-20 py-1 text-xs"
                                    placeholder="Max"
                                    value={field.maxItems || ""}
                                    onChange={(e) => onUpdate(field.id, { maxItems: parseInt(e.target.value) || undefined })}
                                    label="Max"
                                />
                            </div>
                         </div>
                         
                         <div className="space-y-2 pl-2 border-l-2 border-zinc-800">
                             {field.schema?.map(sub => (
                                 <div key={sub.id} className="grid grid-cols-12 gap-2 items-center bg-zinc-950/50 p-2 rounded">
                                     <div className="col-span-3 text-xs text-zinc-500 uppercase">{sub.type}</div>
                                     <div className="col-span-8">
                                         <input 
                                            className="w-full bg-transparent text-sm text-zinc-300 focus:outline-none"
                                            value={sub.label}
                                            onChange={(e) => onUpdateSubField && onUpdateSubField(field.id, sub.id, { label: e.target.value })}
                                            placeholder="Sub-field Label"
                                         />
                                     </div>
                                     <button 
                                        className="col-span-1 text-zinc-600 hover:text-red-500"
                                        onClick={() => onRemoveSubField && onRemoveSubField(field.id, sub.id)}
                                     >
                                         <X size={14} />
                                     </button>
                                 </div>
                             ))}
                             
                             <div className="flex gap-2 mt-2">
                                 {['text', 'email', 'image'].map(type => (
                                     <button
                                        key={type}
                                        onClick={() => onAddSubField && onAddSubField(field.id, type)}
                                        className="text-xs bg-zinc-800 hover:bg-zinc-700 text-zinc-300 px-2 py-1.5 rounded flex items-center gap-1 transition-colors"
                                     >
                                         <Plus size={12} /> {type}
                                     </button>
                                 ))}
                             </div>
                         </div>
                     </div>
                 )}
            </div>

            {!isStatic && !isReplicator && (
                <div className="flex items-center gap-2">
                    <input
                        type="checkbox"
                        id={`req-${field.id}`}
                        checked={field.required}
                        onChange={(e) => onUpdate(field.id, { required: e.target.checked })}
                        className="rounded border-zinc-700 bg-zinc-800 text-blue-600 focus:ring-blue-500/30"
                    />
                    <label htmlFor={`req-${field.id}`} className="text-sm text-zinc-400 select-none cursor-pointer">Required</label>
                </div>
            )}
        </div>
    </div>
  );
}
