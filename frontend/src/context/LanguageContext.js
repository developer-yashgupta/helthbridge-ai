import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const LanguageContext = createContext({});

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

// Translation strings
const translations = {
  hi: {
    // Common
    'welcome': 'स्वागत है',
    'continue': 'जारी रखें',
    'cancel': 'रद्द करें',
    'save': 'सहेजें',
    'loading': 'लोड हो रहा है...',
    'error': 'त्रुटि',
    'success': 'सफल',
    'retry': 'पुनः प्रयास करें',
    
    // Navigation
    'home': 'होम',
    'symptoms': 'लक्षण जांच',
    'resources': 'संसाधन',
    'asha_dashboard': 'ASHA डैशबोर्ड',
    'teleconsult': 'टेली परामर्श',
    'profile': 'प्रोफाइल',
    
    // Onboarding
    'app_title': 'HealthBridge AI',
    'app_subtitle': 'आपका स्वास्थ्य साथी',
    'onboarding_title_1': 'AI-powered स्वास्थ्य सहायता',
    'onboarding_desc_1': 'अपने लक्षणों की जांच करें और तुरंत सलाह पाएं',
    'onboarding_title_2': 'ऑफलाइन सपोर्ट',
    'onboarding_desc_2': 'इंटरनेट के बिना भी स्वास्थ्य सेवा का उपयोग करें',
    'onboarding_title_3': 'ASHA कार्यकर्ता सहायता',
    'onboarding_desc_3': 'स्थानीय ASHA कार्यकर्ताओं से जुड़ें',
    'get_started': 'शुरू करें',
    
    // Login
    'login_title': 'लॉगिन करें',
    'phone_number': 'मोबाइल नंबर',
    'enter_phone': 'अपना मोबाइल नंबर दर्ज करें',
    'send_otp': 'OTP भेजें',
    'enter_otp': 'OTP दर्ज करें',
    'verify_otp': 'OTP सत्यापित करें',
    'otp_sent': 'OTP भेजा गया',
    'invalid_otp': 'गलत OTP',
    
    // Home
    'good_morning': 'सुप्रभात',
    'good_afternoon': 'नमस्कार',
    'good_evening': 'शुभ संध्या',
    'how_are_you_feeling': 'आज आप कैसा महसूस कर रहे हैं?',
    'check_symptoms': 'लक्षण जांचें',
    'find_resources': 'संसाधन खोजें',
    'book_consultation': 'परामर्श बुक करें',
    'emergency': 'आपातकाल',
    'call_108': '108 पर कॉल करें',
    
    // Symptom Checker
    'symptom_checker': 'लक्षण जांचकर्ता',
    'describe_symptoms': 'अपने लक्षण बताएं',
    'voice_input': 'आवाज़ से बताएं',
    'text_input': 'टेक्स्ट में लिखें',
    'image_input': 'फोटो अपलोड करें',
    'tap_to_speak': 'बोलने के लिए दबाएं',
    'listening': 'सुन रहे हैं...',
    'processing': 'विश्लेषण हो रहा है...',
    'analyze_symptoms': 'लक्षण विश्लेषण करें',
    
    // Risk Levels
    'risk_level': 'जोखिम स्तर',
    'low_risk': 'कम जोखिम',
    'medium_risk': 'मध्यम जोखिम',
    'high_risk': 'उच्च जोखिम',
    'immediate_care': 'तुरंत चिकित्सा सहायता लें',
    'consult_asha': 'ASHA कार्यकर्ता से मिलें',
    'home_care': 'घरेलू उपचार करें',
    
    // Resources
    'find_nearby': 'नजदीकी खोजें',
    'phc': 'प्राथमिक स्वास्थ्य केंद्र',
    'chc': 'सामुदायिक स्वास्थ्य केंद्र',
    'asha_worker': 'ASHA कार्यकर्ता',
    'distance': 'दूरी',
    'call_now': 'अभी कॉल करें',
    'get_directions': 'दिशा निर्देश',
    
    // ASHA Dashboard
    'total_patients': 'कुल मरीज़',
    'high_risk_patients': 'उच्च जोखिम मरीज़',
    'today_visits': 'आज की विज़िट',
    'pending_followups': 'बकाया फॉलो-अप',
    'patient_list': 'मरीज़ों की सूची',
    'visit_history': 'विज़िट इतिहास',
    'add_visit': 'विज़िट जोड़ें',
    
    // Teleconsultation
    'book_teleconsult': 'टेली परामर्श बुक करें',
    'available_doctors': 'उपलब्ध डॉक्टर',
    'consultation_fee': 'परामर्श शुल्क',
    'book_appointment': 'अपॉइंटमेंट बुक करें',
    'my_consultations': 'मेरे परामर्श',
    'upcoming': 'आगामी',
    'completed': 'पूर्ण',
    
    // Profile
    'personal_info': 'व्यक्तिगत जानकारी',
    'medical_history': 'चिकित्सा इतिहास',
    'emergency_contacts': 'आपातकालीन संपर्क',
    'language_settings': 'भाषा सेटिंग्स',
    'logout': 'लॉगआउट',
    
    // Common symptoms
    'fever': 'बुखार',
    'headache': 'सिरदर्द',
    'cough': 'खांसी',
    'chest_pain': 'छाती में दर्द',
    'difficulty_breathing': 'सांस लेने में तकलीफ',
    'stomach_pain': 'पेट दर्द',
    'vomiting': 'उल्टी',
    'diarrhea': 'दस्त',
    'fatigue': 'कमजोरी',
    'sore_throat': 'गले में खराश',
  },
  
  en: {
    // Common
    'welcome': 'Welcome',
    'continue': 'Continue',
    'cancel': 'Cancel',
    'save': 'Save',
    'loading': 'Loading...',
    'error': 'Error',
    'success': 'Success',
    'retry': 'Retry',
    
    // Navigation
    'home': 'Home',
    'symptoms': 'Symptom Check',
    'resources': 'Resources',
    'asha_dashboard': 'ASHA Dashboard',
    'teleconsult': 'Teleconsult',
    'profile': 'Profile',
    
    // Onboarding
    'app_title': 'HealthBridge AI',
    'app_subtitle': 'Your Health Companion',
    'onboarding_title_1': 'AI-powered Health Assistant',
    'onboarding_desc_1': 'Check your symptoms and get instant advice',
    'onboarding_title_2': 'Offline Support',
    'onboarding_desc_2': 'Access healthcare services without internet',
    'onboarding_title_3': 'ASHA Worker Support',
    'onboarding_desc_3': 'Connect with local ASHA workers',
    'get_started': 'Get Started',
    
    // Login
    'login_title': 'Login',
    'phone_number': 'Phone Number',
    'enter_phone': 'Enter your phone number',
    'send_otp': 'Send OTP',
    'enter_otp': 'Enter OTP',
    'verify_otp': 'Verify OTP',
    'otp_sent': 'OTP Sent',
    'invalid_otp': 'Invalid OTP',
    
    // Add more English translations as needed...
  }
};

export const LanguageProvider = ({ children }) => {
  const [currentLanguage, setCurrentLanguage] = useState('hi');
  const [isRTL, setIsRTL] = useState(false);

  useEffect(() => {
    loadLanguagePreference();
  }, []);

  const loadLanguagePreference = async () => {
    try {
      const savedLanguage = await AsyncStorage.getItem('selectedLanguage');
      if (savedLanguage) {
        setCurrentLanguage(savedLanguage);
        setIsRTL(savedLanguage === 'ar' || savedLanguage === 'ur');
      }
    } catch (error) {
      console.error('Error loading language preference:', error);
    }
  };

  const changeLanguage = async (languageCode) => {
    try {
      setCurrentLanguage(languageCode);
      setIsRTL(languageCode === 'ar' || languageCode === 'ur');
      await AsyncStorage.setItem('selectedLanguage', languageCode);
    } catch (error) {
      console.error('Error saving language preference:', error);
    }
  };

  const t = (key, params = {}) => {
    let translation = translations[currentLanguage]?.[key] || translations['en']?.[key] || key;
    
    // Replace parameters in translation
    Object.keys(params).forEach(param => {
      translation = translation.replace(`{{${param}}}`, params[param]);
    });
    
    return translation;
  };

  const getSupportedLanguages = () => {
    return [
      { code: 'hi', name: 'हिंदी', nativeName: 'Hindi' },
      { code: 'en', name: 'English', nativeName: 'English' },
      { code: 'ta', name: 'தமிழ்', nativeName: 'Tamil' },
      { code: 'te', name: 'తెలుగు', nativeName: 'Telugu' },
      { code: 'bn', name: 'বাংলা', nativeName: 'Bengali' },
      { code: 'gu', name: 'ગુજરાતી', nativeName: 'Gujarati' },
      { code: 'mr', name: 'मराठी', nativeName: 'Marathi' },
    ];
  };

  const value = {
    currentLanguage,
    isRTL,
    changeLanguage,
    t,
    getSupportedLanguages,
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};