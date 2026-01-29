// API Service for HealthBridge frontend - integrates with existing backend and AI engine

const API_BASE_URL = 'http://localhost:3000/api';
const AI_ENGINE_URL = 'http://localhost:5000';

// Types for API responses
export interface ApiResponse<T> {
    success: boolean;
    data?: T;
    error?: string;
    message?: string;
}

// Authentication types (matching backend)
export interface LoginRequest {
    phone: string;
    otp: string;
}

export interface RegisterRequest {
    phone: string;
    name: string;
    otp: string;
    userType?: string;
    language?: string;
    location?: any;
}

export interface AuthResponse {
    token: string;
    user: {
        id: string;
        phone: string;
        name: string;
        userType: string;
        language: string;
        location: any;
    };
}

// AI Engine types (matching enhanced_app.py)
export interface SymptomAnalysisRequest {
    userId?: string;
    symptoms: string[] | string;
    inputType?: 'text' | 'voice' | 'image';
    language?: 'en' | 'hi';
    patientAge?: number;
    patientGender?: 'male' | 'female' | 'unknown';
    chronicConditions?: string[];
    allergies?: string[];
    currentMedications?: string[];
    location?: {
        village?: string;
        block?: string;
        district?: string;
    };
    familyHistory?: string[];
}

export interface SymptomAnalysisResponse {
    success: boolean;
    userId: string;
    riskLevel: 'green' | 'amber' | 'red';
    riskScore: number;
    confidence: number;
    diseasePredictions: DiseasePrediction[];
    healthcareRouting: HealthcareRouting;
    medicationSuggestions: MedicationSuggestions;
    recommendations: string[];
    followUpPlan: FollowUpPlan;
    historyFactors: HistoryFactors;
    extractedSymptoms: string[];
    analysisMethod: string;
    timestamp: string;
}

export interface DiseasePrediction {
    disease: string;
    confidence: number;
    matching_symptoms: string[];
    risk_factors_present: string[];
    urgency: 'routine' | 'urgent' | 'critical';
    description: string;
}

export interface HealthcareRouting {
    level: 'ASHA' | 'PHC' | 'CHC' | 'EMERGENCY';
    facility: {
        facility_id: string;
        name: string;
        level: string;
        location: Record<string, any>;
        services: string[];
        contact_info: Record<string, any>;
    };
    urgency: 'routine' | 'urgent' | 'emergency' | 'critical';
    transport: string;
    estimated_time: string;
    instructions: string[];
    contact_numbers: string[];
}

export interface MedicationSuggestions {
    safe_medicines: {
        name: string;
        dosage: string;
        frequency: string;
        duration: string;
    }[];
    home_remedies: string[];
    warnings: string[];
    contraindications: string[];
}

export interface FollowUpPlan {
    timeline: string;
    next_check: string;
    monitoring: string;
    red_flags: string[];
}

export interface HistoryFactors {
    age_factor: string;
    chronic_conditions: string[];
    current_medications: number;
    previous_episodes: number;
    allergies: number;
}

// API Client class
class ApiService {
    private async request<T>(
        url: string,
        options: RequestInit = {}
    ): Promise<ApiResponse<T>> {
        try {
            const response = await fetch(url, {
                headers: {
                    'Content-Type': 'application/json',
                    ...options.headers,
                },
                ...options,
            });

            const data = await response.json();

            if (!response.ok) {
                return {
                    success: false,
                    error: data.error || data.message || `HTTP ${response.status}`,
                };
            }

            return {
                success: true,
                data,
            };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Network error',
            };
        }
    }

    // Authentication APIs (matching backend routes)
    async sendOTP(phone: string): Promise<ApiResponse<{ message: string }>> {
        return this.request(`${API_BASE_URL}/auth/send-otp`, {
            method: 'POST',
            body: JSON.stringify({ phone }),
        });
    }

    async login(loginData: LoginRequest): Promise<ApiResponse<AuthResponse>> {
        return this.request(`${API_BASE_URL}/auth/login`, {
            method: 'POST',
            body: JSON.stringify(loginData),
        });
    }

    async register(userData: RegisterRequest): Promise<ApiResponse<AuthResponse>> {
        return this.request(`${API_BASE_URL}/auth/register`, {
            method: 'POST',
            body: JSON.stringify(userData),
        });
    }

    async getProfile(token: string): Promise<ApiResponse<any>> {
        return this.request(`${API_BASE_URL}/auth/profile`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });
    }

    // AI Engine APIs (matching enhanced_app.py endpoints)
    async analyzeSymptoms(
        request: SymptomAnalysisRequest
    ): Promise<ApiResponse<SymptomAnalysisResponse>> {
        return this.request(`${AI_ENGINE_URL}/analyze`, {
            method: 'POST',
            body: JSON.stringify(request),
        });
    }

    async getUserHistory(userId: string): Promise<ApiResponse<any>> {
        return this.request(`${AI_ENGINE_URL}/user-history/${userId}`);
    }

    async getHealthcareFacilities(
        location?: string,
        type?: string
    ): Promise<ApiResponse<{ facilities: any[]; total: number }>> {
        const params = new URLSearchParams();
        if (location) params.append('location', location);
        if (type) params.append('type', type);

        return this.request(`${AI_ENGINE_URL}/healthcare-facilities?${params}`);
    }

    async voiceToText(
        audioFile: File,
        language: string = 'hi'
    ): Promise<ApiResponse<{ text: string; confidence: number }>> {
        const formData = new FormData();
        formData.append('audio', audioFile);
        formData.append('language', language);

        return this.request(`${AI_ENGINE_URL}/voice-to-text`, {
            method: 'POST',
            body: formData,
            headers: {}, // Remove Content-Type to let browser set it for FormData
        });
    }

    async analyzeImage(
        imageFile: File
    ): Promise<ApiResponse<{ analysis: any }>> {
        const formData = new FormData();
        formData.append('image', imageFile);

        return this.request(`${AI_ENGINE_URL}/image-analysis`, {
            method: 'POST',
            body: formData,
            headers: {}, // Remove Content-Type to let browser set it for FormData
        });
    }

    async translateText(
        text: string,
        source: string = 'en',
        target: string = 'hi'
    ): Promise<ApiResponse<{ translated_text: string }>> {
        return this.request(`${AI_ENGINE_URL}/translate`, {
            method: 'POST',
            body: JSON.stringify({ text, source, target }),
        });
    }

    async getModelStatus(): Promise<ApiResponse<{ models: Record<string, boolean> }>> {
        return this.request(`${AI_ENGINE_URL}/models/status`);
    }

    async sendEmergencyAlert(
        userId: string,
        symptoms: string[],
        location: any
    ): Promise<ApiResponse<any>> {
        return this.request(`${AI_ENGINE_URL}/emergency-alert`, {
            method: 'POST',
            body: JSON.stringify({ userId, symptoms, location }),
        });
    }

    // Backend APIs (matching existing routes)
    async getTriageStats(token: string): Promise<ApiResponse<any>> {
        return this.request(`${API_BASE_URL}/triage/stats`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });
    }

    async findResources(
        userLocation: any,
        resourceType: string = 'all',
        urgency: string = 'normal'
    ): Promise<ApiResponse<any>> {
        return this.request(`${API_BASE_URL}/resources/find`, {
            method: 'POST',
            body: JSON.stringify({ userLocation, resourceType, urgency }),
        });
    }

    async requestAmbulance(
        userLocation: any,
        patientInfo: any,
        urgency: string = 'emergency'
    ): Promise<ApiResponse<any>> {
        return this.request(`${API_BASE_URL}/resources/emergency/ambulance`, {
            method: 'POST',
            body: JSON.stringify({ userLocation, patientInfo, urgency }),
        });
    }

    async getASHADashboard(token: string): Promise<ApiResponse<any>> {
        return this.request(`${API_BASE_URL}/asha/dashboard`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });
    }

    async getAvailableDoctors(token: string): Promise<ApiResponse<any>> {
        return this.request(`${API_BASE_URL}/teleconsult/doctors`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });
    }

    async bookTeleconsultation(
        doctorId: string,
        preferredTime: string,
        symptoms: string[],
        urgency: string,
        token: string
    ): Promise<ApiResponse<any>> {
        return this.request(`${API_BASE_URL}/teleconsult/book`, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ doctorId, preferredTime, symptoms, urgency }),
        });
    }
}

// Export singleton instance
export const apiService = new ApiService();

// Utility functions for formatting
export const formatRiskLevel = (riskLevel: string): { color: string; label: string; icon: string } => {
    switch (riskLevel) {
        case 'red':
            return { color: 'text-red-600', label: 'High Risk', icon: '🚨' };
        case 'amber':
            return { color: 'text-yellow-600', label: 'Medium Risk', icon: '⚠️' };
        case 'green':
            return { color: 'text-green-600', label: 'Low Risk', icon: '✅' };
        default:
            return { color: 'text-gray-600', label: 'Unknown', icon: '❓' };
    }
};

export const formatHealthcareLevel = (level: string): { label: string; description: string; icon: string } => {
    switch (level) {
        case 'ASHA':
            return {
                label: 'ASHA Worker',
                description: 'Community health worker for basic care',
                icon: '👩‍⚕️'
            };
        case 'PHC':
            return {
                label: 'Primary Health Centre',
                description: 'Basic medical care and emergency services',
                icon: '🏥'
            };
        case 'CHC':
            return {
                label: 'Community Health Centre',
                description: 'Specialist care and advanced treatment',
                icon: '🏥'
            };
        case 'EMERGENCY':
            return {
                label: 'Emergency Care',
                description: 'Immediate critical care required',
                icon: '🚑'
            };
        default:
            return {
                label: 'Healthcare Facility',
                description: 'Medical care provider',
                icon: '🏥'
            };
    }
};

export const formatUrgency = (urgency: string): { color: string; label: string; icon: string } => {
    switch (urgency) {
        case 'critical':
            return { color: 'text-red-600', label: 'Critical', icon: '🚨' };
        case 'emergency':
            return { color: 'text-red-500', label: 'Emergency', icon: '🚑' };
        case 'urgent':
            return { color: 'text-yellow-600', label: 'Urgent', icon: '⚠️' };
        case 'routine':
            return { color: 'text-green-600', label: 'Routine', icon: '📅' };
        default:
            return { color: 'text-gray-600', label: 'Normal', icon: '📋' };
    }
};