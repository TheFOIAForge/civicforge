"use client";

import { forwardRef } from "react";

type ButtonVariant = "primary" | "secondary" | "outline" | "ghost" | "teal" | "danger";
type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  icon?: React.ReactNode;
  iconRight?: React.ReactNode;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    "bg-navy text-white hover:bg-navy-light shadow-sm hover:shadow-md active:scale-[0.98]",
  secondary:
    "bg-gold text-navy font-semibold hover:bg-gold-dark hover:text-white shadow-sm active:scale-[0.98]",
  outline:
    "bg-white text-navy border border-gray-200 hover:border-navy hover:bg-navy-50 active:scale-[0.98]",
  ghost:
    "text-navy hover:bg-gray-100 active:scale-[0.98]",
  teal:
    "bg-teal text-white hover:bg-teal/90 shadow-sm active:scale-[0.98]",
  danger:
    "bg-red text-white hover:bg-red/90 shadow-sm active:scale-[0.98]",
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: "px-3 py-1.5 text-sm gap-1.5",
  md: "px-5 py-2.5 text-sm gap-2",
  lg: "px-7 py-3.5 text-base gap-2.5",
};

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "primary", size = "md", loading, icon, iconRight, children, className = "", disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={`
          inline-flex items-center justify-center font-medium
          rounded-xl transition-all duration-200 cursor-pointer
          disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100
          focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy
          ${variantStyles[variant]}
          ${sizeStyles[size]}
          ${className}
        `}
        {...props}
      >
        {loading ? (
          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        ) : icon ? (
          <span className="shrink-0">{icon}</span>
        ) : null}
        {children}
        {iconRight && <span className="shrink-0">{iconRight}</span>}
      </button>
    );
  }
);

Button.displayName = "Button";
export default Button;
