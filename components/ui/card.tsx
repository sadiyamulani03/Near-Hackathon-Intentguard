"use client";

import * as React from "react";
import { cn } from "./button";

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  elevated?: boolean;
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, children, elevated = false, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "relative rounded-xl border border-[rgba(148,163,184,0.16)] bg-[#111827] text-[#f8fafc]",
          elevated
            ? "bg-[#172033] shadow-[0_8px_24px_rgba(0,0,0,0.35)]"
            : "bg-[#111827] shadow-[0_4px_12px_rgba(0,0,0,0.3)]",
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);
Card.displayName = "Card";

interface CardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export const CardHeader = React.forwardRef<HTMLDivElement, CardHeaderProps>(
  ({ className, children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("flex flex-col space-y-1.5 p-6", className)}
      {...props}
    >
      {children}
    </div>
  )
);
CardHeader.displayName = "CardHeader";

interface CardTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {
  children: React.ReactNode;
}

export const CardTitle = React.forwardRef<HTMLHeadingElement, CardTitleProps>(
  ({ className, children, ...props }, ref) => (
    <h3
      ref={ref}
      className={cn(
        "text-lg font-semibold text-[#f8fafc] tracking-tight",
        className
      )}
      {...props}
    >
      {children}
    </h3>
  )
);
CardTitle.displayName = "CardTitle";

interface CardDescriptionProps extends React.HTMLAttributes<HTMLParagraphElement> {
  children: React.ReactNode;
}

export const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  CardDescriptionProps
>(({ className, children, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-sm text-[#94a3b8]", className)}
    {...props}
  >
    {children}
  </p>
));
CardDescription.displayName = "CardDescription";

interface CardContentProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export const CardContent = React.forwardRef<HTMLDivElement, CardContentProps>(
  ({ className, children, ...props }, ref) => (
    <div ref={ref} className={cn("p-6 pt-0", className)} {...props}>
      {children}
    </div>
  )
);
CardContent.displayName = "CardContent";

interface CardFooterProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export const CardFooter = React.forwardRef<HTMLDivElement, CardFooterProps>(
  ({ className, children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("flex items-center p-6 pt-0", className)}
      {...props}
    >
      {children}
    </div>
  )
);
CardFooter.displayName = "CardFooter";

interface SeparatorProps extends React.HTMLAttributes<HTMLHRElement> {
  children?: React.ReactNode;
  orientation?: "horizontal" | "vertical";
  decorative?: boolean;
}

export const Separator = React.forwardRef<
  HTMLHRElement,
  SeparatorProps
>(({ className, children, orientation = "horizontal", decorative = true, ...props }, ref) => (
  <hr
    ref={ref}
    className={cn(
      "relative flex w-full shrink-0 [border-top:var(--color-border)] self-stretch dark:[border-top:var(--color-border)]",
      orientation === "horizontal"
        ? "h-[1px] w-full"
        : "h-full w-[1px]",
      className
    )}
    {...props}
  >
    {children}
  </hr>
));
Separator.displayName = "Separator";

interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: string;
  children: React.ReactNode;
}

function badgeVariantClass(variant: string) {
  switch (variant) {
    case "safe":
      return "bg-[#22c55e]/10 text-[#22c55e] border border-[#22c55e]/20";
    case "warning":
      return "bg-[#f59e0b]/10 text-[#f59e0b] border border-[#f59e0b]/20";
    case "critical":
      return "bg-[#ef4444]/10 text-[#ef4444] border border-[#ef4444]/20";
    case "informational":
    default:
      return "bg-[#4778ff]/10 text-[#4778ff] border border-[#4778ff]/20";
  }
}

export const Badge = React.forwardRef<HTMLDivElement, BadgeProps>(
  ({ className, variant = "informational", children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium",
        badgeVariantClass(variant),
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
);
Badge.displayName = "Badge";
