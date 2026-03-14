"use client";

import { forwardRef } from "react";

interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  label: string;
  size?: "sm" | "md" | "lg";
  variant?: "default" | "ghost";
}

const sizeMap = {
  sm: "w-8 h-8",
  md: "w-10 h-10",
  lg: "w-12 h-12",
};

const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ label, size = "md", variant = "default", children, className = "", ...props }, ref) => {
    return (
      <button
        ref={ref}
        aria-label={label}
        className={`
          inline-flex items-center justify-center rounded-xl
          transition-all duration-200 cursor-pointer
          focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy
          ${variant === "default"
            ? "bg-white border border-gray-200 text-navy hover:bg-gray-50 hover:border-gray-300 shadow-xs"
            : "text-gray-500 hover:text-navy hover:bg-gray-100"
          }
          ${sizeMap[size]}
          ${className}
        `}
        {...props}
      >
        {children}
      </button>
    );
  }
);

IconButton.displayName = "IconButton";
export default IconButton;
