import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// API Configuration
const API_BASE_URL = __DEV__ 
  ? 'http://localhost:3000/api' 
  : 'https://healthbridge-api.herokuapp.com/api';

const AI_ENGINE_URL = __DEV__
  ? 'http://localhost:5000'
  : 'https://healthbridge-ai.herokuapp.com';

// Create axios instance
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  async (config) => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.error('Error getting auth token:', error);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized access
      AsyncStorage.removeItem('authToken');
      AsyncStorage.removeItem('user');
    }
    
    return Promise.reject({
      message: error.response?.data?.error || error.message || 'Network error',
      status: error.response?.status,
      data: error.response?.data
    });
  }
);

// AI Engine client
const aiClient = axios.create({
  baseURL: AI_ENGINE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Auth API
export const authAPI = {
  sendOTP: (phone) => apiClient.post('/auth/send-otp', { phone }),
  
  login: (phone, otp) => apiClient.post('/auth/login', { phone, otp }),
  
  register: (userData) => apiClient.post('/auth/register', userData),
  
  getProfile: () => apiClient.get('/auth/profile'),
  
  updateProfile: (updates) => apiClient.put('/auth/profile', updates),
};

// Symptoms API
export const symptomsAPI = {
  analyzeSymptoms: (data) => apiClient.post('/symptoms/analyze', data),
  
  getHistory: (userId) => apiClient.get(`/symptoms/history/${userId}`),
  
  // AI Engine endpoints
  analyzeWithAI: (data) => aiClient.post('/analyze', data),
  
  voiceToText: (audioFile, language) => {
    const formData = new FormData();
    formData.append('audio', audioFile);
    formData.append('language', language);
    
    return aiClient.post('/voice-to-text', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
  
  analyzeImage: (imageFile) => {
    const formData = new FormData();
    formData.append('image', imageFile);
    
    return aiClient.post('/image-analysis', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
};

// Triage API
export const triageAPI = {
  makeDecision: (data) => apiClient.post('/triage/decide', data),
  
  getStats: () => apiClient.get('/triage/stats'),
};

// Resources API
export const resourcesAPI = {
  findNearby: (data) => apiClient.post('/resources/find', data),
  
  getAvailability: (resourceId) => apiClient.get(`/resources/availability/${resourceId}`),
  
  requestAmbulance: (data) => apiClient.post('/resources/emergency/ambulance', data),
  
  getStats: () => apiClient.get('/resources/stats'),
};

// ASHA API
export const ashaAPI = {
  getDashboard: () => apiClient.get('/asha/dashboard'),
  
  getPatients: (params) => apiClient.get('/asha/patients', { params }),
  
  getPatientDetails: (patientId) => apiClient.get(`/asha/patients/${patientId}`),
  
  recordVisit: (data) => apiClient.post('/asha/visits', data),
  
  createReferral: (data) => apiClient.post('/asha/referrals', data),
  
  getMetrics: () => apiClient.get('/asha/metrics'),
};

// Teleconsultation API
export const teleconsultAPI = {
  getDoctors: (params) => apiClient.get('/teleconsult/doctors', { params }),
  
  bookConsultation: (data) => apiClient.post('/teleconsult/book', data),
  
  getConsultation: (consultationId) => apiClient.get(`/teleconsult/consultations/${consultationId}`),
  
  getMyConsultations: () => apiClient.get('/teleconsult/my-consultations'),
  
  completeConsultation: (consultationId, data) => 
    apiClient.post(`/teleconsult/consultations/${consultationId}/complete`, data),
  
  getStats: () => apiClient.get('/teleconsult/stats'),
};

// Offline fallback functions
export const offlineAPI = {
  // Basic symptom analysis without AI
  analyzeSymptoms: (symptoms, age, gender) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const riskScore = calculateBasicRisk(symptoms, age);
        const riskLevel = riskScore >= 70 ? 'red' : riskScore >= 40 ? 'amber' : 'green';
        
        resolve({
          success: true,
          analysis: {
            riskLevel,
            riskScore,
            explanation: getOfflineExplanation(riskLevel),
            recommendations: getOfflineRecommendations(riskLevel),
            nextSteps: getOfflineNextSteps(riskLevel),
            urgency: riskLevel === 'red' ? 'immediate' : riskLevel === 'amber' ? 'moderate' : 'low',
            estimatedWaitTime: riskLevel === 'red' ? '0 minutes' : riskLevel === 'amber' ? '2-4 hours' : 'self-care'
          }
        });
      }, 1000);
    });
  },
  
  // Mock resource finder
  findResources: (location, type) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          success: true,
          resources: getMockResources(type)
        });
      }, 500);
    });
  }
};

// Helper functions for offline mode
function calculateBasicRisk(symptoms, age) {
  const highRiskSymptoms = ['chest_pain', 'difficulty_breathing', 'severe_bleeding'];
  const mediumRiskSymptoms = ['fever', 'severe_headache', 'persistent_vomiting'];
  
  let score = 20; // Base score
  
  symptoms.forEach(symptom => {
    if (highRiskSymptoms.includes(symptom)) {
      score += 30;
    } else if (mediumRiskSymptoms.includes(symptom)) {
      score += 15;
    } else {
      score += 5;
    }
  });
  
  // Age adjustment
  if (age < 5 || age > 65) {
    score *= 1.2;
  }
  
  return Math.min(100, score);
}

function getOfflineExplanation(riskLevel) {
  const explanations = {
    red: 'आपके लक्षण गंभीर हैं। तुरंत चिकित्सा सहायता की आवश्यकता है।',
    amber: 'आपके लक्षणों पर ध्यान देने की जरूरत है। जल्दी इलाज कराएं।',
    green: 'आपके लक्षण सामान्य लगते हैं। घरेलू उपचार से ठीक हो सकते हैं।'
  };
  return explanations[riskLevel];
}

function getOfflineRecommendations(riskLevel) {
  const recommendations = {
    red: ['तुरंत नजदीकी अस्पताल जाएं', '108 पर एम्बुलेंस बुलाएं'],
    amber: ['ASHA कार्यकर्ता से संपर्क करें', 'नजदीकी PHC में जांच कराएं'],
    green: ['आराम करें और पानी पिएं', 'स्वस्थ भोजन लें']
  };
  return recommendations[riskLevel];
}

function getOfflineNextSteps(riskLevel) {
  const steps = {
    red: ['emergency_care'],
    amber: ['asha_visit', 'phc_consultation'],
    green: ['home_care', 'monitor']
  };
  return steps[riskLevel];
}

function getMockResources(type) {
  const mockData = [
    {
      id: 'phc_001',
      name: 'Primary Health Centre Rampur',
      type: 'PHC',
      distance: 2.5,
      phone: '+91-9876543210',
      availability: 'open'
    },
    {
      id: 'asha_001',
      name: 'Sunita Devi (ASHA Worker)',
      type: 'ASHA',
      distance: 0.8,
      phone: '+91-9876543212',
      availability: 'available'
    }
  ];
  
  return type === 'all' ? mockData : mockData.filter(r => r.type === type.toUpperCase());
}

// Network status checker
export const checkNetworkStatus = async () => {
  try {
    const response = await fetch(`${API_BASE_URL.replace('/api', '')}/health`, {
      method: 'GET',
      timeout: 5000
    });
    return response.ok;
  } catch (error) {
    return false;
  }
};

export default {
  authAPI,
  symptomsAPI,
  triageAPI,
  resourcesAPI,
  ashaAPI,
  teleconsultAPI,
  offlineAPI,
  checkNetworkStatus
};