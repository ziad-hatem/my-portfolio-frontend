"use client";

import { useState, useRef, ChangeEvent, useEffect } from "react";
import { 
  FileIcon, 
  Upload, 
  X, 
  FileDown, 
  Trash2, 
  ArrowLeft, 
  CheckCircle, 
  RefreshCcw,
  Settings,
  Minimize2
} from "lucide-react";
import jsPDF from "jspdf";
import Link from "next/link";
import { toast } from "sonner";
import confetti from "canvas-confetti";
import { motion, AnimatePresence } from "framer-motion";

// Import PDF.js types only
import type { PDFDocumentProxy, PDFPageProxy } from "pdfjs-dist";

// Remove top-level import and worker setup to avoid SSR ReferenceError: DOMMatrix is not defined
// We will dynamically import it on the client side


interface PdfFile {
  file: File;
  name: string;
  size: number;
}

export default function CompressPdfPage() {
  const [file, setFile] = useState<PdfFile | null>(null);
  const [isCompressing, setIsCompressing] = useState(false);
  const [compressionLevel, setCompressionLevel] = useState<"low" | "medium" | "high">("medium");
  
  // Success state
  const [isSuccess, setIsSuccess] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [compressedSize, setCompressedSize] = useState<number>(0);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      if (selectedFile.type !== "application/pdf") {
        toast.error("Please select a PDF file.");
        return;
      }
      setFile({
        file: selectedFile,
        name: selectedFile.name,
        size: selectedFile.size,
      });
      // Reset success state if new file is selected
      setIsSuccess(false);
      setPdfUrl(null);
    }
  };

  const clearFile = () => {
    setFile(null);
    setIsSuccess(false);
    setPdfUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const formatSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const compressPdf = async () => {
    if (!file) return;

    try {
      setIsCompressing(true);
      
      // Dynamically import PDF.js
      const pdfjsLib = await import("pdfjs-dist");
      pdfjsLib.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

      const arrayBuffer = await file.file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument(arrayBuffer).promise;
      const numPages = pdf.numPages;

      const doc = new jsPDF();
      // Adjusted settings to prevent size inflation
      // Scale < 1.0 effectively downsamples the resolution
      const quality = compressionLevel === "high" ? 0.4 : compressionLevel === "medium" ? 0.6 : 0.8;
      const scale = compressionLevel === "high" ? 0.7 : compressionLevel === "medium" ? 1.0 : 1.3;

      for (let i = 1; i <= numPages; i++) {
        const page = await pdf.getPage(i);
        const viewport = page.getViewport({ scale: scale });
        
        // Create canvas
        const canvas = document.createElement("canvas");
        const context = canvas.getContext("2d");
        if (!context) throw new Error("Canvas context check failed");

        canvas.width = viewport.width;
        canvas.height = viewport.height;

        await page.render({
          canvasContext: context,
          viewport: viewport,
        } as any).promise;

        // Convert to JPEG
        const imgData = canvas.toDataURL("image/jpeg", quality);
        
        // Add to PDF
        // Note: We use the original viewport aspect ratio for the PDF page size
        // but we might need to scale the "drawing" dimensions if we want to print it 'sized' correctly
        // However, for pure digital compression, matching the canvas size is usually fine.
        // Actually, to keep 'physical' size similar but lower res, we should use original viewport dimensions for addPage
        // and fill it with the canvas image.
        
        // Get original viewport for "physical" page dimensions
        const originalViewport = page.getViewport({ scale: 1.0 });

        if (i > 1) doc.addPage([originalViewport.width, originalViewport.height]);
        else {
           doc.deletePage(1);
           doc.addPage([originalViewport.width, originalViewport.height]);
        }
        
        doc.addImage(imgData, "JPEG", 0, 0, originalViewport.width, originalViewport.height);
      }

      const blobInfo = doc.output("bloburl");
      setPdfUrl(String(blobInfo));
      
      const blob = doc.output("blob");
      setCompressedSize(blob.size);
      
      setIsSuccess(true);
      
      const isReduction = blob.size < file.size;

      if (isReduction) {
        confetti({
          particleCount: 150,
          spread: 70,
          origin: { y: 0.6 },
          colors: ["#00F0A0", "#26E6E6", "#ff6b6b"]
        });
        toast.success("PDF compressed successfully!");
      } else {
        toast.warning("File size increased. Try 'High' compression.");
      }

    } catch (error) {
      console.error("Compression error:", error);
      toast.error("Failed to compress PDF. Please try a different file.");
    } finally {
      setIsCompressing(false);
    }
  };

  return (
    <div className="min-h-screen pt-12 pb-20 px-4 sm:px-6 lg:px-8 bg-background">
      <div className="max-w-3xl mx-auto">
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
              <Minimize2 className="w-8 h-8 text-accent" />
            </div>
            Compress PDF
          </h1>
          <p className="mt-4 text-muted-foreground text-lg">
            Ideally for Scanned documents. Text will be converted to images to reduce size.
          </p>
        </div>

        <AnimatePresence mode="wait">
          {isSuccess && pdfUrl ? (
             <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-muted/30 border border-border/50 rounded-3xl p-8 text-center"
            >
               <div className="p-6 bg-green-500/10 rounded-full w-fit mx-auto mb-6">
                 <CheckCircle className="w-16 h-16 text-green-500" />
              </div>
              
               <h2 className="text-2xl font-bold mb-2">
                 {compressedSize < (file?.size || 0) ? "Compression Complete!" : "Process Complete"}
               </h2>
               <div className="flex items-center justify-center gap-4 text-muted-foreground mb-8">
                  <div className="flex flex-col items-center">
                     <span className="text-sm">Original</span>
                     <span className="text-foreground font-semibold line-through decoration-red-500/50">{formatSize(file?.size || 0)}</span>
                  </div>
                  <div className="text-accent">➜</div>
                  <div className="flex flex-col items-center">
                     <span className="text-sm">Result</span>
                     <span className={`${compressedSize < (file?.size || 0) ? 'text-accent' : 'text-red-500'} font-bold text-xl`}>{formatSize(compressedSize)}</span>
                  </div>
               </div>

               {compressedSize < (file?.size || 0) ? (
                 <p className="text-green-500 font-medium mb-8">
                   You saved {formatSize((file?.size || 0) - compressedSize)}!
                 </p>
               ) : (
                 <p className="text-red-500 font-medium mb-8">
                   File size increased. This PDF was already optimized or text-based.
                   <br />
                   <span className="text-sm text-muted-foreground">Try selecting "High" compression.</span>
                 </p>
               )}

               <div className="flex flex-col sm:flex-row gap-4">
                  <a 
                    href={pdfUrl} 
                    download={`compressed_${file?.name}`}
                    className="flex-1 px-8 py-4 bg-accent text-accent-foreground rounded-xl font-bold hover:bg-accent/90 transition-all hover:scale-[1.02] flex items-center justify-center gap-2 shadow-lg shadow-accent/20"
                  >
                    <FileDown />
                    Download PDF
                  </a>
                  <button
                    onClick={clearFile}
                    className="flex-1 px-8 py-4 bg-background border border-border hover:bg-muted rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
                  >
                     <RefreshCcw size={20} />
                     Compress Another
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
              {!file ? (
                 <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-border hover:border-accent hover:bg-accent/5 rounded-2xl p-16 text-center cursor-pointer transition-all duration-300 group"
                  >
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileSelect}
                      className="hidden"
                      accept="application/pdf"
                    />
                    <div className="flex flex-col items-center gap-4">
                      <div className="p-5 bg-muted rounded-full group-hover:scale-110 transition-transform duration-300">
                        <Upload className="w-10 h-10 text-muted-foreground group-hover:text-accent transition-colors" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold mb-2">Upload PDF</p>
                        <p className="text-muted-foreground">Drag & drop or click to select</p>
                      </div>
                    </div>
                  </div>
              ) : (
                <div className="bg-muted/30 border border-border/50 rounded-2xl p-6">
                   {/* File Info */}
                   <div className="flex items-center justify-between mb-8 p-4 bg-background rounded-xl border border-border">
                      <div className="flex items-center gap-4">
                         <div className="p-3 bg-red-500/10 rounded-lg">
                            <FileIcon className="w-8 h-8 text-red-500" />
                         </div>
                         <div>
                            <p className="font-semibold text-lg line-clamp-1 break-all">{file.name}</p>
                            <p className="text-sm text-muted-foreground">{formatSize(file.size)}</p>
                         </div>
                      </div>
                      <button 
                        onClick={clearFile}
                        className="p-2 hover:bg-muted rounded-full transition-colors text-muted-foreground hover:text-foreground"
                      >
                         <X size={20} />
                      </button>
                   </div>

                   {/* Settings */}
                   <div className="mb-8">
                     <p className="font-medium mb-4 flex items-center gap-2">
                        <Settings size={18} />
                        Compression Level
                     </p>
                     <div className="grid grid-cols-3 gap-3">
                        {(['low', 'medium', 'high'] as const).map((level) => (
                           <button
                             key={level}
                             onClick={() => setCompressionLevel(level)}
                             className={`py-3 px-4 rounded-xl border-2 transition-all capitalize ${
                               compressionLevel === level 
                               ? 'border-accent bg-accent/5 text-accent font-bold' 
                               : 'border-transparent bg-muted/50 hover:bg-muted text-muted-foreground'
                             }`}
                           >
                              {level}
                           </button>
                        ))}
                     </div>
                     <p className="text-sm text-muted-foreground mt-3 text-center">
                        {compressionLevel === 'high' ? 'Smallest Size (Lower Quality)' : 
                         compressionLevel === 'medium' ? 'Balanced' : 'Best Quality (Larger Size)'}
                     </p>
                   </div>

                   <button 
                      onClick={compressPdf}
                      disabled={isCompressing}
                      className="w-full py-4 bg-accent text-accent-foreground rounded-xl font-bold hover:bg-accent/90 transition-all hover:scale-[1.01] flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-accent/20"
                    >
                      {isCompressing ? (
                        <>
                          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          Compressing...
                        </>
                      ) : (
                        <>
                          <Minimize2 size={20} />
                          Compress PDF
                        </>
                      )}
                    </button>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
