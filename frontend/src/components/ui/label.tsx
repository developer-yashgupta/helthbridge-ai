// Simple label component implementation
import React from "react";

interface LabelProps {
  children?: React.ReactNode;
  className?: string;
  htmlFor?: string;
  [key: string]: any;
}

export const Label: React.FC<LabelProps> = ({ 
  children, 
  className = '', 
  ...props 
}) => {
  return (
    <label
      className={`text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 ${className}`}
      {...props}
    >
      {children}
    </label>
  );
};