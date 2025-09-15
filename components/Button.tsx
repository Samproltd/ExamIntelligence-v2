import React from "react";

export interface ButtonProps {
  children: React.ReactNode;
  type?: "button" | "submit" | "reset";
  variant?: "primary" | "secondary" | "outline";
  size?: "sm" | "md" | "lg";
  fullWidth?: boolean;
  disabled?: boolean;
  loading?: boolean;
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  className?: string;
}

const Button: React.FC<ButtonProps> = ({
  children,
  type = "button",
  variant = "primary",
  size = "md",
  fullWidth = false,
  disabled = false,
  loading = false,
  onClick,
  className = "",
}) => {
  const baseStyles = "btn";
  const variantStyles = {
    primary: "btn-primary",
    secondary: "btn-secondary",
    outline: "btn-outline",
  };

  const sizeStyles = {
    sm: "text-sm px-2 py-1",
    md: "px-4 py-2",
    lg: "text-lg px-6 py-3",
  };

  const widthStyle = fullWidth ? "w-full" : "";
  const disabledStyle =
    disabled || loading ? "opacity-50 cursor-not-allowed" : "";

  const buttonClasses = `${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${widthStyle} ${disabledStyle} ${className} flex items-center justify-center`;

  return (
    <button
      type={type}
      className={buttonClasses}
      onClick={onClick}
      disabled={disabled || loading}
    >
      {loading && (
        <span className="mr-2 inline-block animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-current"></span>
      )}
      {children}
    </button>
  );
};

export default Button;
