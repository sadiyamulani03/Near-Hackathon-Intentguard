"use client";

import { ShieldAlert, Info, Loader2 } from "lucide-react";

export function LoadingState({ message = "Loading..." }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <Loader2 className="h-8 w-8 animate-spin text-[#4778ff]" />
      <p className="mt-4 text-sm text-[#94a3b8]">{message}</p>
    </div>
  );
}

export function EmptyState({
  icon = Info,
  title = "No data available",
  description,
  action,
}: {
  icon?: React.ElementType;
  title?: string;
  description?: string;
  action?: React.ReactNode;
}) {
  const Icon = icon;
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-lg border border-[rgba(148,163,184,0.16)] bg-[#111827] mb-4">
        <Icon className="h-6 w-6 text-[#64748b]" />
      </div>
      <h3 className="text-lg font-semibold text-[#f8fafc]">{title}</h3>
      {description && (
        <p className="mt-2 text-sm text-[#94a3b8] max-w-xs mx-auto">
          {description}
        </p>
      )}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}

export function Toast({
  message,
  type = "info",
  onDismiss,
}: {
  message: string;
  type?: "info" | "success" | "error";
  onDismiss: () => void;
}) {
  const color =
    type === "success" ? "#22c55e" : type === "error" ? "#ef4444" : "#4778ff";
  return (
    <div
      className="fixed bottom-4 right-4 z-[100] flex w-full max-w-sm flex-col gap-2"
    >
      <div className="flex items-start gap-3 rounded-lg border border-[rgba(148,163,184,0.25)] bg-[#172033] p-4 shadow-[0_10px_24px_rgba(0,0,0,0.5)]">
        <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#111827]">
          <span
            className="h-3 w-3"
            style={{ color }}
          >
            {type === "success" ? (
              <ShieldAlert />
            ) : type === "error" ? (
              <ShieldAlert />
            ) : (
              <Info />
            )}
          </span>
        </div>
        <div>
          <p className="text-sm font-medium text-[#f8fafc]">{message}</p>
        </div>
        <button
          onClick={onDismiss}
          className="absolute right-2 top-2 p-1 text-[#64748b] hover:text-[#f8fafc]"
          aria-label="Dismiss"
        >
          <span className="sr-only">Dismiss</span>
          <span className="block h-[12px] w-[12px]">
            <svg
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              className="h-4 w-4"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </span>
        </button>
      </div>
    </div>
  );
}
