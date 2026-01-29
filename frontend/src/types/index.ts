// Global type definitions for HealthBridge AI

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface User {
  id: string;
  phone: string;
  name: string;
  userType: string;
  language: string;
  location: any;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface AnalysisResult {
  riskLevel: string;
  possibleConditions: string[];
  whatToDo: string[];
  emergencySigns?: string;
}

// Badge component types
export type BadgeVariant = "default" | "secondary" | "destructive" | "outline";

// Extend global types for better compatibility
declare global {
  namespace NodeJS {
    interface ProcessEnv {
      NEXT_PUBLIC_API_URL?: string;
      NEXT_PUBLIC_AI_ENGINE_URL?: string;
      NODE_ENV: 'development' | 'production' | 'test';
    }
  }
}