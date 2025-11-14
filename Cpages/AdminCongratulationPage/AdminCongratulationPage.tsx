"use client";

import { useState, useRef, ChangeEvent, FormEvent } from "react";
import {
  Lock,
  Send,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Upload,
  X,
  Link2,
  MessageSquare,
  User,
} from "lucide-react";
import { processImageUpload } from "@/utils/imageUpload";
import type { CreateCongratulationResponse } from "@/types/congratulation";

/**
 * Admin Congratulation Generator Page
 * Password-protected page to create congratulations pages
 */
export default function AdminCongratulationPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [isCheckingPassword, setIsCheckingPassword] = useState(false);

  const handlePasswordSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsCheckingPassword(true);
    setPasswordError("");

    try {
      // We'll verify the password when creating the congratulation
      // For now, just move to the form
      if (password.trim()) {
        setIsAuthenticated(true);
      } else {
        setPasswordError("Please enter a password");
      }
    } catch (error) {
      setPasswordError("An error occurred");
    } finally {
      setIsCheckingPassword(false);
    }
  };

  if (!isAuthenticated) {
    return <PasswordScreen />;
  }

  return <GeneratorForm adminPassword={password} />;

  function PasswordScreen() {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4 ">
        <div className="w-full max-w-md">
          <div className="bg-card border border-border rounded-2xl p-8">
            <div className="flex items-center justify-center w-16 h-16 bg-accent/10 rounded-full mx-auto mb-6">
              <Lock className="text-accent" size={32} />
            </div>

            <h1 className="text-2xl font-medium text-center mb-2">
              Congratulation Generator
            </h1>
            <p className="text-muted-foreground text-center mb-8">
              Enter your admin password to continue
            </p>

            <form onSubmit={handlePasswordSubmit} className="space-y-6">
              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-medium mb-2"
                >
                  Admin Password
                </label>
                <input
                  type="password"
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full px-4 py-3 bg-input border border-border rounded-lg focus:outline-none focus:border-accent text-white transition-colors"
                  placeholder="Enter password"
                  autoFocus
                />
              </div>

              {passwordError && (
                <div className="flex items-center gap-3 p-4 rounded-lg bg-red-500/10 border border-red-500/30">
                  <AlertCircle className="text-red-400" size={20} />
                  <p className="text-red-400 text-sm">{passwordError}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={isCheckingPassword}
                className="w-full px-8 py-3 bg-accent text-accent-foreground rounded-lg hover:bg-accent/90 transition-colors font-medium flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isCheckingPassword ? (
                  <>
                    <Loader2 className="animate-spin" size={20} />
                    <span>Verifying...</span>
                  </>
                ) : (
                  <>
                    <span>Continue</span>
                    <Lock size={20} />
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }
}

/**
 * Generator Form Component
 */
function GeneratorForm({ adminPassword }: { adminPassword: string }) {
  const [formData, setFormData] = useState({
    name: "",
    message: "",
    postUrl: "",
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<{
    type: "success" | "error" | null;
    message: string;
    url?: string;
  }>({ type: null, message: "" });
  const [imageError, setImageError] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImageError("");

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      setImageError("Image size must be less than 5MB");
      return;
    }

    // Validate file type
    const allowedTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/webp",
      "image/gif",
    ];
    if (!allowedTypes.includes(file.type)) {
      setImageError("Only JPEG, PNG, WebP, and GIF images are allowed");
      return;
    }

    setImageFile(file);

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
    setImageError("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus({ type: null, message: "" });
    setImageError("");

    try {
      // Process image if provided
      let imageUrl: string | undefined;
      if (imageFile) {
        const result = await processImageUpload(imageFile);
        if (!result.success) {
          setImageError(result.error || "Failed to process image");
          setIsSubmitting(false);
          return;
        }
        imageUrl = result.data;
      }

      // Submit to API
      const response = await fetch("/api/congratulation", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          password: adminPassword,
          name: formData.name,
          message: formData.message || undefined,
          postUrl: formData.postUrl || undefined,
          imageUrl,
        }),
      });

      const data: CreateCongratulationResponse = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create congratulation");
      }

      setSubmitStatus({
        type: "success",
        message: "Congratulation page created successfully!",
        url: data.url,
      });

      // Reset form
      setFormData({ name: "", message: "", postUrl: "" });
      setImageFile(null);
      setImagePreview(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (error: any) {
      setSubmitStatus({
        type: "error",
        message: error.message || "An error occurred",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="min-h-screen bg-background py-12 px-4 pt-[150px]">
      <div className="max-w-2xl mx-auto">
        <div className="bg-card border border-border rounded-2xl p-8">
          <div className="mb-8">
            <h1 className="text-3xl font-medium mb-2">
              Create Congratulation Page
            </h1>
            <p className="text-muted-foreground">
              Generate a beautiful congratulations page for someone special
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Name Field */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium mb-2">
                Full Name <span className="text-accent">*</span>
              </label>
              <div className="relative">
                <User
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground"
                  size={20}
                />
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  maxLength={100}
                  className="w-full pl-12 pr-4 py-3 bg-input border border-border rounded-lg focus:outline-none focus:border-accent text-white transition-colors"
                  placeholder="e.g., John Doe"
                />
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {formData.name.length}/100 characters
              </p>
            </div>

            {/* Message Field */}
            <div>
              <label
                htmlFor="message"
                className="block text-sm font-medium mb-2"
              >
                Congratulations Message{" "}
                <span className="text-muted-foreground">(optional)</span>
              </label>
              <div className="relative">
                <MessageSquare
                  className="absolute left-4 top-4 text-muted-foreground"
                  size={20}
                />
                <textarea
                  id="message"
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  rows={4}
                  maxLength={500}
                  className="w-full pl-12 pr-4 py-3 bg-input border border-border rounded-lg focus:outline-none focus:border-accent text-white transition-colors resize-none"
                  placeholder="Write a short congratulations message..."
                />
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {formData.message.length}/500 characters
              </p>
            </div>

            {/* LinkedIn Post URL Field */}
            <div>
              <label
                htmlFor="postUrl"
                className="block text-sm font-medium mb-2"
              >
                LinkedIn Post URL{" "}
                <span className="text-muted-foreground">(optional)</span>
              </label>
              <div className="relative">
                <Link2
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground"
                  size={20}
                />
                <input
                  type="url"
                  id="postUrl"
                  name="postUrl"
                  value={formData.postUrl}
                  onChange={handleChange}
                  className="w-full pl-12 pr-4 py-3 bg-input border border-border rounded-lg focus:outline-none focus:border-accent text-white transition-colors"
                  placeholder="https://linkedin.com/posts/..."
                />
              </div>
            </div>

            {/* Image Upload Field */}
            <div>
              <label htmlFor="image" className="block text-sm font-medium mb-2">
                Profile Picture{" "}
                <span className="text-muted-foreground">(optional)</span>
              </label>

              {!imagePreview ? (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-border rounded-lg p-8 text-center cursor-pointer hover:border-accent transition-colors"
                >
                  <Upload
                    className="mx-auto mb-3 text-muted-foreground"
                    size={32}
                  />
                  <p className="text-sm text-muted-foreground mb-1">
                    Click to upload or drag and drop
                  </p>
                  <p className="text-xs text-muted-foreground">
                    JPEG, PNG, WebP, or GIF (max 5MB)
                  </p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    id="image"
                    accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                </div>
              ) : (
                <div className="relative border border-border rounded-lg p-4">
                  <button
                    type="button"
                    onClick={removeImage}
                    className="absolute top-2 right-2 p-2 bg-red-500/10 hover:bg-red-500/20 rounded-full transition-colors"
                  >
                    <X size={16} className="text-red-400" />
                  </button>
                  <div className="flex items-center gap-4">
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="w-20 h-20 object-cover rounded-lg"
                    />
                    <div className="flex-1">
                      <p className="text-sm font-medium">{imageFile?.name}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {((imageFile?.size || 0) / 1024).toFixed(2)} KB
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {imageError && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/30 mt-2">
                  <AlertCircle className="text-red-400" size={16} />
                  <p className="text-red-400 text-sm">{imageError}</p>
                </div>
              )}
            </div>

            {/* Status Messages */}
            {submitStatus.type && (
              <div
                className={`flex items-start gap-3 p-4 rounded-lg ${
                  submitStatus.type === "success"
                    ? "bg-green-500/10 border border-green-500/30"
                    : "bg-red-500/10 border border-red-500/30"
                }`}
              >
                {submitStatus.type === "success" ? (
                  <CheckCircle2 className="text-green-400 mt-0.5" size={20} />
                ) : (
                  <AlertCircle className="text-red-400 mt-0.5" size={20} />
                )}
                <div className="flex-1">
                  <p
                    className={
                      submitStatus.type === "success"
                        ? "text-green-400"
                        : "text-red-400"
                    }
                  >
                    {submitStatus.message}
                  </p>
                  {submitStatus.url && (
                    <div className="mt-3 space-y-2">
                      <a
                        href={submitStatus.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 text-accent hover:underline text-sm"
                      >
                        View Congratulation Page
                        <Link2 size={14} />
                      </a>
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={submitStatus.url}
                          readOnly
                          className="flex-1 px-3 py-2 bg-background border border-border rounded text-sm"
                        />
                        <button
                          type="button"
                          onClick={() => copyToClipboard(submitStatus.url!)}
                          className="px-3 py-2 bg-accent/10 hover:bg-accent/20 rounded text-accent text-sm transition-colors"
                        >
                          Copy
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full px-8 py-3 bg-accent text-accent-foreground rounded-lg hover:bg-accent/90 transition-colors font-medium flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="animate-spin" size={20} />
                  <span>Creating...</span>
                </>
              ) : (
                <>
                  <span>Create Congratulation Page</span>
                  <Send size={20} />
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
