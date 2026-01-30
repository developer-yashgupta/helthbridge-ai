// Type definitions for the HealthBridge AI application

export type Role = 'citizen' | 'asha' | 'clinical' | 'admin';

export const roles: Role[] = ['citizen', 'asha', 'clinical', 'admin'];

export const roleRoutes: Record<Role, string> = {
  citizen: '/citizen/dashboard',
  asha: '/asha/dashboard', 
  clinical: '/clinical/dashboard',
  admin: '/admin/dashboard'
};

export const roleDisplayNames: Record<Role, string> = {
  citizen: 'Citizen',
  asha: 'ASHA Worker',
  clinical: 'Healthcare Provider', 
  admin: 'Administrator'
};

export const roleDescriptions: Record<Role, string> = {
  citizen: 'Access your health dashboard and AI-powered symptom analysis',
  asha: 'Manage community health and assist citizens',
  clinical: 'Access clinical tools and patient management',
  admin: 'System administration and oversight'
};

export interface User {
  id: string;
  phone: string;
  name: string;
  userType: string;
  language: string;
  location: any;
}

export interface AuthResponse {
  success: boolean;
  data?: {
    token: string;
    user: User;
  };
  error?: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}