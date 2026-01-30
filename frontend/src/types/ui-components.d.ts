// UI Components type declarations
declare module '@/components/ui/button' {
  import React from 'react';
  
  interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
    size?: 'default' | 'sm' | 'lg' | 'icon';
  }
  
  export const Button: React.FC<ButtonProps>;
}

declare module '@/components/ui/card' {
  import React from 'react';
  
  interface CardProps extends React.HTMLAttributes<HTMLDivElement> {}
  interface CardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {}
  interface CardTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {}
  interface CardDescriptionProps extends React.HTMLAttributes<HTMLParagraphElement> {}
  interface CardContentProps extends React.HTMLAttributes<HTMLDivElement> {}
  interface CardFooterProps extends React.HTMLAttributes<HTMLDivElement> {}
  
  export const Card: React.FC<CardProps>;
  export const CardHeader: React.FC<CardHeaderProps>;
  export const CardTitle: React.FC<CardTitleProps>;
  export const CardDescription: React.FC<CardDescriptionProps>;
  export const CardContent: React.FC<CardContentProps>;
  export const CardFooter: React.FC<CardFooterProps>;
}

declare module '@/components/ui/input' {
  import React from 'react';
  
  interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}
  
  export const Input: React.FC<InputProps>;
}

declare module '@/components/ui/label' {
  import React from 'react';
  
  interface LabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {}
  
  export const Label: React.FC<LabelProps>;
}