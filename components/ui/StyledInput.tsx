"use client";

import { InputHTMLAttributes, TextareaHTMLAttributes } from "react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
}

export function StyledInput({ label, className, ...props }: InputProps) {
  return (
    <div className="space-y-2">
      {label && (
        <label className="text-base font-medium text-zinc-200 ps-1 block">
          {label}
        </label>
      )}
      <input
        className={twMerge(
          "w-full bg-zinc-900/80 border border-zinc-700 rounded-2xl px-5 py-4 text-lg text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all shadow-sm",
          className
        )}
        {...props}
      />
    </div>
  );
}

export function StyledTextarea({ label, className, ...props }: TextareaProps) {
  return (
    <div className="space-y-2">
      {label && (
        <label className="text-base font-medium text-zinc-200 ps-1 block">
          {label}
        </label>
      )}
      <textarea
        className={twMerge(
          "w-full bg-zinc-900/80 border border-zinc-700 rounded-2xl px-5 py-4 text-lg text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all min-h-[160px] resize-y shadow-sm",
          className
        )}
        {...props}
      />
    </div>
  );
}
