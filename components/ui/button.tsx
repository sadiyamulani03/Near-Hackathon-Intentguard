import * as React from "react";

export function cn(...classes: (string | undefined | null | false)[]) {
  return classes.filter(Boolean).join(" ");
}

type ButtonVariant = "primary" | "secondary" | "outline" | "ghost" | "danger";
type ButtonSize = "default" | "sm" | "lg" | "icon";

interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  asChild?: boolean;
}

function variantClass(variant: ButtonVariant) {
  switch (variant) {
    case "primary":
      return "bg-[#4778ff] text-white hover:bg-[#3a6be0] shadow-[0_0_16px_rgba(71,120,255,0.25)]";
    case "secondary":
      return "bg-[#7557ff] text-white hover:bg-[#6a4be0] shadow-[0_0_16px_rgba(117,87,255,0.25)]";
    case "outline":
      return "border border-[rgba(148,163,184,0.25)] bg-transparent hover:bg-[rgba(148,163,184,0.1)] text-[#f8fafc]";
    case "ghost":
      return "hover:bg-[rgba(148,163,184,0.1)] text-[#f8fafc]";
    case "danger":
      return "bg-[#ef4444] text-white hover:bg-[#dc2626] shadow-[0_0_16px_rgba(239,68,68,0.25)]";
  }
}

function sizeClass(size: ButtonSize) {
  switch (size) {
    case "sm":
      return "h-9 px-3 text-xs";
    case "lg":
      return "h-11 px-8 text-base";
    case "icon":
      return "h-10 w-10 p-0";
    default:
      return "h-10 px-4 py-2 text-sm";
  }
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "default", asChild = false, ...props }, ref) => {
    const base = cn(
      "inline-flex items-center justify-center whitespace-nowrap rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4778ff] disabled:pointer-events-none disabled:opacity-50",
      variantClass(variant),
      sizeClass(size),
      className
    );
    if (asChild) {
      return <span className={base} {...props} />;
    }
    return (
      <button ref={ref} className={base} {...props} />
    );
  }
);
Button.displayName = "Button";

export type { ButtonVariant, ButtonSize };
