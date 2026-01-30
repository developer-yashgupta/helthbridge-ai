// Utility functions

// Define ClassValue type locally
export type ClassValue = string | number | boolean | undefined | null | { [key: string]: any } | ClassValue[];

// Simple className utility function
export function cn(...inputs: ClassValue[]): string {
  return inputs
    .filter(Boolean)
    .map(input => {
      if (typeof input === 'string') return input;
      if (typeof input === 'object' && input !== null) {
        return Object.entries(input)
          .filter(([, value]) => Boolean(value))
          .map(([key]) => key)
          .join(' ');
      }
      return '';
    })
    .join(' ')
    .trim();
}

// Alternative simple implementation without clsx dependency
export function clsx(...inputs: ClassValue[]): string {
  return cn(...inputs);
}