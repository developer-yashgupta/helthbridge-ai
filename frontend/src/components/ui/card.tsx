// Simple card components implementation
import React from "react";

interface CardProps {
  children?: React.ReactNode;
  className?: string;
  [key: string]: any;
}

interface CardHeaderProps {
  children?: React.ReactNode;
  className?: string;
  [key: string]: any;
}

interface CardTitleProps {
  children?: React.ReactNode;
  className?: string;
  [key: string]: any;
}

interface CardDescriptionProps {
  children?: React.ReactNode;
  className?: string;
  [key: string]: any;
}

interface CardContentProps {
  children?: React.ReactNode;
  className?: string;
  [key: string]: any;
}

interface CardFooterProps {
  children?: React.ReactNode;
  className?: string;
  [key: string]: any;
}

export const Card: React.FC<CardProps> = ({ children, className = '', ...props }) => {
  return (
    <div 
      className={`rounded-lg border bg-card text-card-foreground shadow-sm ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

export const CardHeader: React.FC<CardHeaderProps> = ({ children, className = '', ...props }) => {
  return (
    <div className={`flex flex-col space-y-1.5 p-6 ${className}`} {...props}>
      {children}
    </div>
  );
};

export const CardTitle: React.FC<CardTitleProps> = ({ children, className = '', ...props }) => {
  return (
    <h3 className={`text-2xl font-semibold leading-none tracking-tight ${className}`} {...props}>
      {children}
    </h3>
  );
};

export const CardDescription: React.FC<CardDescriptionProps> = ({ children, className = '', ...props }) => {
  return (
    <p className={`text-sm text-muted-foreground ${className}`} {...props}>
      {children}
    </p>
  );
};

export const CardContent: React.FC<CardContentProps> = ({ children, className = '', ...props }) => {
  return (
    <div className={`p-6 pt-0 ${className}`} {...props}>
      {children}
    </div>
  );
};

export const CardFooter: React.FC<CardFooterProps> = ({ children, className = '', ...props }) => {
  return (
    <div className={`flex items-center p-6 pt-0 ${className}`} {...props}>
      {children}
    </div>
  );
};