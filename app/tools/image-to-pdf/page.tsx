"use client";

import { useState, useRef, ChangeEvent } from "react";
import Image from "next/image";
import { FileImage, Upload, X, FileDown, Trash2, ArrowLeft, Eye, GripVertical, CheckCircle, RefreshCcw } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import confetti from "canvas-confetti";
// Removed top-level imports for heic2any and jsPDF to avoid SSR window error
// import heic2any from "heic2any";
// import jsPDF from "jspdf";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
  DragStartEvent,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  rectSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { motion, AnimatePresence } from "framer-motion";

interface ImageFile {
  id: string;
  file: File;
  preview: string;
}

// --- Sortable Item Component ---
interface SortableImageProps {
  id: string;
  img: ImageFile;
  index: number;
  onRemove: (id: string) => void;
  onPreview: (img: ImageFile) => void;
}

const SortableImage = ({ id, img, index, onRemove, onPreview }: SortableImageProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : "auto",
    opacity: isDragging ? 0.3 : 1,
  };

  // Long press logic for mobile preview
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleTouchStart = () => {
    timeoutRef.current = setTimeout(() => {
      // Haptic feedback
      if (typeof navigator !== "undefined" && navigator.vibrate) {
        navigator.vibrate(50);
      }
      onPreview(img);
    }, 500);
  };

  const handleTouchEnd = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onTouchMove={handleTouchEnd}
      className="relative group aspect-[3/4] rounded-xl overflow-hidden bg-muted border border-border/50 shadow-sm touch-manipulation transform transition-all hover:scale-[1.02]"
    >
      <Image
        src={img.preview}
        alt="Preview"
        fill
        className="object-cover pointer-events-none select-none"
      />
      
      {/* Overlay controls */}
      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-end p-2 gap-2">
        <div className="absolute top-2 left-2 p-1.5 bg-black/50 rounded-lg text-white/70 cursor-grab active:cursor-grabbing">
          <GripVertical size={16} />
        </div>

        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove(img.id);
          }}
          className="p-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors shadow-lg"
          title="Remove"
          onPointerDown={(e) => e.stopPropagation()} 
        >
          <X size={16} />
        </button>
        
        <button
          onClick={(e) => {
            e.stopPropagation();
            onPreview(img);
          }}
          className="p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors shadow-lg hidden sm:block" 
          title="Fast Preview"
          onPointerDown={(e) => e.stopPropagation()}
        >
          <Eye size={16} />
        </button>
      </div>

      <div className="absolute bottom-2 left-2 bg-black/60 text-white text-xs px-2 py-1 rounded-full pointer-events-none">
        {index + 1}
      </div>
    </div>
  );
};

// --- Main Page Component ---
export default function ImageToPdfPage() {
  const [images, setImages] = useState<ImageFile[]>([]);
  const [isConverting, setIsConverting] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [previewImage, setPreviewImage] = useState<ImageFile | null>(null);
  
  // Success & Result State
  const [isSuccess, setIsSuccess] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleFileSelect = async (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      const newImages: ImageFile[] = [];

      for (const file of files) {
        let processedFile = file;

        // Check for HEIC/HEIF
        const isHeic = 
          file.name.toLowerCase().endsWith('.heic') || 
          file.name.toLowerCase().endsWith('.heif') || 
          file.type === 'image/heic' || 
          file.type === 'image/heif';

        if (isHeic) {
           const toastId = toast.loading(`Processing ${file.name}...`);
           try {
             // Dynamic import for heic2any
             const heic2any = (await import("heic2any")).default;
             
             const result = await heic2any({
               blob: file,
               toType: 'image/jpeg',
               quality: 0.8
             });
             
             // Handle array vs single blob return
             const blob = Array.isArray(result) ? result[0] : result;
             processedFile = new File(
                [blob], 
                file.name.replace(/\.(heic|heif)$/i, ".jpg"), 
                { type: "image/jpeg" }
             );
             toast.dismiss(toastId);
           } catch (err) {
             console.error("HEIC conversion failed", err);
             toast.dismiss(toastId);
             toast.error(`Failed to process ${file.name}`);
             continue; // Skip valid images
           }
        }

        newImages.push({
          id: Math.random().toString(36).substring(7),
          file: processedFile,
          preview: URL.createObjectURL(processedFile),
        });
      }

      setImages((prev) => [...prev, ...newImages]);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const removeImage = (id: string) => {
    setImages((prev) => {
      const imageToRemove = prev.find(img => img.id === id);
      if (imageToRemove) URL.revokeObjectURL(imageToRemove.preview);
      return prev.filter((img) => img.id !== id);
    });
  };

  const clearAll = () => {
    images.forEach(img => URL.revokeObjectURL(img.preview));
    setImages([]);
    setIsSuccess(false);
    setPdfUrl(null);
  };

  const resetTool = () => {
    clearAll();
  };

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setImages((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
    setActiveId(null);
  };

  const convertToPdf = async () => {
    if (images.length === 0) return;

    try {
      setIsConverting(true);
      // Dynamic import for jsPDF
      const jsPDF = (await import("jspdf")).default;
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();

      for (let i = 0; i < images.length; i++) {
        if (i > 0) doc.addPage();
        const img = images[i];
        
        const imgElement = document.createElement("img");
        imgElement.src = img.preview;
        
        await new Promise((resolve) => {
          imgElement.onload = resolve;
        });

        const imgRatio = imgElement.width / imgElement.height;
        const pageRatio = pageWidth / pageHeight;

        let finalWidth = pageWidth;
        let finalHeight = pageHeight;

        if (imgRatio > pageRatio) {
          finalHeight = pageWidth / imgRatio;
        } else {
          finalWidth = pageHeight * imgRatio;
        }

        const x = (pageWidth - finalWidth) / 2;
        const y = (pageHeight - finalHeight) / 2;

        doc.addImage(imgElement, "JPEG", x, y, finalWidth, finalHeight);
      }

      // Generate Blob URL instead of auto-save
      const blobInfo = doc.output("bloburl");
      setPdfUrl(String(blobInfo));
      setIsSuccess(true);
      
      // Trigger Confetti
      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 },
        colors: ["#00F0A0", "#26E6E6", "#ff6b6b"]
      });

      toast.success("PDF ready for download!");
    } catch (error) {
      console.error(error);
      toast.error("Failed to generate PDF.");
    } finally {
      setIsConverting(false);
    }
  };

  return (
    <div className="min-h-screen pt-12 pb-20 px-4 sm:px-6 lg:px-8 bg-background">
      <div className="max-w-5xl mx-auto">
        <div className="mb-8">
          <Link 
            href="/tools" 
            className="inline-flex items-center text-muted-foreground hover:text-accent mb-4 transition-colors"
          >
            <ArrowLeft size={16} className="mr-2" />
            Back to Tools
          </Link>
          <h1 className="text-3xl md:text-4xl font-bold flex items-center gap-3">
            <div className="p-2 bg-accent/10 rounded-lg">
              <FileImage className="w-8 h-8 text-accent" />
            </div>
            Image to PDF Converter
          </h1>
          <p className="mt-4 text-muted-foreground text-lg">
            Drag and drop to reorder. Long press (mobile) or click eye icon for preview.
          </p>
        </div>

        <AnimatePresence mode="wait">
          {isSuccess ? (
            <motion.div
              key="success"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="flex flex-col items-center justify-center py-20 bg-muted/30 rounded-3xl border border-border/50"
            >
              <div className="p-6 bg-green-500/10 rounded-full mb-6">
                 <CheckCircle className="w-20 h-20 text-green-500" />
              </div>
              
              <h2 className="text-3xl font-bold mb-4 text-center">Your PDF is Ready!</h2>
              <p className="text-muted-foreground text-center mb-8 max-w-md">
                We've successfully converted {images.length} images into a single PDF document.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 w-full max-w-md px-4">
                <a 
                  href={pdfUrl || "#"} 
                  download="converted_images.pdf"
                  className="flex-1 flex items-center justify-center gap-2 px-8 py-4 bg-accent text-accent-foreground rounded-xl font-bold hover:bg-accent/90 transition-all hover:scale-[1.02] shadow-lg shadow-accent/20"
                >
                  <FileDown size={24} />
                  Download PDF
                </a>
                
                <button
                  onClick={resetTool}
                  className="flex-1 flex items-center justify-center gap-2 px-8 py-4 bg-background border-2 border-border hover:border-accent/50 rounded-xl font-medium transition-all hover:bg-muted"
                >
                  <RefreshCcw size={20} />
                  Convert More
                </button>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="upload"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-border hover:border-accent hover:bg-accent/5 rounded-2xl p-12 text-center cursor-pointer transition-all duration-300 group"
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileSelect}
                  className="hidden"
                  multiple
                  accept="image/*, .heic, .heif"
                />
                <div className="flex flex-col items-center gap-4">
                  <div className="p-4 bg-muted rounded-full group-hover:scale-110 transition-transform duration-300">
                    <Upload className="w-8 h-8 text-muted-foreground group-hover:text-accent transition-colors" />
                  </div>
                  <div>
                    <p className="text-xl font-medium mb-1">Click to upload images</p>
                    <p className="text-muted-foreground">or drag and drop files here</p>
                  </div>
                </div>
              </div>

              {images.length > 0 && (
                <div className="mt-8 flex flex-col sm:flex-row justify-between items-center gap-4 bg-muted/30 p-4 rounded-xl border border-border/50">
                  <div className="text-muted-foreground font-medium">
                    {images.length} image{images.length !== 1 ? 's' : ''} selected
                  </div>
                  <div className="flex gap-3 w-full sm:w-auto">
                    <button
                      onClick={clearAll}
                      className="flex-1 sm:flex-none px-4 py-2 rounded-lg border border-red-500/20 text-red-500 hover:bg-red-500/10 transition-colors flex items-center justify-center gap-2"
                    >
                      <Trash2 size={16} />
                      Clear
                    </button>
                    <button
                      onClick={convertToPdf}
                      disabled={isConverting}
                      className="flex-1 sm:flex-none px-6 py-2 rounded-lg bg-accent text-accent-foreground hover:bg-accent/90 transition-colors flex items-center justify-center gap-2 font-bold disabled:opacity-50"
                    >
                      {isConverting ? "Processing..." : (
                        <>
                          <FileDown size={18} />
                          Convert to PDF
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}

              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
              >
                <SortableContext 
                  items={images.map(img => img.id)}
                  strategy={rectSortingStrategy}
                >
                  <div className="mt-8 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 pb-20">
                    {images.map((img, index) => (
                      <SortableImage 
                        key={img.id} 
                        id={img.id} 
                        img={img} 
                        index={index}
                        onRemove={removeImage}
                        onPreview={setPreviewImage}
                      />
                    ))}
                  </div>
                </SortableContext>
                
                <DragOverlay>
                  {activeId ? (
                    <div className="aspect-[3/4] rounded-xl overflow-hidden bg-muted border-2 border-accent shadow-xl opacity-90 cursor-grabbing">
                        <Image
                          src={images.find(i => i.id === activeId)?.preview || ""}
                          alt="Preview"
                          fill
                          className="object-cover"
                        />
                    </div>
                  ) : null}
                </DragOverlay>
              </DndContext>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {previewImage && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 cursor-pointer"
            onClick={() => setPreviewImage(null)}
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="relative max-w-4xl w-full max-h-[90vh] flex items-center justify-center cursor-default"
              onClick={(e) => e.stopPropagation()}
            >
               <button 
                  onClick={() => setPreviewImage(null)}
                  className="absolute -top-12 right-0 p-2 text-white/50 hover:text-white transition-colors"
               >
                 <X size={32} />
               </button>
               
               <Image 
                 src={previewImage.preview}
                 alt="Full Preview"
                 width={1200}
                 height={1200}
                 className="object-contain max-h-[85vh] w-auto rounded-lg shadow-2xl"
               />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
