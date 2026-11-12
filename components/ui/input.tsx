"use client";

import * as React from "react";
import { cn } from "./button";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, id, ...props }, ref) => {
    const generatedId = React.useId();
    const inputId = id || generatedId;
    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-xs font-medium text-[#94a3b8] mb-1.5"
          >
            {label}
          </label>
        )}
        <input
          id={inputId}
          className={cn(
            "flex h-10 w-full rounded-md border border-[rgba(148,163,184,0.25)] bg-[#111827] px-4 py-2 text-sm text-[#f8fafc] placeholder-[#64748b] focus:outline-none focus:ring-1 focus:ring-[#4778ff] focus:border-[#4778ff] disabled:opacity-50 disabled:pointer-events-none",
            error && "border-[#ef4444] focus:ring-[#ef4444] focus:border-[#ef4444]",
            className
          )}
          {...props}
          ref={ref}
        />
        {error && (
          <p className="mt-1 text-xs text-[#ef4444]">{error}</p>
        )}
      </div>
    );
  }
);
Input.displayName = "Input";

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, id, ...props }, ref) => {
    const generatedId = React.useId();
    const textareaId = id || generatedId;
    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={textareaId}
            className="block text-xs font-medium text-[#94a3b8] mb-1.5"
          >
            {label}
          </label>
        )}
        <textarea
          id={textareaId}
          className={cn(
            "min-h-[120px] w-full rounded-md border border-[rgba(148,163,184,0.25)] bg-[#111827] px-4 py-2 text-sm text-[#f8fafc] placeholder-[#64748b] focus:outline-none focus:ring-1 focus:ring-[#4778ff] focus:border-[#4778ff] disabled:opacity-50 disabled:pointer-events-none",
            error && "border-[#ef4444] focus:ring-[#ef4444] focus:border-[#ef4444]",
            className
          )}
          {...props}
          ref={ref}
        />
        {error && (
          <p className="mt-1 text-xs text-[#ef4444]">{error}</p>
        )}
      </div>
    );
  }
);
Textarea.displayName = "Textarea";
