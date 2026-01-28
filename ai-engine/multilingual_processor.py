import json
import logging
from datetime import datetime

logger = logging.getLogger(__name__)

class MultilingualProcessor:
    def __init__(self):
        self.supported_languages = ['hi', 'en', 'ta', 'te', 'bn', 'gu', 'mr']
        
        # Translation dictionaries (simplified for demo)
        self.translations = {
            'hi': {
                'fever': 'बुखार',
                'headache': 'सिरदर्द',
                'cough': 'खांसी',
                'chest_pain': 'छाती में दर्द',
                'difficulty_breathing': 'सांस लेने में तकलीफ',
                'abdominal_pain': 'पेट दर्द',
                'vomiting': 'उल्टी',
                'diarrhea': 'दस्त',
                'fatigue': 'कमजोरी',
                'sore_throat': 'गले में खराश',
                
                # Risk level translations
                'red': 'उच्च जोखिम',
                'amber': 'मध्यम जोखिम',
                'green': 'कम जोखिम',
                
                # Common phrases
                'immediate_care': 'तुरंत चिकित्सा सहायता लें',
                'consult_asha': 'ASHA कार्यकर्ता से मिलें',
                'home_care': 'घरेलू उपचार करें',
                'monitor_symptoms': 'लक्षणों पर नजर रखें'
            },
            'en': {
                'fever': 'fever',
                'headache': 'headache',
                'cough': 'cough',
                'chest_pain': 'chest pain',
                'difficulty_breathing': 'difficulty breathing',
                'abdominal_pain': 'abdominal pain',
                'vomiting': 'vomiting',
                'diarrhea': 'diarrhea',
                'fatigue': 'fatigue',
                'sore_throat': 'sore throat',
                
                'red': 'high risk',
                'amber': 'medium risk',
                'green': 'low risk',
                
                'immediate_care': 'Seek immediate medical attention',
                'consult_asha': 'Consult ASHA worker',
                'home_care': 'Take home care',
                'monitor_symptoms': 'Monitor symptoms'
            }
        }
        
        # Reverse mappings for symptom recognition
        self.symptom_mappings = {}
        for lang, translations in self.translations.items():
            self.symptom_mappings[lang] = {v: k for k, v in translations.items()}
        
        logger.info("Multilingual processor initialized")
    
    def process_voice(self, audio_data, language='hi'):
        """Process voice input and convert to symptoms"""
        try:
            # Mock voice-to-text conversion
            # In real implementation, use speech recognition APIs
            
            mock_transcriptions = {
                'hi': 'मुझे बुखार और सिरदर्द है',
                'en': 'I have fever and headache'
            }
            
            text = mock_transcriptions.get(language, mock_transcriptions['hi'])
            
            # Extract symptoms from text
            symptoms = self._extract_symptoms_from_text(text, language)
            
            return symptoms
            
        except Exception as e:
            logger.error(f"Voice processing error: {str(e)}")
            return []
    
    def process_text(self, text_input, language='hi'):
        """Process text input and extract symptoms"""
        try:
            if isinstance(text_input, list):
                # Already a list of symptoms
                return [self._normalize_symptom(s, language) for s in text_input]
            
            # Extract symptoms from text
            symptoms = self._extract_symptoms_from_text(text_input, language)
            return symptoms
            
        except Exception as e:
            logger.error(f"Text processing error: {str(e)}")
            return []
    
    def _extract_symptoms_from_text(self, text, language):
        """Extract symptoms from natural language text"""
        text = text.lower()
        symptoms = []
        
        # Get symptom mappings for the language
        mappings = self.symptom_mappings.get(language, {})
        
        # Look for symptom keywords
        for symptom_text, symptom_key in mappings.items():
            if symptom_text in text:
                symptoms.append(symptom_key)
        
        # If no symptoms found, try common patterns
        if not symptoms:
            symptoms = self._fallback_symptom_extraction(text, language)
        
        return list(set(symptoms))  # Remove duplicates
    
    def _normalize_symptom(self, symptom, language):
        """Normalize symptom to English key"""
        mappings = self.symptom_mappings.get(language, {})
        return mappings.get(symptom.lower(), symptom)
    
    def _fallback_symptom_extraction(self, text, language):
        """Fallback symptom extraction using common patterns"""
        symptoms = []
        
        if language == 'hi':
            patterns = {
                'बुखार': 'fever',
                'सिर': 'headache',
                'खांसी': 'cough',
                'छाती': 'chest_pain',
                'सांस': 'difficulty_breathing',
                'पेट': 'abdominal_pain',
                'उल्टी': 'vomiting',
                'दस्त': 'diarrhea'
            }
        else:
            patterns = {
                'fever': 'fever',
                'head': 'headache',
                'cough': 'cough',
                'chest': 'chest_pain',
                'breath': 'difficulty_breathing',
                'stomach': 'abdominal_pain',
                'vomit': 'vomiting',
                'diarrhea': 'diarrhea'
            }
        
        for pattern, symptom in patterns.items():
            if pattern in text:
                symptoms.append(symptom)
        
        return symptoms
    
    def translate_response(self, triage_result, target_language):
        """Translate triage response to target language"""
        try:
            if target_language not in self.supported_languages:
                target_language = 'en'  # Fallback to English
            
            translations = self.translations.get(target_language, self.translations['en'])
            
            # Translate risk level
            risk_level = triage_result.get('riskLevel', 'green')
            translated_risk = translations.get(risk_level, risk_level)
            
            # Generate explanation based on risk level
            explanation = self._generate_explanation(risk_level, target_language)
            
            # Generate recommendations
            recommendations = self._generate_recommendations(risk_level, target_language)
            
            # Determine next steps and urgency
            next_steps, urgency, wait_time = self._determine_next_steps(risk_level)
            
            return {
                'riskLevel': risk_level,
                'riskScore': triage_result.get('riskScore', 50),
                'explanation': explanation,
                'recommendations': recommendations,
                'nextSteps': next_steps,
                'urgency': urgency,
                'estimatedWaitTime': wait_time
            }
            
        except Exception as e:
            logger.error(f"Translation error: {str(e)}")
            return self._default_translated_response(target_language)
    
    def _generate_explanation(self, risk_level, language):
        """Generate explanation based on risk level and language"""
        explanations = {
            'hi': {
                'red': 'आपके लक्षण गंभीर हैं। तुरंत चिकित्सा सहायता की आवश्यकता है।',
                'amber': 'आपके लक्षणों पर ध्यान देने की जरूरत है। जल्दी इलाज कराएं।',
                'green': 'आपके लक्षण सामान्य लगते हैं। घरेलू उपचार से ठीक हो सकते हैं।'
            },
            'en': {
                'red': 'Your symptoms are serious. Immediate medical attention is required.',
                'amber': 'Your symptoms need attention. Seek medical care soon.',
                'green': 'Your symptoms appear mild. Home care may be sufficient.'
            }
        }
        
        return explanations.get(language, explanations['en']).get(risk_level, '')
    
    def _generate_recommendations(self, risk_level, language):
        """Generate recommendations based on risk level and language"""
        recommendations = {
            'hi': {
                'red': [
                    'तुरंत नजदीकी अस्पताल जाएं',
                    '108 पर एम्बुलेंस बुलाएं',
                    'किसी को साथ ले जाएं'
                ],
                'amber': [
                    'ASHA कार्यकर्ता से संपर्क करें',
                    'नजदीकी PHC में जांच कराएं',
                    'लक्षणों पर नजर रखें'
                ],
                'green': [
                    'आराम करें और पानी पिएं',
                    'स्वस्थ भोजन लें',
                    'यदि बिगड़े तो डॉक्टर से मिलें'
                ]
            },
            'en': {
                'red': [
                    'Go to nearest hospital immediately',
                    'Call ambulance (108)',
                    'Take someone with you'
                ],
                'amber': [
                    'Contact ASHA worker',
                    'Visit nearest PHC for checkup',
                    'Monitor your symptoms'
                ],
                'green': [
                    'Rest and drink plenty of water',
                    'Eat healthy food',
                    'See doctor if symptoms worsen'
                ]
            }
        }
        
        return recommendations.get(language, recommendations['en']).get(risk_level, [])
    
    def _determine_next_steps(self, risk_level):
        """Determine next steps, urgency, and wait time"""
        if risk_level == 'red':
            return ['emergency_care'], 'immediate', '0 minutes'
        elif risk_level == 'amber':
            return ['asha_visit', 'phc_consultation'], 'moderate', '2-4 hours'
        else:
            return ['home_care', 'monitor'], 'low', 'self-care'
    
    def _default_translated_response(self, language):
        """Default response when translation fails"""
        if language == 'hi':
            return {
                'riskLevel': 'green',
                'riskScore': 30,
                'explanation': 'कृपया अपने लक्षण स्पष्ट रूप से बताएं।',
                'recommendations': ['ASHA कार्यकर्ता से सलाह लें'],
                'nextSteps': ['consult_asha'],
                'urgency': 'low',
                'estimatedWaitTime': '1-2 hours'
            }
        else:
            return {
                'riskLevel': 'green',
                'riskScore': 30,
                'explanation': 'Please describe your symptoms clearly.',
                'recommendations': ['Consult with ASHA worker'],
                'nextSteps': ['consult_asha'],
                'urgency': 'low',
                'estimatedWaitTime': '1-2 hours'
            }
    
    def translate(self, text, source_lang, target_lang):
        """Simple translation between supported languages"""
        # Mock translation - in production, use Google Translate API or similar
        if source_lang == target_lang:
            return text
        
        # Simple keyword-based translation
        source_dict = self.translations.get(source_lang, {})
        target_dict = self.translations.get(target_lang, {})
        
        # Reverse lookup
        reverse_source = {v: k for k, v in source_dict.items()}
        
        translated_words = []
        for word in text.split():
            key = reverse_source.get(word.lower())
            if key and key in target_dict:
                translated_words.append(target_dict[key])
            else:
                translated_words.append(word)
        
        return ' '.join(translated_words)