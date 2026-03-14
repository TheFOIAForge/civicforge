"use client";

interface CardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  padding?: "none" | "sm" | "md" | "lg";
  as?: "div" | "article" | "section";
  id?: string;
  [key: `data-${string}`]: string | undefined;
}

const paddingStyles = {
  none: "",
  sm: "p-4",
  md: "p-6",
  lg: "p-8",
};

export default function Card({
  children,
  className = "",
  hover = false,
  padding = "md",
  as: Tag = "div",
  id,
  ...rest
}: CardProps) {
  return (
    <Tag
      id={id}
      {...rest}
      className={`
        bg-white rounded-xl border border-gray-200 shadow-sm
        ${hover ? "transition-all duration-200 hover:shadow-md hover:border-gray-300 hover:-translate-y-0.5" : ""}
        ${paddingStyles[padding]}
        ${className}
      `}
    >
      {children}
    </Tag>
  );
}
