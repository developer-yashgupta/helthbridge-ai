// API Service for HealthBridge frontend - integrates with existing backend and AI engine

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';
const AI_ENGINE_URL = process.env.NEXT_PUBLIC_AI_ENGINE_URL || 'http://localhost:5000';

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
    aiResponse?: string; // The main AI conversational response
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
            console.log('=== Making Request ===');
            console.log('URL:', url);
            console.log('Method:', options.method || 'GET');

            const response = await fetch(url, {
                headers: {
                    'Content-Type': 'application/json',
                    ...options.headers,
                },
                ...options,
            });

            console.log('=== Response Received ===');
            console.log('Status:', response.status);
            console.log('OK:', response.ok);
            console.log('Status Text:', response.statusText);

            const data = await response.json();
            console.log('Response data:', data);

            if (!response.ok) {
                console.error('Response not OK:', response.status);
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
            console.error('=== Request Error ===');
            console.error('Error:', error);
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

    // AI Engine APIs - Now using backend voice assistant with OpenAI
    async analyzeSymptoms(
        request: SymptomAnalysisRequest & { imageData?: string }
    ): Promise<ApiResponse<SymptomAnalysisResponse>> {
        // Use the test user ID we created, or create a default anonymous user
        const defaultUserId = '3dfd7ac0-8b57-46df-8232-9efe2750183c'; // Test user we created

        // Convert to voice assistant format
        const voiceAssistantRequest = {
            userId: request.userId || defaultUserId,
            message: Array.isArray(request.symptoms) ? request.symptoms.join(', ') : request.symptoms,
            language: request.language || 'en',
            imageData: request.imageData, // Add image data support
            patientInfo: {
                age: request.patientAge,
                gender: request.patientGender,
                location: request.location,
                medicalHistory: [
                    ...(request.chronicConditions || []),
                    ...(request.allergies || []),
                    ...(request.currentMedications || [])
                ]
            }
        };

        // Call voice assistant API
        console.log('=== Calling Voice Assistant API ===');
        console.log('Request URL:', `${API_BASE_URL}/voice-assistant/analyze`);
        console.log('Request body:', voiceAssistantRequest);

        const response = await this.request<any>(`${API_BASE_URL}/voice-assistant/analyze`, {
            method: 'POST',
            body: JSON.stringify(voiceAssistantRequest),
        });

        console.log('=== API Response ===');
        console.log('Response success:', response.success);
        console.log('Response error:', response.error);
        console.log('Response data:', response.data);
        console.log('Full response:', JSON.stringify(response, null, 2));

        if (!response.success) {
            console.error('API call failed:', response.error);
            return {
                success: false,
                error: response.error || 'Failed to analyze symptoms'
            };
        }

        // The backend returns the data directly, not wrapped in a data field
        const vaData = response.data;

        console.log('=== Voice Assistant Data ===');
        console.log('vaData:', vaData);
        console.log('vaData.routing:', vaData?.routing);
        console.log('vaData.response:', vaData?.response);

        if (!vaData || !vaData.routing) {
            console.error('Invalid response structure - missing routing data');
            console.error('vaData is:', vaData);
            return {
                success: false,
                error: 'Invalid response from server - missing routing data'
            };
        }

        // Transform voice assistant response to expected format
        const transformedData: SymptomAnalysisResponse = {
            success: true,
            userId: request.userId || defaultUserId,
            riskLevel: vaData.routing.severity === 'critical' ? 'red' :
                vaData.routing.severity === 'high' ? 'red' :
                    vaData.routing.severity === 'medium' ? 'amber' : 'green',
            riskScore: vaData.routing.severityScore,
            confidence: 85, // Default confidence
            diseasePredictions: [],
            healthcareRouting: {
                level: vaData.routing.facilityType,
                facility: vaData.routing.facility ? {
                    facility_id: vaData.routing.facility.id || '',
                    name: vaData.routing.facility.name || '',
                    level: vaData.routing.facilityType,
                    location: {},
                    services: [],
                    contact_info: {
                        phone: vaData.routing.facility.phone,
                        address: vaData.routing.facility.address
                    }
                } : {} as any,
                urgency: vaData.routing.severity === 'critical' ? 'critical' :
                    vaData.routing.severity === 'high' ? 'urgent' : 'routine',
                transport: vaData.routing.severity === 'critical' ? 'Ambulance' : 'Self',
                estimated_time: vaData.routing.timeframe,
                instructions: [vaData.routing.reasoning],
                contact_numbers: vaData.routing.facility?.phone ? [vaData.routing.facility.phone] : []
            },
            medicationSuggestions: {
                safe_medicines: [],
                home_remedies: [],
                warnings: [],
                contraindications: []
            },
            // Use routing reasoning for recommendations, not the AI response
            recommendations: vaData.routing.reasoning ? [vaData.routing.reasoning] : [],
            followUpPlan: {
                timeline: vaData.routing.timeframe,
                next_check: vaData.routing.timeframe,
                monitoring: vaData.routing.reasoning,
                red_flags: []
            },
            historyFactors: {
                age_factor: request.patientAge ? `Age: ${request.patientAge}` : 'Unknown',
                chronic_conditions: request.chronicConditions || [],
                current_medications: request.currentMedications?.length || 0,
                previous_episodes: 0,
                allergies: request.allergies?.length || 0
            },
            extractedSymptoms: Array.isArray(request.symptoms) ? request.symptoms : [request.symptoms],
            analysisMethod: 'Gemini AI',
            timestamp: new Date().toISOString(),
            // Add the AI response as a separate field
            aiResponse: vaData.response
        };

        return {
            success: true,
            data: transformedData
        };
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