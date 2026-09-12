import type { ButtonHTMLAttributes, ReactNode } from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md";

const VARIANT_CLASSES: Record<Variant, string> = {
  primary: "bg-brand-500 text-white hover:bg-brand-600 shadow-sm",
  secondary: "bg-surface-3 text-ink-primary hover:bg-border-subtle",
  ghost: "bg-transparent text-ink-secondary hover:bg-surface-3",
  danger: "bg-transparent text-[color:var(--status-critical)] hover:bg-[color-mix(in_srgb,var(--status-critical)_12%,transparent)]",
};

const SIZE_CLASSES: Record<Size, string> = {
  sm: "px-3 py-1.5 text-xs",
  md: "px-4 py-2 text-sm",
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  icon?: ReactNode;
}

export function Button({ variant = "secondary", size = "md", icon, className = "", children, ...rest }: ButtonProps) {
  return (
    <button
      className={`inline-flex items-center justify-center gap-1.5 rounded-lg font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${VARIANT_CLASSES[variant]} ${SIZE_CLASSES[size]} ${className}`}
      {...rest}
    >
      {icon}
      {children}
    </button>
  );
}
